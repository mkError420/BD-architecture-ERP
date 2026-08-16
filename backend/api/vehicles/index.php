<?php
$user = requireAuth();
$db = Database::getInstance()->getConnection();

try {
    $db->exec("CREATE TABLE IF NOT EXISTS vehicles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vehicle_code VARCHAR(30) UNIQUE NOT NULL,
        vehicle_type ENUM('truck','pickup','car','motorcycle','excavator','bulldozer','crane','other') DEFAULT 'truck',
        registration_number VARCHAR(50) UNIQUE NOT NULL,
        make VARCHAR(100),
        model VARCHAR(100),
        year INT,
        purchase_date DATE,
        purchase_price DECIMAL(15,2) DEFAULT 0,
        current_value DECIMAL(15,2) DEFAULT 0,
        fuel_type ENUM('diesel','petrol','cng','electric','other') DEFAULT 'diesel',
        capacity DECIMAL(10,2) DEFAULT 0,
        status ENUM('available','in_use','maintenance','retired') DEFAULT 'available',
        driver_id INT,
        insurance_expiry DATE,
        fitness_expiry DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (driver_id) REFERENCES employees(id)
    )");
    
    $db->exec("CREATE TABLE IF NOT EXISTS vehicle_work_slips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slip_code VARCHAR(30) UNIQUE NOT NULL,
        project_id INT NOT NULL,
        vehicle_id INT NOT NULL,
        driver_id INT NOT NULL,
        work_date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        start_location VARCHAR(200),
        end_location VARCHAR(200),
        distance_km DECIMAL(8,2) DEFAULT 0,
        fuel_consumed DECIMAL(8,2) DEFAULT 0,
        fuel_cost DECIMAL(10,2) DEFAULT 0,
        work_description TEXT,
        daily_rate DECIMAL(10,2) DEFAULT 0,
        overtime_hours DECIMAL(5,2) DEFAULT 0,
        overtime_rate DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(12,2) NOT NULL,
        status ENUM('pending','approved','paid') DEFAULT 'pending',
        approved_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
        FOREIGN KEY (driver_id) REFERENCES employees(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
    )");
} catch (Exception $e) {}

$projectId = $_GET['project_id'] ?? null;
$type = $_GET['type'] ?? 'vehicles';

switch ($method) {
    case 'GET':
        if ($type === 'vehicles') {
            if ($id) {
                $stmt = $db->prepare("
                    SELECT v.*, e.name as driver_name, e.employee_code
                    FROM vehicles v
                    LEFT JOIN employees e ON v.driver_id = e.id
                    WHERE v.id = ?
                ");
                $stmt->execute([$id]);
                $data = $stmt->fetch();
                if (!$data) sendError('Vehicle not found', 404);
                sendJson($data);
            } else {
                $page = intval($_GET['page'] ?? 1);
                $per_page = intval($_GET['per_page'] ?? 20);
                $offset = ($page - 1) * $per_page;
                
                $where = ["1=1"];
                $params = [];
                
                if (!empty($_GET['vehicle_type'])) {
                    $where[] = "vehicle_type = ?";
                    $params[] = $_GET['vehicle_type'];
                }
                
                if (!empty($_GET['status'])) {
                    $where[] = "status = ?";
                    $params[] = $_GET['status'];
                }
                
                if (!empty($_GET['search'])) {
                    $where[] = "(registration_number LIKE ? OR make LIKE ? OR model LIKE ?)";
                    $searchTerm = '%' . $_GET['search'] . '%';
                    $params[] = $searchTerm;
                    $params[] = $searchTerm;
                    $params[] = $searchTerm;
                }
                
                $whereClause = implode(' AND ', $where);
                
                $stmt = $db->prepare("
                    SELECT v.*, e.name as driver_name
                    FROM vehicles v
                    LEFT JOIN employees e ON v.driver_id = e.id
                    WHERE $whereClause
                    ORDER BY v.registration_number
                    LIMIT $per_page OFFSET $offset
                ");
                $stmt->execute($params);
                $data = $stmt->fetchAll();
                
                $countStmt = $db->prepare("SELECT COUNT(*) FROM vehicles WHERE $whereClause");
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
        } elseif ($type === 'work-slips') {
            if ($id) {
                $stmt = $db->prepare("
                    SELECT vws.*, p.name as project_name, v.registration_number, v.vehicle_code, 
                           e.name as driver_name, u.name as approved_by_name
                    FROM vehicle_work_slips vws
                    LEFT JOIN projects p ON vws.project_id = p.id
                    LEFT JOIN vehicles v ON vws.vehicle_id = v.id
                    LEFT JOIN employees e ON vws.driver_id = e.id
                    LEFT JOIN users u ON vws.approved_by = u.id
                    WHERE vws.id = ?
                ");
                $stmt->execute([$id]);
                $data = $stmt->fetch();
                if (!$data) sendError('Work slip not found', 404);
                sendJson($data);
            } elseif ($projectId) {
                $stmt = $db->prepare("
                    SELECT vws.*, v.registration_number, v.vehicle_code, e.name as driver_name
                    FROM vehicle_work_slips vws
                    LEFT JOIN vehicles v ON vws.vehicle_id = v.id
                    LEFT JOIN employees e ON vws.driver_id = e.id
                    WHERE vws.project_id = ?
                    ORDER BY vws.work_date DESC
                ");
                $stmt->execute([$projectId]);
                $data = $stmt->fetchAll();
                
                $totalStmt = $db->prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM vehicle_work_slips WHERE project_id = ? AND status = 'paid'");
                $totalStmt->execute([$projectId]);
                $total = $totalStmt->fetchColumn();
                
                $pendingStmt = $db->prepare("SELECT COALESCE(SUM(total_amount), 0) as pending FROM vehicle_work_slips WHERE project_id = ? AND status = 'pending'");
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
                
                $stmt = $db->prepare("
                    SELECT vws.*, p.name as project_name, v.registration_number, e.name as driver_name
                    FROM vehicle_work_slips vws
                    LEFT JOIN projects p ON vws.project_id = p.id
                    LEFT JOIN vehicles v ON vws.vehicle_id = v.id
                    LEFT JOIN employees e ON vws.driver_id = e.id
                    ORDER BY vws.work_date DESC
                    LIMIT $per_page OFFSET $offset
                ");
                $stmt->execute();
                $data = $stmt->fetchAll();
                
                $countStmt = $db->prepare("SELECT COUNT(*) FROM vehicle_work_slips");
                $countStmt->execute();
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
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $type = $input['type'] ?? 'vehicles';
        
        if ($type === 'vehicles') {
            if (empty($input['registration_number'])) {
                sendError('Missing required field: registration_number');
            }
            
            $vehicleCode = 'VH-' . strtoupper(substr(uniqid(), -8));
            
            $stmt = $db->prepare("
                INSERT INTO vehicles (vehicle_code, vehicle_type, registration_number, make, model, year,
                    purchase_date, purchase_price, current_value, fuel_type, capacity, status, 
                    driver_id, insurance_expiry, fitness_expiry, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $vehicleCode,
                $input['vehicle_type'] ?? 'truck',
                $input['registration_number'],
                $input['make'] ?? null,
                $input['model'] ?? null,
                $input['year'] ?? null,
                $input['purchase_date'] ?? null,
                $input['purchase_price'] ?? 0,
                $input['current_value'] ?? $input['purchase_price'] ?? 0,
                $input['fuel_type'] ?? 'diesel',
                $input['capacity'] ?? 0,
                $input['status'] ?? 'available',
                $input['driver_id'] ?? null,
                $input['insurance_expiry'] ?? null,
                $input['fitness_expiry'] ?? null,
                $input['notes'] ?? null
            ]);
            
            if ($result) {
                sendJson(['message' => 'Vehicle added successfully', 'id' => $db->lastInsertId(), 'vehicle_code' => $vehicleCode], 201);
            } else {
                sendError('Failed to add vehicle');
            }
        } elseif ($type === 'work-slips') {
            if (empty($input['project_id']) || empty($input['vehicle_id']) || empty($input['driver_id']) || empty($input['work_date'])) {
                sendError('Missing required fields: project_id, vehicle_id, driver_id, work_date');
            }
            
            $slipCode = 'VWS-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            $overtimePay = ($input['overtime_hours'] ?? 0) * ($input['overtime_rate'] ?? 0);
            $totalAmount = ($input['daily_rate'] ?? 0) + $overtimePay + ($input['fuel_cost'] ?? 0);
            
            $stmt = $db->prepare("
                INSERT INTO vehicle_work_slips (slip_code, project_id, vehicle_id, driver_id, work_date, 
                    start_time, end_time, start_location, end_location, distance_km, fuel_consumed, fuel_cost,
                    work_description, daily_rate, overtime_hours, overtime_rate, total_amount)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $slipCode,
                $input['project_id'],
                $input['vehicle_id'],
                $input['driver_id'],
                $input['work_date'],
                $input['start_time'] ?? null,
                $input['end_time'] ?? null,
                $input['start_location'] ?? null,
                $input['end_location'] ?? null,
                $input['distance_km'] ?? 0,
                $input['fuel_consumed'] ?? 0,
                $input['fuel_cost'] ?? 0,
                $input['work_description'] ?? null,
                $input['daily_rate'] ?? 0,
                $input['overtime_hours'] ?? 0,
                $input['overtime_rate'] ?? 0,
                $totalAmount
            ]);
            
            if ($result) {
                sendJson(['message' => 'Work slip created successfully', 'id' => $db->lastInsertId(), 'slip_code' => $slipCode], 201);
            } else {
                sendError('Failed to create work slip');
            }
        }
        break;

    case 'PUT':
        if (!$id) sendError('ID required');
        
        $input = json_decode(file_get_contents('php://input'), true);
        $type = $input['type'] ?? 'vehicles';
        
        if ($type === 'vehicles') {
            $fields = [];
            $params = [];
            
            $allowedFields = ['vehicle_type', 'registration_number', 'make', 'model', 'year', 'purchase_date', 
                             'purchase_price', 'current_value', 'fuel_type', 'capacity', 'status', 
                             'driver_id', 'insurance_expiry', 'fitness_expiry', 'notes'];
            
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $input)) {
                    $fields[] = "$field = ?";
                    $params[] = $input[$field];
                }
            }
            
            if (empty($fields)) sendError('No valid fields to update');
            
            $params[] = $id;
            $sql = "UPDATE vehicles SET " . implode(', ', $fields) . " WHERE id = ?";
            
            $stmt = $db->prepare($sql);
            $result = $stmt->execute($params);
            
            if ($result) {
                sendJson(['message' => 'Vehicle updated successfully']);
            } else {
                sendError('Failed to update vehicle');
            }
        } elseif ($type === 'work-slips') {
            $fields = [];
            $params = [];
            
            $allowedFields = ['start_time', 'end_time', 'start_location', 'end_location', 'distance_km', 
                             'fuel_consumed', 'fuel_cost', 'work_description', 'daily_rate', 'overtime_hours', 'overtime_rate'];
            
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $input)) {
                    $fields[] = "$field = ?";
                    $params[] = $input[$field];
                }
            }
            
            if (array_key_exists('status', $input)) {
                $fields[] = "status = ?";
                $params[] = $input['status'];
                
                if ($input['status'] === 'approved') {
                    $fields[] = "approved_by = ?";
                    $params[] = $user['id'];
                }
            }
            
            if (empty($fields)) sendError('No valid fields to update');
            
            $params[] = $id;
            $sql = "UPDATE vehicle_work_slips SET " . implode(', ', $fields) . " WHERE id = ?";
            
            $stmt = $db->prepare($sql);
            $result = $stmt->execute($params);
            
            if ($result) {
                sendJson(['message' => 'Work slip updated successfully']);
            } else {
                sendError('Failed to update work slip');
            }
        }
        break;

    case 'DELETE':
        if (!$id) sendError('ID required');
        
        $type = $_GET['type'] ?? 'vehicles';
        
        if ($type === 'vehicles') {
            $stmt = $db->prepare("DELETE FROM vehicles WHERE id = ?");
        } elseif ($type === 'work-slips') {
            $stmt = $db->prepare("DELETE FROM vehicle_work_slips WHERE id = ?");
        }
        
        $result = $stmt->execute([$id]);
        
        if ($result) {
            sendJson(['message' => 'Deleted successfully']);
        } else {
            sendError('Failed to delete');
        }
        break;

    default:
        sendError('Method not allowed', 405);
}
