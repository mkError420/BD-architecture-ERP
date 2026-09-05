<?php
$user = getOptionalAuth();
$db = Database::getInstance()->getConnection();

switch ($method) {
    case 'GET':
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(100, max(10, (int)($_GET['per_page'] ?? 50)));
        $month = $_GET['month'] ?? '';
        $employee = $_GET['employee_id'] ?? '';
        $projectId = $_GET['project_id'] ?? '';
        $offset = ($page - 1) * $perPage;

        $where = "WHERE 1=1"; $params = [];
        if ($month) { $where .= " AND sp.payment_month = ?"; $params[] = $month; }
        if ($employee) { $where .= " AND sp.employee_id = ?"; $params[] = $employee; }
        if ($projectId) { $where .= " AND sp.project_id = ?"; $params[] = $projectId; }

        $total = $db->prepare("SELECT COUNT(*) FROM salary_payments sp $where"); $total->execute($params);
        $stmt = $db->prepare(
            "SELECT sp.*, e.name as employee_name, e.employee_code, e.role as employee_role
             FROM salary_payments sp
             LEFT JOIN employees e ON sp.employee_id = e.id
             $where ORDER BY sp.payment_month DESC, sp.created_at DESC LIMIT $perPage OFFSET $offset"
        );
        $stmt->execute($params);
        sendPaginated($stmt->fetchAll(), $total->fetchColumn(), $page, $perPage);
        break;

    case 'POST':
        if ($user) {
            requireRole($user, ['admin','accountant']);
        }
        $body = getJsonBody();
        $empId = $body['employee_id'] ?? null;
        $month = !empty($body['payment_month']) ? $body['payment_month'] : (!empty($body['payment_date']) ? substr($body['payment_date'], 0, 7) : date('Y-m'));
        if (!$empId) sendError('Employee required');

        $db->prepare(
            "INSERT INTO salary_payments (employee_id, project_id, payment_month, basic_salary,
                overtime_pay, bonus, deduction, net_salary, payment_date, payment_method,
                transaction_ref, status, paid_by, notes)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
        )->execute([
            $empId, $body['project_id'] ?? null, $month,
            $body['basic_salary'] ?? 0, $body['overtime_pay'] ?? 0,
            $body['bonus'] ?? 0, $body['deduction'] ?? 0,
            $body['net_salary'] ?? 0, $body['payment_date'] ?? null,
            $body['payment_method'] ?? 'cash', $body['transaction_ref'] ?? null,
            $body['status'] ?? 'pending', $user['id'] ?? null, $body['notes'] ?? null
        ]);
        sendSuccess(['id' => $db->lastInsertId()], 'Salary payment created', 201);
        break;

    case 'PUT':
    case 'PATCH':
        if (!$id) sendError('Payment ID required');
        $body = getJsonBody();
        $fields = []; $params = [];
        $allowed = ['employee_id','project_id','payment_month','basic_salary','overtime_pay','bonus','deduction','net_salary','payment_date',
                     'payment_method','transaction_ref','status','notes'];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $body)) { $fields[] = "$f = ?"; $params[] = $body[$f]; }
        }
        if (empty($fields)) sendError('No fields to update');
        $params[] = $id;
        $db->prepare("UPDATE salary_payments SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
        sendSuccess(null, 'Salary updated');
        break;

    case 'DELETE':
        if (!$id) sendError('Payment ID required');
        $db->prepare("DELETE FROM salary_payments WHERE id = ?")->execute([$id]);
        sendSuccess(null, 'Salary payment deleted');
        break;

    default:
        sendError('Method not allowed', 405);
}
