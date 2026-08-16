<?php
try {
    $user = requireAuth();
    $db = Database::getInstance()->getConnection();
} catch (Exception $e) {
    sendError('Database connection failed: ' . $e->getMessage(), 500);
}

if ($method === 'GET') {
    // Dashboard stats
    $stats = [];

    // Total projects
    $stats['total_projects'] = $db->query("SELECT COUNT(*) FROM projects")->fetchColumn();
    $stats['active_projects'] = $db->query("SELECT COUNT(*) FROM projects WHERE status='active'")->fetchColumn();
    $stats['completed_projects'] = $db->query("SELECT COUNT(*) FROM projects WHERE status='completed'")->fetchColumn();
    $stats['total_clients'] = $db->query("SELECT COUNT(*) FROM clients WHERE is_active=1")->fetchColumn();
    $stats['total_employees'] = $db->query("SELECT COUNT(*) FROM employees WHERE is_active=1")->fetchColumn();

    // Financial
    $stats['total_budget'] = $db->query("SELECT COALESCE(SUM(total_budget),0) FROM projects WHERE status IN ('active','planning')")->fetchColumn();
    $stats['total_expenses'] = $db->query("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE is_approved=1")->fetchColumn();
    $stats['total_invoiced'] = $db->query("SELECT COALESCE(SUM(total),0) FROM invoices WHERE status != 'cancelled'")->fetchColumn();
    $stats['total_received'] = $db->query("SELECT COALESCE(SUM(paid_amount),0) FROM invoices")->fetchColumn();

    // Recent projects
    $recentProjects = $db->query(
        "SELECT p.id, p.project_code, p.name, p.status, p.progress, p.start_date, p.end_date,
                c.name as client_name
         FROM projects p
         LEFT JOIN clients c ON p.client_id = c.id
         ORDER BY p.created_at DESC LIMIT 5"
    )->fetchAll();

    // Monthly expenses (last 6 months)
    $monthlyExpenses = $db->query(
        "SELECT DATE_FORMAT(expense_date,'%Y-%m') as month,
                SUM(amount) as total
         FROM expenses
         WHERE expense_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
         GROUP BY month ORDER BY month"
    )->fetchAll();

    // Monthly invoices
    $monthlyInvoices = $db->query(
        "SELECT DATE_FORMAT(issue_date,'%Y-%m') as month,
                SUM(total) as total, SUM(paid_amount) as paid
         FROM invoices
         WHERE issue_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
         GROUP BY month ORDER BY month"
    )->fetchAll();

    // Project status distribution
    $projectStatus = $db->query(
        "SELECT status, COUNT(*) as count FROM projects GROUP BY status"
    )->fetchAll();

    // Today attendance
    $todayAttendance = $db->query(
        "SELECT COUNT(*) FROM attendance WHERE attendance_date = CURDATE() AND status='present'"
    )->fetchColumn();

    // Pending work orders
    $pendingWorkOrders = $db->query(
        "SELECT COUNT(*) FROM work_orders WHERE status IN ('pending','in_progress')"
    )->fetchColumn();

    sendSuccess([
        'stats' => $stats,
        'recent_projects' => $recentProjects,
        'monthly_expenses' => $monthlyExpenses,
        'monthly_invoices' => $monthlyInvoices,
        'project_status' => $projectStatus,
        'today_attendance' => $todayAttendance,
        'pending_work_orders' => $pendingWorkOrders,
    ]);
} else {
    sendError('Method not allowed', 405);
}
