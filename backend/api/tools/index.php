<?php
$user = getOptionalAuth();
$db = Database::getInstance()->getConnection();

try {
    $db->exec("CREATE TABLE IF NOT EXISTS tools_inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tool_code VARCHAR(30) UNIQUE NOT NULL,
        tool_name VARCHAR(200) NOT NULL,
        category ENUM('power_tools','hand_tools','measuring','safety_equipment','heavy_machinery','vehicles','other') DEFAULT 'other',
        brand VARCHAR(100),
        model VARCHAR(100),
        serial_number VARCHAR(100),
        purchase_date DATE,
        purchase_price DECIMAL(12,2) DEFAULT 0,
        current_value DECIMAL(12,2) DEFAULT 0,
        tool_condition ENUM('excellent','good','fair','poor','broken') DEFAULT 'good',
        location VARCHAR(100),
        status ENUM('available','assigned','in_maintenance','retired') DEFAULT 'available',
        warranty_expiry DATE,
        last_service_date DATE,
        next_service_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
    
    $db->exec("CREATE TABLE IF NOT EXISTS tool_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tool_id INT NOT NULL,
        project_id INT NOT NULL,
        assigned_to INT,
        assigned_date DATE NOT NULL,
        return_date DATE,
        expected_return_date DATE,
        status ENUM('assigned','returned','overdue','lost') DEFAULT 'assigned',
        condition_on_assignment VARCHAR(50),
        condition_on_return VARCHAR(50),
        notes TEXT,
        assigned_by INT,
        received_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tool_id) REFERENCES tools_inventory(id),
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (assigned_to) REFERENCES employees(id),
        FOREIGN KEY (assigned_by) REFERENCES users(id),
        FOREIGN KEY (received_by) REFERENCES users(id)
    )");
    
    $db->exec("CREATE TABLE IF NOT EXISTS tool_maintenance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tool_id INT NOT NULL,
        maintenance_type ENUM('routine','repair','replacement','inspection') DEFAULT 'routine',
        service_date DATE NOT NULL,
        service_provider VARCHAR(150),
        cost DECIMAL(12,2) DEFAULT 0,
        description TEXT,
        next_service_date DATE,
        performed_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tool_id) REFERENCES tools_inventory(id),
        FOREIGN KEY (performed_by) REFERENCES users(id)
    )");
} catch (Exception $e) {}

$projectId = $_GET['project_id'] ?? null;
$type = $_GET['type'] ?? 'inventory';

switch ($method) {
    case 'GET':
        if ($type === 'inventory') {
            if ($id) {
                $stmt = $db->prepare("SELECT * FROM tools_inventory WHERE id = ?");
                $stmt->execute([$id]);
                $data = $stmt->fetch();
                if (!$data) sendError('Tool not found', 404);
                sendJson($data);
            } else {
                $page = intval($_GET['page'] ?? 1);
                $per_page = intval($_GET['per_page'] ?? 20);
                $offset = ($page - 1) * $per_page;
                
                $where = ["1=1"];
                $params = [];
                
                if (!empty($_GET['category'])) {
                    $where[] = "category = ?";
                    $params[] = $_GET['category'];
                }
                
                if (!empty($_GET['status'])) {
                    $where[] = "status = ?";
                    $params[] = $_GET['status'];
                }
                
                if (!empty($_GET['search'])) {
                    $where[] = "(tool_name LIKE ? OR tool_code LIKE ? OR brand LIKE ?)";
                    $searchTerm = '%' . $_GET['search'] . '%';
                    $params[] = $searchTerm;
                    $params[] = $searchTerm;
                    $params[] = $searchTerm;
                }
                
                $whereClause = implode(' AND ', $where);
                
                $stmt = $db->prepare("
                    SELECT * FROM tools_inventory
                    WHERE $whereClause
                    ORDER BY tool_name
                    LIMIT $per_page OFFSET $offset
                ");
                $stmt->execute($params);
                $data = $stmt->fetchAll();
                
                $countStmt = $db->prepare("SELECT COUNT(*) FROM tools_inventory WHERE $whereClause");
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
        } elseif ($type === 'assignments') {
            if ($id) {
                $stmt = $db->prepare("
                    SELECT ta.*, t.tool_name, t.tool_code, p.name as project_name, e.name as assigned_to_name,
                           u1.name as assigned_by_name, u2.name as received_by_name
                    FROM tool_assignments ta
                    LEFT JOIN tools_inventory t ON ta.tool_id = t.id
                    LEFT JOIN projects p ON ta.project_id = p.id
                    LEFT JOIN employees e ON ta.assigned_to = e.id
                    LEFT JOIN users u1 ON ta.assigned_by = u1.id
                    LEFT JOIN users u2 ON ta.received_by = u2.id
                    WHERE ta.id = ?
                ");
                $stmt->execute([$id]);
                $data = $stmt->fetch();
                if (!$data) sendError('Assignment not found', 404);
                sendJson($data);
            } elseif ($projectId) {
                $stmt = $db->prepare("
                    SELECT ta.*, t.tool_name, t.tool_code, e.name as assigned_to_name
                    FROM tool_assignments ta
                    LEFT JOIN tools_inventory t ON ta.tool_id = t.id
                    LEFT JOIN employees e ON ta.assigned_to = e.id
                    WHERE ta.project_id = ?
                    ORDER BY ta.assigned_date DESC
                ");
                $stmt->execute([$projectId]);
                $data = $stmt->fetchAll();
                sendJson(['data' => $data]);
            } else {
                $page = intval($_GET['page'] ?? 1);
                $per_page = intval($_GET['per_page'] ?? 20);
                $offset = ($page - 1) * $per_page;
                
                $stmt = $db->prepare("
                    SELECT ta.*, t.tool_name, t.tool_code, p.name as project_name, e.name as assigned_to_name
                    FROM tool_assignments ta
                    LEFT JOIN tools_inventory t ON ta.tool_id = t.id
                    LEFT JOIN projects p ON ta.project_id = p.id
                    LEFT JOIN employees e ON ta.assigned_to = e.id
                    ORDER BY ta.assigned_date DESC
                    LIMIT $per_page OFFSET $offset
                ");
                $stmt->execute();
                $data = $stmt->fetchAll();
                
                $countStmt = $db->prepare("SELECT COUNT(*) FROM tool_assignments");
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
        } elseif ($type === 'maintenance') {
            if ($id) {
                $stmt = $db->prepare("
                    SELECT tm.*, t.tool_name, t.tool_code, u.name as performed_by_name
                    FROM tool_maintenance tm
                    LEFT JOIN tools_inventory t ON tm.tool_id = t.id
                    LEFT JOIN users u ON tm.performed_by = u.id
                    WHERE tm.id = ?
                ");
                $stmt->execute([$id]);
                $data = $stmt->fetch();
                if (!$data) sendError('Maintenance record not found', 404);
                sendJson($data);
            } else {
                $toolId = $_GET['tool_id'] ?? null;
                if ($toolId) {
                    $stmt = $db->prepare("
                        SELECT tm.*, u.name as performed_by_name
                        FROM tool_maintenance tm
                        LEFT JOIN users u ON tm.performed_by = u.id
                        WHERE tm.tool_id = ?
                        ORDER BY tm.service_date DESC
                    ");
                    $stmt->execute([$toolId]);
                    $data = $stmt->fetchAll();
                    sendJson(['data' => $data]);
                }
            }
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $type = $input['type'] ?? 'inventory';
        
        if ($type === 'inventory') {
            if (empty($input['tool_name'])) {
                sendError('Missing required field: tool_name');
            }
            
            $toolCode = 'TL-' . strtoupper(substr(uniqid(), -8));
            
            $stmt = $db->prepare("
                INSERT INTO tools_inventory (tool_code, tool_name, category, brand, model, serial_number, 
                    purchase_date, purchase_price, current_value, tool_condition, location, status, 
                    warranty_expiry, last_service_date, next_service_date, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $toolCode,
                $input['tool_name'],
                $input['category'] ?? 'other',
                $input['brand'] ?? null,
                $input['model'] ?? null,
                $input['serial_number'] ?? null,
                $input['purchase_date'] ?? null,
                $input['purchase_price'] ?? 0,
                $input['current_value'] ?? $input['purchase_price'] ?? 0,
                $input['tool_condition'] ?? $input['condition'] ?? 'good',
                $input['location'] ?? null,
                $input['status'] ?? 'available',
                $input['warranty_expiry'] ?? null,
                $input['last_service_date'] ?? null,
                $input['next_service_date'] ?? null,
                $input['notes'] ?? null
            ]);
            
            if ($result) {
                sendJson(['message' => 'Tool added successfully', 'id' => $db->lastInsertId(), 'tool_code' => $toolCode], 201);
            } else {
                sendError('Failed to add tool');
            }
        } elseif ($type === 'assignments') {
            if (empty($input['tool_id']) || empty($input['project_id']) || empty($input['assigned_date'])) {
                sendError('Missing required fields: tool_id, project_id, assigned_date');
            }
            
            $stmt = $db->prepare("
                INSERT INTO tool_assignments (tool_id, project_id, assigned_to, assigned_date, expected_return_date,
                    status, condition_on_assignment, notes, assigned_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $input['tool_id'],
                $input['project_id'],
                $input['assigned_to'] ?? null,
                $input['assigned_date'],
                $input['expected_return_date'] ?? null,
                $input['status'] ?? 'assigned',
                $input['condition_on_assignment'] ?? 'good',
                $input['notes'] ?? null,
                $user['id'] ?? null
            ]);
            
            if ($result) {
                $assignmentId = $db->lastInsertId();
                
                $updateStmt = $db->prepare("UPDATE tools_inventory SET status = 'assigned' WHERE id = ?");
                $updateStmt->execute([$input['tool_id']]);
                
                sendJson(['message' => 'Tool assigned successfully', 'id' => $assignmentId], 201);
            } else {
                sendError('Failed to assign tool');
            }
        } elseif ($type === 'maintenance') {
            if (empty($input['tool_id']) || empty($input['service_date'])) {
                sendError('Missing required fields: tool_id, service_date');
            }
            
            $stmt = $db->prepare("
                INSERT INTO tool_maintenance (tool_id, maintenance_type, service_date, service_provider, 
                    cost, description, next_service_date, performed_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $input['tool_id'],
                $input['maintenance_type'] ?? 'routine',
                $input['service_date'],
                $input['service_provider'] ?? null,
                $input['cost'] ?? 0,
                $input['description'] ?? null,
                $input['next_service_date'] ?? null,
                $user['id'] ?? null
            ]);
            
            if ($result) {
                $maintenanceId = $db->lastInsertId();
                
                $updateStmt = $db->prepare("UPDATE tools_inventory SET last_service_date = ?, next_service_date = ?, status = 'available' WHERE id = ?");
                $updateStmt->execute([
                    $input['service_date'],
                    $input['next_service_date'] ?? null,
                    $input['tool_id']
                ]);
                
                sendJson(['message' => 'Maintenance record added successfully', 'id' => $maintenanceId], 201);
            } else {
                sendError('Failed to add maintenance record');
            }
        }
        break;

    case 'PUT':
        if (!$id) sendError('ID required');
        
        $input = json_decode(file_get_contents('php://input'), true);
        $type = $input['type'] ?? 'inventory';
        
        if ($type === 'inventory') {
            $fields = [];
            $params = [];
            
            $allowedFields = ['tool_name', 'category', 'brand', 'model', 'serial_number', 'purchase_date', 
                             'purchase_price', 'current_value', 'tool_condition', 'location', 'status', 
                             'warranty_expiry', 'last_service_date', 'next_service_date', 'notes'];
            
            if (isset($input['condition']) && !isset($input['tool_condition'])) {
                $input['tool_condition'] = $input['condition'];
            }
            
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $input)) {
                    $fields[] = "$field = ?";
                    $params[] = $input[$field];
                }
            }
            
            if (empty($fields)) sendError('No valid fields to update');
            
            $params[] = $id;
            $sql = "UPDATE tools_inventory SET " . implode(', ', $fields) . " WHERE id = ?";
            
            $stmt = $db->prepare($sql);
            $result = $stmt->execute($params);
            
            if ($result) {
                sendJson(['message' => 'Tool updated successfully']);
            } else {
                sendError('Failed to update tool');
            }
        } elseif ($type === 'assignments') {
            $fields = [];
            $params = [];
            
            $allowedFields = ['return_date', 'expected_return_date', 'status', 'condition_on_return', 'notes'];
            
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $input)) {
                    $fields[] = "$field = ?";
                    $params[] = $input[$field];
                }
            }
            
            if ($input['status'] === 'returned') {
                $fields[] = "received_by = ?";
                $params[] = $user['id'] ?? null;
            }
            
            if (empty($fields)) sendError('No valid fields to update');
            
            $params[] = $id;
            $sql = "UPDATE tool_assignments SET " . implode(', ', $fields) . " WHERE id = ?";
            
            $stmt = $db->prepare($sql);
            $result = $stmt->execute($params);
            
            if ($result) {
                if ($input['status'] === 'returned' && !empty($input['tool_id'])) {
                    $updateStmt = $db->prepare("UPDATE tools_inventory SET status = 'available' WHERE id = ?");
                    $updateStmt->execute([$input['tool_id']]);
                }
                
                sendJson(['message' => 'Assignment updated successfully']);
            } else {
                sendError('Failed to update assignment');
            }
        }
        break;

    case 'DELETE':
        if (!$id) sendError('ID required');
        
        $type = $_GET['type'] ?? 'inventory';
        
        if ($type === 'inventory') {
            $stmt = $db->prepare("DELETE FROM tools_inventory WHERE id = ?");
        } elseif ($type === 'assignments') {
            $stmt = $db->prepare("DELETE FROM tool_assignments WHERE id = ?");
        } elseif ($type === 'maintenance') {
            $stmt = $db->prepare("DELETE FROM tool_maintenance WHERE id = ?");
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
