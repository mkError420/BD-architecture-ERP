<?php
$user = getOptionalAuth();
$db = Database::getInstance()->getConnection();

try {
    $db->exec("CREATE TABLE IF NOT EXISTS project_schedule (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_code VARCHAR(30),
        project_id INT NOT NULL,
        task_name VARCHAR(200) NOT NULL,
        task_description TEXT,
        category VARCHAR(100),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        actual_start_date DATE,
        actual_end_date DATE,
        duration_days INT DEFAULT 0,
        progress INT DEFAULT 0,
        status ENUM('not_started','in_progress','completed','delayed','on_hold','cancelled') DEFAULT 'not_started',
        priority ENUM('critical','high','medium','low') DEFAULT 'medium',
        dependencies VARCHAR(255),
        assigned_team VARCHAR(255),
        notes TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    )");
} catch (Exception $e) {}

try {
    $db->exec("ALTER TABLE project_schedule ADD COLUMN task_code VARCHAR(30) NULL AFTER id");
} catch (Exception $e) {}
try {
    $db->exec("ALTER TABLE project_schedule ADD COLUMN category VARCHAR(100) NULL AFTER task_description");
} catch (Exception $e) {}

$projectId = $_GET['project_id'] ?? null;

switch ($method) {
    case 'GET':
        try {
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
                sendResponse(['success' => true, 'data' => $data]);
            } elseif ($projectId) {
                $stmt = $db->prepare("
                    SELECT ps.* FROM project_schedule ps
                    WHERE ps.project_id = ?
                    ORDER BY ps.start_date ASC, ps.id ASC
                ");
                $stmt->execute([$projectId]);
                $data = $stmt->fetchAll();
                
                $completed = 0;
                $total = count($data);
                foreach ($data as $task) {
                    if ($task['status'] === 'completed') $completed++;
                }
                
                sendResponse([
                    'success' => true,
                    'data' => $data ?: [],
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
                $per_page = intval($_GET['per_page'] ?? 50);
                $offset = ($page - 1) * $per_page;
                
                $where = ["1=1"];
                $params = [];
                if (!empty($_GET['project_id'])) {
                    $where[] = "ps.project_id = ?";
                    $params[] = $_GET['project_id'];
                }
                $whereClause = implode(' AND ', $where);
                
                $stmt = $db->prepare("
                    SELECT ps.*, p.name as project_name
                    FROM project_schedule ps
                    LEFT JOIN projects p ON ps.project_id = p.id
                    WHERE $whereClause
                    ORDER BY ps.start_date DESC
                    LIMIT $per_page OFFSET $offset
                ");
                $stmt->execute($params);
                $data = $stmt->fetchAll();
                
                $countStmt = $db->prepare("SELECT COUNT(*) FROM project_schedule ps WHERE $whereClause");
                $countStmt->execute($params);
                $total = $countStmt->fetchColumn();
                
                sendResponse([
                    'success' => true,
                    'data' => $data ?: [],
                    'pagination' => [
                        'page' => $page,
                        'per_page' => $per_page,
                        'total' => (int)$total,
                        'total_pages' => ceil($total / $per_page)
                    ]
                ]);
            }
        } catch (Exception $e) {
            sendError('Failed to fetch schedule: ' . $e->getMessage(), 500);
        }
        break;

    case 'POST':
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (empty($input['project_id']) || empty($input['task_name']) || empty($input['start_date'])) {
                sendError('Missing required fields: project_id, task_name, start_date');
            }
            
            $startDateStr = $input['start_date'];
            $endDateStr = !empty($input['end_date']) ? $input['end_date'] : $startDateStr;
            
            $startDate = new DateTime($startDateStr);
            $endDate = new DateTime($endDateStr);
            $duration = max(1, $startDate->diff($endDate)->days + 1);
            
            $taskCode = !empty($input['task_code']) ? sanitize($input['task_code']) : ('SCH-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT));
            
            $stmt = $db->prepare("
                INSERT INTO project_schedule (task_code, project_id, task_name, task_description, category, start_date, end_date, duration_days, 
                    progress, status, priority, dependencies, assigned_team, notes, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $taskCode,
                $input['project_id'],
                $input['task_name'],
                $input['task_description'] ?? null,
                $input['category'] ?? null,
                $startDateStr,
                $endDateStr,
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
                sendResponse(['success' => true, 'message' => 'Task created successfully', 'id' => $db->lastInsertId(), 'task_code' => $taskCode], 201);
            } else {
                sendError('Failed to create task');
            }
        } catch (Exception $e) {
            sendError('Failed to create task: ' . $e->getMessage(), 500);
        }
        break;

    case 'PUT':
        try {
            if (!$id) sendError('Task ID required');
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            $fields = [];
            $params = [];
            
            $allowedFields = ['task_code', 'task_name', 'task_description', 'category', 'start_date', 'end_date', 'actual_start_date', 
                             'actual_end_date', 'progress', 'status', 'priority', 'dependencies', 'assigned_team', 'notes'];
            
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $input)) {
                    $fields[] = "$field = ?";
                    $params[] = $input[$field];
                }
            }
            
            if (!empty($input['start_date']) && !empty($input['end_date'])) {
                $startDate = new DateTime($input['start_date']);
                $endDate = new DateTime($input['end_date']);
                $duration = max(1, $startDate->diff($endDate)->days + 1);
                $fields[] = "duration_days = ?";
                $params[] = $duration;
            }
            
            if (empty($fields)) sendError('No valid fields to update');
            
            $params[] = $id;
            $sql = "UPDATE project_schedule SET " . implode(', ', $fields) . " WHERE id = ?";
            
            $stmt = $db->prepare($sql);
            $result = $stmt->execute($params);
            
            if ($result) {
                sendResponse(['success' => true, 'message' => 'Task updated successfully']);
            } else {
                sendError('Failed to update task');
            }
        } catch (Exception $e) {
            sendError('Failed to update task: ' . $e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        try {
            if (!$id) sendError('Task ID required');
            
            $stmt = $db->prepare("DELETE FROM project_schedule WHERE id = ?");
            $result = $stmt->execute([$id]);
            
            if ($result) {
                sendResponse(['success' => true, 'message' => 'Task deleted successfully']);
            } else {
                sendError('Failed to delete task');
            }
        } catch (Exception $e) {
            sendError('Failed to delete task: ' . $e->getMessage(), 500);
        }
        break;

    default:
        sendError('Method not allowed', 405);
}
