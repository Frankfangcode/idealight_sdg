<?php
/**
 * 遊戲狀態總入口。前端載入或重整時打這一支，拿回：
 *   - 公開設定（階段秒數、訊問上限、分類區文案、判斷題目、回顧範圍）
 *   - 六個角色
 *   - 目前進度（關卡 + 階段）與該關內容
 *   - 該關已經做過的事（訊問紀錄、證據牆分類、判斷）
 *
 * 最後一項是 demo 版做不到的：demo 狀態只在 sessionStorage，關掉分頁就沒了。
 */

require_once __DIR__ . '/../src/api.php';

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

if (!$finished) {
    $payload['level'] = ck_level_payload($levelNo);

    // 該關已訊問過誰、問了什麼、對方怎麼答（重整後要能還原訊問紀錄）
    $stmt = db()->prepare(
        'SELECT i.char_key, q.id AS question_id, q.q, q.a, q.detail
         FROM ck_interrogations i
         JOIN ck_questions q ON q.id = i.question_id
         WHERE i.stu_id = ? AND i.level_no = ?
         ORDER BY i.asked_at'
    );
    $stmt->execute([$stuId, $levelNo]);
    $payload['asked'] = $stmt->fetchAll();

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
