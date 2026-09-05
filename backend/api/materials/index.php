<?php
try {
    $user = getOptionalAuth();
    $db = Database::getInstance()->getConnection();
} catch (Exception $e) {
    sendError('Database connection failed: ' . $e->getMessage(), 500);
}

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare("SELECT * FROM materials WHERE id = ?");
            $stmt->execute([$id]);
            $mat = $stmt->fetch();
            if (!$mat) sendError('Material not found', 404);
            sendSuccess($mat);
        } else {
            $page = max(1, (int)($_GET['page'] ?? 1));
            $perPage = min(50, max(10, (int)($_GET['per_page'] ?? 10)));
            $search = $_GET['search'] ?? '';
            $category = $_GET['category'] ?? '';
            $offset = ($page - 1) * $perPage;

            $where = "WHERE is_active = 1";
            $params = [];
            if ($search) { $where .= " AND (name LIKE ? OR material_code LIKE ?)"; $params[] = "%$search%"; $params[] = "%$search%"; }
            if ($category) { $where .= " AND category = ?"; $params[] = $category; }

            $total = $db->prepare("SELECT COUNT(*) FROM materials $where"); $total->execute($params);
            $stmt = $db->prepare("SELECT * FROM materials $where ORDER BY name LIMIT $perPage OFFSET $offset");
            $stmt->execute($params);
            sendPaginated($stmt->fetchAll(), $total->fetchColumn(), $page, $perPage);
        }
        break;

    case 'POST':
        if ($user) {
            requireRole($user, ['admin','project_manager','engineer']);
        }
        $body = getJsonBody();
        $name = sanitize($body['name'] ?? '');
        if (!$name) sendError('Material name is required');

        $db->prepare("INSERT INTO materials (material_code, name) VALUES ('TEMP', ?)")->execute([$name]);
        $newId = $db->lastInsertId();
        $code = generateCode('MAT', $newId);
        $db->prepare(
            "UPDATE materials SET material_code=?, category=?, unit=?, unit_price=?, description=?, min_stock_alert=? WHERE id=?"
        )->execute([
            $code, $body['category'] ?? 'other', $body['unit'] ?? 'piece',
            $body['unit_price'] ?? 0, $body['description'] ?? null,
            $body['min_stock_alert'] ?? 0, $newId
        ]);
        sendSuccess(['id' => $newId, 'material_code' => $code], 'Material created', 201);
        break;

    case 'PUT':
    case 'PATCH':
        if (!$id) sendError('Material ID required');
        $body = getJsonBody();
        $fields = []; $params = [];
        $allowed = ['name','category','unit','unit_price','description','min_stock_alert','is_active'];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $body)) { $fields[] = "$f = ?"; $params[] = $body[$f]; }
        }
        if (empty($fields)) sendError('No fields to update');
        $params[] = $id;
        $db->prepare("UPDATE materials SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
        sendSuccess(null, 'Material updated');
        break;

    case 'DELETE':
        if (!$id) sendError('Material ID required');
        if ($user) {
            requireRole($user, ['admin']);
        }
        $db->prepare("UPDATE materials SET is_active = 0 WHERE id = ?")->execute([$id]);
        sendSuccess(null, 'Material deleted');
        break;

    default:
        sendError('Method not allowed', 405);
}
