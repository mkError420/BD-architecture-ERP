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
        milestone VARCHAR(200) NULL,
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

    // Ensure milestone text column exists if table was previously created without it
    try {
        $db->exec("ALTER TABLE client_payments ADD COLUMN milestone VARCHAR(200) NULL AFTER milestone_id");
    } catch (Exception $e) {}

} catch (Exception $e) {
    // Ignore table creation errors
}

$projectId = $_GET['project_id'] ?? null;
$type = $_GET['type'] ?? '';

switch ($method) {
    case 'GET':
        if ($id) {
            if ($type === 'plans' || $type === 'milestones') {
                $stmt = $db->prepare("SELECT * FROM payment_milestones WHERE id = ?");
                $stmt->execute([$id]);
                $data = $stmt->fetch();
                if (!$data) sendError('Payment milestone not found', 404);
                sendJson(['success' => true, 'data' => $data]);
            } else {
                // Single payment
                $stmt = $db->prepare("
                    SELECT cp.*, p.name as project_name, c.name as client_name, u.name as received_by_name,
                           pm.milestone_name as milestone_ref_name
                    FROM client_payments cp
                    LEFT JOIN projects p ON cp.project_id = p.id
                    LEFT JOIN clients c ON cp.client_id = c.id
                    LEFT JOIN users u ON cp.received_by = u.id
                    LEFT JOIN payment_milestones pm ON cp.milestone_id = pm.id
                    WHERE cp.id = ?
                ");
                $stmt->execute([$id]);
                $data = $stmt->fetch();
                if (!$data) sendError('Payment not found', 404);
                sendJson(['success' => true, 'data' => $data]);
            }
        } elseif ($projectId) {
            if ($type === 'plans' || $type === 'milestones') {
                $stmt = $db->prepare("
                    SELECT pm.*,
                           COALESCE(
                               (SELECT SUM(cp.amount) FROM client_payments cp 
                                WHERE cp.project_id = pm.project_id 
                                  AND (cp.milestone_id = pm.id OR (pm.milestone_name IS NOT NULL AND cp.milestone = pm.milestone_name))
                               ), 0
                           ) as collected_amount
                    FROM payment_milestones pm
                    WHERE pm.project_id = ?
                    ORDER BY pm.due_date ASC, pm.id ASC
                ");
                $stmt->execute([$projectId]);
                $milestones = $stmt->fetchAll();
                sendJson([
                    'success' => true,
                    'data' => $milestones
                ]);
            } else {
                // Payments for specific project
                $stmt = $db->prepare("
                    SELECT cp.*, c.name as client_name, u.name as received_by_name,
                           pm.milestone_name as milestone_ref_name
                    FROM client_payments cp
                    LEFT JOIN clients c ON cp.client_id = c.id
                    LEFT JOIN users u ON cp.received_by = u.id
                    LEFT JOIN payment_milestones pm ON cp.milestone_id = pm.id
                    WHERE cp.project_id = ?
                    ORDER BY cp.payment_date DESC, cp.id DESC
                ");
                $stmt->execute([$projectId]);
                $data = $stmt->fetchAll();
                
                // Get totals
                $totalStmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM client_payments WHERE project_id = ?");
                $totalStmt->execute([$projectId]);
                $total = $totalStmt->fetchColumn();
                
                sendJson([
                    'success' => true,
                    'data' => $data,
                    'total' => (float)$total
                ]);
            }
        } else {
            if ($type === 'plans' || $type === 'milestones') {
                $stmt = $db->prepare("
                    SELECT pm.*, p.name as project_name
                    FROM payment_milestones pm
                    LEFT JOIN projects p ON pm.project_id = p.id
                    ORDER BY pm.due_date ASC
                ");
                $stmt->execute();
                $data = $stmt->fetchAll();
                sendJson(['success' => true, 'data' => $data]);
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
                    'success' => true,
                    'data' => $data,
                    'pagination' => [
                        'page' => $page,
                        'per_page' => $per_page,
                        'total' => (int)$total,
                        'total_pages' => ceil($total / $per_page)
                    ]
                ]);
            }
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $reqType = $_GET['type'] ?? ($input['type'] ?? '');
        
        if ($reqType === 'plans' || $reqType === 'milestones' || (isset($input['milestone_name']) && empty($input['payment_date']))) {
            $pId = !empty($input['project_id']) ? (int)$input['project_id'] : null;
            $milestoneName = trim($input['milestone_name'] ?? '');
            $targetAmount = $input['target_amount'] ?? null;
            
            if (!$pId || empty($milestoneName) || !isset($targetAmount)) {
                sendError('project_id, milestone_name, and target_amount are required');
            }
            
            $stmt = $db->prepare("
                INSERT INTO payment_milestones (project_id, milestone_name, description, target_amount, due_date, completion_percentage, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $result = $stmt->execute([
                $pId,
                $milestoneName,
                $input['description'] ?? null,
                $targetAmount,
                $input['due_date'] ?? null,
                $input['completion_percentage'] ?? 0,
                $input['status'] ?? 'pending'
            ]);
            
            if ($result) {
                sendJson(['success' => true, 'message' => 'Payment milestone created successfully', 'id' => $db->lastInsertId()], 201);
            } else {
                sendError('Failed to create payment milestone');
            }
            break;
        }

        // Standard Payment Record
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
        $milestone = !empty($input['milestone']) ? trim($input['milestone']) : null;
        $milestoneId = !empty($input['milestone_id']) ? (int)$input['milestone_id'] : null;

        $stmt = $db->prepare("
            INSERT INTO client_payments (payment_code, project_id, client_id, payment_date, amount, payment_method, 
                bank_name, account_number, cheque_number, transaction_ref, payment_for, milestone_id, milestone, notes, received_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            $milestoneId,
            $milestone,
            $input['notes'] ?? null,
            $receivedBy
        ]);
        
        if ($result) {
            // Auto update milestone status if applicable
            if ($milestoneId) {
                try {
                    $mStmt = $db->prepare("
                        SELECT pm.target_amount, COALESCE(SUM(cp.amount), 0) as total_collected
                        FROM payment_milestones pm
                        LEFT JOIN client_payments cp ON cp.milestone_id = pm.id
                        WHERE pm.id = ?
                        GROUP BY pm.id
                    ");
                    $mStmt->execute([$milestoneId]);
                    $mInfo = $mStmt->fetch();
                    if ($mInfo) {
                        $target = (float)$mInfo['target_amount'];
                        $collected = (float)$mInfo['total_collected'];
                        $newStatus = $collected >= $target ? 'completed' : ($collected > 0 ? 'partial' : 'pending');
                        $db->prepare("UPDATE payment_milestones SET status = ? WHERE id = ?")->execute([$newStatus, $milestoneId]);
                    }
                } catch (Exception $e) {}
            }

            sendJson(['success' => true, 'message' => 'Payment recorded successfully', 'id' => $db->lastInsertId(), 'payment_code' => $paymentCode], 201);
        } else {
            sendError('Failed to record payment');
        }
        break;

    case 'PUT':
        if (!$id) sendError('ID required');
        
        $input = json_decode(file_get_contents('php://input'), true);
        $reqType = $_GET['type'] ?? ($input['type'] ?? '');
        
        if ($reqType === 'plans' || $reqType === 'milestones' || isset($input['milestone_name'])) {
            $fields = [];
            $params = [];
            $allowed = ['milestone_name', 'description', 'target_amount', 'due_date', 'completion_percentage', 'status'];
            foreach ($allowed as $f) {
                if (array_key_exists($f, $input)) {
                    $fields[] = "$f = ?";
                    $params[] = $input[$f];
                }
            }
            if (empty($fields)) sendError('No valid fields to update');
            $params[] = $id;
            $stmt = $db->prepare("UPDATE payment_milestones SET " . implode(', ', $fields) . " WHERE id = ?");
            $result = $stmt->execute($params);
            if ($result) {
                sendJson(['success' => true, 'message' => 'Payment milestone updated successfully']);
            } else {
                sendError('Failed to update payment milestone');
            }
            break;
        }

        $fields = [];
        $params = [];
        
        $allowedFields = ['payment_date', 'amount', 'payment_method', 'bank_name', 'account_number', 
                         'cheque_number', 'transaction_ref', 'payment_for', 'milestone_id', 'milestone', 'notes'];
        
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
            sendJson(['success' => true, 'message' => 'Payment updated successfully']);
        } else {
            sendError('Failed to update payment');
        }
        break;

    case 'DELETE':
        if (!$id) sendError('ID required');
        $reqType = $_GET['type'] ?? '';
        
        if ($reqType === 'plans' || $reqType === 'milestones') {
            $stmt = $db->prepare("DELETE FROM payment_milestones WHERE id = ?");
            $result = $stmt->execute([$id]);
            if ($result) {
                sendJson(['success' => true, 'message' => 'Payment milestone deleted successfully']);
            } else {
                sendError('Failed to delete payment milestone');
            }
            break;
        }

        $stmt = $db->prepare("DELETE FROM client_payments WHERE id = ?");
        $result = $stmt->execute([$id]);
        
        if ($result) {
            sendJson(['success' => true, 'message' => 'Payment deleted successfully']);
        } else {
            sendError('Failed to delete payment');
        }
        break;

    default:
        sendError('Method not allowed', 405);
}
