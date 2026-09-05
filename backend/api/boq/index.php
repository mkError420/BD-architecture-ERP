<?php
$user = getOptionalAuth();
$db = Database::getInstance()->getConnection();

try {
    $db->exec("CREATE TABLE IF NOT EXISTS boq_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        item_code VARCHAR(30) NOT NULL,
        category VARCHAR(100),
        description TEXT NOT NULL,
        unit ENUM('sqft','sft','cft','cum','kg','ton','meter','run_meter','piece','lot','each','no') DEFAULT 'piece',
        quantity DECIMAL(14,3) NOT NULL,
        unit_rate DECIMAL(12,2) NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        work_type ENUM('civil','electrical','plumbing','finishing','other') DEFAULT 'civil',
        priority ENUM('high','medium','low') DEFAULT 'medium',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    )");
    
    $db->exec("CREATE TABLE IF NOT EXISTS boq_estimates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        estimate_name VARCHAR(200) NOT NULL,
        estimate_type ENUM('preliminary','detailed','revised') DEFAULT 'preliminary',
        total_cost DECIMAL(18,2) NOT NULL,
        contingency_percentage DECIMAL(5,2) DEFAULT 5,
        contingency_amount DECIMAL(15,2) DEFAULT 0,
        grand_total DECIMAL(18,2) NOT NULL,
        prepared_by INT,
        approved_by INT,
        approved_at DATETIME,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (prepared_by) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
    )");
    
    $db->exec("CREATE TABLE IF NOT EXISTS boq_rate_analysis (
        id INT AUTO_INCREMENT PRIMARY KEY,
        boq_item_id INT NOT NULL,
        material_cost DECIMAL(12,2) DEFAULT 0,
        labor_cost DECIMAL(12,2) DEFAULT 0,
        equipment_cost DECIMAL(12,2) DEFAULT 0,
        overhead_cost DECIMAL(12,2) DEFAULT 0,
        profit_percentage DECIMAL(5,2) DEFAULT 10,
        profit_amount DECIMAL(12,2) DEFAULT 0,
        final_rate DECIMAL(12,2) NOT NULL,
        analysis_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (boq_item_id) REFERENCES boq_items(id)
    )");
} catch (Exception $e) {}

$projectId = $_GET['project_id'] ?? null;
$type = $_GET['type'] ?? 'items';

switch ($method) {
    case 'GET':
        if ($type === 'items') {
            if ($id) {
                $stmt = $db->prepare("
                    SELECT bi.*, p.name as project_name, 
                           (SELECT material_cost FROM boq_rate_analysis WHERE boq_item_id = bi.id LIMIT 1) as material_cost,
                           (SELECT labor_cost FROM boq_rate_analysis WHERE boq_item_id = bi.id LIMIT 1) as labor_cost
                    FROM boq_items bi
                    LEFT JOIN projects p ON bi.project_id = p.id
                    WHERE bi.id = ?
                ");
                $stmt->execute([$id]);
                $data = $stmt->fetch();
                if (!$data) sendError('BOQ item not found', 404);
                sendJson($data);
            } elseif ($projectId) {
                $stmt = $db->prepare("
                    SELECT bi.* FROM boq_items bi
                    WHERE bi.project_id = ?
                    ORDER BY bi.category, bi.item_code
                ");
                $stmt->execute([$projectId]);
                $data = $stmt->fetchAll();
                
                $totalStmt = $db->prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM boq_items WHERE project_id = ?");
                $totalStmt->execute([$projectId]);
                $total = $totalStmt->fetchColumn();
                
                sendJson(['data' => $data, 'total' => (float)$total]);
            } else {
                $page = intval($_GET['page'] ?? 1);
                $per_page = intval($_GET['per_page'] ?? 20);
                $offset = ($page - 1) * $per_page;
                
                $stmt = $db->prepare("
                    SELECT bi.*, p.name as project_name
                    FROM boq_items bi
                    LEFT JOIN projects p ON bi.project_id = p.id
                    ORDER BY bi.created_at DESC
                    LIMIT $per_page OFFSET $offset
                ");
                $stmt->execute();
                $data = $stmt->fetchAll();
                
                $countStmt = $db->prepare("SELECT COUNT(*) FROM boq_items");
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
        } elseif ($type === 'estimates') {
            if ($id) {
                $stmt = $db->prepare("
                    SELECT be.*, p.name as project_name, u1.name as prepared_by_name, u2.name as approved_by_name
                    FROM boq_estimates be
                    LEFT JOIN projects p ON be.project_id = p.id
                    LEFT JOIN users u1 ON be.prepared_by = u1.id
                    LEFT JOIN users u2 ON be.approved_by = u2.id
                    WHERE be.id = ?
                ");
                $stmt->execute([$id]);
                $data = $stmt->fetch();
                if (!$data) sendError('Estimate not found', 404);
                sendJson($data);
            } elseif ($projectId) {
                $stmt = $db->prepare("
                    SELECT be.* FROM boq_estimates be
                    WHERE be.project_id = ?
                    ORDER BY be.created_at DESC
                ");
                $stmt->execute([$projectId]);
                $data = $stmt->fetchAll();
                sendJson(['data' => $data]);
            }
        } elseif ($type === 'rates') {
            if ($id) {
                $stmt = $db->prepare("SELECT * FROM boq_rate_analysis WHERE id = ?");
                $stmt->execute([$id]);
                $data = $stmt->fetch();
                if (!$data) sendError('Rate analysis not found', 404);
                sendJson($data);
            } else {
                $boqItemId = $_GET['boq_item_id'] ?? null;
                if ($boqItemId) {
                    $stmt = $db->prepare("SELECT * FROM boq_rate_analysis WHERE boq_item_id = ?");
                    $stmt->execute([$boqItemId]);
                    $data = $stmt->fetchAll();
                    sendJson(['data' => $data]);
                }
            }
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $type = $input['type'] ?? 'items';
        
        if ($type === 'items') {
            if (empty($input['project_id']) || empty($input['description']) || empty($input['quantity']) || empty($input['unit_rate'])) {
                sendError('Missing required fields: project_id, description, quantity, unit_rate');
            }
            
            $itemCode = 'BOQ-' . strtoupper(substr(uniqid(), -6));
            $totalAmount = $input['quantity'] * $input['unit_rate'];
            
            $stmt = $db->prepare("
                INSERT INTO boq_items (item_code, project_id, category, description, unit, quantity, unit_rate, total_amount, work_type, priority, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $itemCode,
                $input['project_id'],
                $input['category'] ?? null,
                $input['description'],
                $input['unit'] ?? 'piece',
                $input['quantity'],
                $input['unit_rate'],
                $totalAmount,
                $input['work_type'] ?? 'civil',
                $input['priority'] ?? 'medium',
                $input['notes'] ?? null
            ]);
            
            if ($result) {
                sendJson(['message' => 'BOQ item created successfully', 'id' => $db->lastInsertId(), 'item_code' => $itemCode], 201);
            } else {
                sendError('Failed to create BOQ item');
            }
        } elseif ($type === 'estimates') {
            if (empty($input['project_id']) || empty($input['estimate_name']) || empty($input['total_cost'])) {
                sendError('Missing required fields: project_id, estimate_name, total_cost');
            }
            
            $contingencyAmount = $input['total_cost'] * ($input['contingency_percentage'] ?? 5) / 100;
            $grandTotal = $input['total_cost'] + $contingencyAmount;
            
            $stmt = $db->prepare("
                INSERT INTO boq_estimates (project_id, estimate_name, estimate_type, total_cost, contingency_percentage, contingency_amount, grand_total, prepared_by, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $input['project_id'],
                $input['estimate_name'],
                $input['estimate_type'] ?? 'preliminary',
                $input['total_cost'],
                $input['contingency_percentage'] ?? 5,
                $contingencyAmount,
                $grandTotal,
                $user['id'] ?? null,
                $input['notes'] ?? null
            ]);
            
            if ($result) {
                sendJson(['message' => 'Estimate created successfully', 'id' => $db->lastInsertId()], 201);
            } else {
                sendError('Failed to create estimate');
            }
        } elseif ($type === 'rates') {
            if (empty($input['boq_item_id']) || empty($input['final_rate'])) {
                sendError('Missing required fields: boq_item_id, final_rate');
            }
            
            $profitAmount = $input['final_rate'] * ($input['profit_percentage'] ?? 10) / 100;
            
            $stmt = $db->prepare("
                INSERT INTO boq_rate_analysis (boq_item_id, material_cost, labor_cost, equipment_cost, overhead_cost, profit_percentage, profit_amount, final_rate, analysis_date, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $input['boq_item_id'],
                $input['material_cost'] ?? 0,
                $input['labor_cost'] ?? 0,
                $input['equipment_cost'] ?? 0,
                $input['overhead_cost'] ?? 0,
                $input['profit_percentage'] ?? 10,
                $profitAmount,
                $input['final_rate'],
                $input['analysis_date'] ?? date('Y-m-d'),
                $input['notes'] ?? null
            ]);
            
            if ($result) {
                sendJson(['message' => 'Rate analysis created successfully', 'id' => $db->lastInsertId()], 201);
            } else {
                sendError('Failed to create rate analysis');
            }
        }
        break;

    case 'PUT':
        if (!$id) sendError('ID required');
        
        $input = json_decode(file_get_contents('php://input'), true);
        $type = $input['type'] ?? 'items';
        
        if ($type === 'items') {
            $fields = [];
            $params = [];
            
            $allowedFields = ['category', 'description', 'unit', 'quantity', 'unit_rate', 'work_type', 'priority', 'notes'];
            
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $input)) {
                    $fields[] = "$field = ?";
                    $params[] = $input[$field];
                }
            }
            
            if (array_key_exists('quantity', $input) && array_key_exists('unit_rate', $input)) {
                $fields[] = "total_amount = ?";
                $params[] = $input['quantity'] * $input['unit_rate'];
            }
            
            if (empty($fields)) sendError('No valid fields to update');
            
            $params[] = $id;
            $sql = "UPDATE boq_items SET " . implode(', ', $fields) . " WHERE id = ?";
            
            $stmt = $db->prepare($sql);
            $result = $stmt->execute($params);
            
            if ($result) {
                sendJson(['message' => 'BOQ item updated successfully']);
            } else {
                sendError('Failed to update BOQ item');
            }
        }
        break;

    case 'DELETE':
        if (!$id) sendError('ID required');
        
        $type = $_GET['type'] ?? 'items';
        
        if ($type === 'items') {
            $stmt = $db->prepare("DELETE FROM boq_items WHERE id = ?");
        } elseif ($type === 'estimates') {
            $stmt = $db->prepare("DELETE FROM boq_estimates WHERE id = ?");
        } elseif ($type === 'rates') {
            $stmt = $db->prepare("DELETE FROM boq_rate_analysis WHERE id = ?");
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
