<?php
/**
 * 推進階段或關卡。進度存在後端，重整、換裝置、關掉瀏覽器都能續跑
 * ——demo 版的 sessionStorage 做不到這件事。
 *
 * 階段順序固定，且只能往前：受試者不能跳過訊問直接進判斷，
 * 也不能看完回饋後倒回去改分類。
 */

require_once __DIR__ . '/../src/api.php';

ck_require_post();

$stuId = ck_require_stu_id();
ck_run($stuId);

const CK_PHASES = ['video', 'testimony', 'interrogation', 'evidence', 'ranking', 'feedback'];

$in       = ck_input();
$levelNo  = ck_valid_level((int)($in['levelNo'] ?? 0));
$toPhase  = (string)($in['phase'] ?? '');
$nextLevel = (bool)($in['nextLevel'] ?? false);

ck_require_current_level($stuId, $levelNo);

$pdo = db();
$stmt = $pdo->prepare('SELECT phase FROM ck_progress WHERE stu_id = ?');
$stmt->execute([$stuId]);
$current = (string)($stmt->fetchColumn() ?: 'video');

// ---- 進入下一關 ----
if ($nextLevel) {
    if ($current !== 'feedback') {
        ck_fail('要先完成本關的回饋階段才能進入下一關', 409);
    }
    $target = $levelNo + 1;
    $pdo->prepare('UPDATE ck_progress SET level_no = ?, phase = ? WHERE stu_id = ?')
        ->execute([$target, 'video', $stuId]);

    // 六關都完成，標記回合結束
    if ($target > ck_level_count()) {
        $pdo->prepare('UPDATE ck_runs SET finished_at = NOW() WHERE stu_id = ? AND finished_at IS NULL')
            ->execute([$stuId]);
    }

    ck_log($stuId, $levelNo, 'feedback', 'level_complete', []);
    ck_json([
        'success'  => true,
        'levelNo'  => $target,
        'phase'    => 'video',
        'finished' => $target > ck_level_count(),
    ]);
}

// ---- 階段推進 ----
$fromIdx = array_search($current, CK_PHASES, true);
$toIdx   = array_search($toPhase, CK_PHASES, true);

if ($toIdx === false) {
    ck_fail("階段名稱不存在：{$toPhase}");
}
if ($toIdx <= $fromIdx) {
    ck_fail("階段只能往前（目前 {$current}）", 409);
}

$pdo->prepare('UPDATE ck_progress SET phase = ? WHERE stu_id = ?')->execute([$toPhase, $stuId]);
ck_log($stuId, $levelNo, $toPhase, 'phase_enter', ['from' => $current]);

ck_json(['success' => true, 'levelNo' => $levelNo, 'phase' => $toPhase]);
