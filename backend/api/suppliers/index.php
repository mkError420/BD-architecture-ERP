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
            $stmt = $db->prepare("SELECT * FROM suppliers WHERE id = ?");
            $stmt->execute([$id]);
            $sup = $stmt->fetch();
            if (!$sup) sendError('Supplier not found', 404);
            sendSuccess($sup);
        } else {
            $search = $_GET['search'] ?? '';
            $where = "WHERE is_active = 1";
            $params = [];
            if ($search) { $where .= " AND (name LIKE ? OR company LIKE ? OR phone LIKE ?)"; $params[] = "%$search%"; $params[] = "%$search%"; $params[] = "%$search%"; }
            $stmt = $db->prepare("SELECT * FROM suppliers $where ORDER BY name");
            $stmt->execute($params);
            sendSuccess($stmt->fetchAll());
        }
        break;

    case 'POST':
        $body = getJsonBody();
        $name = sanitize($body['name'] ?? '');
        $phone = sanitize($body['phone'] ?? '');
        if (!$name || !$phone) sendError('Name and phone required');

        $db->prepare(
            "INSERT INTO suppliers (name, company, phone, email, address, district, trade_license, product_categories, payment_terms)
             VALUES (?,?,?,?,?,?,?,?,?)"
        )->execute([
            $name, $body['company'] ?? null, $phone, $body['email'] ?? null,
            $body['address'] ?? null, $body['district'] ?? null,
            $body['trade_license'] ?? null, $body['product_categories'] ?? null,
            $body['payment_terms'] ?? null
        ]);
        sendSuccess(['id' => $db->lastInsertId()], 'Supplier created', 201);
        break;

    case 'PUT':
    case 'PATCH':
        if (!$id) sendError('Supplier ID required');
        $body = getJsonBody();
        $fields = []; $params = [];
        $allowed = ['name','company','phone','email','address','district','trade_license','product_categories','payment_terms','is_active'];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $body)) { $fields[] = "$f = ?"; $params[] = $body[$f]; }
        }
        if (empty($fields)) sendError('No fields to update');
        $params[] = $id;
        $db->prepare("UPDATE suppliers SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
        sendSuccess(null, 'Supplier updated');
        break;

    case 'DELETE':
        if (!$id) sendError('Supplier ID required');
        requireRole($user, ['admin']);
        $db->prepare("UPDATE suppliers SET is_active = 0 WHERE id = ?")->execute([$id]);
        sendSuccess(null, 'Supplier deleted');
        break;

    default:
        sendError('Method not allowed', 405);
}
