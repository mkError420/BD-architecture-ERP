<?php
$user = getOptionalAuth();
$db = Database::getInstance()->getConnection();

// Ensure invoices and invoice_items tables exist
try {
    $db->exec("CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_no VARCHAR(50) UNIQUE NOT NULL,
        project_id INT NOT NULL,
        client_id INT NOT NULL,
        issue_date DATE NOT NULL,
        due_date DATE,
        subtotal DECIMAL(15,2) DEFAULT 0,
        vat DECIMAL(5,2) DEFAULT 0,
        discount DECIMAL(15,2) DEFAULT 0,
        total DECIMAL(15,2) DEFAULT 0,
        paid_amount DECIMAL(15,2) DEFAULT 0,
        status ENUM('draft','sent','partially_paid','paid','overdue','cancelled') DEFAULT 'draft',
        payment_date DATE,
        payment_method VARCHAR(50),
        notes TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (client_id) REFERENCES clients(id)
    )");

    $db->exec("CREATE TABLE IF NOT EXISTS invoice_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        description TEXT NOT NULL,
        quantity DECIMAL(10,2) DEFAULT 1,
        unit_price DECIMAL(15,2) DEFAULT 0,
        total DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    )");
} catch (Exception $e) {
    // Ignore table creation errors
}

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
            $perPage = min(100, max(1, (int)($_GET['per_page'] ?? 20)));
            $status = $_GET['status'] ?? '';
            $project = $_GET['project_id'] ?? '';
            $offset = ($page - 1) * $perPage;

            $where = "WHERE 1=1"; $params = [];
            if ($status) { $where .= " AND i.status = ?"; $params[] = $status; }
            if ($project) { $where .= " AND i.project_id = ?"; $params[] = $project; }

            $total = $db->prepare("SELECT COUNT(*) FROM invoices i $where"); 
            $total->execute($params);
            $totalCount = (int)$total->fetchColumn();

            $stmt = $db->prepare(
                "SELECT i.*, c.name as client_name, p.name as project_name
                 FROM invoices i
                 LEFT JOIN clients c ON i.client_id = c.id
                 LEFT JOIN projects p ON i.project_id = p.id
                 $where ORDER BY i.created_at DESC LIMIT $perPage OFFSET $offset"
            );
            $stmt->execute($params);
            $invoices = $stmt->fetchAll();

            // Fetch items for each invoice if requested or list summary
            foreach ($invoices as &$invoice) {
                $itemStmt = $db->prepare("SELECT * FROM invoice_items WHERE invoice_id = ?");
                $itemStmt->execute([$invoice['id']]);
                $invoice['items'] = $itemStmt->fetchAll();
            }
            unset($invoice);

            sendPaginated($invoices, $totalCount, $page, $perPage);
        }
        break;

    case 'POST':
        $body = getJsonBody();
        $projectId = !empty($body['project_id']) ? (int)$body['project_id'] : null;
        $clientId = !empty($body['client_id']) ? (int)$body['client_id'] : null;

        // Auto resolve client_id from project if not provided
        if (!$clientId && $projectId) {
            $pStmt = $db->prepare("SELECT client_id FROM projects WHERE id = ?");
            $pStmt->execute([$projectId]);
            $clientId = $pStmt->fetchColumn() ?: null;
        }

        if (!$projectId || !$clientId) sendError('Project and client required');

        $db->beginTransaction();
        try {
            $tempNo = 'TMP-' . microtime(true) . '-' . mt_rand(1000, 9999);
            $db->prepare(
                "INSERT INTO invoices (invoice_no, project_id, client_id, issue_date, due_date, subtotal, vat, discount, total, paid_amount, status, notes, created_by)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)"
            )->execute([
                $tempNo,
                $projectId, $clientId, $body['issue_date'] ?? date('Y-m-d'),
                $body['due_date'] ?? null, $body['subtotal'] ?? 0,
                $body['vat'] ?? 0, $body['discount'] ?? 0, $body['total'] ?? 0,
                $body['paid_amount'] ?? 0,
                $body['status'] ?? 'sent', $body['notes'] ?? null, $user['id'] ?? null
            ]);
            $newId = $db->lastInsertId();
            $invNo = !empty($body['invoice_no']) ? sanitize($body['invoice_no']) : ('INV-' . date('Y') . '-' . str_pad($newId, 4, '0', STR_PAD_LEFT));
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
            sendSuccess(['id' => $newId, 'invoice_no' => $invNo], 'Invoice created successfully', 201);
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
        $allowed = ['invoice_no', 'client_id', 'issue_date','due_date','subtotal','vat','discount','total','paid_amount',
                     'status','payment_date','payment_method','notes'];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $body)) { $fields[] = "$f = ?"; $params[] = $body[$f]; }
        }
        if (empty($fields) && !isset($body['items'])) sendError('No fields to update');
        
        $db->beginTransaction();
        try {
            if (!empty($fields)) {
                $params[] = $id;
                $db->prepare("UPDATE invoices SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
            }

            // Update items if provided
            if (isset($body['items']) && is_array($body['items'])) {
                $db->prepare("DELETE FROM invoice_items WHERE invoice_id = ?")->execute([$id]);
                $itemStmt = $db->prepare(
                    "INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total) VALUES (?,?,?,?,?)"
                );
                foreach ($body['items'] as $item) {
                    $itemStmt->execute([
                        $id, $item['description'] ?? '', $item['quantity'] ?? 1,
                        $item['unit_price'] ?? 0, $item['total'] ?? 0
                    ]);
                }
            }

            $db->commit();
            sendSuccess(null, 'Invoice updated successfully');
        } catch (Exception $e) {
            $db->rollBack();
            sendError('Failed to update invoice: ' . $e->getMessage(), 500);
        }
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
        sendSuccess(null, 'Invoice deleted successfully');
        break;

    default:
        sendError('Method not allowed', 405);
}
