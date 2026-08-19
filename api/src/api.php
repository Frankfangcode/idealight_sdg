<?php
/**
 * JSON API 共用啟動碼。
 *
 * 這裡用 __DIR__ 定位 require，不像既有的 api/public/*.php 用 '../src/db.php'
 * ——後者是相對於執行時的工作目錄，換 document root 或用不同的 SAPI 就會找不到檔案。
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/scenario_repo.php';

/** 統一回應格式並結束請求。 */
function ck_json($data, int $status = 200): void
{
    if (!headers_sent()) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function ck_fail(string $message, int $status = 400): void
{
    ck_json(['success' => false, 'message' => $message], $status);
}

/** 讀取 JSON 請求本體。 */
function ck_input(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '[]', true);
    return is_array($data) ? $data : [];
}

function ck_require_post(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        ck_fail('僅接受 POST', 405);
    }
}

/** 驗證關卡編號落在實際存在的範圍內。 */
function ck_valid_level(int $levelNo): int
{
    if ($levelNo < 1 || $levelNo > ck_level_count()) {
        ck_fail("關卡編號不存在：{$levelNo}");
    }
    return $levelNo;
}

/**
 * 受試者只能操作自己目前所在的關卡。
 * 少了這道檢查，前端改個數字就能跳關，或回頭覆寫已經送出的作答。
 */
function ck_require_current_level(string $stuId, int $levelNo): void
{
    $stmt = db()->prepare('SELECT level_no FROM ck_progress WHERE stu_id = ?');
    $stmt->execute([$stuId]);
    $current = (int)($stmt->fetchColumn() ?: 1);
    if ($levelNo !== $current) {
        ck_fail("目前在關卡 {$current}，不能操作關卡 {$levelNo}", 409);
    }
}

/** 未捕捉的例外一律轉成 JSON，不要把堆疊噴到受試者畫面上。 */
set_exception_handler(function (Throwable $e) {
    error_log('[ck_api] ' . $e->getMessage());
    ck_json(['success' => false, 'message' => '伺服器錯誤'], 500);
});
