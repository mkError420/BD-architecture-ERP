<?php
try {
    // Temporarily disable auth for debugging
    // $user = requireAuth();
    $db = Database::getInstance()->getConnection();
} catch (Exception $e) {
    sendError('Database connection failed: ' . $e->getMessage(), 500);
}

// Function to dynamically ensure building columns exist without breaking live installations
function ensureBuildingColumns($db) {
    try {
        $stmt = $db->query("SHOW COLUMNS FROM projects LIKE 'building_type'");
        if (!$stmt->fetch()) {
            $db->exec("
                ALTER TABLE projects 
                ADD COLUMN building_type VARCHAR(100) DEFAULT 'Residential Apartment',
                ADD COLUMN stories_above_ground INT DEFAULT 1,
                ADD COLUMN basement_floors INT DEFAULT 0,
                ADD COLUMN total_units INT DEFAULT 0,
                ADD COLUMN gross_floor_area DECIMAL(14,2) DEFAULT 0,
                ADD COLUMN footprint_area DECIMAL(12,2) DEFAULT 0,
                ADD COLUMN far_value DECIMAL(6,2) DEFAULT 0,
                ADD COLUMN mgc_percentage DECIMAL(5,2) DEFAULT 0,
                ADD COLUMN structural_system VARCHAR(150) DEFAULT 'RCC Frame with Shear Wall',
                ADD COLUMN foundation_system VARCHAR(150) DEFAULT 'Cast-in-situ Bored Piles',
                ADD COLUMN parking_capacity INT DEFAULT 0,
                ADD COLUMN rajuk_approval_no VARCHAR(100) NULL,
                ADD COLUMN approval_date DATE NULL,
                ADD COLUMN soil_bearing_capacity VARCHAR(100) NULL,
                ADD COLUMN elevators_count INT DEFAULT 0,
                ADD COLUMN generator_capacity VARCHAR(100) NULL,
                ADD COLUMN fire_safety_status VARCHAR(100) DEFAULT 'Pending Inspection',
                ADD COLUMN setback_front VARCHAR(50) NULL,
                ADD COLUMN setback_rear VARCHAR(50) NULL,
                ADD COLUMN setback_left VARCHAR(50) NULL,
                ADD COLUMN setback_right VARCHAR(50) NULL,
                ADD COLUMN floor_details LONGTEXT NULL
            ");
        }
    } catch (Exception $e) {
        // Ignore column check errors on constrained hosting
    }
}

ensureBuildingColumns($db);

switch ($method) {
    case 'GET':
        if ($id) {
            // Single project with related summaries
            $stmt = $db->prepare(
                "SELECT p.*, c.name as client_name, c.phone as client_phone, c.email as client_email, c.company as client_company,
                        m.name as manager_name, m.phone as manager_phone, e.name as engineer_name, e.phone as engineer_phone
                 FROM projects p
                 LEFT JOIN clients c ON p.client_id = c.id
                 LEFT JOIN users m ON p.manager_id = m.id
                 LEFT JOIN users e ON p.engineer_id = e.id
                 WHERE p.id = ?"
            );
            $stmt->execute([$id]);
            $project = $stmt->fetch();
            if (!$project) sendError('Project not found', 404);

            // Fetch Work Orders for this project
            try {
                $woStmt = $db->prepare("SELECT wo.*, emp.name as assigned_name FROM work_orders wo LEFT JOIN employees emp ON wo.assigned_to = emp.id WHERE wo.project_id = ? ORDER BY wo.created_at DESC");
                $woStmt->execute([$id]);
                $project['work_orders'] = $woStmt->fetchAll();
            } catch (Exception $e) {
                $project['work_orders'] = [];
            }

            // Fetch Expenses summary for this project
            try {
                $expStmt = $db->prepare("SELECT id, expense_code, title, category, amount, expense_date, paid_to, payment_method, is_approved FROM expenses WHERE project_id = ? ORDER BY expense_date DESC LIMIT 50");
                $expStmt->execute([$id]);
                $project['expenses'] = $expStmt->fetchAll();
                
                $expTotalStmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses WHERE project_id = ?");
                $expTotalStmt->execute([$id]);
                $project['total_expenses'] = (float)$expTotalStmt->fetchColumn();
            } catch (Exception $e) {
                $project['expenses'] = [];
                $project['total_expenses'] = 0;
            }

            // Fetch Invoices summary for this project
            try {
                $invStmt = $db->prepare("SELECT id, invoice_no, issue_date, due_date, subtotal, total, paid_amount, status FROM invoices WHERE project_id = ? ORDER BY issue_date DESC");
                $invStmt->execute([$id]);
                $project['invoices'] = $invStmt->fetchAll();

                $invTotalStmt = $db->prepare("SELECT COALESCE(SUM(total), 0) as total_invoiced, COALESCE(SUM(paid_amount), 0) as total_collected FROM invoices WHERE project_id = ?");
                $invTotalStmt->execute([$id]);
                $invRow = $invTotalStmt->fetch();
                $project['total_invoiced'] = (float)($invRow['total_invoiced'] ?? 0);
                $project['total_collected'] = (float)($invRow['total_collected'] ?? 0);
            } catch (Exception $e) {
                $project['invoices'] = [];
                $project['total_invoiced'] = 0;
                $project['total_collected'] = 0;
            }

            // Fetch Material stock summary for this project
            try {
                $matStmt = $db->prepare("
                    SELECT ms.*, m.name as material_name, m.unit, m.category, s.name as supplier_name 
                    FROM material_stocks ms 
                    LEFT JOIN materials m ON ms.material_id = m.id 
                    LEFT JOIN suppliers s ON ms.supplier_id = s.id 
                    WHERE ms.project_id = ? 
                    ORDER BY ms.purchase_date DESC LIMIT 30
                ");
                $matStmt->execute([$id]);
                $project['material_stocks'] = $matStmt->fetchAll();
            } catch (Exception $e) {
                $project['material_stocks'] = [];
            }

            // Fetch Documents for this project
            try {
                $docStmt = $db->prepare("SELECT * FROM documents WHERE project_id = ? AND is_active = 1 ORDER BY created_at DESC");
                $docStmt->execute([$id]);
                $project['documents'] = $docStmt->fetchAll();
            } catch (Exception $e) {
                $project['documents'] = [];
            }

            // Fetch Assigned Team / Employees for this project
            try {
                $empStmt = $db->prepare("
                    SELECT pe.id as assignment_id, pe.role_in_project, pe.assigned_date, emp.id as employee_id, emp.name, emp.phone, emp.role, emp.department
                    FROM project_employees pe
                    JOIN employees emp ON pe.employee_id = emp.id
                    WHERE pe.project_id = ? AND pe.is_active = 1
                ");
                $empStmt->execute([$id]);
                $project['team'] = $empStmt->fetchAll();
            } catch (Exception $e) {
                $project['team'] = [];
            }

            sendSuccess($project);
        } else {
            // List with filters
            $page = max(1, (int)($_GET['page'] ?? 1));
            $perPage = min(50, max(10, (int)($_GET['per_page'] ?? 10)));
            $search = $_GET['search'] ?? '';
            $status = $_GET['status'] ?? '';
            $type = $_GET['project_type'] ?? '';
            $offset = ($page - 1) * $perPage;

            $where = "WHERE 1=1";
            $params = [];
            if ($search) { $where .= " AND (p.name LIKE ? OR p.project_code LIKE ? OR p.location LIKE ?)"; $params[] = "%$search%"; $params[] = "%$search%"; $params[] = "%$search%"; }
            if ($status) { $where .= " AND p.status = ?"; $params[] = $status; }
            if ($type) { $where .= " AND p.project_type = ?"; $params[] = $type; }

            $countStmt = $db->prepare("SELECT COUNT(*) FROM projects p $where");
            $countStmt->execute($params);
            $total = $countStmt->fetchColumn();

            $stmt = $db->prepare(
                "SELECT p.*, c.name as client_name,
                        (SELECT COUNT(*) FROM work_orders wo WHERE wo.project_id = p.id) as work_orders_count,
                        (SELECT COALESCE(SUM(amount), 0) FROM expenses exp WHERE exp.project_id = p.id) as spent_amount
                 FROM projects p
                 LEFT JOIN clients c ON p.client_id = c.id
                 $where ORDER BY p.created_at DESC LIMIT $perPage OFFSET $offset"
            );
            $stmt->execute($params);
            sendPaginated($stmt->fetchAll(), $total, $page, $perPage);
        }
        break;

    case 'POST':
        requireRole($user, ['admin','project_manager']);
        $body = getJsonBody();
        $name = sanitize($body['name'] ?? '');
        if (!$name) sendError('Project name is required');

        $floorDetails = is_array($body['floor_details'] ?? null) ? json_encode($body['floor_details']) : ($body['floor_details'] ?? null);

        // Generate temp code then update
        $db->prepare("INSERT INTO projects (project_code, name, created_by) VALUES ('TEMP', ?, ?)")->execute([$name, $user['id']]);
        $newId = $db->lastInsertId();
        $code = generateCode('PRJ', $newId);

        $allowedFields = [
            'name' => $name,
            'project_code' => $code,
            'description' => $body['description'] ?? null,
            'client_id' => !empty($body['client_id']) ? $body['client_id'] : null,
            'project_type' => $body['project_type'] ?? 'residential',
            'status' => $body['status'] ?? 'planning',
            'start_date' => !empty($body['start_date']) ? $body['start_date'] : null,
            'end_date' => !empty($body['end_date']) ? $body['end_date'] : null,
            'location' => $body['location'] ?? null,
            'district' => $body['district'] ?? null,
            'division' => $body['division'] ?? null,
            'total_area' => !empty($body['total_area']) ? $body['total_area'] : null,
            'area_unit' => $body['area_unit'] ?? 'sqft',
            'total_budget' => !empty($body['total_budget']) ? $body['total_budget'] : 0,
            'approved_budget' => !empty($body['approved_budget']) ? $body['approved_budget'] : 0,
            'manager_id' => !empty($body['manager_id']) ? $body['manager_id'] : null,
            'engineer_id' => !empty($body['engineer_id']) ? $body['engineer_id'] : null,
            'priority' => $body['priority'] ?? 'medium',
            'notes' => $body['notes'] ?? null,
            // Building specifics
            'building_type' => $body['building_type'] ?? 'Residential Apartment',
            'stories_above_ground' => isset($body['stories_above_ground']) ? (int)$body['stories_above_ground'] : 1,
            'basement_floors' => isset($body['basement_floors']) ? (int)$body['basement_floors'] : 0,
            'total_units' => isset($body['total_units']) ? (int)$body['total_units'] : 0,
            'gross_floor_area' => !empty($body['gross_floor_area']) ? $body['gross_floor_area'] : 0,
            'footprint_area' => !empty($body['footprint_area']) ? $body['footprint_area'] : 0,
            'far_value' => !empty($body['far_value']) ? $body['far_value'] : 0,
            'mgc_percentage' => !empty($body['mgc_percentage']) ? $body['mgc_percentage'] : 0,
            'structural_system' => $body['structural_system'] ?? 'RCC Frame with Shear Wall',
            'foundation_system' => $body['foundation_system'] ?? 'Cast-in-situ Bored Piles',
            'parking_capacity' => isset($body['parking_capacity']) ? (int)$body['parking_capacity'] : 0,
            'rajuk_approval_no' => $body['rajuk_approval_no'] ?? null,
            'approval_date' => !empty($body['approval_date']) ? $body['approval_date'] : null,
            'soil_bearing_capacity' => $body['soil_bearing_capacity'] ?? null,
            'elevators_count' => isset($body['elevators_count']) ? (int)$body['elevators_count'] : 0,
            'generator_capacity' => $body['generator_capacity'] ?? null,
            'fire_safety_status' => $body['fire_safety_status'] ?? 'Pending Inspection',
            'setback_front' => $body['setback_front'] ?? null,
            'setback_rear' => $body['setback_rear'] ?? null,
            'setback_left' => $body['setback_left'] ?? null,
            'setback_right' => $body['setback_right'] ?? null,
            'floor_details' => $floorDetails,
        ];

        $setCols = [];
        $vals = [];
        foreach ($allowedFields as $k => $v) {
            $setCols[] = "$k = ?";
            $vals[] = $v;
        }
        $vals[] = $newId;

        $db->prepare("UPDATE projects SET " . implode(', ', $setCols) . " WHERE id = ?")->execute($vals);

        sendSuccess(['id' => $newId, 'project_code' => $code], 'Project created successfully', 201);
        break;

    case 'PUT':
    case 'PATCH':
        if (!$id) sendError('Project ID is required');
        requireRole($user, ['admin','project_manager']);
        $body = getJsonBody();

        $fields = [];
        $params = [];
        $allowed = [
            'name','description','client_id','project_type','status','start_date','end_date',
            'actual_end_date','location','district','division','total_area','area_unit',
            'total_budget','approved_budget','manager_id','engineer_id','priority','progress','notes',
            // Building specifics
            'building_type','stories_above_ground','basement_floors','total_units','gross_floor_area',
            'footprint_area','far_value','mgc_percentage','structural_system','foundation_system',
            'parking_capacity','rajuk_approval_no','approval_date','soil_bearing_capacity',
            'elevators_count','generator_capacity','fire_safety_status',
            'setback_front','setback_rear','setback_left','setback_right','floor_details'
        ];

        foreach ($allowed as $f) {
            if (array_key_exists($f, $body)) {
                $fields[] = "$f = ?";
                $val = $body[$f];
                if ($f === 'floor_details' && is_array($val)) {
                    $val = json_encode($val);
                }
                $params[] = $val;
            }
        }
        if (empty($fields)) sendError('No fields to update');
        $params[] = $id;

        $db->prepare("UPDATE projects SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
        sendSuccess(null, 'Project updated successfully');
        break;

    case 'DELETE':
        if (!$id) sendError('Project ID is required');
        requireRole($user, ['admin']);
        $db->prepare("DELETE FROM projects WHERE id = ?")->execute([$id]);
        sendSuccess(null, 'Project deleted successfully');
        break;

    default:
        sendError('Method not allowed', 405);
}
