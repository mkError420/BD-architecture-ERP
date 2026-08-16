<?php
$user = requireAuth();
$db = Database::getInstance()->getConnection();

switch ($method) {
    case 'GET':
        $stmt = $db->query("SELECT * FROM settings ORDER BY setting_key");
        $settings = [];
        foreach ($stmt->fetchAll() as $row) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
        sendSuccess($settings);
        break;

    case 'PUT':
    case 'POST':
        requireRole($user, ['admin']);
        $body = getJsonBody();
        $stmt = $db->prepare(
            "INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)"
        );
        foreach ($body as $key => $value) {
            $stmt->execute([sanitize($key), $value]);
        }
        sendSuccess(null, 'Settings updated');
        break;

    default:
        sendError('Method not allowed', 405);
}
