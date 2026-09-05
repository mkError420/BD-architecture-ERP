<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

class JWTHelper {
    private static string $secret;
    private static int $expiry;

    public static function init(): void {
        self::$secret = $_ENV['JWT_SECRET'] ?? 'fallback_secret_key_change_me';
        self::$expiry = (int)($_ENV['JWT_EXPIRY'] ?? 86400);
    }

    public static function encode(array $payload): string {
        self::init();
        $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $payload['iat'] = time();
        $payload['exp'] = time() + self::$expiry;
        $body = base64_encode(json_encode($payload));
        $sig = hash_hmac('sha256', "$header.$body", self::$secret, true);
        return "$header.$body." . base64_encode($sig);
    }

    public static function decode(string $token): ?array {
        self::init();
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;
        [$header, $body, $sig] = $parts;
        $valid = hash_hmac('sha256', "$header.$body", self::$secret, true);
        if (!hash_equals(base64_encode($valid), $sig)) return null;
        $payload = json_decode(base64_decode($body), true);
        if (!$payload || $payload['exp'] < time()) return null;
        return $payload;
    }
}

function getAuthHeader(): string {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (!$auth && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $auth = $_SERVER['HTTP_AUTHORIZATION'];
    }
    if (!$auth && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $auth = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    if (!$auth && function_exists('apache_request_headers')) {
        $aHeaders = apache_request_headers();
        $auth = $aHeaders['Authorization'] ?? $aHeaders['authorization'] ?? '';
    }
    return $auth;
}

function getOptionalAuth(): ?array {
    $auth = getAuthHeader();
    if (!$auth || !str_starts_with($auth, 'Bearer ')) {
        return null;
    }
    $token = substr($auth, 7);
    return JWTHelper::decode($token);
}

function requireAuth(): array {
    $auth = getAuthHeader();
    if (!$auth || !str_starts_with($auth, 'Bearer ')) {
        sendError('Unauthorized - No token provided', 401);
    }
    $token = substr($auth, 7);
    $payload = JWTHelper::decode($token);
    if (!$payload) {
        sendError('Unauthorized - Invalid or expired token', 401);
    }
    return $payload;
}

function requireRole(?array $payload, array $roles): void {
    if (!$payload) {
        return; // Allow if auth is optional or bypassed
    }
    if (isset($payload['role']) && !in_array($payload['role'], $roles)) {
        sendError('Forbidden - Insufficient permissions', 403);
    }
}
