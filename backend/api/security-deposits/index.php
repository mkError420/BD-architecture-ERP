<?php
$user = getOptionalAuth();
$db = Database::getInstance()->getConnection();

try {
    $db->exec("CREATE TABLE IF NOT EXISTS security_deposits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        deposit_code VARCHAR(30) UNIQUE NOT NULL,
        project_id INT NOT NULL,
        client_id INT NOT NULL,
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
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (received_by) REFERENCES users(id)
    )");
} catch (Exception $e) {}

$projectId = $_GET['project_id'] ?? null;

switch ($method) {
    case 'GET':
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
            sendJson($data);
        } elseif ($projectId) {
            $stmt = $db->prepare("
                SELECT sd.*, c.name as client_name, u.name as received_by_name
                FROM security_deposits sd
                LEFT JOIN clients c ON sd.client_id = c.id
                LEFT JOIN users u ON sd.received_by = u.id
                WHERE sd.project_id = ?
                ORDER BY sd.deposit_date DESC
            ");
            $stmt->execute([$projectId]);
            $data = $stmt->fetchAll();
            
            $totalStmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM security_deposits WHERE project_id = ? AND status = 'active'");
            $totalStmt->execute([$projectId]);
            $total = $totalStmt->fetchColumn();
            
            sendJson(['data' => $data, 'total' => (float)$total]);
        } else {
            $page = intval($_GET['page'] ?? 1);
            $per_page = intval($_GET['per_page'] ?? 20);
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
        
        if (empty($input['project_id']) || empty($input['client_id']) || empty($input['amount']) || empty($input['deposit_date'])) {
            sendError('Missing required fields: project_id, client_id, amount, deposit_date');
        }
        
        $depositCode = 'DEP-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
        
        $stmt = $db->prepare("
            INSERT INTO security_deposits (deposit_code, project_id, client_id, deposit_type, amount, deposit_date,
                bank_name, account_number, cheque_number, transaction_ref, notes, received_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $result = $stmt->execute([
            $depositCode,
            $input['project_id'],
            $input['client_id'],
            $input['deposit_type'] ?? 'security_money',
            $input['amount'],
            $input['deposit_date'],
            $input['bank_name'] ?? null,
            $input['account_number'] ?? null,
            $input['cheque_number'] ?? null,
            $input['transaction_ref'] ?? null,
            $input['notes'] ?? null,
            $user['id']
        ]);
        
        if ($result) {
            sendJson(['message' => 'Deposit recorded successfully', 'id' => $db->lastInsertId(), 'deposit_code' => $depositCode], 201);
        } else {
            sendError('Failed to record deposit');
        }
        break;

    case 'PUT':
        if (!$id) sendError('Deposit ID required');
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        $allowedFields = ['deposit_type', 'amount', 'refund_date', 'status', 'refund_amount', 
                         'bank_name', 'account_number', 'cheque_number', 'transaction_ref', 'notes'];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $input)) {
                $fields[] = "$field = ?";
                $params[] = $input[$field];
            }
        }
        
        if (empty($fields)) sendError('No valid fields to update');
        
        $params[] = $id;
        $sql = "UPDATE security_deposits SET " . implode(', ', $fields) . " WHERE id = ?";
        
        $stmt = $db->prepare($sql);
        $result = $stmt->execute($params);
        
        if ($result) {
            sendJson(['message' => 'Deposit updated successfully']);
        } else {
            sendError('Failed to update deposit');
        }
        break;

    case 'DELETE':
        if (!$id) sendError('Deposit ID required');
        
        $stmt = $db->prepare("DELETE FROM security_deposits WHERE id = ?");
        $result = $stmt->execute([$id]);
        
        if ($result) {
            sendJson(['message' => 'Deposit deleted successfully']);
        } else {
            sendError('Failed to delete deposit');
        }
        break;

    default:
        sendError('Method not allowed', 405);
}
