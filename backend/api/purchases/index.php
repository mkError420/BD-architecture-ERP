<?php
$user = getOptionalAuth();
$db = Database::getInstance()->getConnection();

try {
    $db->exec("CREATE TABLE IF NOT EXISTS purchase_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_code VARCHAR(30) UNIQUE NOT NULL,
        project_id INT NOT NULL,
        supplier_id INT NULL,
        supplier_name VARCHAR(150) NULL,
        item_description TEXT NULL,
        order_date DATE NOT NULL,
        expected_delivery_date DATE,
        actual_delivery_date DATE,
        subtotal DECIMAL(15,2) DEFAULT 0,
        vat DECIMAL(12,2) DEFAULT 0,
        discount DECIMAL(12,2) DEFAULT 0,
        total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        paid_amount DECIMAL(15,2) DEFAULT 0,
        status ENUM('draft','pending','approved','ordered','partial_delivered','delivered','cancelled','partial') DEFAULT 'pending',
        payment_terms VARCHAR(100),
        delivery_address TEXT,
        notes TEXT,
        created_by INT,
        approved_by INT,
        approved_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
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
        FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
    )");
    
    $db->exec("CREATE TABLE IF NOT EXISTS purchase_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        request_code VARCHAR(30) UNIQUE NOT NULL,
        project_id INT NOT NULL,
        requested_by INT NULL,
        item_description TEXT NULL,
        estimated_amount DECIMAL(15,2) DEFAULT 0,
        request_date DATE NOT NULL,
        required_date DATE,
        status ENUM('pending','approved','rejected','ordered') DEFAULT 'pending',
        priority ENUM('urgent','high','medium','low') DEFAULT 'medium',
        reason TEXT,
        approved_by INT,
        approved_at DATETIME,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
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
        FOREIGN KEY (purchase_request_id) REFERENCES purchase_requests(id) ON DELETE CASCADE
    )");
    
    $db->exec("CREATE TABLE IF NOT EXISTS quotations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quotation_code VARCHAR(30) UNIQUE NOT NULL,
        project_id INT NOT NULL,
        supplier_id INT NULL,
        supplier_name VARCHAR(150) NULL,
        item_description TEXT NULL,
        quotation_date DATE NOT NULL,
        valid_until DATE,
        subtotal DECIMAL(15,2) DEFAULT 0,
        vat DECIMAL(12,2) DEFAULT 0,
        discount DECIMAL(12,2) DEFAULT 0,
        total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        status ENUM('received','under_review','accepted','rejected','expired') DEFAULT 'received',
        payment_terms VARCHAR(100),
        delivery_terms VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
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

// Safe migrations
try {
    $db->exec("ALTER TABLE purchase_orders ADD COLUMN supplier_name VARCHAR(150) NULL AFTER supplier_id");
} catch (Exception $e) {}
try {
    $db->exec("ALTER TABLE purchase_orders ADD COLUMN item_description TEXT NULL AFTER supplier_name");
} catch (Exception $e) {}
try {
    $db->exec("ALTER TABLE purchase_orders MODIFY supplier_id INT NULL");
} catch (Exception $e) {}
try {
    $db->exec("ALTER TABLE purchase_requests ADD COLUMN item_description TEXT NULL AFTER requested_by");
} catch (Exception $e) {}
try {
    $db->exec("ALTER TABLE purchase_requests ADD COLUMN estimated_amount DECIMAL(15,2) DEFAULT 0 AFTER item_description");
} catch (Exception $e) {}
try {
    $db->exec("ALTER TABLE purchase_requests MODIFY requested_by INT NULL");
} catch (Exception $e) {}
try {
    $db->exec("ALTER TABLE quotations ADD COLUMN supplier_name VARCHAR(150) NULL AFTER supplier_id");
} catch (Exception $e) {}
try {
    $db->exec("ALTER TABLE quotations ADD COLUMN item_description TEXT NULL AFTER supplier_name");
} catch (Exception $e) {}
try {
    $db->exec("ALTER TABLE quotations MODIFY supplier_id INT NULL");
} catch (Exception $e) {}

$projectId = $_GET['project_id'] ?? null;
$type = $_GET['type'] ?? 'orders';

switch ($method) {
    case 'GET':
        try {
            if ($type === 'orders') {
                if ($id) {
                    $stmt = $db->prepare("
                        SELECT po.*, p.name as project_name, COALESCE(po.supplier_name, s.name) as supplier_name,
                               u1.name as created_by_name, u2.name as approved_by_name
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
                    
                    sendResponse(['success' => true, 'data' => $data]);
                } elseif ($projectId) {
                    $stmt = $db->prepare("
                        SELECT po.*, COALESCE(po.supplier_name, s.name) as supplier_name
                        FROM purchase_orders po
                        LEFT JOIN suppliers s ON po.supplier_id = s.id
                        WHERE po.project_id = ?
                        ORDER BY po.order_date DESC, po.id DESC
                    ");
                    $stmt->execute([$projectId]);
                    $data = $stmt->fetchAll();
                    sendResponse(['success' => true, 'data' => $data ?: []]);
                } else {
                    $stmt = $db->prepare("
                        SELECT po.*, p.name as project_name, COALESCE(po.supplier_name, s.name) as supplier_name
                        FROM purchase_orders po
                        LEFT JOIN projects p ON po.project_id = p.id
                        LEFT JOIN suppliers s ON po.supplier_id = s.id
                        ORDER BY po.order_date DESC, po.id DESC
                    ");
                    $stmt->execute();
                    $data = $stmt->fetchAll();
                    sendResponse(['success' => true, 'data' => $data ?: []]);
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
                    
                    sendResponse(['success' => true, 'data' => $data]);
                } elseif ($projectId) {
                    $stmt = $db->prepare("
                        SELECT pr.*, u.name as requested_by_name
                        FROM purchase_requests pr
                        LEFT JOIN users u ON pr.requested_by = u.id
                        WHERE pr.project_id = ?
                        ORDER BY pr.request_date DESC, pr.id DESC
                    ");
                    $stmt->execute([$projectId]);
                    $data = $stmt->fetchAll();
                    sendResponse(['success' => true, 'data' => $data ?: []]);
                } else {
                    $stmt = $db->prepare("SELECT pr.*, p.name as project_name FROM purchase_requests pr LEFT JOIN projects p ON pr.project_id = p.id ORDER BY pr.request_date DESC");
                    $stmt->execute();
                    $data = $stmt->fetchAll();
                    sendResponse(['success' => true, 'data' => $data ?: []]);
                }
            } elseif ($type === 'quotations') {
                if ($id) {
                    $stmt = $db->prepare("
                        SELECT q.*, p.name as project_name, COALESCE(q.supplier_name, s.name) as supplier_name
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
                    
                    sendResponse(['success' => true, 'data' => $data]);
                } elseif ($projectId) {
                    $stmt = $db->prepare("
                        SELECT q.*, COALESCE(q.supplier_name, s.name) as supplier_name
                        FROM quotations q
                        LEFT JOIN suppliers s ON q.supplier_id = s.id
                        WHERE q.project_id = ?
                        ORDER BY q.quotation_date DESC, q.id DESC
                    ");
                    $stmt->execute([$projectId]);
                    $data = $stmt->fetchAll();
                    sendResponse(['success' => true, 'data' => $data ?: []]);
                } else {
                    $stmt = $db->prepare("SELECT q.*, p.name as project_name FROM quotations q LEFT JOIN projects p ON q.project_id = p.id ORDER BY q.quotation_date DESC");
                    $stmt->execute();
                    $data = $stmt->fetchAll();
                    sendResponse(['success' => true, 'data' => $data ?: []]);
                }
            } else {
                sendResponse(['success' => true, 'data' => []]);
            }
        } catch (Exception $e) {
            sendError('Failed to fetch purchases: ' . $e->getMessage(), 500);
        }
        break;

    case 'POST':
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $type = $input['type'] ?? ($_GET['type'] ?? 'orders');
            
            if ($type === 'orders') {
                if (empty($input['project_id'])) {
                    sendError('Project ID is required');
                }
                
                $orderDate = !empty($input['order_date']) ? $input['order_date'] : (!empty($input['purchase_date']) ? $input['purchase_date'] : date('Y-m-d'));
                $orderCode = !empty($input['purchase_code']) ? sanitize($input['purchase_code']) : (!empty($input['order_code']) ? sanitize($input['order_code']) : ('PO-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT)));
                
                $subtotal = isset($input['subtotal']) ? (float)$input['subtotal'] : 0;
                $vat = isset($input['vat']) ? (float)$input['vat'] : 0;
                $discount = isset($input['discount']) ? (float)$input['discount'] : 0;
                $total = isset($input['total_amount']) ? (float)$input['total_amount'] : ($subtotal + $vat - $discount);
                if ($total <= 0 && $subtotal > 0) $total = $subtotal;
                
                $supplierId = !empty($input['supplier_id']) ? (int)$input['supplier_id'] : null;
                $supplierName = $input['supplier_name'] ?? null;
                $itemDesc = $input['item_description'] ?? null;
                
                $stmt = $db->prepare("
                    INSERT INTO purchase_orders (order_code, project_id, supplier_id, supplier_name, item_description,
                        order_date, expected_delivery_date, subtotal, vat, discount, total_amount, status, payment_terms, delivery_address, notes, created_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                $result = $stmt->execute([
                    $orderCode,
                    $input['project_id'],
                    $supplierId,
                    $supplierName,
                    $itemDesc,
                    $orderDate,
                    $input['expected_delivery_date'] ?? null,
                    $subtotal,
                    $vat,
                    $discount,
                    $total,
                    $input['status'] ?? 'pending',
                    $input['payment_terms'] ?? null,
                    $input['delivery_address'] ?? null,
                    $input['notes'] ?? null,
                    $user['id'] ?? null
                ]);
                
                if ($result) {
                    $orderId = $db->lastInsertId();
                    
                    if (!empty($input['items']) && is_array($input['items'])) {
                        foreach ($input['items'] as $item) {
                            $qty = (float)($item['quantity'] ?? 1);
                            $price = (float)($item['unit_price'] ?? 0);
                            $itemTotal = (float)($item['total'] ?? ($qty * $price));
                            $itemStmt = $db->prepare("
                                INSERT INTO purchase_order_items (purchase_order_id, material_id, description, quantity, unit, unit_price, total)
                                VALUES (?, ?, ?, ?, ?, ?, ?)
                            ");
                            $itemStmt->execute([
                                $orderId,
                                $item['material_id'] ?? null,
                                $item['description'] ?? 'Item',
                                $qty,
                                $item['unit'] ?? 'piece',
                                $price,
                                $itemTotal
                            ]);
                        }
                    }
                    
                    sendResponse(['success' => true, 'message' => 'Purchase order created successfully', 'id' => $orderId, 'order_code' => $orderCode], 201);
                } else {
                    sendError('Failed to create purchase order');
                }
            } elseif ($type === 'requests') {
                if (empty($input['project_id'])) {
                    sendError('Project ID is required');
                }
                
                $requestCode = !empty($input['request_code']) ? sanitize($input['request_code']) : ('PR-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT));
                $reqDate = !empty($input['request_date']) ? $input['request_date'] : date('Y-m-d');
                $estAmount = isset($input['estimated_amount']) ? (float)$input['estimated_amount'] : (isset($input['total_amount']) ? (float)$input['total_amount'] : 0);
                
                $stmt = $db->prepare("
                    INSERT INTO purchase_requests (request_code, project_id, item_description, estimated_amount, request_date, required_date, status, priority, reason, notes, requested_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                $result = $stmt->execute([
                    $requestCode,
                    $input['project_id'],
                    $input['item_description'] ?? null,
                    $estAmount,
                    $reqDate,
                    $input['required_date'] ?? null,
                    $input['status'] ?? 'pending',
                    $input['priority'] ?? 'medium',
                    $input['reason'] ?? null,
                    $input['notes'] ?? null,
                    $user['id'] ?? null
                ]);
                
                if ($result) {
                    $requestId = $db->lastInsertId();
                    sendResponse(['success' => true, 'message' => 'Purchase request created successfully', 'id' => $requestId, 'request_code' => $requestCode], 201);
                } else {
                    sendError('Failed to create purchase request');
                }
            } elseif ($type === 'quotations') {
                if (empty($input['project_id'])) {
                    sendError('Project ID is required');
                }
                
                $quotationCode = !empty($input['quotation_code']) ? sanitize($input['quotation_code']) : ('QT-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT));
                $qDate = !empty($input['quotation_date']) ? $input['quotation_date'] : date('Y-m-d');
                $total = isset($input['total_amount']) ? (float)$input['total_amount'] : 0;
                $supplierId = !empty($input['supplier_id']) ? (int)$input['supplier_id'] : null;
                $supplierName = $input['supplier_name'] ?? null;
                
                $stmt = $db->prepare("
                    INSERT INTO quotations (quotation_code, project_id, supplier_id, supplier_name, item_description, quotation_date, valid_until, total_amount, status, payment_terms, delivery_terms, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                $result = $stmt->execute([
                    $quotationCode,
                    $input['project_id'],
                    $supplierId,
                    $supplierName,
                    $input['item_description'] ?? null,
                    $qDate,
                    $input['valid_until'] ?? null,
                    $total,
                    $input['status'] ?? 'received',
                    $input['payment_terms'] ?? null,
                    $input['delivery_terms'] ?? null,
                    $input['notes'] ?? null
                ]);
                
                if ($result) {
                    $quotationId = $db->lastInsertId();
                    sendResponse(['success' => true, 'message' => 'Quotation created successfully', 'id' => $quotationId, 'quotation_code' => $quotationCode], 201);
                } else {
                    sendError('Failed to create quotation');
                }
            }
        } catch (Exception $e) {
            sendError('Failed to save purchase: ' . $e->getMessage(), 500);
        }
        break;

    case 'PUT':
        try {
            if (!$id) sendError('ID required');
            
            $input = json_decode(file_get_contents('php://input'), true);
            $type = $input['type'] ?? ($_GET['type'] ?? 'orders');
            
            if ($type === 'orders') {
                $fields = [];
                $params = [];
                
                $allowedFields = ['supplier_id', 'supplier_name', 'item_description', 'order_date', 'purchase_date', 
                                 'expected_delivery_date', 'actual_delivery_date', 'total_amount', 'status', 'payment_terms', 'delivery_address', 'notes'];
                
                foreach ($allowedFields as $field) {
                    if (array_key_exists($field, $input)) {
                        $targetField = ($field === 'purchase_date') ? 'order_date' : $field;
                        $fields[] = "$targetField = ?";
                        $val = $input[$field];
                        if ($field === 'supplier_id' && empty($val)) $val = null;
                        $params[] = $val;
                    }
                }
                
                if (empty($fields)) sendError('No valid fields to update');
                
                $params[] = $id;
                $sql = "UPDATE purchase_orders SET " . implode(', ', $fields) . " WHERE id = ?";
                $stmt = $db->prepare($sql);
                $result = $stmt->execute($params);
                
                if ($result) {
                    sendResponse(['success' => true, 'message' => 'Purchase order updated successfully']);
                } else {
                    sendError('Failed to update purchase order');
                }
            } elseif ($type === 'requests') {
                $fields = [];
                $params = [];
                
                $allowedFields = ['item_description', 'estimated_amount', 'total_amount', 'request_date', 'required_date', 'status', 'priority', 'reason', 'notes'];
                
                foreach ($allowedFields as $field) {
                    if (array_key_exists($field, $input)) {
                        $targetField = ($field === 'total_amount') ? 'estimated_amount' : $field;
                        $fields[] = "$targetField = ?";
                        $params[] = $input[$field];
                    }
                }
                
                if (empty($fields)) sendError('No valid fields to update');
                
                $params[] = $id;
                $sql = "UPDATE purchase_requests SET " . implode(', ', $fields) . " WHERE id = ?";
                $stmt = $db->prepare($sql);
                $result = $stmt->execute($params);
                
                if ($result) {
                    sendResponse(['success' => true, 'message' => 'Purchase request updated successfully']);
                } else {
                    sendError('Failed to update purchase request');
                }
            } elseif ($type === 'quotations') {
                $fields = [];
                $params = [];
                
                $allowedFields = ['supplier_id', 'supplier_name', 'item_description', 'quotation_date', 'valid_until', 'total_amount', 'status', 'payment_terms', 'delivery_terms', 'notes'];
                
                foreach ($allowedFields as $field) {
                    if (array_key_exists($field, $input)) {
                        $fields[] = "$field = ?";
                        $val = $input[$field];
                        if ($field === 'supplier_id' && empty($val)) $val = null;
                        $params[] = $val;
                    }
                }
                
                if (empty($fields)) sendError('No valid fields to update');
                
                $params[] = $id;
                $sql = "UPDATE quotations SET " . implode(', ', $fields) . " WHERE id = ?";
                $stmt = $db->prepare($sql);
                $result = $stmt->execute($params);
                
                if ($result) {
                    sendResponse(['success' => true, 'message' => 'Quotation updated successfully']);
                } else {
                    sendError('Failed to update quotation');
                }
            }
        } catch (Exception $e) {
            sendError('Failed to update: ' . $e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        try {
            if (!$id) sendError('ID required');
            
            $type = $_GET['type'] ?? 'orders';
            
            if ($type === 'orders') {
                $stmt = $db->prepare("DELETE FROM purchase_orders WHERE id = ?");
            } elseif ($type === 'requests') {
                $stmt = $db->prepare("DELETE FROM purchase_requests WHERE id = ?");
            } elseif ($type === 'quotations') {
                $stmt = $db->prepare("DELETE FROM quotations WHERE id = ?");
            } else {
                $stmt = $db->prepare("DELETE FROM purchase_orders WHERE id = ?");
            }
            
            $result = $stmt->execute([$id]);
            
            if ($result) {
                sendResponse(['success' => true, 'message' => 'Deleted successfully']);
            } else {
                sendError('Failed to delete');
            }
        } catch (Exception $e) {
            sendError('Failed to delete: ' . $e->getMessage(), 500);
        }
        break;

    default:
        sendError('Method not allowed', 405);
}
