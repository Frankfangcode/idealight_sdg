<?php
/**
 * 訊問階段受試者閒置時，由目前選中的角色主動開口（會議決議：
 * 「時間未到但玩家不想問了，AI 可以主動跳出來說話」）。
 *
 * 台詞是預寫的、不經 LLM：省錢，也確保兩組看到的完全相同。
 * 由後端發放並寫入對話紀錄，日後才能分析閒置的次數與時間點。
 * 同一個角色不會連續催兩次 —— 上一句已經是催促就不再發。
 */

require_once __DIR__ . '/../src/api.php';
require_once __DIR__ . '/../src/interrogation.php';

ck_require_post();

$stuId = ck_require_stu_id();
ck_run($stuId);

$in      = ck_input();
$levelNo = ck_valid_level((int)($in['levelNo'] ?? 0));
$charKey = (string)($in['charKey'] ?? '');

ck_require_current_level($stuId, $levelNo);

if (!in_array($charKey, array_column(ck_characters(), 'char_key'), true)) {
    ck_fail('角色不存在');
}

$pdo = db();

$stmt = $pdo->prepare('SELECT phase FROM ck_progress WHERE stu_id = ?');
$stmt->execute([$stuId]);
$remaining = ck_timer_remaining($stuId, $levelNo, 'interrogation');
if ((string)$stmt->fetchColumn() !== 'interrogation' || ($remaining !== null && $remaining <= 0)) {
    ck_json(['success' => true, 'content' => null]);
}

$stmt = $pdo->prepare(
    'SELECT role FROM ck_chat_messages WHERE stu_id = ? AND level_no = ? AND char_key = ? ORDER BY id'
);
$stmt->execute([$stuId, $levelNo, $charKey]);
$roles = $stmt->fetchAll(PDO::FETCH_COLUMN);

if ($roles && end($roles) !== 'character') {
    // 上一句是催促（不連催），或是還沒答完的提問
    ck_json(['success' => true, 'content' => null]);
}

$counts = array_count_values($roles) + ['player' => 0, 'nudge' => 0];
$line = $counts['player'] === 0
    ? CK_CHAT_NUDGE_OPENING
    : CK_CHAT_NUDGES[$counts['nudge'] % count(CK_CHAT_NUDGES)];

$pdo->prepare(
    'INSERT INTO ck_chat_messages (stu_id, level_no, char_key, role, content) VALUES (?, ?, ?, ?, ?)'
)->execute([$stuId, $levelNo, $charKey, 'nudge', $line]);

ck_log($stuId, $levelNo, 'interrogation', 'nudge', ['charKey' => $charKey]);

ck_json(['success' => true, 'content' => $line]);
