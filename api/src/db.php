<?php
// /api/src/db.php
//
// 連線設定一律走環境變數或專案根目錄的 .env（見 config.php 的 ck_env()），
// 不寫死在程式碼裡——本機、XAMPP、雲端各自用自己的 .env，程式碼不用改。
//
//   DB_HOST=127.0.0.1
//   DB_NAME=idealightsdg
//   DB_USER=root
//   DB_PASS=...
//
// 預設值對齊 XAMPP 出廠設定（root、空密碼）；密碼不提供預設，
// 有設密碼的環境忘了填 .env 時會連線失敗而不是靜默用錯帳號。

require_once __DIR__ . '/config.php';

function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host     = ck_env('DB_HOST', '127.0.0.1');
    $dbname   = ck_env('DB_NAME', 'idealightsdg');
    $username = ck_env('DB_USER', 'root');
    $password = ck_env('DB_PASS', '');
    $charset  = 'utf8mb4';

    $dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

    try {
        $pdo = new PDO($dsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $e) {
        // 不把原始訊息往外拋——PDO 例外可能含主機、帳號等連線細節
        error_log('[db] connection failed: ' . $e->getMessage());
        throw new Exception('DB connection failed');
    }

    return $pdo;
}
