<?php
$user = getOptionalAuth();
$db = Database::getInstance()->getConnection();

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare(
                "SELECT i.*, c.name as client_name, p.name as project_name
                 FROM invoices i
                 LEFT JOIN clients c ON i.client_id = c.id
                 LEFT JOIN projects p ON i.project_id = p.id
                 WHERE i.id = ?"
            );
            $stmt->execute([$id]);
            $inv = $stmt->fetch();
            if (!$inv) sendError('Invoice not found', 404);

            $items = $db->prepare("SELECT * FROM invoice_items WHERE invoice_id = ?");
            $items->execute([$id]);
            $inv['items'] = $items->fetchAll();
            sendSuccess($inv);
        } else {
            $page = max(1, (int)($_GET['page'] ?? 1));
            $perPage = min(50, max(10, (int)($_GET['per_page'] ?? 10)));
            $status = $_GET['status'] ?? '';
            $project = $_GET['project_id'] ?? '';
            $offset = ($page - 1) * $perPage;

            $where = "WHERE 1=1"; $params = [];
            if ($status) { $where .= " AND i.status = ?"; $params[] = $status; }
            if ($project) { $where .= " AND i.project_id = ?"; $params[] = $project; }

            $total = $db->prepare("SELECT COUNT(*) FROM invoices i $where"); $total->execute($params);
            $stmt = $db->prepare(
                "SELECT i.*, c.name as client_name, p.name as project_name
                 FROM invoices i
                 LEFT JOIN clients c ON i.client_id = c.id
                 LEFT JOIN projects p ON i.project_id = p.id
                 $where ORDER BY i.created_at DESC LIMIT $perPage OFFSET $offset"
            );
            $stmt->execute($params);
            sendPaginated($stmt->fetchAll(), $total->fetchColumn(), $page, $perPage);
        }
        break;

    case 'POST':
        $body = getJsonBody();
        $projectId = $body['project_id'] ?? null;
        $clientId = $body['client_id'] ?? null;
        if (!$projectId || !$clientId) sendError('Project and client required');

        $db->beginTransaction();
        try {
            $db->prepare(
                "INSERT INTO invoices (invoice_no, project_id, client_id, issue_date, due_date, subtotal, vat, discount, total, status, notes, created_by)
                 VALUES ('TEMP',?,?,?,?,?,?,?,?,?,?,?)"
            )->execute([
                $projectId, $clientId, $body['issue_date'] ?? date('Y-m-d'),
                $body['due_date'] ?? null, $body['subtotal'] ?? 0,
                $body['vat'] ?? 0, $body['discount'] ?? 0, $body['total'] ?? 0,
                $body['status'] ?? 'draft', $body['notes'] ?? null, $user['id'] ?? null
            ]);
            $newId = $db->lastInsertId();
            $invNo = 'INV-' . str_pad($newId, 6, '0', STR_PAD_LEFT);
            $db->prepare("UPDATE invoices SET invoice_no = ? WHERE id = ?")->execute([$invNo, $newId]);

            // Invoice items
            if (isset($body['items']) && is_array($body['items'])) {
                $itemStmt = $db->prepare(
                    "INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total) VALUES (?,?,?,?,?)"
                );
                foreach ($body['items'] as $item) {
                    $itemStmt->execute([
                        $newId, $item['description'] ?? '', $item['quantity'] ?? 1,
                        $item['unit_price'] ?? 0, $item['total'] ?? 0
                    ]);
                }
            }
            $db->commit();
            sendSuccess(['id' => $newId, 'invoice_no' => $invNo], 'Invoice created', 201);
        } catch (Exception $e) {
            $db->rollBack();
            sendError('Failed to create invoice: ' . $e->getMessage(), 500);
        }
        break;

    case 'PUT':
    case 'PATCH':
        if (!$id) sendError('Invoice ID required');
        $body = getJsonBody();
        $fields = []; $params = [];
        $allowed = ['issue_date','due_date','subtotal','vat','discount','total','paid_amount',
                     'status','payment_date','payment_method','notes'];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $body)) { $fields[] = "$f = ?"; $params[] = $body[$f]; }
        }
        if (empty($fields)) sendError('No fields to update');
        $params[] = $id;
        $db->prepare("UPDATE invoices SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
        sendSuccess(null, 'Invoice updated');
        break;

    case 'DELETE':
        if (!$id) sendError('Invoice ID required');
        if ($user) {
            requireRole($user, ['admin']);
        }
        $db->beginTransaction();
        $db->prepare("DELETE FROM invoice_items WHERE invoice_id = ?")->execute([$id]);
        $db->prepare("DELETE FROM invoices WHERE id = ?")->execute([$id]);
        $db->commit();
        sendSuccess(null, 'Invoice deleted');
        break;

    default:
        sendError('Method not allowed', 405);
}
