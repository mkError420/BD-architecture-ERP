<?php
$db = Database::getInstance()->getConnection();

if ($method === 'POST') {
    $body = getJsonBody();
    $email = sanitize($body['email'] ?? '');
    $password = $body['password'] ?? '';

    if (!$email || !$password) {
        sendError('Email and password are required', 400);
    }

    $stmt = $db->prepare("SELECT * FROM users WHERE email = ? AND is_active = 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        sendError('Invalid email or password', 401);
    }

    // Update last login
    $db->prepare("UPDATE users SET last_login = NOW() WHERE id = ?")->execute([$user['id']]);

    $token = JWTHelper::encode([
        'id'    => $user['id'],
        'name'  => $user['name'],
        'email' => $user['email'],
        'role'  => $user['role'],
    ]);

    sendSuccess([
        'token' => $token,
        'user'  => [
            'id'     => $user['id'],
            'name'   => $user['name'],
            'email'  => $user['email'],
            'role'   => $user['role'],
            'avatar' => $user['avatar'],
            'phone'  => $user['phone'],
        ]
    ], 'Login successful');
} else {
    sendError('Method not allowed', 405);
}
