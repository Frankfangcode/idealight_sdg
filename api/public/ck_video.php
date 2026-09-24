<?php
require_once __DIR__.'/../src/api.php';require_once __DIR__.'/../src/review.php';
ck_require_post();$stu=ck_require_stu_id();$run=ck_run($stu);$in=ck_input();
$level=$in['levelNo']??-1;$position=$in['position']??null;$duration=$in['duration']??null;$completed=($in['completed']??false)===true;
if(!is_int($level)||$level<0||$level>ck_level_count()||!is_numeric($position)||!is_numeric($duration)||!is_finite((float)$position)||!is_finite((float)$duration)||$position<0||$duration<=0||$duration>28800||$position>$duration+1)ck_fail('影片進度格式錯誤');
if($completed && $position<$duration-1)ck_fail('影片尚未播放完成',409);
if($level>0)ck_require_current_level($stu,$level);
$pdo=db();$pdo->prepare('INSERT INTO ck_video_progress(run_id,level_no,position_seconds,completed) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE position_seconds=GREATEST(position_seconds,VALUES(position_seconds)),completed=GREATEST(completed,VALUES(completed))')->execute([$run['id'],$level,$position,(int)$completed]);
ck_log($stu,$level,'video',$completed?'video_complete':'video_progress',['position'=>$position,'duration'=>$duration]);
ck_json(['success'=>true,'videoProgress'=>ck_video_progress($run,$level)]);
