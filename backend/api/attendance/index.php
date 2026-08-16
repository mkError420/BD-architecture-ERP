<?php
try {
    $user = requireAuth();
    $db = Database::getInstance()->getConnection();
} catch (Exception $e) {
    sendError('Database connection failed: ' . $e->getMessage(), 500);
}

switch ($method) {
    case 'GET':
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(100, max(10, (int)($_GET['per_page'] ?? 20)));
        $date = $_GET['date'] ?? date('Y-m-d');
        $project = $_GET['project_id'] ?? '';
        $employee = $_GET['employee_id'] ?? '';
        $month = $_GET['month'] ?? '';
        $offset = ($page - 1) * $perPage;

        $where = "WHERE 1=1";
        $params = [];
        if ($date && !$month) { $where .= " AND a.attendance_date = ?"; $params[] = $date; }
        if ($month) { $where .= " AND DATE_FORMAT(a.attendance_date,'%Y-%m') = ?"; $params[] = $month; }
        if ($project) { $where .= " AND a.project_id = ?"; $params[] = $project; }
        if ($employee) { $where .= " AND a.employee_id = ?"; $params[] = $employee; }

        $total = $db->prepare("SELECT COUNT(*) FROM attendance a $where");
        $total->execute($params);

        $stmt = $db->prepare(
            "SELECT a.*, e.name as employee_name, e.employee_code, e.role as employee_role,
                    p.name as project_name
             FROM attendance a
             LEFT JOIN employees e ON a.employee_id = e.id
             LEFT JOIN projects p ON a.project_id = p.id
             $where ORDER BY a.attendance_date DESC, e.name LIMIT $perPage OFFSET $offset"
        );
        $stmt->execute($params);
        sendPaginated($stmt->fetchAll(), $total->fetchColumn(), $page, $perPage);
        break;

    case 'POST':
        $body = getJsonBody();

        // Support batch attendance
        if (isset($body['records']) && is_array($body['records'])) {
            $count = 0;
            $stmt = $db->prepare(
                "INSERT INTO attendance (employee_id, project_id, attendance_date, check_in, check_out, status, overtime_hours, daily_wage, notes, recorded_by)
                 VALUES (?,?,?,?,?,?,?,?,?,?)
                 ON DUPLICATE KEY UPDATE check_in=VALUES(check_in), check_out=VALUES(check_out), status=VALUES(status),
                 overtime_hours=VALUES(overtime_hours), daily_wage=VALUES(daily_wage), notes=VALUES(notes)"
            );
            foreach ($body['records'] as $rec) {
                $stmt->execute([
                    $rec['employee_id'], $rec['project_id'] ?? null,
                    $rec['attendance_date'] ?? date('Y-m-d'),
                    $rec['check_in'] ?? null, $rec['check_out'] ?? null,
                    $rec['status'] ?? 'present', $rec['overtime_hours'] ?? 0,
                    $rec['daily_wage'] ?? 0, $rec['notes'] ?? null, $user['id']
                ]);
                $count++;
            }
            sendSuccess(['count' => $count], "$count attendance records saved", 201);
        } else {
            // Single record
            $empId = $body['employee_id'] ?? null;
            $date = $body['attendance_date'] ?? date('Y-m-d');
            if (!$empId) sendError('Employee ID required');

            $db->prepare(
                "INSERT INTO attendance (employee_id, project_id, attendance_date, check_in, check_out, status, overtime_hours, daily_wage, notes, recorded_by)
                 VALUES (?,?,?,?,?,?,?,?,?,?)
                 ON DUPLICATE KEY UPDATE check_in=VALUES(check_in), check_out=VALUES(check_out), status=VALUES(status),
                 overtime_hours=VALUES(overtime_hours), daily_wage=VALUES(daily_wage), notes=VALUES(notes)"
            )->execute([
                $empId, $body['project_id'] ?? null, $date,
                $body['check_in'] ?? null, $body['check_out'] ?? null,
                $body['status'] ?? 'present', $body['overtime_hours'] ?? 0,
                $body['daily_wage'] ?? 0, $body['notes'] ?? null, $user['id']
            ]);
            sendSuccess(null, 'Attendance recorded', 201);
        }
        break;

    case 'DELETE':
        if (!$id) sendError('Attendance ID required');
        requireRole($user, ['admin','project_manager']);
        $db->prepare("DELETE FROM attendance WHERE id = ?")->execute([$id]);
        sendSuccess(null, 'Attendance deleted');
        break;

    default:
        sendError('Method not allowed', 405);
}
