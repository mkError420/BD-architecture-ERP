<?php
try {
    $user = requireAuth();
    $db = Database::getInstance()->getConnection();
} catch (Exception $e) {
    sendError('Database connection failed: ' . $e->getMessage(), 500);
}

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare("SELECT * FROM clients WHERE id = ?");
            $stmt->execute([$id]);
            $client = $stmt->fetch();
            if (!$client) sendError('Client not found', 404);
            // Get client's projects
            $projects = $db->prepare("SELECT id, project_code, name, status, progress FROM projects WHERE client_id = ? ORDER BY created_at DESC");
            $projects->execute([$id]);
            $client['projects'] = $projects->fetchAll();
            sendSuccess($client);
        } else {
            $page = max(1, (int)($_GET['page'] ?? 1));
            $perPage = min(50, max(10, (int)($_GET['per_page'] ?? 10)));
            $search = $_GET['search'] ?? '';
            $offset = ($page - 1) * $perPage;

            $where = "WHERE is_active = 1";
            $params = [];
            if ($search) { $where .= " AND (name LIKE ? OR phone LIKE ? OR company LIKE ?)"; $params[] = "%$search%"; $params[] = "%$search%"; $params[] = "%$search%"; }

            $total = $db->prepare("SELECT COUNT(*) FROM clients $where");
            $total->execute($params);
            $totalCount = $total->fetchColumn();

            $stmt = $db->prepare("SELECT * FROM clients $where ORDER BY created_at DESC LIMIT $perPage OFFSET $offset");
            $stmt->execute($params);
            sendPaginated($stmt->fetchAll(), $totalCount, $page, $perPage);
        }
        break;

    case 'POST':
        $body = getJsonBody();
        $name = sanitize($body['name'] ?? '');
        $phone = sanitize($body['phone'] ?? '');
        if (!$name || !$phone) sendError('Name and phone are required');

        $db->prepare(
            "INSERT INTO clients (name, company, email, phone, nid, address, district, division, client_type, notes, created_by)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)"
        )->execute([
            $name, $body['company'] ?? null, $body['email'] ?? null, $phone,
            $body['nid'] ?? null, $body['address'] ?? null, $body['district'] ?? null,
            $body['division'] ?? null, $body['client_type'] ?? 'individual',
            $body['notes'] ?? null, $user['id']
        ]);
        sendSuccess(['id' => $db->lastInsertId()], 'Client created successfully', 201);
        break;

    case 'PUT':
    case 'PATCH':
        if (!$id) sendError('Client ID is required');
        $body = getJsonBody();
        $fields = []; $params = [];
        $allowed = ['name','company','email','phone','nid','address','district','division','client_type','notes','is_active'];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $body)) { $fields[] = "$f = ?"; $params[] = $body[$f]; }
        }
        if (empty($fields)) sendError('No fields to update');
        $params[] = $id;
        $db->prepare("UPDATE clients SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
        sendSuccess(null, 'Client updated successfully');
        break;

    case 'DELETE':
        if (!$id) sendError('Client ID is required');
        requireRole($user, ['admin']);
        $db->prepare("UPDATE clients SET is_active = 0 WHERE id = ?")->execute([$id]);
        sendSuccess(null, 'Client deleted successfully');
        break;

    default:
        sendError('Method not allowed', 405);
}
