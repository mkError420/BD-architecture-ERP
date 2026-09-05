<?php
$user = getOptionalAuth();
$db = Database::getInstance()->getConnection();

switch ($method) {
    case 'GET':
        $project = $_GET['project_id'] ?? '';
        $type = $_GET['doc_type'] ?? '';
        $where = "WHERE d.is_active = 1"; $params = [];
        if ($project) { $where .= " AND d.project_id = ?"; $params[] = $project; }
        if ($type) { $where .= " AND d.doc_type = ?"; $params[] = $type; }
        $stmt = $db->prepare(
            "SELECT d.*, p.name as project_name, u.name as uploaded_by_name
             FROM documents d
             LEFT JOIN projects p ON d.project_id = p.id
             LEFT JOIN users u ON d.uploaded_by = u.id
             $where ORDER BY d.created_at DESC"
        );
        $stmt->execute($params);
        sendSuccess($stmt->fetchAll());
        break;

    case 'POST':
        if (!isset($_FILES['file'])) sendError('No file uploaded');
        $file = $_FILES['file'];
        $maxSize = (int)($_ENV['MAX_FILE_SIZE'] ?? 10485760);
        if ($file['size'] > $maxSize) sendError('File too large (max 10MB)');

        $allowed = ['pdf','doc','docx','xls','xlsx','jpg','jpeg','png','gif','dwg','dxf','zip','rar'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, $allowed)) sendError('File type not allowed');

        $uploadDir = __DIR__ . '/../../uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
        $fileName = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $file['name']);
        $filePath = $uploadDir . $fileName;

        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            sendError('Failed to upload file', 500);
        }

        $db->prepare(
            "INSERT INTO documents (project_id, title, doc_type, file_name, file_path, file_size, file_type, description, uploaded_by)
             VALUES (?,?,?,?,?,?,?,?,?)"
        )->execute([
            $_POST['project_id'] ?? null,
            $_POST['title'] ?? $file['name'],
            $_POST['doc_type'] ?? 'other',
            $fileName, 'uploads/' . $fileName,
            $file['size'], $file['type'],
            $_POST['description'] ?? null, $user['id'] ?? null
        ]);
        sendSuccess(['id' => $db->lastInsertId()], 'Document uploaded', 201);
        break;

    case 'DELETE':
        if (!$id) sendError('Document ID required');
        $doc = $db->prepare("SELECT file_path FROM documents WHERE id = ?");
        $doc->execute([$id]);
        $d = $doc->fetch();
        if ($d) {
            $path = __DIR__ . '/../../' . $d['file_path'];
            if (file_exists($path)) unlink($path);
        }
        $db->prepare("DELETE FROM documents WHERE id = ?")->execute([$id]);
        sendSuccess(null, 'Document deleted');
        break;

    default:
        sendError('Method not allowed', 405);
}
