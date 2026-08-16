<?php
$user = requireAuth();
$db = Database::getInstance()->getConnection();

switch ($method) {
    case 'GET':
        if ($id) {
            // Single project
            $stmt = $db->prepare(
                "SELECT p.*, c.name as client_name, c.phone as client_phone,
                        m.name as manager_name, e.name as engineer_name
                 FROM projects p
                 LEFT JOIN clients c ON p.client_id = c.id
                 LEFT JOIN users m ON p.manager_id = m.id
                 LEFT JOIN users e ON p.engineer_id = e.id
                 WHERE p.id = ?"
            );
            $stmt->execute([$id]);
            $project = $stmt->fetch();
            if (!$project) sendError('Project not found', 404);
            sendSuccess($project);
        } else {
            // List with filters
            $page = max(1, (int)($_GET['page'] ?? 1));
            $perPage = min(50, max(10, (int)($_GET['per_page'] ?? 10)));
            $search = $_GET['search'] ?? '';
            $status = $_GET['status'] ?? '';
            $type = $_GET['project_type'] ?? '';
            $offset = ($page - 1) * $perPage;

            $where = "WHERE 1=1";
            $params = [];
            if ($search) { $where .= " AND (p.name LIKE ? OR p.project_code LIKE ?)"; $params[] = "%$search%"; $params[] = "%$search%"; }
            if ($status) { $where .= " AND p.status = ?"; $params[] = $status; }
            if ($type) { $where .= " AND p.project_type = ?"; $params[] = $type; }

            $countStmt = $db->prepare("SELECT COUNT(*) FROM projects p $where");
            $countStmt->execute($params);
            $total = $countStmt->fetchColumn();

            $stmt = $db->prepare(
                "SELECT p.*, c.name as client_name
                 FROM projects p
                 LEFT JOIN clients c ON p.client_id = c.id
                 $where ORDER BY p.created_at DESC LIMIT $perPage OFFSET $offset"
            );
            $stmt->execute($params);
            sendPaginated($stmt->fetchAll(), $total, $page, $perPage);
        }
        break;

    case 'POST':
        requireRole($user, ['admin','project_manager']);
        $body = getJsonBody();
        $name = sanitize($body['name'] ?? '');
        if (!$name) sendError('Project name is required');

        $stmt = $db->prepare(
            "INSERT INTO projects (project_code, name, description, client_id, project_type, status,
                start_date, end_date, location, district, division, total_area, area_unit,
                total_budget, approved_budget, manager_id, engineer_id, priority, notes, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        // Generate temp code then update
        $db->prepare("INSERT INTO projects (project_code, name, created_by) VALUES ('TEMP', ?, ?)")->execute([$name, $user['id']]);
        $newId = $db->lastInsertId();
        $code = generateCode('PRJ', $newId);

        $db->prepare(
            "UPDATE projects SET project_code=?, description=?, client_id=?, project_type=?,
                status=?, start_date=?, end_date=?, location=?, district=?, division=?,
                total_area=?, area_unit=?, total_budget=?, approved_budget=?,
                manager_id=?, engineer_id=?, priority=?, notes=?
             WHERE id=?"
        )->execute([
            $code,
            $body['description'] ?? null,
            $body['client_id'] ?? null,
            $body['project_type'] ?? 'residential',
            $body['status'] ?? 'planning',
            $body['start_date'] ?? null,
            $body['end_date'] ?? null,
            $body['location'] ?? null,
            $body['district'] ?? null,
            $body['division'] ?? null,
            $body['total_area'] ?? null,
            $body['area_unit'] ?? 'sqft',
            $body['total_budget'] ?? 0,
            $body['approved_budget'] ?? 0,
            $body['manager_id'] ?? null,
            $body['engineer_id'] ?? null,
            $body['priority'] ?? 'medium',
            $body['notes'] ?? null,
            $newId
        ]);

        sendSuccess(['id' => $newId, 'project_code' => $code], 'Project created successfully', 201);
        break;

    case 'PUT':
    case 'PATCH':
        if (!$id) sendError('Project ID is required');
        requireRole($user, ['admin','project_manager']);
        $body = getJsonBody();

        $fields = [];
        $params = [];
        $allowed = ['name','description','client_id','project_type','status','start_date','end_date',
                     'actual_end_date','location','district','division','total_area','area_unit',
                     'total_budget','approved_budget','manager_id','engineer_id','priority','progress','notes'];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $body)) {
                $fields[] = "$f = ?";
                $params[] = $body[$f];
            }
        }
        if (empty($fields)) sendError('No fields to update');
        $params[] = $id;

        $db->prepare("UPDATE projects SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
        sendSuccess(null, 'Project updated successfully');
        break;

    case 'DELETE':
        if (!$id) sendError('Project ID is required');
        requireRole($user, ['admin']);
        $db->prepare("DELETE FROM projects WHERE id = ?")->execute([$id]);
        sendSuccess(null, 'Project deleted successfully');
        break;

    default:
        sendError('Method not allowed', 405);
}
