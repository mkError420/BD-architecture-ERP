<?php
$user = getOptionalAuth();
$db = Database::getInstance()->getConnection();

try {
    $db->exec("CREATE TABLE IF NOT EXISTS labour_wage_slips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slip_code VARCHAR(30) UNIQUE NOT NULL,
        project_id INT NOT NULL,
        employee_id INT NOT NULL,
        work_period_start DATE NOT NULL,
        work_period_end DATE NOT NULL,
        total_days INT DEFAULT 0,
        present_days INT DEFAULT 0,
        absent_days INT DEFAULT 0,
        overtime_hours DECIMAL(5,2) DEFAULT 0,
        daily_wage DECIMAL(10,2) DEFAULT 0,
        basic_wage DECIMAL(12,2) DEFAULT 0,
        overtime_pay DECIMAL(10,2) DEFAULT 0,
        bonus DECIMAL(10,2) DEFAULT 0,
        deduction DECIMAL(10,2) DEFAULT 0,
        net_wage DECIMAL(12,2) NOT NULL,
        payment_date DATE,
        payment_method ENUM('cash','bank_transfer','mobile_banking') DEFAULT 'cash',
        status ENUM('pending','paid') DEFAULT 'pending',
        paid_by INT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (employee_id) REFERENCES employees(id),
        FOREIGN KEY (paid_by) REFERENCES users(id)
    )");
} catch (Exception $e) {}

$projectId = $_GET['project_id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare("
                SELECT lws.*, p.name as project_name, e.name as employee_name, e.employee_code, 
                       e.role as employee_role, u.name as paid_by_name
                FROM labour_wage_slips lws
                LEFT JOIN projects p ON lws.project_id = p.id
                LEFT JOIN employees e ON lws.employee_id = e.id
                LEFT JOIN users u ON lws.paid_by = u.id
                WHERE lws.id = ?
            ");
            $stmt->execute([$id]);
            $data = $stmt->fetch();
            if (!$data) sendError('Wage slip not found', 404);
            sendJson($data);
        } elseif ($projectId) {
            $stmt = $db->prepare("
                SELECT lws.*, e.name as employee_name, e.employee_code
                FROM labour_wage_slips lws
                LEFT JOIN employees e ON lws.employee_id = e.id
                WHERE lws.project_id = ?
                ORDER BY lws.work_period_start DESC
            ");
            $stmt->execute([$projectId]);
            $data = $stmt->fetchAll();
            
            $totalStmt = $db->prepare("SELECT COALESCE(SUM(net_wage), 0) as total FROM labour_wage_slips WHERE project_id = ? AND status = 'paid'");
            $totalStmt->execute([$projectId]);
            $total = $totalStmt->fetchColumn();
            
            $pendingStmt = $db->prepare("SELECT COALESCE(SUM(net_wage), 0) as pending FROM labour_wage_slips WHERE project_id = ? AND status = 'pending'");
            $pendingStmt->execute([$projectId]);
            $pending = $pendingStmt->fetchColumn();
            
            sendJson([
                'data' => $data,
                'summary' => [
                    'total_paid' => (float)$total,
                    'total_pending' => (float)$pending
                ]
            ]);
        } else {
            $page = intval($_GET['page'] ?? 1);
            $per_page = intval($_GET['per_page'] ?? 20);
            $offset = ($page - 1) * $per_page;
            
            $where = ["1=1"];
            $params = [];
            
            if (!empty($_GET['project_id'])) {
                $where[] = "lws.project_id = ?";
                $params[] = $_GET['project_id'];
            }
            
            if (!empty($_GET['employee_id'])) {
                $where[] = "lws.employee_id = ?";
                $params[] = $_GET['employee_id'];
            }
            
            if (!empty($_GET['status'])) {
                $where[] = "lws.status = ?";
                $params[] = $_GET['status'];
            }
            
            $whereClause = implode(' AND ', $where);
            
            $stmt = $db->prepare("
                SELECT lws.*, p.name as project_name, e.name as employee_name
                FROM labour_wage_slips lws
                LEFT JOIN projects p ON lws.project_id = p.id
                LEFT JOIN employees e ON lws.employee_id = e.id
                WHERE $whereClause
                ORDER BY lws.work_period_start DESC
                LIMIT $per_page OFFSET $offset
            ");
            $stmt->execute($params);
            $data = $stmt->fetchAll();
            
            $countStmt = $db->prepare("SELECT COUNT(*) FROM labour_wage_slips lws WHERE $whereClause");
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
        
        if (empty($input['project_id']) || empty($input['employee_id'])) {
            sendError('Missing required fields: project_id, employee_id');
        }

        $workPeriodStart = !empty($input['work_period_start']) ? $input['work_period_start'] : (!empty($input['payment_date']) ? $input['payment_date'] : date('Y-m-01'));
        $workPeriodEnd = !empty($input['work_period_end']) ? $input['work_period_end'] : (!empty($input['payment_date']) ? $input['payment_date'] : date('Y-m-d'));
        
        $slipCode = 'WS-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
        
        $presentDays = floatval($input['present_days'] ?? $input['work_days'] ?? 1);
        $dailyWage = floatval($input['daily_wage'] ?? $input['daily_rate'] ?? 0);
        $overtimeHours = floatval($input['overtime_hours'] ?? 0);
        $overtimeRate = floatval($input['overtime_rate'] ?? ($dailyWage > 0 ? $dailyWage / 8 * 1.5 : 0));
        $overtimePay = $overtimeHours * $overtimeRate;
        $bonus = floatval($input['bonus'] ?? 0);
        $deduction = floatval($input['deduction'] ?? 0);
        $basicWage = $dailyWage * $presentDays;
        
        $netWage = isset($input['total_amount']) && floatval($input['total_amount']) > 0
            ? floatval($input['total_amount'])
            : ($basicWage + $overtimePay + $bonus - $deduction);
        
        $stmt = $db->prepare("
            INSERT INTO labour_wage_slips (slip_code, project_id, employee_id, work_period_start, work_period_end,
                total_days, present_days, absent_days, overtime_hours, daily_wage, basic_wage, overtime_pay, bonus, deduction, net_wage, payment_date, payment_method, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $result = $stmt->execute([
            $slipCode,
            $input['project_id'],
            $input['employee_id'],
            $workPeriodStart,
            $workPeriodEnd,
            $input['total_days'] ?? $presentDays,
            $presentDays,
            $input['absent_days'] ?? 0,
            $overtimeHours,
            $dailyWage,
            $basicWage,
            $overtimePay,
            $bonus,
            $deduction,
            $netWage,
            $input['payment_date'] ?? date('Y-m-d'),
            $input['payment_method'] ?? 'cash',
            $input['status'] ?? 'paid',
            $input['notes'] ?? null
        ]);
        
        if ($result) {
            sendJson(['message' => 'Wage slip created successfully', 'id' => $db->lastInsertId(), 'slip_code' => $slipCode], 201);
        } else {
            sendError('Failed to create wage slip');
        }
        break;

    case 'PUT':
        if (!$id) sendError('Wage slip ID required');
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        $allowedFields = ['work_period_start', 'work_period_end', 'total_days', 'present_days', 'absent_days', 
                         'overtime_hours', 'daily_wage', 'bonus', 'deduction', 'notes'];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $input)) {
                $fields[] = "$field = ?";
                $params[] = $input[$field];
            }
        }
        
        if (array_key_exists('status', $input)) {
            $fields[] = "status = ?";
            $params[] = $input['status'];
            
            if ($input['status'] === 'paid') {
                $fields[] = "payment_date = ?";
                $params[] = $input['payment_date'] ?? date('Y-m-d');
                $fields[] = "payment_method = ?";
                $params[] = $input['payment_method'] ?? 'cash';
                $fields[] = "paid_by = ?";
                $params[] = $user['id'] ?? null;
            }
        }
        
        if (empty($fields)) sendError('No valid fields to update');
        
        $params[] = $id;
        $sql = "UPDATE labour_wage_slips SET " . implode(', ', $fields) . " WHERE id = ?";
        
        $stmt = $db->prepare($sql);
        $result = $stmt->execute($params);
        
        if ($result) {
            sendJson(['message' => 'Wage slip updated successfully']);
        } else {
            sendError('Failed to update wage slip');
        }
        break;

    case 'DELETE':
        if (!$id) sendError('Wage slip ID required');
        
        $stmt = $db->prepare("DELETE FROM labour_wage_slips WHERE id = ?");
        $result = $stmt->execute([$id]);
        
        if ($result) {
            sendJson(['message' => 'Wage slip deleted successfully']);
        } else {
            sendError('Failed to delete wage slip');
        }
        break;

    default:
        sendError('Method not allowed', 405);
}
