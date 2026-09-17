<?php
/**
 * 證據牆：把六個角色分到「合理說法」或「破綻證據牆」。
 *
 * 對錯由後端比對 ck_testimonies.correct 後寫入 is_correct，前端不參與判定，
 * 回應也不含對錯 —— 那要到回饋階段（且限實驗組）才揭露。
 * 提交後鎖定：同一關不允許重送，避免看完回饋再回頭改分類。
 */

require_once __DIR__ . '/../src/api.php';

ck_require_post();

$stuId = ck_require_stu_id();
ck_run($stuId);

$in         = ck_input();
$levelNo    = ck_valid_level((int)($in['levelNo'] ?? 0));
$placements = $in['placements'] ?? null;
// 計時到期由前端強制提交，此時可能還有角色沒分類。
// 逾時不該讓整筆作答失敗——「沒分類完」本身就是要保留的研究資料。
$timedOut   = (bool)($in['timedOut'] ?? false);

ck_require_current_level($stuId, $levelNo);

if (!is_array($placements)) {
    ck_fail('placements 格式錯誤');
}

$pdo = db();

$stmt = $pdo->prepare('SELECT COUNT(*) FROM ck_evidence WHERE stu_id = ? AND level_no = ?');
$stmt->execute([$stuId, $levelNo]);
if ((int)$stmt->fetchColumn() > 0) {
    ck_fail('這一關的證據牆已經提交過了', 409);
}

$answerKey = ck_answer_key($levelNo);

// 正常提交要六個角色都分類完；逾時提交則把未分類的記成 unclassified
$missing = array_diff(array_keys($answerKey), array_keys($placements));
if ($missing && !$timedOut) {
    ck_fail('還有角色沒有分類：' . implode('、', $missing));
}

$pdo->beginTransaction();
try {
    $ins = $pdo->prepare(
        'INSERT INTO ck_evidence (stu_id, level_no, char_key, zone, is_correct, timed_out)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $correctCount = 0;
    foreach ($answerKey as $charKey => $truth) {
        $zone = (string)($placements[$charKey] ?? 'unclassified');
        if (!in_array($zone, ['reasonable', 'flaw', 'unclassified'], true)) {
            throw new RuntimeException("分類值異常：{$charKey} => {$zone}");
        }
        // 未分類一律計為不正確，但保留 unclassified 以便和「分錯」區分
        $isCorrect = (int)($zone === $truth);
        $correctCount += $isCorrect;
        $ins->execute([$stuId, $levelNo, $charKey, $zone, $isCorrect, (int)$timedOut]);
    }
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    if ($e instanceof RuntimeException) {
        ck_fail($e->getMessage());
    }
    throw $e;
}

ck_log($stuId, $levelNo, 'evidence', 'submit', ['placements' => $placements, 'correct' => $correctCount]);

// 刻意不回 correctCount：這一關的對錯屬於回饋階段的內容
ck_json(['success' => true, 'submitted' => true]);
