<?php
header('Content-Type: application/json; charset=utf-8');

// CORS configuration for production
$allowedOrigins = ['https://mkposs.gt.tc', 'http://localhost:5173', 'http://localhost:3000'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/middleware/auth.php';

// Parse request dynamically for any folder location
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = array_values(array_filter(explode('/', trim($uri, '/'))));
$backendIdx = array_search('backend', $parts);
if ($backendIdx !== false) {
    $segments = array_slice($parts, $backendIdx + 1);
} else {
    $segments = $parts;
}

$method = $_SERVER['REQUEST_METHOD'];
$module = $segments[0] ?? '';
$sub = $segments[1] ?? '';
$id = isset($segments[2]) ? (int)$segments[2] : (is_numeric($sub) ? (int)$sub : null);
if (is_numeric($sub)) { $sub = ''; }

// Route dispatcher
switch ($module) {
    case 'auth':
        require __DIR__ . '/api/auth/' . ($sub ?: 'login') . '.php';
        break;
    case 'dashboard':
        require __DIR__ . '/api/dashboard/index.php';
        break;
    case 'projects':
        require __DIR__ . '/api/projects/index.php';
        break;
    case 'clients':
        require __DIR__ . '/api/clients/index.php';
        break;
    case 'employees':
        require __DIR__ . '/api/employees/index.php';
        break;
    case 'attendance':
        require __DIR__ . '/api/attendance/index.php';
        break;
    case 'materials':
        require __DIR__ . '/api/materials/index.php';
        break;
    case 'suppliers':
        require __DIR__ . '/api/suppliers/index.php';
        break;
    case 'workorders':
        require __DIR__ . '/api/workorders/index.php';
        break;
    case 'expenses':
        require __DIR__ . '/api/finance/expenses.php';
        break;
    case 'invoices':
        require __DIR__ . '/api/finance/invoices.php';
        break;
    case 'salary':
        require __DIR__ . '/api/finance/salary.php';
        break;
    case 'documents':
        require __DIR__ . '/api/documents/index.php';
        break;
    case 'reports':
        require __DIR__ . '/api/reports/index.php';
        break;
    case 'users':
        require __DIR__ . '/api/users/index.php';
        break;
    case 'settings':
        require __DIR__ . '/api/settings/index.php';
        break;
    case 'project-payments':
        require __DIR__ . '/api/project-payments/index.php';
        break;
    case 'security-deposits':
        require __DIR__ . '/api/security-deposits/index.php';
        break;
    case 'boq':
        require __DIR__ . '/api/boq/index.php';
        break;
    case 'project-schedule':
        require __DIR__ . '/api/project-schedule/index.php';
        break;
    case 'purchases':
        require __DIR__ . '/api/purchases/index.php';
        break;
    case 'stock':
        require __DIR__ . '/api/stock/index.php';
        break;
    case 'labour-wages':
        require __DIR__ . '/api/labour-wages/index.php';
        break;
    case 'tools':
        require __DIR__ . '/api/tools/index.php';
        break;
    case 'vehicles':
        require __DIR__ . '/api/vehicles/index.php';
        break;
    default:
        sendError('Endpoint not found', 404);
}
