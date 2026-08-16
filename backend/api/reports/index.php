<?php
$user = requireAuth();
$db = Database::getInstance()->getConnection();

$reportType = $_GET['type'] ?? 'project_summary';

switch ($reportType) {
    case 'project_summary':
        $stmt = $db->query(
            "SELECT p.*, c.name as client_name,
                    (SELECT COALESCE(SUM(amount),0) FROM expenses WHERE project_id=p.id AND is_approved=1) as total_spent,
                    (SELECT COALESCE(SUM(total),0) FROM invoices WHERE project_id=p.id AND status!='cancelled') as total_invoiced,
                    (SELECT COALESCE(SUM(paid_amount),0) FROM invoices WHERE project_id=p.id) as total_received,
                    (SELECT COUNT(*) FROM work_orders WHERE project_id=p.id AND status='completed') as completed_tasks,
                    (SELECT COUNT(*) FROM work_orders WHERE project_id=p.id) as total_tasks
             FROM projects p LEFT JOIN clients c ON p.client_id = c.id
             ORDER BY p.created_at DESC"
        );
        sendSuccess($stmt->fetchAll());
        break;

    case 'financial':
        $projectId = $_GET['project_id'] ?? '';
        $from = $_GET['from_date'] ?? date('Y-01-01');
        $to = $_GET['to_date'] ?? date('Y-12-31');

        $where = "WHERE expense_date BETWEEN ? AND ?"; $params = [$from, $to];
        if ($projectId) { $where .= " AND project_id = ?"; $params[] = $projectId; }

        $expenses = $db->prepare(
            "SELECT category, SUM(amount) as total, COUNT(*) as count FROM expenses $where GROUP BY category ORDER BY total DESC"
        );
        $expenses->execute($params);

        $monthlyExpenses = $db->prepare(
            "SELECT DATE_FORMAT(expense_date,'%Y-%m') as month, SUM(amount) as total FROM expenses $where GROUP BY month ORDER BY month"
        );
        $monthlyExpenses->execute($params);

        $totalExpenses = $db->prepare("SELECT COALESCE(SUM(amount),0) FROM expenses $where");
        $totalExpenses->execute($params);

        sendSuccess([
            'by_category' => $expenses->fetchAll(),
            'monthly' => $monthlyExpenses->fetchAll(),
            'total' => $totalExpenses->fetchColumn(),
        ]);
        break;

    case 'attendance':
        $month = $_GET['month'] ?? date('Y-m');
        $projectId = $_GET['project_id'] ?? '';

        $where = "WHERE DATE_FORMAT(a.attendance_date,'%Y-%m') = ?"; $params = [$month];
        if ($projectId) { $where .= " AND a.project_id = ?"; $params[] = $projectId; }

        $stmt = $db->prepare(
            "SELECT e.id, e.name, e.employee_code, e.role,
                    COUNT(CASE WHEN a.status='present' THEN 1 END) as present_days,
                    COUNT(CASE WHEN a.status='absent' THEN 1 END) as absent_days,
                    COUNT(CASE WHEN a.status='half_day' THEN 1 END) as half_days,
                    SUM(a.overtime_hours) as total_overtime,
                    SUM(a.daily_wage) as total_wages
             FROM employees e
             LEFT JOIN attendance a ON e.id = a.employee_id AND DATE_FORMAT(a.attendance_date,'%Y-%m') = ?
             WHERE e.is_active = 1
             GROUP BY e.id ORDER BY e.name"
        );
        $stmt->execute([$month]);
        sendSuccess($stmt->fetchAll());
        break;

    case 'material_stock':
        $projectId = $_GET['project_id'] ?? '';
        $where = ""; $params = [];
        if ($projectId) { $where = "WHERE ms.project_id = ?"; $params[] = $projectId; }

        $stmt = $db->prepare(
            "SELECT m.name, m.category, m.unit,
                    COALESCE(SUM(ms.quantity),0) as total_purchased,
                    COALESCE(SUM(mu.quantity_used),0) as total_used,
                    (COALESCE(SUM(ms.quantity),0) - COALESCE(SUM(mu.quantity_used),0)) as remaining,
                    COALESCE(SUM(ms.total_price),0) as total_cost
             FROM materials m
             LEFT JOIN material_stocks ms ON m.id = ms.material_id
             LEFT JOIN material_usage mu ON m.id = mu.material_id
             $where
             GROUP BY m.id ORDER BY m.name"
        );
        $stmt->execute($params);
        sendSuccess($stmt->fetchAll());
        break;

    default:
        sendError('Invalid report type');
}
