<?php
function sendResponse($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function sendSuccess($data = null, string $message = 'Success', int $code = 200): void {
    sendResponse(['success' => true, 'message' => $message, 'data' => $data], $code);
}

function sendJson($data = null, int $code = 200): void {
    if (is_array($data) && isset($data['success'])) {
        sendResponse($data, $code);
    } elseif (is_array($data) && (isset($data['message']) || isset($data['pagination']))) {
        $res = ['success' => true];
        foreach ($data as $k => $v) {
            $res[$k] = $v;
        }
        sendResponse($res, $code);
    } else {
        sendResponse(['success' => true, 'data' => $data], $code);
    }
}

function sendError(string $message = 'Error', int $code = 400, $errors = null): void {
    $res = ['success' => false, 'message' => $message];
    if ($errors) $res['errors'] = $errors;
    sendResponse($res, $code);
}

function sendPaginated(array $data, int $total, int $page, int $perPage): void {
    sendResponse([
        'success' => true,
        'data' => $data,
        'pagination' => [
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => (int)ceil($total / $perPage),
        ]
    ]);
}

function getJsonBody(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

function sanitize(string $str): string {
    return htmlspecialchars(strip_tags(trim($str)), ENT_QUOTES, 'UTF-8');
}

function generateCode(string $prefix, int $id): string {
    return $prefix . '-' . str_pad($id, 5, '0', STR_PAD_LEFT);
}
