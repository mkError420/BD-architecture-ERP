<?php
$user = getOptionalAuth();
$db = Database::getInstance()->getConnection();

try {
    $db->exec("CREATE TABLE IF NOT EXISTS project_schedule (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        task_name VARCHAR(200) NOT NULL,
        task_description TEXT,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        actual_start_date DATE,
        actual_end_date DATE,
        duration_days INT,
        progress INT DEFAULT 0,
        status ENUM('not_started','in_progress','completed','delayed','on_hold') DEFAULT 'not_started',
        priority ENUM('critical','high','medium','low') DEFAULT 'medium',
        dependencies VARCHAR(255),
        assigned_team VARCHAR(255),
        notes TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
    )");
} catch (Exception $e) {}

$projectId = $_GET['project_id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare("
                SELECT ps.*, p.name as project_name, u.name as created_by_name
                FROM project_schedule ps
                LEFT JOIN projects p ON ps.project_id = p.id
                LEFT JOIN users u ON ps.created_by = u.id
                WHERE ps.id = ?
            ");
            $stmt->execute([$id]);
            $data = $stmt->fetch();
            if (!$data) sendError('Task not found', 404);
            sendJson($data);
        } elseif ($projectId) {
            $stmt = $db->prepare("
                SELECT ps.* FROM project_schedule ps
                WHERE ps.project_id = ?
                ORDER BY ps.start_date ASC
            ");
            $stmt->execute([$projectId]);
            $data = $stmt->fetchAll();
            
            $completed = 0;
            $total = count($data);
            foreach ($data as $task) {
                if ($task['status'] === 'completed') $completed++;
            }
            
            sendJson([
                'data' => $data,
                'summary' => [
                    'total' => $total,
                    'completed' => $completed,
                    'in_progress' => count(array_filter($data, fn($t) => $t['status'] === 'in_progress')),
                    'delayed' => count(array_filter($data, fn($t) => $t['status'] === 'delayed')),
                    'overall_progress' => $total > 0 ? round(array_sum(array_column($data, 'progress')) / $total) : 0
                ]
            ]);
        } else {
            $page = intval($_GET['page'] ?? 1);
            $per_page = intval($_GET['per_page'] ?? 20);
            $offset = ($page - 1) * $per_page;
            
            $stmt = $db->prepare("
                SELECT ps.*, p.name as project_name
                FROM project_schedule ps
                LEFT JOIN projects p ON ps.project_id = p.id
                ORDER BY ps.start_date DESC
                LIMIT $per_page OFFSET $offset
            ");
            $stmt->execute();
            $data = $stmt->fetchAll();
            
            $countStmt = $db->prepare("SELECT COUNT(*) FROM project_schedule");
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
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (empty($input['project_id']) || empty($input['task_name']) || empty($input['start_date']) || empty($input['end_date'])) {
            sendError('Missing required fields: project_id, task_name, start_date, end_date');
        }
        
        $startDate = new DateTime($input['start_date']);
        $endDate = new DateTime($input['end_date']);
        $duration = $startDate->diff($endDate)->days;
        
        $stmt = $db->prepare("
            INSERT INTO project_schedule (project_id, task_name, task_description, start_date, end_date, duration_days, 
                progress, status, priority, dependencies, assigned_team, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $result = $stmt->execute([
            $input['project_id'],
            $input['task_name'],
            $input['task_description'] ?? null,
            $input['start_date'],
            $input['end_date'],
            $duration,
            $input['progress'] ?? 0,
            $input['status'] ?? 'not_started',
            $input['priority'] ?? 'medium',
            $input['dependencies'] ?? null,
            $input['assigned_team'] ?? null,
            $input['notes'] ?? null,
            $user['id'] ?? null
        ]);
        
        if ($result) {
            sendJson(['message' => 'Task created successfully', 'id' => $db->lastInsertId()], 201);
        } else {
            sendError('Failed to create task');
        }
        break;

    case 'PUT':
        if (!$id) sendError('Task ID required');
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        $allowedFields = ['task_name', 'task_description', 'start_date', 'end_date', 'actual_start_date', 
                         'actual_end_date', 'progress', 'status', 'priority', 'dependencies', 'assigned_team', 'notes'];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $input)) {
                $fields[] = "$field = ?";
                $params[] = $input[$field];
            }
        }
        
        if (array_key_exists('start_date', $input) && array_key_exists('end_date', $input)) {
            $startDate = new DateTime($input['start_date']);
            $endDate = new DateTime($input['end_date']);
            $duration = $startDate->diff($endDate)->days;
            $fields[] = "duration_days = ?";
            $params[] = $duration;
        }
        
        if (empty($fields)) sendError('No valid fields to update');
        
        $params[] = $id;
        $sql = "UPDATE project_schedule SET " . implode(', ', $fields) . " WHERE id = ?";
        
        $stmt = $db->prepare($sql);
        $result = $stmt->execute($params);
        
        if ($result) {
            sendJson(['message' => 'Task updated successfully']);
        } else {
            sendError('Failed to update task');
        }
        break;

    case 'DELETE':
        if (!$id) sendError('Task ID required');
        
        $stmt = $db->prepare("DELETE FROM project_schedule WHERE id = ?");
        $result = $stmt->execute([$id]);
        
        if ($result) {
            sendJson(['message' => 'Task deleted successfully']);
        } else {
            sendError('Failed to delete task');
        }
        break;

    default:
        sendError('Method not allowed', 405);
}
