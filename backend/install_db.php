<?php
/**
 * Database Auto-Installer for Live Server (InfinityFree / cPanel / Shared Hosting)
 * Upload this file alongside schema.sql to your hosting and visit it in browser to install.
 */
header('Content-Type: text/html; charset=utf-8');

$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            [$key, $val] = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($val);
        }
    }
}

$host = $_ENV['DB_HOST'] ?? 'localhost';
$port = $_ENV['DB_PORT'] ?? '3306';
$dbname = $_ENV['DB_NAME'] ?? 'construction_db';
$user = $_ENV['DB_USER'] ?? 'root';
$pass = $_ENV['DB_PASS'] ?? '';

echo "<h2>🏗️ Construction Management System — Database Installer</h2>";
echo "<p>Connecting to MySQL database <strong>$dbname</strong> on host <strong>$host</strong>...</p>";

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $user, $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
    echo "<p style='color:green;'>✅ Connected to database successfully!</p>";

    $schemaFile = __DIR__ . '/database/schema.sql';
    if (!file_exists($schemaFile)) {
        die("<p style='color:red;'>❌ schema.sql file not found in database/ directory.</p>");
    }

    $sql = file_get_contents($schemaFile);

    // Split SQL by statements
    $pdo->exec($sql);

    echo "<p style='color:green; font-weight:bold;'>🎉 All 14 tables and default settings have been created successfully!</p>";
    echo "<h3>Default Admin Credentials:</h3>";
    echo "<ul>";
    echo "<li><strong>Email:</strong> admin@construction.com</li>";
    echo "<li><strong>Password:</strong> password</li>";
    echo "<li><strong>Role:</strong> Administrator</li>";
    echo "</ul>";
    echo "<p style='color:orange;'>⚠️ For security, please delete this <code>install_db.php</code> file after setup.</p>";

} catch (PDOException $e) {
    echo "<p style='color:red;'>❌ Database Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}
