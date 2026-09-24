<?php
/**
 * 遊戲狀態總入口。前端載入或重整時打這一支，拿回：
 *   - 公開設定（階段秒數、訊問設定、分類區文案、判斷題目、回顧範圍）
 *   - 六個角色
 *   - 目前進度（關卡 + 階段）與該關內容
 *   - 該關已經做過的事（訊問對話、證據牆分類、判斷）
 *   - 目前階段的剩餘秒數（以伺服器記錄的起算時間為準）
 *
 * 最後一項是 demo 版做不到的：demo 狀態只在 sessionStorage，關掉分頁就沒了。
 */

require_once __DIR__ . '/../src/api.php';
require_once __DIR__ . '/../src/review.php';

$stuId = ck_require_stu_id();
$run   = ck_run($stuId);

$stmt = db()->prepare('SELECT level_no, phase FROM ck_progress WHERE stu_id = ?');
$stmt->execute([$stuId]);
$progress = $stmt->fetch() ?: ['level_no' => 1, 'phase' => 'video'];
$levelNo = (int)$progress['level_no'];

// 已完成六關則不再回傳關卡內容，前端據此進入真相與 debriefing
$finished = $levelNo > ck_level_count();

$payload = [
    'success'    => true,
    'stuId'      => $stuId,
    'flowVersion' => (int)$run['flow_version'],
    'onboardingStep' => (int)$run['onboarding_step'],
    'guideVideo' => ['src'=>'media/intro-guide.mp4'] + ck_video_progress($run,0),
    'videoProgress' => ck_video_progress($run,$levelNo),
    'postCompleted' => ck_post_completed($stuId),
    // 刻意不回傳 cond：受試者不該知道自己在哪一組。
    // 前端只需要「這一關結束後有沒有詳細回饋」這個布林值。
    'hasAiFeedback' => ck_has_ai_feedback($run),
    'levelCount' => ck_level_count(),
    'config'     => ck_public_config(),
    'characters' => ck_characters(),
    // 六關的編號與名稱，供上方進度點顯示。只給 no 與 name，
    // 未進行的關卡不會提前送出發言、追問或影片腳本。
    'outline'    => db()->query('SELECT level_no AS no, name FROM ck_levels ORDER BY level_no')->fetchAll(),
    'progress'   => ['levelNo' => $levelNo, 'phase' => $progress['phase'], 'finished' => $finished],
];

if (ck_has_ai_feedback($run)) $payload['totalScore'] = ck_score($stuId);
$payload['config']['PHASE_SECONDS']['combined'] = ck_phase_seconds('combined');

if (!$finished) {
    $payload['drafts'] = ck_drafts($run,$levelNo);
    $payload['level'] = ck_level_payload($levelNo);

    // 該關的訊問對話（重整後要能還原）。只回角色、發話方與內容，
    // 不回 ai_ok / model / prompt_version 這些研究用欄位。
    $stmt = db()->prepare(
        'SELECT char_key, role, content FROM ck_chat_messages
         WHERE stu_id = ? AND level_no = ? ORDER BY id'
    );
    $stmt->execute([$stuId, $levelNo]);
    $payload['chat'] = $stmt->fetchAll();

    // 限時階段的剩餘秒數。前端的倒數以此為準，清掉 sessionStorage 也拿不回時間。
    $remaining = ck_timer_remaining($stuId, $levelNo, (string)$progress['phase']);
    $payload['progress']['remaining'] = $remaining === null ? null : max(0, (int)ceil($remaining));

    // 證據牆分類（只回自己的分類，不回對錯——對錯要到回饋階段才揭露）
    $stmt = db()->prepare(
        'SELECT char_key, zone FROM ck_evidence WHERE stu_id = ? AND level_no = ?'
    );
    $stmt->execute([$stuId, $levelNo]);
    $payload['placements'] = array_column($stmt->fetchAll(), 'zone', 'char_key');

    $stmt = db()->prepare(
        'SELECT pick_char, reason FROM ck_judgments WHERE stu_id = ? AND level_no = ?'
    );
    $stmt->execute([$stuId, $levelNo]);
    $payload['judgment'] = $stmt->fetch() ?: null;
}

ck_json($payload);
