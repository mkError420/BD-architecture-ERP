<?php
$user = requireAuth();
$db = Database::getInstance()->getConnection();

try {
    $db->exec("CREATE TABLE IF NOT EXISTS stock_transfers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transfer_code VARCHAR(30) UNIQUE NOT NULL,
        from_project_id INT,
        to_project_id INT NOT NULL,
        transfer_date DATE NOT NULL,
        status ENUM('pending','approved','in_transit','completed','cancelled') DEFAULT 'pending',
        notes TEXT,
        requested_by INT,
        approved_by INT,
        approved_at DATETIME,
        received_by INT,
        received_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_project_id) REFERENCES projects(id),
        FOREIGN KEY (to_project_id) REFERENCES projects(id),
        FOREIGN KEY (requested_by) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id),
        FOREIGN KEY (received_by) REFERENCES users(id)
    )");
    
    $db->exec("CREATE TABLE IF NOT EXISTS stock_transfer_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        stock_transfer_id INT NOT NULL,
        material_id INT NOT NULL,
        quantity DECIMAL(14,3) NOT NULL,
        unit VARCHAR(20) DEFAULT 'piece',
        notes TEXT,
        FOREIGN KEY (stock_transfer_id) REFERENCES stock_transfers(id) ON DELETE CASCADE,
        FOREIGN KEY (material_id) REFERENCES materials(id)
    )");
    
    $db->exec("CREATE TABLE IF NOT EXISTS stock_adjustments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        adjustment_code VARCHAR(30) UNIQUE NOT NULL,
        project_id INT NOT NULL,
        material_id INT NOT NULL,
        adjustment_type ENUM('damage','loss','theft','expired','quality_issue','correction','other') DEFAULT 'correction',
        previous_quantity DECIMAL(14,3) NOT NULL,
        adjusted_quantity DECIMAL(14,3) NOT NULL,
        difference DECIMAL(14,3) NOT NULL,
        adjustment_date DATE NOT NULL,
        reason TEXT,
        approved_by INT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (material_id) REFERENCES materials(id),
        FOREIGN KEY (approved_by) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
    )");
} catch (Exception $e) {}

$projectId = $_GET['project_id'] ?? null;
$type = $_GET['type'] ?? 'transfers';

switch ($method) {
    case 'GET':
        if ($type === 'transfers') {
            if ($id) {
                $stmt = $db->prepare("
                    SELECT st.*, p1.name as from_project_name, p2.name as to_project_name, 
                           u1.name as requested_by_name, u2.name as approved_by_name, u3.name as received_by_name
                    FROM stock_transfers st
                    LEFT JOIN projects p1 ON st.from_project_id = p1.id
                    LEFT JOIN projects p2 ON st.to_project_id = p2.id
                    LEFT JOIN users u1 ON st.requested_by = u1.id
                    LEFT JOIN users u2 ON st.approved_by = u2.id
                    LEFT JOIN users u3 ON st.received_by = u3.id
                    WHERE st.id = ?
                ");
                $stmt->execute([$id]);
                $data = $stmt->fetch();
                if (!$data) sendError('Transfer not found', 404);
                
                $itemsStmt = $db->prepare("SELECT sti.*, m.name as material_name FROM stock_transfer_items sti LEFT JOIN materials m ON sti.material_id = m.id WHERE sti.stock_transfer_id = ?");
                $itemsStmt->execute([$id]);
                $data['items'] = $itemsStmt->fetchAll();
                
                sendJson($data);
            } elseif ($projectId) {
                $stmt = $db->prepare("
                    SELECT st.*, p1.name as from_project_name, p2.name as to_project_name
                    FROM stock_transfers st
                    LEFT JOIN projects p1 ON st.from_project_id = p1.id
                    LEFT JOIN projects p2 ON st.to_project_id = p2.id
                    WHERE st.from_project_id = ? OR st.to_project_id = ?
                    ORDER BY st.transfer_date DESC
                ");
                $stmt->execute([$projectId, $projectId]);
                $data = $stmt->fetchAll();
                sendJson(['data' => $data]);
            } else {
                $page = intval($_GET['page'] ?? 1);
                $per_page = intval($_GET['per_page'] ?? 20);
                $offset = ($page - 1) * $per_page;
                
                $stmt = $db->prepare("
                    SELECT st.*, p1.name as from_project_name, p2.name as to_project_name
                    FROM stock_transfers st
                    LEFT JOIN projects p1 ON st.from_project_id = p1.id
                    LEFT JOIN projects p2 ON st.to_project_id = p2.id
                    ORDER BY st.transfer_date DESC
                    LIMIT $per_page OFFSET $offset
                ");
                $stmt->execute();
                $data = $stmt->fetchAll();
                
                $countStmt = $db->prepare("SELECT COUNT(*) FROM stock_transfers");
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
        } elseif ($type === 'adjustments') {
            if ($id) {
                $stmt = $db->prepare("
                    SELECT sa.*, p.name as project_name, m.name as material_name, u1.name as approved_by_name, u2.name as created_by_name
                    FROM stock_adjustments sa
                    LEFT JOIN projects p ON sa.project_id = p.id
                    LEFT JOIN materials m ON sa.material_id = m.id
                    LEFT JOIN users u1 ON sa.approved_by = u1.id
                    LEFT JOIN users u2 ON sa.created_by = u2.id
                    WHERE sa.id = ?
                ");
                $stmt->execute([$id]);
                $data = $stmt->fetch();
                if (!$data) sendError('Adjustment not found', 404);
                sendJson($data);
            } elseif ($projectId) {
                $stmt = $db->prepare("
                    SELECT sa.*, m.name as material_name, u.name as created_by_name
                    FROM stock_adjustments sa
                    LEFT JOIN materials m ON sa.material_id = m.id
                    LEFT JOIN users u ON sa.created_by = u.id
                    WHERE sa.project_id = ?
                    ORDER BY sa.adjustment_date DESC
                ");
                $stmt->execute([$projectId]);
                $data = $stmt->fetchAll();
                sendJson(['data' => $data]);
            }
        } elseif ($type === 'inventory') {
            if ($projectId) {
                $stmt = $db->prepare("
                    SELECT ms.*, m.name as material_name, m.category, m.unit, s.name as supplier_name
                    FROM material_stocks ms
                    LEFT JOIN materials m ON ms.material_id = m.id
                    LEFT JOIN suppliers s ON ms.supplier_id = s.id
                    WHERE ms.project_id = ?
                    ORDER BY m.name
                ");
                $stmt->execute([$projectId]);
                $data = $stmt->fetchAll();
                sendJson(['data' => $data]);
            }
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $type = $input['type'] ?? 'transfers';
        
        if ($type === 'transfers') {
            if (empty($input['to_project_id']) || empty($input['transfer_date'])) {
                sendError('Missing required fields: to_project_id, transfer_date');
            }
            
            $transferCode = 'ST-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            
            $stmt = $db->prepare("
                INSERT INTO stock_transfers (transfer_code, from_project_id, to_project_id, transfer_date, status, notes, requested_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $transferCode,
                $input['from_project_id'] ?? null,
                $input['to_project_id'],
                $input['transfer_date'],
                $input['status'] ?? 'pending',
                $input['notes'] ?? null,
                $user['id']
            ]);
            
            if ($result) {
                $transferId = $db->lastInsertId();
                
                if (!empty($input['items']) && is_array($input['items'])) {
                    foreach ($input['items'] as $item) {
                        $itemStmt = $db->prepare("
                            INSERT INTO stock_transfer_items (stock_transfer_id, material_id, quantity, unit, notes)
                            VALUES (?, ?, ?, ?, ?)
                        ");
                        $itemStmt->execute([
                            $transferId,
                            $item['material_id'],
                            $item['quantity'],
                            $item['unit'] ?? 'piece',
                            $item['notes'] ?? null
                        ]);
                    }
                }
                
                sendJson(['message' => 'Stock transfer created successfully', 'id' => $transferId, 'transfer_code' => $transferCode], 201);
            } else {
                sendError('Failed to create stock transfer');
            }
        } elseif ($type === 'adjustments') {
            if (empty($input['project_id']) || empty($input['material_id']) || empty($input['previous_quantity']) || empty($input['adjusted_quantity']) || empty($input['adjustment_date'])) {
                sendError('Missing required fields: project_id, material_id, previous_quantity, adjusted_quantity, adjustment_date');
            }
            
            $difference = $input['adjusted_quantity'] - $input['previous_quantity'];
            $adjustmentCode = 'SA-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            
            $stmt = $db->prepare("
                INSERT INTO stock_adjustments (adjustment_code, project_id, material_id, adjustment_type, previous_quantity, adjusted_quantity, difference, adjustment_date, reason, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $adjustmentCode,
                $input['project_id'],
                $input['material_id'],
                $input['adjustment_type'] ?? 'correction',
                $input['previous_quantity'],
                $input['adjusted_quantity'],
                $difference,
                $input['adjustment_date'],
                $input['reason'] ?? null,
                $user['id']
            ]);
            
            if ($result) {
                sendJson(['message' => 'Stock adjustment created successfully', 'id' => $db->lastInsertId(), 'adjustment_code' => $adjustmentCode], 201);
            } else {
                sendError('Failed to create stock adjustment');
            }
        }
        break;

    case 'PUT':
        if (!$id) sendError('ID required');
        
        $input = json_decode(file_get_contents('php://input'), true);
        $type = $input['type'] ?? 'transfers';
        
        if ($type === 'transfers') {
            $fields = [];
            $params = [];
            
            $allowedFields = ['transfer_date', 'status', 'notes'];
            
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $input)) {
                    $fields[] = "$field = ?";
                    $params[] = $input[$field];
                }
            }
            
            if ($input['status'] === 'approved' && !empty($input['approved_by'])) {
                $fields[] = "approved_by = ?";
                $params[] = $input['approved_by'];
                $fields[] = "approved_at = NOW()";
            }
            
            if ($input['status'] === 'completed' && !empty($input['received_by'])) {
                $fields[] = "received_by = ?";
                $params[] = $input['received_by'];
                $fields[] = "received_at = NOW()";
            }
            
            if (empty($fields)) sendError('No valid fields to update');
            
            $params[] = $id;
            $sql = "UPDATE stock_transfers SET " . implode(', ', $fields) . " WHERE id = ?";
            
            $stmt = $db->prepare($sql);
            $result = $stmt->execute($params);
            
            if ($result) {
                sendJson(['message' => 'Stock transfer updated successfully']);
            } else {
                sendError('Failed to update stock transfer');
            }
        } elseif ($type === 'adjustments') {
            $fields = [];
            $params = [];
            
            $allowedFields = ['adjustment_type', 'status', 'approved_by', 'reason'];
            
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $input)) {
                    $fields[] = "$field = ?";
                    $params[] = $input[$field];
                }
            }
            
            if (empty($fields)) sendError('No valid fields to update');
            
            $params[] = $id;
            $sql = "UPDATE stock_adjustments SET " . implode(', ', $fields) . " WHERE id = ?";
            
            $stmt = $db->prepare($sql);
            $result = $stmt->execute($params);
            
            if ($result) {
                sendJson(['message' => 'Stock adjustment updated successfully']);
            } else {
                sendError('Failed to update stock adjustment');
            }
        }
        break;

    case 'DELETE':
        if (!$id) sendError('ID required');
        
        $type = $_GET['type'] ?? 'transfers';
        
        if ($type === 'transfers') {
            $stmt = $db->prepare("DELETE FROM stock_transfers WHERE id = ?");
        } elseif ($type === 'adjustments') {
            $stmt = $db->prepare("DELETE FROM stock_adjustments WHERE id = ?");
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
