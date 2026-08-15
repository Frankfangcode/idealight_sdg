<?php



function db() {

 static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = 'YOUR_HOST';
    $dbname = 'YOUR_DATABASE';
    $username = 'YOUR_USERNAME';
    $password = 'YOUR_PASSWORD';
    $charset = 'utf8mb4';


    $dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

     try {
        $pdo = new PDO($dsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $e) {
        throw new Exception('DB connection failed: ' . $e->getMessage());
    }

    return $pdo;
}