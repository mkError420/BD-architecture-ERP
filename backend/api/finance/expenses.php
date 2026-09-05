<?php
$user = getOptionalAuth();
$db = Database::getInstance()->getConnection();

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare(
                "SELECT e.*, p.name as project_name, u.name as created_by_name
                 FROM expenses e
                 LEFT JOIN projects p ON e.project_id = p.id
                 LEFT JOIN users u ON e.created_by = u.id
                 WHERE e.id = ?"
            );
            $stmt->execute([$id]);
            $expense = $stmt->fetch();
            if (!$expense) sendError('Expense not found', 404);
            sendSuccess($expense);
        } else {
            $page = max(1, (int)($_GET['page'] ?? 1));
            $perPage = min(50, max(10, (int)($_GET['per_page'] ?? 10)));
            $project = $_GET['project_id'] ?? '';
            $category = $_GET['category'] ?? '';
            $fromDate = $_GET['from_date'] ?? '';
            $toDate = $_GET['to_date'] ?? '';
            $offset = ($page - 1) * $perPage;

            $where = "WHERE 1=1"; $params = [];
            if ($project) { $where .= " AND e.project_id = ?"; $params[] = $project; }
            if ($category) { $where .= " AND e.category = ?"; $params[] = $category; }
            if ($fromDate) { $where .= " AND e.expense_date >= ?"; $params[] = $fromDate; }
            if ($toDate) { $where .= " AND e.expense_date <= ?"; $params[] = $toDate; }

            $total = $db->prepare("SELECT COUNT(*) FROM expenses e $where"); $total->execute($params);
            $totalAmount = $db->prepare("SELECT COALESCE(SUM(amount),0) FROM expenses e $where"); $totalAmount->execute($params);

            $stmt = $db->prepare(
                "SELECT e.*, p.name as project_name
                 FROM expenses e LEFT JOIN projects p ON e.project_id = p.id
                 $where ORDER BY e.expense_date DESC LIMIT $perPage OFFSET $offset"
            );
            $stmt->execute($params);

            $data = $stmt->fetchAll();
            sendResponse([
                'success' => true,
                'data' => $data,
                'total_amount' => $totalAmount->fetchColumn(),
                'pagination' => [
                    'total' => $total->fetchColumn(),
                    'page' => $page,
                    'per_page' => $perPage,
                ]
            ]);
        }
        break;

    case 'POST':
        $body = getJsonBody();
        $title = sanitize($body['title'] ?? '');
        $amount = (float)($body['amount'] ?? 0);
        if (!$title || !$amount) sendError('Title and amount required');

        $db->prepare("INSERT INTO expenses (expense_code, title, amount, expense_date, created_by) VALUES ('TEMP',?,?,?,?)")
           ->execute([$title, $amount, $body['expense_date'] ?? date('Y-m-d'), $user['id'] ?? null]);
        $newId = $db->lastInsertId();
        $code = generateCode('EXP', $newId);
        $db->prepare(
            "UPDATE expenses SET expense_code=?, project_id=?, category=?, paid_to=?, payment_method=?,
                transaction_ref=?, vat_amount=?, tax_amount=?, notes=? WHERE id=?"
        )->execute([
            $code, $body['project_id'] ?? null, $body['category'] ?? 'other',
            $body['paid_to'] ?? null, $body['payment_method'] ?? 'cash',
            $body['transaction_ref'] ?? null, $body['vat_amount'] ?? 0,
            $body['tax_amount'] ?? 0, $body['notes'] ?? null, $newId
        ]);
        sendSuccess(['id' => $newId, 'expense_code' => $code], 'Expense created', 201);
        break;

    case 'PUT':
    case 'PATCH':
        if (!$id) sendError('Expense ID required');
        $body = getJsonBody();
        $fields = []; $params = [];
        $allowed = ['title','project_id','category','amount','expense_date','paid_to','payment_method',
                     'transaction_ref','vat_amount','tax_amount','is_approved','notes'];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $body)) { $fields[] = "$f = ?"; $params[] = $body[$f]; }
        }
        if (isset($body['is_approved']) && $body['is_approved']) {
            $fields[] = "approved_by = ?"; $params[] = $user['id'] ?? null;
            $fields[] = "approved_at = NOW()";
        }
        if (empty($fields)) sendError('No fields to update');
        $params[] = $id;
        $db->prepare("UPDATE expenses SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
        sendSuccess(null, 'Expense updated');
        break;

    case 'DELETE':
        if (!$id) sendError('Expense ID required');
        if ($user) {
            requireRole($user, ['admin','accountant']);
        }
        $db->prepare("DELETE FROM expenses WHERE id = ?")->execute([$id]);
        sendSuccess(null, 'Expense deleted');
        break;

    default:
        sendError('Method not allowed', 405);
}
