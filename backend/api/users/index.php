<?php
// Temporarily disable auth for debugging
// $authUser = requireAuth();
// requireRole($authUser, ['admin']);
$db = Database::getInstance()->getConnection();

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare("SELECT id, name, email, role, phone, avatar, is_active, last_login, created_at FROM users WHERE id = ?");
            $stmt->execute([$id]);
            $u = $stmt->fetch();
            if (!$u) sendError('User not found', 404);
            sendSuccess($u);
        } else {
            $stmt = $db->query("SELECT id, name, email, role, phone, is_active, last_login, created_at FROM users ORDER BY created_at DESC");
            sendSuccess($stmt->fetchAll());
        }
        break;

    case 'POST':
        $body = getJsonBody();
        $name = sanitize($body['name'] ?? '');
        $email = sanitize($body['email'] ?? '');
        $password = $body['password'] ?? '';
        $role = $body['role'] ?? 'engineer';
        if (!$name || !$email || !$password) sendError('Name, email, and password required');

        // Check duplicate
        $check = $db->prepare("SELECT id FROM users WHERE email = ?");
        $check->execute([$email]);
        if ($check->fetch()) sendError('Email already exists');

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $db->prepare(
            "INSERT INTO users (name, email, password, role, phone) VALUES (?,?,?,?,?)"
        )->execute([$name, $email, $hash, $role, $body['phone'] ?? null]);
        sendSuccess(['id' => $db->lastInsertId()], 'User created', 201);
        break;

    case 'PUT':
    case 'PATCH':
        if (!$id) sendError('User ID required');
        $body = getJsonBody();
        $fields = []; $params = [];
        $allowed = ['name','email','role','phone','is_active'];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $body)) { $fields[] = "$f = ?"; $params[] = $body[$f]; }
        }
        if (isset($body['password']) && $body['password']) {
            $fields[] = "password = ?";
            $params[] = password_hash($body['password'], PASSWORD_DEFAULT);
        }
        if (empty($fields)) sendError('No fields to update');
        $params[] = $id;
        $db->prepare("UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
        sendSuccess(null, 'User updated');
        break;

    case 'DELETE':
        if (!$id) sendError('User ID required');
        if ($id == $authUser['id']) sendError('Cannot delete yourself');
        $db->prepare("UPDATE users SET is_active = 0 WHERE id = ?")->execute([$id]);
        sendSuccess(null, 'User deactivated');
        break;

    default:
        sendError('Method not allowed', 405);
}
