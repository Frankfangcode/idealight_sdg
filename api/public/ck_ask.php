<?php
/**
 * 訊問：對某個角色提出一個問題，取得他的回答。
 *
 * 兩條限制都在後端擋，不靠前端自律：
 *   - 每關訊問次數上限（ck_config.MAX_INTERROGATIONS，現為 2）
 *   - 同一關不可重複追問同一人（ck_interrogations 的 uniq_ask）
 * 角色的回答在寫入紀錄成功之後才發放，避免「問了但沒記到」或
 * 前端重送同一題來繞過次數上限。
 */

require_once __DIR__ . '/../src/api.php';

ck_require_post();

$stuId = ck_require_stu_id();
ck_run($stuId);

$in         = ck_input();
$levelNo    = ck_valid_level((int)($in['levelNo'] ?? 0));
$charKey    = (string)($in['charKey'] ?? '');
$questionId = (int)($in['questionId'] ?? 0);

ck_require_current_level($stuId, $levelNo);

$pdo = db();

// 問題必須真的屬於這一關的這個角色
$stmt = $pdo->prepare('SELECT id, q, a, detail FROM ck_questions WHERE id = ? AND level_no = ? AND char_key = ?');
$stmt->execute([$questionId, $levelNo, $charKey]);
$question = $stmt->fetch();
if (!$question) {
    ck_fail('問題不存在或不屬於這一關的這個角色');
}

$maxAsk = (int)(ck_config('MAX_INTERROGATIONS') ?? 2);

$stmt = $pdo->prepare('SELECT COUNT(*) FROM ck_interrogations WHERE stu_id = ? AND level_no = ?');
$stmt->execute([$stuId, $levelNo]);
if ((int)$stmt->fetchColumn() >= $maxAsk) {
    ck_fail("這一關的訊問次數已用完（上限 {$maxAsk} 人）", 409);
}

try {
    $pdo->prepare(
        'INSERT INTO ck_interrogations (stu_id, level_no, char_key, question_id) VALUES (?, ?, ?, ?)'
    )->execute([$stuId, $levelNo, $charKey, $questionId]);
} catch (PDOException $e) {
    // 1062 = uniq_ask 撞鍵，代表這一關已經問過這個人
    if (($e->errorInfo[1] ?? 0) === 1062) {
        ck_fail('這一關已經追問過這個人了', 409);
    }
    throw $e;
}

ck_log($stuId, $levelNo, 'interrogation', 'ask', ['charKey' => $charKey, 'questionId' => $questionId]);

$stmt = $pdo->prepare('SELECT COUNT(*) FROM ck_interrogations WHERE stu_id = ? AND level_no = ?');
$stmt->execute([$stuId, $levelNo]);
$used = (int)$stmt->fetchColumn();

ck_json([
    'success'      => true,
    'charKey'      => $charKey,
    'q'            => $question['q'],
    'a'            => $question['a'],
    'detail'       => $question['detail'],
    'attemptsUsed' => $used,
    'attemptsLeft' => max(0, $maxAsk - $used),
]);
