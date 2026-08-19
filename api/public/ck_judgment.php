<?php
/**
 * 判斷階段：選出說法最不合理的一人，並說明理由。
 *
 * 任務形式依教師意見從「六人排序」簡化為「單選一人＋理由」
 * （見 demo README 的四項待確認事項）。
 *
 * is_flaw 只記錄所選對象在該關是否被判定為有瑕疵，不等於「答對」——
 * 本案六名角色都涉入，真正的評分要看理由的推理品質，
 * 由 ck_feedback.php 依該關的 ranking_criterion 交給 AI 評。
 */

require_once __DIR__ . '/../src/api.php';

ck_require_post();

$stuId = ck_require_stu_id();
ck_run($stuId);

$in       = ck_input();
$levelNo  = ck_valid_level((int)($in['levelNo'] ?? 0));
$pickChar = (string)($in['pickChar'] ?? '');
$reason   = trim((string)($in['reason'] ?? ''));
// 推理階段計時到期時，前端會帶著當下的選擇與文字強制送出——
// 可能還沒選人、理由也可能不足字數。這種情況要照收，
// 擋下來等於讓受試者逾時就整關掉資料。
$timedOut = (bool)($in['timedOut'] ?? false);

ck_require_current_level($stuId, $levelNo);

$pdo = db();

// 證據牆要先提交才能進判斷階段
$stmt = $pdo->prepare('SELECT COUNT(*) FROM ck_evidence WHERE stu_id = ? AND level_no = ?');
$stmt->execute([$stuId, $levelNo]);
if ((int)$stmt->fetchColumn() === 0) {
    ck_fail('請先完成證據牆分類', 409);
}

$stmt = $pdo->prepare('SELECT COUNT(*) FROM ck_judgments WHERE stu_id = ? AND level_no = ?');
$stmt->execute([$stuId, $levelNo]);
if ((int)$stmt->fetchColumn() > 0) {
    ck_fail('這一關的判斷已經提交過了', 409);
}

$answerKey = ck_answer_key($levelNo);

// 理由字數門檻與前端的送出條件一致（40 字）。前端可被繞過，
// 所以底線在這裡；逾時提交則不套用，照原樣收下。
$MIN_REASON = 40;

if (!$timedOut) {
    if (!isset($answerKey[$pickChar])) {
        ck_fail('選擇的角色不存在');
    }
    if (mb_strlen($reason) < $MIN_REASON) {
        ck_fail("理由至少需要 {$MIN_REASON} 個字（目前 " . mb_strlen($reason) . ' 字）');
    }
} elseif ($pickChar !== '' && !isset($answerKey[$pickChar])) {
    ck_fail('選擇的角色不存在');
}

$pick   = $pickChar === '' ? null : $pickChar;
$isFlaw = (int)($pick !== null && $answerKey[$pick] === 'flaw');

$pdo->prepare(
    'INSERT INTO ck_judgments (stu_id, level_no, pick_char, reason, is_flaw, timed_out)
     VALUES (?, ?, ?, ?, ?, ?)'
)->execute([$stuId, $levelNo, $pick, $reason === '' ? null : $reason, $isFlaw, (int)$timedOut]);

ck_log($stuId, $levelNo, 'ranking', 'submit', [
    'pick' => $pick, 'reasonLen' => mb_strlen($reason), 'timedOut' => $timedOut,
]);

// 同樣不回 is_flaw：對錯屬於回饋階段
ck_json(['success' => true, 'submitted' => true]);
