<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

try {
    $db = Database::getInstance()->getConnection();
    $results = [];
    $errors = [];

    // Test each query individually
    try {
        $results['total_projects'] = $db->query("SELECT COUNT(*) FROM projects")->fetchColumn();
    } catch (PDOException $e) {
        $errors[] = "total_projects: " . $e->getMessage();
    }

    try {
        $results['active_projects'] = $db->query("SELECT COUNT(*) FROM projects WHERE status='active'")->fetchColumn();
    } catch (PDOException $e) {
        $errors[] = "active_projects: " . $e->getMessage();
    }

    try {
        $results['completed_projects'] = $db->query("SELECT COUNT(*) FROM projects WHERE status='completed'")->fetchColumn();
    } catch (PDOException $e) {
        $errors[] = "completed_projects: " . $e->getMessage();
    }

    try {
        $results['total_clients'] = $db->query("SELECT COUNT(*) FROM clients WHERE is_active=1")->fetchColumn();
    } catch (PDOException $e) {
        $errors[] = "total_clients: " . $e->getMessage();
    }

    try {
        $results['total_employees'] = $db->query("SELECT COUNT(*) FROM employees WHERE is_active=1")->fetchColumn();
    } catch (PDOException $e) {
        $errors[] = "total_employees: " . $e->getMessage();
    }

    try {
        $results['total_budget'] = $db->query("SELECT COALESCE(SUM(total_budget),0) FROM projects WHERE status IN ('active','planning')")->fetchColumn();
    } catch (PDOException $e) {
        $errors[] = "total_budget: " . $e->getMessage();
    }

    try {
        $results['total_expenses'] = $db->query("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE is_approved=1")->fetchColumn();
    } catch (PDOException $e) {
        $errors[] = "total_expenses: " . $e->getMessage();
    }

    try {
        $results['total_invoiced'] = $db->query("SELECT COALESCE(SUM(total),0) FROM invoices WHERE status != 'cancelled'")->fetchColumn();
    } catch (PDOException $e) {
        $errors[] = "total_invoiced: " . $e->getMessage();
    }

    try {
        $results['total_received'] = $db->query("SELECT COALESCE(SUM(paid_amount),0) FROM invoices")->fetchColumn();
    } catch (PDOException $e) {
        $errors[] = "total_received: " . $e->getMessage();
    }

    try {
        $results['recent_projects'] = $db->query(
            "SELECT p.id, p.project_code, p.name, p.status, p.progress, p.start_date, p.end_date,
                    c.name as client_name
             FROM projects p
             LEFT JOIN clients c ON p.client_id = c.id
             ORDER BY p.created_at DESC LIMIT 5"
        )->fetchAll();
    } catch (PDOException $e) {
        $errors[] = "recent_projects: " . $e->getMessage();
    }

    try {
        $results['monthly_expenses'] = $db->query(
            "SELECT DATE_FORMAT(expense_date,'%Y-%m') as month,
                    SUM(amount) as total
             FROM expenses
             WHERE expense_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
             GROUP BY month ORDER BY month"
        )->fetchAll();
    } catch (PDOException $e) {
        $errors[] = "monthly_expenses: " . $e->getMessage();
    }

    try {
        $results['monthly_invoices'] = $db->query(
            "SELECT DATE_FORMAT(issue_date,'%Y-%m') as month,
                    SUM(total) as total, SUM(paid_amount) as paid
             FROM invoices
             WHERE issue_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
             GROUP BY month ORDER BY month"
        )->fetchAll();
    } catch (PDOException $e) {
        $errors[] = "monthly_invoices: " . $e->getMessage();
    }

    try {
        $results['project_status'] = $db->query(
            "SELECT status, COUNT(*) as count FROM projects GROUP BY status"
        )->fetchAll();
    } catch (PDOException $e) {
        $errors[] = "project_status: " . $e->getMessage();
    }

    try {
        $results['today_attendance'] = $db->query(
            "SELECT COUNT(*) FROM attendance WHERE attendance_date = CURDATE() AND status='present'"
        )->fetchColumn();
    } catch (PDOException $e) {
        $errors[] = "today_attendance: " . $e->getMessage();
    }

    try {
        $results['pending_work_orders'] = $db->query(
            "SELECT COUNT(*) FROM work_orders WHERE status IN ('pending','in_progress')"
        )->fetchColumn();
    } catch (PDOException $e) {
        $errors[] = "pending_work_orders: " . $e->getMessage();
    }

    echo json_encode([
        'success' => true,
        'results' => $results,
        'errors' => $errors,
        'has_errors' => count($errors) > 0
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}
