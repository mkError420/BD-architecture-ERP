<?php
$user = getOptionalAuth();
$db = Database::getInstance()->getConnection();

try {
    // Inventory table
    $db->exec("CREATE TABLE IF NOT EXISTS project_stocks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        material_id INT NULL,
        material_name VARCHAR(150) NOT NULL,
        category VARCHAR(100) DEFAULT 'General',
        quantity DECIMAL(14,3) NOT NULL DEFAULT 0,
        unit VARCHAR(20) DEFAULT 'piece',
        unit_price DECIMAL(12,2) DEFAULT 0,
        total_value DECIMAL(15,2) DEFAULT 0,
        min_stock_level DECIMAL(14,3) DEFAULT 0,
        location VARCHAR(100) DEFAULT 'Site Store',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    )");

    // Transfers table
    $db->exec("CREATE TABLE IF NOT EXISTS stock_transfers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transfer_code VARCHAR(30) UNIQUE NOT NULL,
        from_project_id INT NULL,
        to_project_id INT NOT NULL,
        transfer_date DATE NOT NULL,
        material_name VARCHAR(150) NULL,
        quantity DECIMAL(14,3) DEFAULT 0,
        unit VARCHAR(20) DEFAULT 'piece',
        status ENUM('pending','approved','in_transit','completed','cancelled') DEFAULT 'pending',
        notes TEXT,
        requested_by INT NULL,
        approved_by INT NULL,
        approved_at DATETIME NULL,
        received_by INT NULL,
        received_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (to_project_id) REFERENCES projects(id)
    )");
    
    $db->exec("CREATE TABLE IF NOT EXISTS stock_transfer_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        stock_transfer_id INT NOT NULL,
        material_id INT NULL,
        material_name VARCHAR(150) NULL,
        quantity DECIMAL(14,3) NOT NULL,
        unit VARCHAR(20) DEFAULT 'piece',
        notes TEXT,
        FOREIGN KEY (stock_transfer_id) REFERENCES stock_transfers(id) ON DELETE CASCADE
    )");
    
    // Adjustments table
    $db->exec("CREATE TABLE IF NOT EXISTS stock_adjustments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        adjustment_code VARCHAR(30) UNIQUE NOT NULL,
        project_id INT NOT NULL,
        material_id INT NULL,
        material_name VARCHAR(150) NOT NULL,
        adjustment_type ENUM('damage','loss','theft','expired','quality_issue','correction','other') DEFAULT 'correction',
        previous_quantity DECIMAL(14,3) NOT NULL DEFAULT 0,
        adjusted_quantity DECIMAL(14,3) NOT NULL DEFAULT 0,
        difference DECIMAL(14,3) NOT NULL DEFAULT 0,
        unit VARCHAR(20) DEFAULT 'piece',
        adjustment_date DATE NOT NULL,
        reason TEXT,
        approved_by INT NULL,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    )");
} catch (Exception $e) {}

// Safe migrations
try {
    $db->exec("ALTER TABLE stock_transfers ADD COLUMN material_name VARCHAR(150) NULL AFTER transfer_date");
} catch (Exception $e) {}
try {
    $db->exec("ALTER TABLE stock_transfers ADD COLUMN quantity DECIMAL(14,3) DEFAULT 0 AFTER material_name");
} catch (Exception $e) {}
try {
    $db->exec("ALTER TABLE stock_transfers ADD COLUMN unit VARCHAR(20) DEFAULT 'piece' AFTER quantity");
} catch (Exception $e) {}
try {
    $db->exec("ALTER TABLE stock_adjustments ADD COLUMN material_name VARCHAR(150) NOT NULL AFTER material_id");
} catch (Exception $e) {}
try {
    $db->exec("ALTER TABLE stock_adjustments ADD COLUMN unit VARCHAR(20) DEFAULT 'piece' AFTER difference");
} catch (Exception $e) {}
try {
    $db->exec("ALTER TABLE stock_adjustments MODIFY material_id INT NULL");
} catch (Exception $e) {}

$projectId = $_GET['project_id'] ?? null;
$type = $_GET['type'] ?? 'inventory';

switch ($method) {
    case 'GET':
        try {
            if ($type === 'inventory') {
                if ($id) {
                    $stmt = $db->prepare("SELECT * FROM project_stocks WHERE id = ?");
                    $stmt->execute([$id]);
                    $data = $stmt->fetch();
                    if (!$data) sendError('Stock record not found', 404);
                    sendResponse(['success' => true, 'data' => $data]);
                } elseif ($projectId) {
                    $stmt = $db->prepare("
                        SELECT ps.*, COALESCE(ps.material_name, m.name) as material_name, 
                               COALESCE(ps.category, m.category, 'General') as category
                        FROM project_stocks ps
                        LEFT JOIN materials m ON ps.material_id = m.id
                        WHERE ps.project_id = ?
                        ORDER BY ps.category ASC, ps.material_name ASC
                    ");
                    $stmt->execute([$projectId]);
                    $data = $stmt->fetchAll();
                    sendResponse(['success' => true, 'data' => $data ?: []]);
                } else {
                    $stmt = $db->prepare("SELECT * FROM project_stocks ORDER BY id DESC LIMIT 50");
                    $stmt->execute();
                    $data = $stmt->fetchAll();
                    sendResponse(['success' => true, 'data' => $data ?: []]);
                }
            } elseif ($type === 'transfers') {
                if ($id) {
                    $stmt = $db->prepare("
                        SELECT st.*, p1.name as from_project_name, p2.name as to_project_name, 
                               u1.name as requested_by_name, u2.name as approved_by_name
                        FROM stock_transfers st
                        LEFT JOIN projects p1 ON st.from_project_id = p1.id
                        LEFT JOIN projects p2 ON st.to_project_id = p2.id
                        LEFT JOIN users u1 ON st.requested_by = u1.id
                        LEFT JOIN users u2 ON st.approved_by = u2.id
                        WHERE st.id = ?
                    ");
                    $stmt->execute([$id]);
                    $data = $stmt->fetch();
                    if (!$data) sendError('Transfer not found', 404);
                    
                    $itemsStmt = $db->prepare("SELECT * FROM stock_transfer_items WHERE stock_transfer_id = ?");
                    $itemsStmt->execute([$id]);
                    $data['items'] = $itemsStmt->fetchAll();
                    
                    sendResponse(['success' => true, 'data' => $data]);
                } elseif ($projectId) {
                    $stmt = $db->prepare("
                        SELECT st.*, COALESCE(p1.name, 'Central Store / Warehouse') as from_project_name, p2.name as to_project_name
                        FROM stock_transfers st
                        LEFT JOIN projects p1 ON st.from_project_id = p1.id
                        LEFT JOIN projects p2 ON st.to_project_id = p2.id
                        WHERE st.from_project_id = ? OR st.to_project_id = ?
                        ORDER BY st.transfer_date DESC, st.id DESC
                    ");
                    $stmt->execute([$projectId, $projectId]);
                    $data = $stmt->fetchAll();
                    sendResponse(['success' => true, 'data' => $data ?: []]);
                } else {
                    $stmt = $db->prepare("
                        SELECT st.*, COALESCE(p1.name, 'Central Store') as from_project_name, p2.name as to_project_name
                        FROM stock_transfers st
                        LEFT JOIN projects p1 ON st.from_project_id = p1.id
                        LEFT JOIN projects p2 ON st.to_project_id = p2.id
                        ORDER BY st.transfer_date DESC LIMIT 50
                    ");
                    $stmt->execute();
                    $data = $stmt->fetchAll();
                    sendResponse(['success' => true, 'data' => $data ?: []]);
                }
            } elseif ($type === 'adjustments') {
                if ($id) {
                    $stmt = $db->prepare("
                        SELECT sa.*, p.name as project_name, u.name as created_by_name
                        FROM stock_adjustments sa
                        LEFT JOIN projects p ON sa.project_id = p.id
                        LEFT JOIN users u ON sa.created_by = u.id
                        WHERE sa.id = ?
                    ");
                    $stmt->execute([$id]);
                    $data = $stmt->fetch();
                    if (!$data) sendError('Adjustment not found', 404);
                    sendResponse(['success' => true, 'data' => $data]);
                } elseif ($projectId) {
                    $stmt = $db->prepare("
                        SELECT sa.*, u.name as created_by_name
                        FROM stock_adjustments sa
                        LEFT JOIN users u ON sa.created_by = u.id
                        WHERE sa.project_id = ?
                        ORDER BY sa.adjustment_date DESC, sa.id DESC
                    ");
                    $stmt->execute([$projectId]);
                    $data = $stmt->fetchAll();
                    sendResponse(['success' => true, 'data' => $data ?: []]);
                } else {
                    $stmt = $db->prepare("SELECT * FROM stock_adjustments ORDER BY adjustment_date DESC LIMIT 50");
                    $stmt->execute();
                    $data = $stmt->fetchAll();
                    sendResponse(['success' => true, 'data' => $data ?: []]);
                }
            } else {
                sendResponse(['success' => true, 'data' => []]);
            }
        } catch (Exception $e) {
            sendError('Failed to fetch stock data: ' . $e->getMessage(), 500);
        }
        break;

    case 'POST':
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $type = $input['type'] ?? ($_GET['type'] ?? 'inventory');
            
            if ($type === 'inventory') {
                if (empty($input['project_id']) || empty($input['material_name'])) {
                    sendError('Project ID and Material Name are required');
                }
                
                $qty = isset($input['quantity']) ? (float)$input['quantity'] : 0;
                $price = isset($input['unit_price']) ? (float)$input['unit_price'] : 0;
                $val = isset($input['total_value']) ? (float)$input['total_value'] : ($qty * $price);
                $minLvl = isset($input['min_stock_level']) ? (float)$input['min_stock_level'] : 0;
                
                $stmt = $db->prepare("
                    INSERT INTO project_stocks (project_id, material_id, material_name, category, quantity, unit, unit_price, total_value, min_stock_level, location, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                $result = $stmt->execute([
                    $input['project_id'],
                    !empty($input['material_id']) ? (int)$input['material_id'] : null,
                    $input['material_name'],
                    $input['category'] ?? 'General',
                    $qty,
                    $input['unit'] ?? 'piece',
                    $price,
                    $val,
                    $minLvl,
                    $input['location'] ?? 'Site Store',
                    $input['notes'] ?? null
                ]);
                
                if ($result) {
                    sendResponse(['success' => true, 'message' => 'Stock record saved', 'id' => $db->lastInsertId()], 201);
                } else {
                    sendError('Failed to save stock record');
                }
            } elseif ($type === 'transfers') {
                if (empty($input['to_project_id'])) {
                    sendError('Destination Project ID is required');
                }
                
                $transferCode = !empty($input['transfer_code']) ? sanitize($input['transfer_code']) : ('ST-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT));
                $tDate = !empty($input['transfer_date']) ? $input['transfer_date'] : date('Y-m-d');
                $qty = isset($input['quantity']) ? (float)$input['quantity'] : 0;
                
                $stmt = $db->prepare("
                    INSERT INTO stock_transfers (transfer_code, from_project_id, to_project_id, transfer_date, material_name, quantity, unit, status, notes, requested_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                $result = $stmt->execute([
                    $transferCode,
                    !empty($input['from_project_id']) ? (int)$input['from_project_id'] : null,
                    $input['to_project_id'],
                    $tDate,
                    $input['material_name'] ?? null,
                    $qty,
                    $input['unit'] ?? 'piece',
                    $input['status'] ?? 'pending',
                    $input['notes'] ?? null,
                    $user['id'] ?? null
                ]);
                
                if ($result) {
                    $transferId = $db->lastInsertId();
                    sendResponse(['success' => true, 'message' => 'Stock transfer recorded', 'id' => $transferId, 'transfer_code' => $transferCode], 201);
                } else {
                    sendError('Failed to record stock transfer');
                }
            } elseif ($type === 'adjustments') {
                if (empty($input['project_id']) || empty($input['material_name'])) {
                    sendError('Project ID and Material Name are required');
                }
                
                $prevQty = isset($input['previous_quantity']) ? (float)$input['previous_quantity'] : 0;
                $adjQty = isset($input['adjusted_quantity']) ? (float)$input['adjusted_quantity'] : 0;
                $diff = isset($input['difference']) ? (float)$input['difference'] : ($adjQty - $prevQty);
                $adjCode = !empty($input['adjustment_code']) ? sanitize($input['adjustment_code']) : ('SA-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT));
                $aDate = !empty($input['adjustment_date']) ? $input['adjustment_date'] : date('Y-m-d');
                
                $stmt = $db->prepare("
                    INSERT INTO stock_adjustments (adjustment_code, project_id, material_id, material_name, adjustment_type, previous_quantity, adjusted_quantity, difference, unit, adjustment_date, reason, created_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                $result = $stmt->execute([
                    $adjCode,
                    $input['project_id'],
                    !empty($input['material_id']) ? (int)$input['material_id'] : null,
                    $input['material_name'],
                    $input['adjustment_type'] ?? 'correction',
                    $prevQty,
                    $adjQty,
                    $diff,
                    $input['unit'] ?? 'piece',
                    $aDate,
                    $input['reason'] ?? null,
                    $user['id'] ?? null
                ]);
                
                if ($result) {
                    sendResponse(['success' => true, 'message' => 'Stock adjustment recorded', 'id' => $db->lastInsertId(), 'adjustment_code' => $adjCode], 201);
                } else {
                    sendError('Failed to record stock adjustment');
                }
            }
        } catch (Exception $e) {
            sendError('Failed to create record: ' . $e->getMessage(), 500);
        }
        break;

    case 'PUT':
        try {
            if (!$id) sendError('ID required');
            
            $input = json_decode(file_get_contents('php://input'), true);
            $type = $input['type'] ?? ($_GET['type'] ?? 'inventory');
            
            if ($type === 'inventory') {
                $fields = [];
                $params = [];
                $allowed = ['material_name', 'category', 'quantity', 'unit', 'unit_price', 'total_value', 'min_stock_level', 'location', 'notes'];
                foreach ($allowed as $f) {
                    if (array_key_exists($f, $input)) {
                        $fields[] = "$f = ?";
                        $params[] = $input[$f];
                    }
                }
                if (empty($fields)) sendError('No fields to update');
                $params[] = $id;
                $sql = "UPDATE project_stocks SET " . implode(', ', $fields) . " WHERE id = ?";
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                sendResponse(['success' => true, 'message' => 'Stock updated successfully']);
            } elseif ($type === 'transfers') {
                $fields = [];
                $params = [];
                $allowed = ['material_name', 'quantity', 'unit', 'status', 'transfer_date', 'notes', 'from_project_id', 'to_project_id'];
                foreach ($allowed as $f) {
                    if (array_key_exists($f, $input)) {
                        $fields[] = "$f = ?";
                        $val = $input[$f];
                        if ($f === 'from_project_id' && empty($val)) $val = null;
                        $params[] = $val;
                    }
                }
                if (empty($fields)) sendError('No fields to update');
                $params[] = $id;
                $sql = "UPDATE stock_transfers SET " . implode(', ', $fields) . " WHERE id = ?";
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                sendResponse(['success' => true, 'message' => 'Transfer updated successfully']);
            } elseif ($type === 'adjustments') {
                $fields = [];
                $params = [];
                $allowed = ['material_name', 'adjustment_type', 'previous_quantity', 'adjusted_quantity', 'difference', 'unit', 'adjustment_date', 'reason'];
                foreach ($allowed as $f) {
                    if (array_key_exists($f, $input)) {
                        $fields[] = "$f = ?";
                        $params[] = $input[$f];
                    }
                }
                if (empty($fields)) sendError('No fields to update');
                $params[] = $id;
                $sql = "UPDATE stock_adjustments SET " . implode(', ', $fields) . " WHERE id = ?";
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                sendResponse(['success' => true, 'message' => 'Adjustment updated successfully']);
            }
        } catch (Exception $e) {
            sendError('Failed to update: ' . $e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        try {
            if (!$id) sendError('ID required');
            $type = $_GET['type'] ?? 'inventory';
            
            if ($type === 'inventory') {
                $stmt = $db->prepare("DELETE FROM project_stocks WHERE id = ?");
            } elseif ($type === 'transfers') {
                $stmt = $db->prepare("DELETE FROM stock_transfers WHERE id = ?");
            } elseif ($type === 'adjustments') {
                $stmt = $db->prepare("DELETE FROM stock_adjustments WHERE id = ?");
            } else {
                $stmt = $db->prepare("DELETE FROM project_stocks WHERE id = ?");
            }
            
            $stmt->execute([$id]);
            sendResponse(['success' => true, 'message' => 'Deleted successfully']);
        } catch (Exception $e) {
            sendError('Failed to delete: ' . $e->getMessage(), 500);
        }
        break;

    default:
        sendError('Method not allowed', 405);
}
