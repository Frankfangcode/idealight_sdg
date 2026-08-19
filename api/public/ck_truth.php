<?php
/**
 * 公布真相與 debriefing。六關全部完成後才發放。
 *
 * truth / debrief 在 ck_config 裡標為 is_public = 0，
 * 不會出現在 ck_state.php 的公開設定裡；只有這一支在確認進度後才吐出。
 * 少了這道檢查，受試者一開始就能從 API 直接讀到「六人共組夜食會」的答案。
 */

require_once __DIR__ . '/../src/api.php';

$stuId = ck_require_stu_id();
ck_run($stuId);

$stmt = db()->prepare('SELECT level_no FROM ck_progress WHERE stu_id = ?');
$stmt->execute([$stuId]);
$levelNo = (int)($stmt->fetchColumn() ?: 1);

if ($levelNo <= ck_level_count()) {
    ck_fail('尚未完成全部關卡', 403);
}

ck_log($stuId, null, 'truth', 'view', []);

ck_json([
    'success' => true,
    'truth'   => ck_config('truth'),
    'debrief' => ck_config('debrief'),
]);
