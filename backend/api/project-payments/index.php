<?php
$user = getOptionalAuth();
$db = Database::getInstance()->getConnection();

// Ensure tables exist
try {
    $db->exec("CREATE TABLE IF NOT EXISTS client_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        payment_code VARCHAR(30) UNIQUE NOT NULL,
        project_id INT NOT NULL,
        client_id INT NULL,
        payment_date DATE NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        payment_method ENUM('cash','bank_transfer','cheque','mobile_banking') DEFAULT 'cash',
        bank_name VARCHAR(100),
        account_number VARCHAR(50),
        cheque_number VARCHAR(50),
        transaction_ref VARCHAR(100),
        payment_for ENUM('advance','milestone','final','retention','other') DEFAULT 'advance',
        milestone_id INT,
        notes TEXT,
        received_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    )");
    
    $db->exec("CREATE TABLE IF NOT EXISTS payment_milestones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        milestone_name VARCHAR(200) NOT NULL,
        description TEXT,
        target_amount DECIMAL(15,2) NOT NULL,
        due_date DATE,
        completion_percentage INT DEFAULT 0,
        status ENUM('pending','partial','completed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    )");
} catch (Exception $e) {
    // Ignore table creation errors
}

$projectId = $_GET['project_id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            // Single payment
            $stmt = $db->prepare("
                SELECT cp.*, p.name as project_name, c.name as client_name, u.name as received_by_name
                FROM client_payments cp
                LEFT JOIN projects p ON cp.project_id = p.id
                LEFT JOIN clients c ON cp.client_id = c.id
                LEFT JOIN users u ON cp.received_by = u.id
                WHERE cp.id = ?
            ");
            $stmt->execute([$id]);
            $data = $stmt->fetch();
            if (!$data) sendError('Payment not found', 404);
            sendJson($data);
        } elseif ($projectId) {
            $type = $_GET['type'] ?? 'history';
            if ($type === 'plans' || $type === 'milestones') {
                $stmt = $db->prepare("SELECT * FROM payment_milestones WHERE project_id = ? ORDER BY due_date ASC");
                $stmt->execute([$projectId]);
                $milestones = $stmt->fetchAll();
                sendJson($milestones);
            } else {
                // Payments for specific project
                $stmt = $db->prepare("
                    SELECT cp.*, c.name as client_name, u.name as received_by_name
                    FROM client_payments cp
                    LEFT JOIN clients c ON cp.client_id = c.id
                    LEFT JOIN users u ON cp.received_by = u.id
                    WHERE cp.project_id = ?
                    ORDER BY cp.payment_date DESC
                ");
                $stmt->execute([$projectId]);
                $data = $stmt->fetchAll();
                
                // Get totals
                $totalStmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM client_payments WHERE project_id = ?");
                $totalStmt->execute([$projectId]);
                $total = $totalStmt->fetchColumn();
                
                sendJson([
                    'data' => $data,
                    'total' => (float)$total
                ]);
            }
        } else {
            // All payments with pagination
            $page = intval($_GET['page'] ?? 1);
            $per_page = intval($_GET['per_page'] ?? 20);
            $offset = ($page - 1) * $per_page;
            
            $where = ["1=1"];
            $params = [];
            
            if (!empty($_GET['project_id'])) {
                $where[] = "cp.project_id = ?";
                $params[] = $_GET['project_id'];
            }
            
            $whereClause = implode(' AND ', $where);
            
            $stmt = $db->prepare("
                SELECT cp.*, p.name as project_name, c.name as client_name
                FROM client_payments cp
                LEFT JOIN projects p ON cp.project_id = p.id
                LEFT JOIN clients c ON cp.client_id = c.id
                WHERE $whereClause
                ORDER BY cp.payment_date DESC
                LIMIT $per_page OFFSET $offset
            ");
            $stmt->execute($params);
            $data = $stmt->fetchAll();
            
            $countStmt = $db->prepare("SELECT COUNT(*) FROM client_payments cp WHERE $whereClause");
            $countStmt->execute($params);
            $total = $countStmt->fetchColumn();
            
            sendJson([
                'data' => $data,
                'pagination' => [
                    'page' => $page,
                    'per_page' => $per_page,
                    'total' => (int)$total,
                    'total_pages' => ceil($total / $per_page)
                ]
            ]);
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        $pId = !empty($input['project_id']) ? (int)$input['project_id'] : null;
        if (!$pId || empty($input['amount']) || empty($input['payment_date'])) {
            sendError('Missing required fields: project_id, amount, payment_date');
        }

        // Auto-resolve client_id from project if not provided
        $cId = !empty($input['client_id']) ? (int)$input['client_id'] : null;
        if (!$cId && $pId) {
            $pStmt = $db->prepare("SELECT client_id FROM projects WHERE id = ?");
            $pStmt->execute([$pId]);
            $cId = $pStmt->fetchColumn() ?: null;
        }

        $receivedBy = isset($user['id']) ? (int)$user['id'] : null;
        
        // Generate payment code
        $paymentCode = !empty($input['payment_code']) ? sanitize($input['payment_code']) : ('PAY-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT));
        
        $stmt = $db->prepare("
            INSERT INTO client_payments (payment_code, project_id, client_id, payment_date, amount, payment_method, 
                bank_name, account_number, cheque_number, transaction_ref, payment_for, milestone_id, notes, received_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $result = $stmt->execute([
            $paymentCode,
            $pId,
            $cId,
            $input['payment_date'],
            $input['amount'],
            $input['payment_method'] ?? 'cash',
            $input['bank_name'] ?? null,
            $input['account_number'] ?? null,
            $input['cheque_number'] ?? null,
            $input['transaction_ref'] ?? null,
            $input['payment_for'] ?? 'advance',
            $input['milestone_id'] ?? null,
            $input['notes'] ?? null,
            $receivedBy
        ]);
        
        if ($result) {
            sendJson(['message' => 'Payment recorded successfully', 'id' => $db->lastInsertId(), 'payment_code' => $paymentCode], 201);
        } else {
            sendError('Failed to record payment');
        }
        break;

    case 'PUT':
        if (!$id) sendError('Payment ID required');
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        $allowedFields = ['payment_date', 'amount', 'payment_method', 'bank_name', 'account_number', 
                         'cheque_number', 'transaction_ref', 'payment_for', 'milestone_id', 'notes'];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $input)) {
                $fields[] = "$field = ?";
                $params[] = $input[$field];
            }
        }
        
        if (empty($fields)) {
            sendError('No valid fields to update');
        }
        
        $params[] = $id;
        $sql = "UPDATE client_payments SET " . implode(', ', $fields) . " WHERE id = ?";
        
        $stmt = $db->prepare($sql);
        $result = $stmt->execute($params);
        
        if ($result) {
            sendJson(['message' => 'Payment updated successfully']);
        } else {
            sendError('Failed to update payment');
        }
        break;

    case 'DELETE':
        if (!$id) sendError('Payment ID required');
        
        $stmt = $db->prepare("DELETE FROM client_payments WHERE id = ?");
        $result = $stmt->execute([$id]);
        
        if ($result) {
            sendJson(['message' => 'Payment deleted successfully']);
        } else {
            sendError('Failed to delete payment');
        }
        break;

    default:
        sendError('Method not allowed', 405);
}
