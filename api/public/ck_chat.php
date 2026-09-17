<?php
/**
 * 訊問：對某個角色自由打字提問，AI 角色以串流方式回答。
 *
 * 六位角色都可以問、不限次數，唯一的限制是時間 —— 所以時間必須在後端擋：
 * 依 ck_phase_timers 的起算時間，逾時的提問直接拒收，不靠前端倒數自律。
 * 等 AI 回覆的時間不暫停計時（會議決議）；期限前送出的問題會讓它答完。
 *
 * 回應格式是 NDJSON（一行一個 JSON），前端邊收邊顯示：
 *   {"t":"delta","v":"文字片段"}
 *   {"t":"done","content":"完整回答","aiOk":true,"remaining":87.2}
 * 送出前的檢查失敗則是一般的 JSON 錯誤回應（非 200）。
 *
 * 兩組的差異完全在 ck_chat_messages_for() 組 prompt 時決定，這裡沒有分支。
 */

require_once __DIR__ . '/../src/api.php';
require_once __DIR__ . '/../src/config.php';
require_once __DIR__ . '/../src/interrogation.php';

ck_require_post();

$stuId = ck_require_stu_id();
// 串流期間不能握著 session 鎖，否則同一位受試者的其他請求
// （例如時間到自動推進階段）會整個卡到 AI 答完才處理
session_write_close();

$run = ck_run($stuId);
$in  = ck_input();

$levelNo = ck_valid_level((int)($in['levelNo'] ?? 0));
$charKey = (string)($in['charKey'] ?? '');
$message = trim((string)($in['message'] ?? ''));

ck_require_current_level($stuId, $levelNo);

$pdo = db();
$cfg = ck_interrogation_config();

$stmt = $pdo->prepare('SELECT phase FROM ck_progress WHERE stu_id = ?');
$stmt->execute([$stuId]);
if ((string)$stmt->fetchColumn() !== 'interrogation') {
    ck_fail('現在不是訊問階段', 409);
}

if (!in_array($charKey, array_column(ck_characters(), 'char_key'), true)) {
    ck_fail('角色不存在');
}
if ($message === '') {
    ck_fail('請先輸入問題');
}
if (mb_strlen($message) > (int)$cfg['maxChars']) {
    ck_fail("問題太長了（上限 {$cfg['maxChars']} 字）");
}

$remaining = ck_timer_remaining($stuId, $levelNo, 'interrogation');
if ($remaining !== null && $remaining < -(float)$cfg['graceSeconds']) {
    ck_fail('訊問時間已到，不能夠再問', 409);
}

// 一次只處理一個問題。前端送出後會鎖輸入框，這裡擋的是繞過前端同時送多題。
// 超過 40 秒還沒有回答代表上一個請求已經死了，放行以免受試者被永久卡住。
$stmt = $pdo->prepare(
    'SELECT role, TIMESTAMPDIFF(SECOND, created_at, NOW(3)) AS age
     FROM ck_chat_messages WHERE stu_id = ? AND level_no = ? ORDER BY id DESC LIMIT 1'
);
$stmt->execute([$stuId, $levelNo]);
$last = $stmt->fetch();
if ($last && $last['role'] === 'player' && (int)$last['age'] < 40) {
    ck_fail('上一個問題還在回答中', 409);
}

// 先記下問題再呼叫 AI：就算之後 AI 失敗或連線中斷，「問了什麼」也不會掉
$pdo->prepare(
    'INSERT INTO ck_chat_messages (stu_id, level_no, char_key, role, content) VALUES (?, ?, ?, ?, ?)'
)->execute([$stuId, $levelNo, $charKey, 'player', $message]);

$messages = ck_chat_messages_for($run, $levelNo, $charKey, ck_chat_history($stuId, $levelNo));

// ---- 開始串流 ----
// 受試者中途關掉分頁也要把回答收完並寫入，否則對話紀錄會出現有問無答的缺口
ignore_user_abort(true);
set_time_limit(60);

header('Content-Type: application/x-ndjson; charset=utf-8');
header('Cache-Control: no-cache, no-store');
header('X-Accel-Buffering: no');
if (function_exists('apache_setenv')) {
    @apache_setenv('no-gzip', '1');
}
while (ob_get_level() > 0) {
    ob_end_flush();
}
ob_implicit_flush(true);

$emit = function (array $line): void {
    echo json_encode($line, JSON_UNESCAPED_UNICODE), "\n";
    flush();
};

$startedAt = microtime(true);
try {
    $answer = ck_llm_chat_stream($messages, fn(string $d) => $emit(['t' => 'delta', 'v' => $d]));
} catch (Throwable $e) {
    error_log('[ck_chat] ' . $e->getMessage());
    $answer = null;
}
$latencyMs = (int)round((microtime(true) - $startedAt) * 1000);

$aiOk = $answer !== null;
if (!$aiOk) {
    $answer = CK_CHAT_FALLBACK;
    $emit(['t' => 'delta', 'v' => $answer]);
}
$answer = trim($answer);

$pdo->prepare(
    'INSERT INTO ck_chat_messages
        (stu_id, level_no, char_key, role, content, ai_ok, latency_ms, model, prompt_version)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
)->execute([
    $stuId, $levelNo, $charKey, 'character', $answer,
    (int)$aiOk, $latencyMs, ck_llm_model(), CK_CHAT_PROMPT_VERSION,
]);

ck_log($stuId, $levelNo, 'interrogation', 'ask', [
    'charKey' => $charKey, 'chars' => mb_strlen($message), 'latencyMs' => $latencyMs, 'aiOk' => $aiOk,
]);

$emit([
    't'         => 'done',
    'content'   => $answer,
    'aiOk'      => $aiOk,
    'remaining' => ck_timer_remaining($stuId, $levelNo, 'interrogation'),
]);
