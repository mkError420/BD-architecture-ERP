<?php
$user = requireAuth();
$db = Database::getInstance()->getConnection();

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare("SELECT * FROM employees WHERE id = ?");
            $stmt->execute([$id]);
            $emp = $stmt->fetch();
            if (!$emp) sendError('Employee not found', 404);
            sendSuccess($emp);
        } else {
            $page = max(1, (int)($_GET['page'] ?? 1));
            $perPage = min(50, max(10, (int)($_GET['per_page'] ?? 10)));
            $search = $_GET['search'] ?? '';
            $role = $_GET['role'] ?? '';
            $project = $_GET['project_id'] ?? '';
            $offset = ($page - 1) * $perPage;

            $where = "WHERE e.is_active = 1";
            $params = [];
            $join = "";
            if ($search) { $where .= " AND (e.name LIKE ? OR e.phone LIKE ? OR e.employee_code LIKE ?)"; $params[] = "%$search%"; $params[] = "%$search%"; $params[] = "%$search%"; }
            if ($role) { $where .= " AND e.role = ?"; $params[] = $role; }
            if ($project) {
                $join = " INNER JOIN project_employees pe ON e.id = pe.employee_id AND pe.project_id = ? AND pe.is_active = 1";
                $params = array_merge([$project], $params);
            }

            $total = $db->prepare("SELECT COUNT(*) FROM employees e $join $where");
            $total->execute($params);

            $stmt = $db->prepare("SELECT e.* FROM employees e $join $where ORDER BY e.created_at DESC LIMIT $perPage OFFSET $offset");
            $stmt->execute($params);
            sendPaginated($stmt->fetchAll(), $total->fetchColumn(), $page, $perPage);
        }
        break;

    case 'POST':
        requireRole($user, ['admin','project_manager']);
        $body = getJsonBody();
        $name = sanitize($body['name'] ?? '');
        $phone = sanitize($body['phone'] ?? '');
        if (!$name || !$phone) sendError('Name and phone are required');

        $db->prepare("INSERT INTO employees (employee_code, name, phone, created_by) VALUES ('TEMP', ?, ?, ?)")
           ->execute([$name, $phone, $user['id']]);
        $newId = $db->lastInsertId();
        $code = generateCode('EMP', $newId);

        $db->prepare(
            "UPDATE employees SET employee_code=?, father_name=?, email=?, nid=?,
                address=?, district=?, division=?, role=?, department=?, join_date=?,
                salary_type=?, salary=?, blood_group=?, emergency_contact=?,
                bank_account=?, bank_name=?
             WHERE id=?"
        )->execute([
            $code, $body['father_name'] ?? null, $body['email'] ?? null, $body['nid'] ?? null,
            $body['address'] ?? null, $body['district'] ?? null, $body['division'] ?? null,
            $body['role'] ?? 'helper', $body['department'] ?? null, $body['join_date'] ?? null,
            $body['salary_type'] ?? 'monthly', $body['salary'] ?? 0, $body['blood_group'] ?? null,
            $body['emergency_contact'] ?? null, $body['bank_account'] ?? null,
            $body['bank_name'] ?? null, $newId
        ]);

        sendSuccess(['id' => $newId, 'employee_code' => $code], 'Employee created', 201);
        break;

    case 'PUT':
    case 'PATCH':
        if (!$id) sendError('Employee ID required');
        requireRole($user, ['admin','project_manager']);
        $body = getJsonBody();
        $fields = []; $params = [];
        $allowed = ['name','father_name','phone','email','nid','address','district','division',
                     'role','department','join_date','salary_type','salary','blood_group',
                     'emergency_contact','bank_account','bank_name','is_active'];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $body)) { $fields[] = "$f = ?"; $params[] = $body[$f]; }
        }
        if (empty($fields)) sendError('No fields to update');
        $params[] = $id;
        $db->prepare("UPDATE employees SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
        sendSuccess(null, 'Employee updated');
        break;

    case 'DELETE':
        if (!$id) sendError('Employee ID required');
        requireRole($user, ['admin']);
        $db->prepare("UPDATE employees SET is_active = 0 WHERE id = ?")->execute([$id]);
        sendSuccess(null, 'Employee deactivated');
        break;

    default:
        sendError('Method not allowed', 405);
}
