<?php
/**
 * 前測／後測問卷。問卷本身在 SurveyCake，這裡負責兩件事：
 *
 *   1. 給前端問卷網址，並把 stu_id 掛成 query string。
 *      SurveyCake 可用隱藏題帶入網址參數，事後匯出的問卷資料才能以學號
 *      跟本系統的作答對接——否則兩邊資料無法合併。
 *   2. 記錄開啟與完成的時間點（受試者按下「我已完成問卷」時回報）。
 *
 * 網址放在 .env：SURVEYCAKE_PRE_URL / SURVEYCAKE_POST_URL。
 * 未設定時回傳 configured=false，前端顯示待設定而不是壞掉的連結。
 */

require_once __DIR__ . '/../src/api.php';
require_once __DIR__ . '/../src/config.php';

$stuId = ck_require_stu_id();
ck_run($stuId);

$in   = ck_input();
$kind = (string)($in['kind'] ?? $_GET['kind'] ?? '');
if ($kind !== 'pre' && $kind !== 'post') {
    ck_fail('kind 必須是 pre 或 post');
}

$pdo = db();

// ---- 回報完成 ----
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && ($in['action'] ?? '') === 'complete') {
    $pdo->prepare(
        'INSERT INTO ck_surveys (stu_id, kind, completed_at) VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE completed_at = NOW()'
    )->execute([$stuId, $kind]);

    ck_log($stuId, null, 'survey', 'complete', ['kind' => $kind]);
    ck_json(['success' => true, 'kind' => $kind, 'completed' => true]);
}

// ---- 取得網址（並記開啟時間）----
$base = ck_env($kind === 'pre' ? 'SURVEYCAKE_PRE_URL' : 'SURVEYCAKE_POST_URL');

$pdo->prepare(
    'INSERT INTO ck_surveys (stu_id, kind, opened_at) VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE opened_at = COALESCE(opened_at, NOW())'
)->execute([$stuId, $kind]);

$stmt = $pdo->prepare('SELECT opened_at, completed_at FROM ck_surveys WHERE stu_id = ? AND kind = ?');
$stmt->execute([$stuId, $kind]);
$row = $stmt->fetch() ?: [];

if (!$base) {
    ck_json([
        'success'    => true,
        'kind'       => $kind,
        'configured' => false,
        'message'    => '尚未設定問卷網址（.env 的 SURVEYCAKE_' . strtoupper($kind) . '_URL）',
        'completed'  => !empty($row['completed_at']),
    ]);
}

$url = $base . (str_contains($base, '?') ? '&' : '?') . http_build_query(['stu_id' => $stuId]);

ck_log($stuId, null, 'survey', 'open', ['kind' => $kind]);

ck_json([
    'success'    => true,
    'kind'       => $kind,
    'configured' => true,
    'url'        => $url,
    'completed'  => !empty($row['completed_at']),
]);
