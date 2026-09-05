<?php
$user = getOptionalAuth();
$db = Database::getInstance()->getConnection();

try {
    $db->exec("CREATE TABLE IF NOT EXISTS security_deposits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        deposit_code VARCHAR(30) UNIQUE NOT NULL,
        project_id INT NOT NULL,
        client_id INT NULL,
        deposit_type ENUM('earnest_money','security_money','performance_guarantee','retention_money','other') DEFAULT 'security_money',
        amount DECIMAL(15,2) NOT NULL,
        deposit_date DATE NOT NULL,
        refund_date DATE,
        status ENUM('active','refunded','forfeited','partial_refund') DEFAULT 'active',
        refund_amount DECIMAL(15,2) DEFAULT 0,
        bank_name VARCHAR(100),
        account_number VARCHAR(50),
        cheque_number VARCHAR(50),
        transaction_ref VARCHAR(100),
        notes TEXT,
        received_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    )");
} catch (Exception $e) {}

try {
    $db->exec("ALTER TABLE security_deposits MODIFY client_id INT NULL");
} catch (Exception $e) {}

$projectId = $_GET['project_id'] ?? null;

switch ($method) {
    case 'GET':
        try {
            if ($id) {
                $stmt = $db->prepare("
                    SELECT sd.*, p.name as project_name, c.name as client_name, u.name as received_by_name
                    FROM security_deposits sd
                    LEFT JOIN projects p ON sd.project_id = p.id
                    LEFT JOIN clients c ON sd.client_id = c.id
                    LEFT JOIN users u ON sd.received_by = u.id
                    WHERE sd.id = ?
                ");
                $stmt->execute([$id]);
                $data = $stmt->fetch();
                if (!$data) sendError('Deposit not found', 404);
                sendJson(['success' => true, 'data' => $data]);
            } elseif ($projectId) {
                $stmt = $db->prepare("
                    SELECT sd.*, c.name as client_name, u.name as received_by_name
                    FROM security_deposits sd
                    LEFT JOIN clients c ON sd.client_id = c.id
                    LEFT JOIN users u ON sd.received_by = u.id
                    WHERE sd.project_id = ?
                    ORDER BY sd.deposit_date DESC, sd.id DESC
                ");
                $stmt->execute([$projectId]);
                $data = $stmt->fetchAll();
                
                $totalStmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM security_deposits WHERE project_id = ? AND status = 'active'");
                $totalStmt->execute([$projectId]);
                $total = $totalStmt->fetchColumn();
                
                sendJson([
                    'success' => true,
                    'data' => $data ?: [],
                    'total' => (float)$total
                ]);
            } else {
                $page = intval($_GET['page'] ?? 1);
                $per_page = intval($_GET['per_page'] ?? 50);
                $offset = ($page - 1) * $per_page;
                
                $where = ["1=1"];
                $params = [];
                
                if (!empty($_GET['project_id'])) {
                    $where[] = "sd.project_id = ?";
                    $params[] = $_GET['project_id'];
                }
                
                $whereClause = implode(' AND ', $where);
                
                $stmt = $db->prepare("
                    SELECT sd.*, p.name as project_name, c.name as client_name
                    FROM security_deposits sd
                    LEFT JOIN projects p ON sd.project_id = p.id
                    LEFT JOIN clients c ON sd.client_id = c.id
                    WHERE $whereClause
                    ORDER BY sd.deposit_date DESC
                    LIMIT $per_page OFFSET $offset
                ");
                $stmt->execute($params);
                $data = $stmt->fetchAll();
                
                $countStmt = $db->prepare("SELECT COUNT(*) FROM security_deposits sd WHERE $whereClause");
                $countStmt->execute($params);
                $total = $countStmt->fetchColumn();
                
                sendJson([
                    'success' => true,
                    'data' => $data ?: [],
                    'pagination' => [
                        'page' => $page,
                        'per_page' => $per_page,
                        'total' => (int)$total,
                        'total_pages' => ceil($total / $per_page)
                    ]
                ]);
            }
        } catch (Exception $e) {
            sendError('Failed to fetch deposits: ' . $e->getMessage(), 500);
        }
        break;

    case 'POST':
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $pId = !empty($input['project_id']) ? (int)$input['project_id'] : null;
            
            if (!$pId || empty($input['amount']) || empty($input['deposit_date'])) {
                sendError('Missing required fields: project_id, amount, deposit_date');
            }

            $cId = !empty($input['client_id']) ? (int)$input['client_id'] : null;
            if (!$cId && $pId) {
                $pStmt = $db->prepare("SELECT client_id FROM projects WHERE id = ?");
                $pStmt->execute([$pId]);
                $cId = $pStmt->fetchColumn() ?: null;
            }
            
            $depositCode = !empty($input['deposit_code']) ? sanitize($input['deposit_code']) : ('SD-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT));
            
            $stmt = $db->prepare("
                INSERT INTO security_deposits (deposit_code, project_id, client_id, deposit_type, amount, deposit_date,
                    refund_date, status, refund_amount, bank_name, account_number, cheque_number, transaction_ref, notes, received_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $depositCode,
                $pId,
                $cId,
                $input['deposit_type'] ?? 'security_money',
                $input['amount'],
                $input['deposit_date'],
                !empty($input['refund_date']) ? $input['refund_date'] : null,
                $input['status'] ?? 'active',
                !empty($input['refund_amount']) ? $input['refund_amount'] : 0,
                $input['bank_name'] ?? null,
                $input['account_number'] ?? null,
                $input['cheque_number'] ?? null,
                $input['transaction_ref'] ?? null,
                $input['notes'] ?? null,
                $user['id'] ?? null
            ]);
            
            if ($result) {
                sendJson(['success' => true, 'message' => 'Deposit recorded successfully', 'id' => $db->lastInsertId(), 'deposit_code' => $depositCode], 201);
            } else {
                sendError('Failed to record deposit');
            }
        } catch (Exception $e) {
            sendError('Failed to record deposit: ' . $e->getMessage(), 500);
        }
        break;

    case 'PUT':
        try {
            if (!$id) sendError('Deposit ID required');
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            $fields = [];
            $params = [];
            
            $allowedFields = ['deposit_type', 'amount', 'deposit_date', 'refund_date', 'status', 'refund_amount', 
                             'bank_name', 'account_number', 'cheque_number', 'transaction_ref', 'notes', 'client_id'];
            
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $input)) {
                    $fields[] = "$field = ?";
                    $val = $input[$field];
                    if (($field === 'refund_date' || $field === 'client_id') && empty($val)) {
                        $val = null;
                    }
                    $params[] = $val;
                }
            }
            
            if (empty($fields)) sendError('No valid fields to update');
            
            $params[] = $id;
            $sql = "UPDATE security_deposits SET " . implode(', ', $fields) . " WHERE id = ?";
            
            $stmt = $db->prepare($sql);
            $result = $stmt->execute($params);
            
            if ($result) {
                sendJson(['success' => true, 'message' => 'Deposit updated successfully']);
            } else {
                sendError('Failed to update deposit');
            }
        } catch (Exception $e) {
            sendError('Failed to update deposit: ' . $e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        try {
            if (!$id) sendError('Deposit ID required');
            
            $stmt = $db->prepare("DELETE FROM security_deposits WHERE id = ?");
            $result = $stmt->execute([$id]);
            
            if ($result) {
                sendJson(['success' => true, 'message' => 'Deposit deleted successfully']);
            } else {
                sendError('Failed to delete deposit');
            }
        } catch (Exception $e) {
            sendError('Failed to delete deposit: ' . $e->getMessage(), 500);
        }
        break;

    default:
        sendError('Method not allowed', 405);
}
