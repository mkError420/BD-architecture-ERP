<?php
// Test database connection
require_once 'config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    echo "Database connection successful!\n";
    
    // Test a simple query
    $result = $db->query("SELECT COUNT(*) as count FROM users");
    $count = $result->fetch();
   echo "Users in database: " . $count['count'] . "\n";
    
    // Test dashboard queries
    $stats = [];
    $stats['total_projects'] = $db->query("SELECT COUNT(*) FROM projects")->fetchColumn();
    $stats['total_clients'] = $db->query("SELECT COUNT(*) FROM clients WHERE is_active=1")->fetchColumn();
    $stats['total_employees'] = $db->query("SELECT COUNT(*) FROM employees WHERE is_active=1")->fetchColumn();
    
    echo "Dashboard stats:\n";
    echo "  Total projects: " . $stats['total_projects'] . "\n";
    echo "  Total clients: " . $stats['total_clients'] . "\n";
    echo "  Total employees: " . $stats['total_employees'] . "\n";
    
} catch (Exception $e) {
    echo "Database connection failed: " . $e->getMessage() . "\n";
}
