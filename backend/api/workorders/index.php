<?php
$user = requireAuth();
$db = Database::getInstance()->getConnection();

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare(
                "SELECT w.*, p.name as project_name, e.name as assigned_name, u.name as supervisor_name
                 FROM work_orders w
                 LEFT JOIN projects p ON w.project_id = p.id
                 LEFT JOIN employees e ON w.assigned_to = e.id
                 LEFT JOIN users u ON w.supervisor_id = u.id
                 WHERE w.id = ?"
            );
            $stmt->execute([$id]);
            $wo = $stmt->fetch();
            if (!$wo) sendError('Work order not found', 404);
            sendSuccess($wo);
        } else {
            $page = max(1, (int)($_GET['page'] ?? 1));
            $perPage = min(50, max(10, (int)($_GET['per_page'] ?? 10)));
            $project = $_GET['project_id'] ?? '';
            $status = $_GET['status'] ?? '';
            $search = $_GET['search'] ?? '';
            $offset = ($page - 1) * $perPage;

            $where = "WHERE 1=1"; $params = [];
            if ($project) { $where .= " AND w.project_id = ?"; $params[] = $project; }
            if ($status) { $where .= " AND w.status = ?"; $params[] = $status; }
            if ($search) { $where .= " AND (w.title LIKE ? OR w.order_code LIKE ?)"; $params[] = "%$search%"; $params[] = "%$search%"; }

            $total = $db->prepare("SELECT COUNT(*) FROM work_orders w $where"); $total->execute($params);
            $stmt = $db->prepare(
                "SELECT w.*, p.name as project_name, e.name as assigned_name
                 FROM work_orders w
                 LEFT JOIN projects p ON w.project_id = p.id
                 LEFT JOIN employees e ON w.assigned_to = e.id
                 $where ORDER BY w.created_at DESC LIMIT $perPage OFFSET $offset"
            );
            $stmt->execute($params);
            sendPaginated($stmt->fetchAll(), $total->fetchColumn(), $page, $perPage);
        }
        break;

    case 'POST':
        $body = getJsonBody();
        $title = sanitize($body['title'] ?? '');
        $projectId = $body['project_id'] ?? null;
        if (!$title || !$projectId) sendError('Title and project are required');

        $db->prepare("INSERT INTO work_orders (order_code, project_id, title, created_by) VALUES ('TEMP', ?, ?, ?)")
           ->execute([$projectId, $title, $user['id']]);
        $newId = $db->lastInsertId();
        $code = generateCode('WO', $newId);
        $db->prepare(
            "UPDATE work_orders SET order_code=?, description=?, category=?, assigned_to=?, supervisor_id=?,
                start_date=?, due_date=?, status=?, priority=?, estimated_cost=?, notes=? WHERE id=?"
        )->execute([
            $code, $body['description'] ?? null, $body['category'] ?? 'other',
            $body['assigned_to'] ?? null, $body['supervisor_id'] ?? null,
            $body['start_date'] ?? null, $body['due_date'] ?? null,
            $body['status'] ?? 'pending', $body['priority'] ?? 'medium',
            $body['estimated_cost'] ?? 0, $body['notes'] ?? null, $newId
        ]);
        sendSuccess(['id' => $newId, 'order_code' => $code], 'Work order created', 201);
        break;

    case 'PUT':
    case 'PATCH':
        if (!$id) sendError('Work order ID required');
        $body = getJsonBody();
        $fields = []; $params = [];
        $allowed = ['title','description','category','assigned_to','supervisor_id','start_date',
                     'due_date','completed_date','status','priority','progress','estimated_cost','actual_cost','notes'];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $body)) { $fields[] = "$f = ?"; $params[] = $body[$f]; }
        }
        if (empty($fields)) sendError('No fields to update');
        $params[] = $id;
        $db->prepare("UPDATE work_orders SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
        sendSuccess(null, 'Work order updated');
        break;

    case 'DELETE':
        if (!$id) sendError('Work order ID required');
        requireRole($user, ['admin','project_manager']);
        $db->prepare("DELETE FROM work_orders WHERE id = ?")->execute([$id]);
        sendSuccess(null, 'Work order deleted');
        break;

    default:
        sendError('Method not allowed', 405);
}
