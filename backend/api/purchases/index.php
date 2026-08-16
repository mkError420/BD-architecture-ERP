<?php
$user = requireAuth();
$db = Database::getInstance()->getConnection();

try {
    $db->exec("CREATE TABLE IF NOT EXISTS purchase_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_code VARCHAR(30) UNIQUE NOT NULL,
        project_id INT NOT NULL,
        supplier_id INT NOT NULL,
        order_date DATE NOT NULL,
        expected_delivery_date DATE,
        actual_delivery_date DATE,
        subtotal DECIMAL(15,2) DEFAULT 0,
        vat DECIMAL(12,2) DEFAULT 0,
        discount DECIMAL(12,2) DEFAULT 0,
        total_amount DECIMAL(15,2) NOT NULL,
        paid_amount DECIMAL(15,2) DEFAULT 0,
        status ENUM('draft','pending','approved','ordered','partial_delivered','delivered','cancelled') DEFAULT 'draft',
        payment_terms VARCHAR(100),
        delivery_address TEXT,
        notes TEXT,
        created_by INT,
        approved_by INT,
        approved_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
    )");
    
    $db->exec("CREATE TABLE IF NOT EXISTS purchase_order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        purchase_order_id INT NOT NULL,
        material_id INT,
        description VARCHAR(255) NOT NULL,
        quantity DECIMAL(14,3) NOT NULL,
        unit VARCHAR(20) DEFAULT 'piece',
        unit_price DECIMAL(12,2) NOT NULL,
        total DECIMAL(15,2) NOT NULL,
        received_quantity DECIMAL(14,3) DEFAULT 0,
        FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
        FOREIGN KEY (material_id) REFERENCES materials(id)
    )");
    
    $db->exec("CREATE TABLE IF NOT EXISTS purchase_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        request_code VARCHAR(30) UNIQUE NOT NULL,
        project_id INT NOT NULL,
        requested_by INT NOT NULL,
        request_date DATE NOT NULL,
        required_date DATE,
        status ENUM('pending','approved','rejected','ordered') DEFAULT 'pending',
        priority ENUM('urgent','high','medium','low') DEFAULT 'medium',
        reason TEXT,
        approved_by INT,
        approved_at DATETIME,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (requested_by) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
    )");
    
    $db->exec("CREATE TABLE IF NOT EXISTS purchase_request_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        purchase_request_id INT NOT NULL,
        material_id INT,
        description VARCHAR(255) NOT NULL,
        quantity DECIMAL(14,3) NOT NULL,
        unit VARCHAR(20) DEFAULT 'piece',
        estimated_price DECIMAL(12,2),
        purpose TEXT,
        FOREIGN KEY (purchase_request_id) REFERENCES purchase_requests(id) ON DELETE CASCADE,
        FOREIGN KEY (material_id) REFERENCES materials(id)
    )");
    
    $db->exec("CREATE TABLE IF NOT EXISTS quotations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quotation_code VARCHAR(30) UNIQUE NOT NULL,
        project_id INT NOT NULL,
        supplier_id INT NOT NULL,
        quotation_date DATE NOT NULL,
        valid_until DATE,
        subtotal DECIMAL(15,2) DEFAULT 0,
        vat DECIMAL(12,2) DEFAULT 0,
        discount DECIMAL(12,2) DEFAULT 0,
        total_amount DECIMAL(15,2) NOT NULL,
        status ENUM('received','under_review','accepted','rejected','expired') DEFAULT 'received',
        payment_terms VARCHAR(100),
        delivery_terms VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    )");
    
    $db->exec("CREATE TABLE IF NOT EXISTS quotation_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quotation_id INT NOT NULL,
        description VARCHAR(255) NOT NULL,
        quantity DECIMAL(14,3) NOT NULL,
        unit VARCHAR(20) DEFAULT 'piece',
        unit_price DECIMAL(12,2) NOT NULL,
        total DECIMAL(15,2) NOT NULL,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
    )");
} catch (Exception $e) {}

$projectId = $_GET['project_id'] ?? null;
$type = $_GET['type'] ?? 'orders';

switch ($method) {
    case 'GET':
        if ($type === 'orders') {
            if ($id) {
                $stmt = $db->prepare("
                    SELECT po.*, p.name as project_name, s.name as supplier_name, u1.name as created_by_name, u2.name as approved_by_name
                    FROM purchase_orders po
                    LEFT JOIN projects p ON po.project_id = p.id
                    LEFT JOIN suppliers s ON po.supplier_id = s.id
                    LEFT JOIN users u1 ON po.created_by = u1.id
                    LEFT JOIN users u2 ON po.approved_by = u2.id
                    WHERE po.id = ?
                ");
                $stmt->execute([$id]);
                $data = $stmt->fetch();
                if (!$data) sendError('Purchase order not found', 404);
                
                $itemsStmt = $db->prepare("SELECT poi.*, m.name as material_name FROM purchase_order_items poi LEFT JOIN materials m ON poi.material_id = m.id WHERE poi.purchase_order_id = ?");
                $itemsStmt->execute([$id]);
                $data['items'] = $itemsStmt->fetchAll();
                
                sendJson($data);
            } elseif ($projectId) {
                $stmt = $db->prepare("
                    SELECT po.*, s.name as supplier_name
                    FROM purchase_orders po
                    LEFT JOIN suppliers s ON po.supplier_id = s.id
                    WHERE po.project_id = ?
                    ORDER BY po.order_date DESC
                ");
                $stmt->execute([$projectId]);
                $data = $stmt->fetchAll();
                sendJson(['data' => $data]);
            } else {
                $page = intval($_GET['page'] ?? 1);
                $per_page = intval($_GET['per_page'] ?? 20);
                $offset = ($page - 1) * $per_page;
                
                $stmt = $db->prepare("
                    SELECT po.*, p.name as project_name, s.name as supplier_name
                    FROM purchase_orders po
                    LEFT JOIN projects p ON po.project_id = p.id
                    LEFT JOIN suppliers s ON po.supplier_id = s.id
                    ORDER BY po.order_date DESC
                    LIMIT $per_page OFFSET $offset
                ");
                $stmt->execute();
                $data = $stmt->fetchAll();
                
                $countStmt = $db->prepare("SELECT COUNT(*) FROM purchase_orders");
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
        } elseif ($type === 'requests') {
            if ($id) {
                $stmt = $db->prepare("
                    SELECT pr.*, p.name as project_name, u1.name as requested_by_name, u2.name as approved_by_name
                    FROM purchase_requests pr
                    LEFT JOIN projects p ON pr.project_id = p.id
                    LEFT JOIN users u1 ON pr.requested_by = u1.id
                    LEFT JOIN users u2 ON pr.approved_by = u2.id
                    WHERE pr.id = ?
                ");
                $stmt->execute([$id]);
                $data = $stmt->fetch();
                if (!$data) sendError('Purchase request not found', 404);
                
                $itemsStmt = $db->prepare("SELECT pri.*, m.name as material_name FROM purchase_request_items pri LEFT JOIN materials m ON pri.material_id = m.id WHERE pri.purchase_request_id = ?");
                $itemsStmt->execute([$id]);
                $data['items'] = $itemsStmt->fetchAll();
                
                sendJson($data);
            } elseif ($projectId) {
                $stmt = $db->prepare("
                    SELECT pr.*, u.name as requested_by_name
                    FROM purchase_requests pr
                    LEFT JOIN users u ON pr.requested_by = u.id
                    WHERE pr.project_id = ?
                    ORDER BY pr.request_date DESC
                ");
                $stmt->execute([$projectId]);
                $data = $stmt->fetchAll();
                sendJson(['data' => $data]);
            }
        } elseif ($type === 'quotations') {
            if ($id) {
                $stmt = $db->prepare("
                    SELECT q.*, p.name as project_name, s.name as supplier_name
                    FROM quotations q
                    LEFT JOIN projects p ON q.project_id = p.id
                    LEFT JOIN suppliers s ON q.supplier_id = s.id
                    WHERE q.id = ?
                ");
                $stmt->execute([$id]);
                $data = $stmt->fetch();
                if (!$data) sendError('Quotation not found', 404);
                
                $itemsStmt = $db->prepare("SELECT qi.* FROM quotation_items qi WHERE qi.quotation_id = ?");
                $itemsStmt->execute([$id]);
                $data['items'] = $itemsStmt->fetchAll();
                
                sendJson($data);
            } elseif ($projectId) {
                $stmt = $db->prepare("
                    SELECT q.*, s.name as supplier_name
                    FROM quotations q
                    LEFT JOIN suppliers s ON q.supplier_id = s.id
                    WHERE q.project_id = ?
                    ORDER BY q.quotation_date DESC
                ");
                $stmt->execute([$projectId]);
                $data = $stmt->fetchAll();
                sendJson(['data' => $data]);
            }
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $type = $input['type'] ?? 'orders';
        
        if ($type === 'orders') {
            if (empty($input['project_id']) || empty($input['supplier_id']) || empty($input['order_date'])) {
                sendError('Missing required fields: project_id, supplier_id, order_date');
            }
            
            $orderCode = 'PO-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            $subtotal = $input['subtotal'] ?? 0;
            $vat = $input['vat'] ?? 0;
            $discount = $input['discount'] ?? 0;
            $total = $subtotal + $vat - $discount;
            
            $stmt = $db->prepare("
                INSERT INTO purchase_orders (order_code, project_id, supplier_id, order_date, expected_delivery_date, 
                    subtotal, vat, discount, total_amount, payment_terms, delivery_address, notes, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $orderCode,
                $input['project_id'],
                $input['supplier_id'],
                $input['order_date'],
                $input['expected_delivery_date'] ?? null,
                $subtotal,
                $vat,
                $discount,
                $total,
                $input['payment_terms'] ?? null,
                $input['delivery_address'] ?? null,
                $input['notes'] ?? null,
                $user['id']
            ]);
            
            if ($result) {
                $orderId = $db->lastInsertId();
                
                if (!empty($input['items']) && is_array($input['items'])) {
                    foreach ($input['items'] as $item) {
                        $itemTotal = $item['quantity'] * $item['unit_price'];
                        $itemStmt = $db->prepare("
                            INSERT INTO purchase_order_items (purchase_order_id, material_id, description, quantity, unit, unit_price, total)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        ");
                        $itemStmt->execute([
                            $orderId,
                            $item['material_id'] ?? null,
                            $item['description'],
                            $item['quantity'],
                            $item['unit'] ?? 'piece',
                            $item['unit_price'],
                            $itemTotal
                        ]);
                    }
                }
                
                sendJson(['message' => 'Purchase order created successfully', 'id' => $orderId, 'order_code' => $orderCode], 201);
            } else {
                sendError('Failed to create purchase order');
            }
        } elseif ($type === 'requests') {
            if (empty($input['project_id']) || empty($input['request_date'])) {
                sendError('Missing required fields: project_id, request_date');
            }
            
            $requestCode = 'PR-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            
            $stmt = $db->prepare("
                INSERT INTO purchase_requests (request_code, project_id, request_date, required_date, priority, reason, notes, requested_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $requestCode,
                $input['project_id'],
                $input['request_date'],
                $input['required_date'] ?? null,
                $input['priority'] ?? 'medium',
                $input['reason'] ?? null,
                $input['notes'] ?? null,
                $user['id']
            ]);
            
            if ($result) {
                $requestId = $db->lastInsertId();
                
                if (!empty($input['items']) && is_array($input['items'])) {
                    foreach ($input['items'] as $item) {
                        $itemStmt = $db->prepare("
                            INSERT INTO purchase_request_items (purchase_request_id, material_id, description, quantity, unit, estimated_price, purpose)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        ");
                        $itemStmt->execute([
                            $requestId,
                            $item['material_id'] ?? null,
                            $item['description'],
                            $item['quantity'],
                            $item['unit'] ?? 'piece',
                            $item['estimated_price'] ?? null,
                            $item['purpose'] ?? null
                        ]);
                    }
                }
                
                sendJson(['message' => 'Purchase request created successfully', 'id' => $requestId, 'request_code' => $requestCode], 201);
            } else {
                sendError('Failed to create purchase request');
            }
        } elseif ($type === 'quotations') {
            if (empty($input['project_id']) || empty($input['supplier_id']) || empty($input['quotation_date'])) {
                sendError('Missing required fields: project_id, supplier_id, quotation_date');
            }
            
            $quotationCode = 'QT-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            $subtotal = $input['subtotal'] ?? 0;
            $vat = $input['vat'] ?? 0;
            $discount = $input['discount'] ?? 0;
            $total = $subtotal + $vat - $discount;
            
            $stmt = $db->prepare("
                INSERT INTO quotations (quotation_code, project_id, supplier_id, quotation_date, valid_until, 
                    subtotal, vat, discount, total_amount, payment_terms, delivery_terms, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $quotationCode,
                $input['project_id'],
                $input['supplier_id'],
                $input['quotation_date'],
                $input['valid_until'] ?? null,
                $subtotal,
                $vat,
                $discount,
                $total,
                $input['payment_terms'] ?? null,
                $input['delivery_terms'] ?? null,
                $input['notes'] ?? null
            ]);
            
            if ($result) {
                $quotationId = $db->lastInsertId();
                
                if (!empty($input['items']) && is_array($input['items'])) {
                    foreach ($input['items'] as $item) {
                        $itemTotal = $item['quantity'] * $item['unit_price'];
                        $itemStmt = $db->prepare("
                            INSERT INTO quotation_items (quotation_id, description, quantity, unit, unit_price, total)
                            VALUES (?, ?, ?, ?, ?, ?)
                        ");
                        $itemStmt->execute([
                            $quotationId,
                            $item['description'],
                            $item['quantity'],
                            $item['unit'] ?? 'piece',
                            $item['unit_price'],
                            $itemTotal
                        ]);
                    }
                }
                
                sendJson(['message' => 'Quotation created successfully', 'id' => $quotationId, 'quotation_code' => $quotationCode], 201);
            } else {
                sendError('Failed to create quotation');
            }
        }
        break;

    case 'PUT':
        if (!$id) sendError('ID required');
        
        $input = json_decode(file_get_contents('php://input'), true);
        $type = $input['type'] ?? 'orders';
        
        if ($type === 'orders') {
            $fields = [];
            $params = [];
            
            $allowedFields = ['expected_delivery_date', 'actual_delivery_date', 'status', 'payment_terms', 'delivery_address', 'notes'];
            
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
            
            if (empty($fields)) sendError('No valid fields to update');
            
            $params[] = $id;
            $sql = "UPDATE purchase_orders SET " . implode(', ', $fields) . " WHERE id = ?";
            
            $stmt = $db->prepare($sql);
            $result = $stmt->execute($params);
            
            if ($result) {
                sendJson(['message' => 'Purchase order updated successfully']);
            } else {
                sendError('Failed to update purchase order');
            }
        } elseif ($type === 'requests') {
            $fields = [];
            $params = [];
            
            $allowedFields = ['required_date', 'status', 'priority', 'reason', 'notes'];
            
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
            
            if (empty($fields)) sendError('No valid fields to update');
            
            $params[] = $id;
            $sql = "UPDATE purchase_requests SET " . implode(', ', $fields) . " WHERE id = ?";
            
            $stmt = $db->prepare($sql);
            $result = $stmt->execute($params);
            
            if ($result) {
                sendJson(['message' => 'Purchase request updated successfully']);
            } else {
                sendError('Failed to update purchase request');
            }
        } elseif ($type === 'quotations') {
            $fields = [];
            $params = [];
            
            $allowedFields = ['valid_until', 'status', 'payment_terms', 'delivery_terms', 'notes'];
            
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $input)) {
                    $fields[] = "$field = ?";
                    $params[] = $input[$field];
                }
            }
            
            if (empty($fields)) sendError('No valid fields to update');
            
            $params[] = $id;
            $sql = "UPDATE quotations SET " . implode(', ', $fields) . " WHERE id = ?";
            
            $stmt = $db->prepare($sql);
            $result = $stmt->execute($params);
            
            if ($result) {
                sendJson(['message' => 'Quotation updated successfully']);
            } else {
                sendError('Failed to update quotation');
            }
        }
        break;

    case 'DELETE':
        if (!$id) sendError('ID required');
        
        $type = $_GET['type'] ?? 'orders';
        
        if ($type === 'orders') {
            $stmt = $db->prepare("DELETE FROM purchase_orders WHERE id = ?");
        } elseif ($type === 'requests') {
            $stmt = $db->prepare("DELETE FROM purchase_requests WHERE id = ?");
        } elseif ($type === 'quotations') {
            $stmt = $db->prepare("DELETE FROM quotations WHERE id = ?");
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
