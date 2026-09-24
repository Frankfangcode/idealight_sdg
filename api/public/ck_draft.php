<?php
require_once __DIR__.'/../src/api.php';
require_once __DIR__.'/../src/review.php';
ck_require_post();
$stu=ck_require_stu_id();$run=ck_run($stu);$in=ck_input();
$level=ck_valid_level((int)($in['levelNo']??0));$phase=$in['phase']??'';
if(!in_array($phase,['interrogation','combined','evidence','ranking'],true) || !is_array($in['payload']??null) || !is_int($in['revision']??null) || $in['revision']<1) ck_fail('草稿格式錯誤');
try {$payload=ck_clean_draft($phase,$in['payload'],$level);}catch(InvalidArgumentException $e){ck_fail($e->getMessage());}
$pdo=db();$pdo->beginTransaction();
try {
 $progress=ck_progress_locked($stu);
 if((int)$progress['level_no']!==$level || $progress['phase']!==$phase) {
  $order=['video'=>0,'testimony'=>1,'interrogation'=>2,'combined'=>3,'evidence'=>3,'ranking'=>4,'feedback'=>5];
  if($level>(int)$progress['level_no'] || ($level===(int)$progress['level_no'] && $order[$phase]>($order[$progress['phase']]??-1))) {$pdo->rollBack();ck_fail('尚未進入這個階段',409);}
  ck_archive_draft($stu,$level,$phase,$in['revision'],$payload);
  $pdo->commit();ck_json(['success'=>true,'saved'=>null,'expired'=>true,'archived'=>true]);
 }
 $existing=ck_drafts($run,$level)[$phase]??null;
 $remaining=ck_timer_remaining($stu,$level,$phase);
 // Three seconds are transport grace, never a new answering period. Old revisions cannot overwrite newer text.
 $expired=$remaining!==null && $remaining < -3;
 if($expired || ($existing['frozen']??false)) ck_archive_draft($stu,$level,$phase,$in['revision'],$payload);
 if(!$expired && !($existing['frozen']??false) && $in['revision']>($existing['revision']??0)) {
  $pdo->prepare('INSERT INTO ck_drafts(run_id,level_no,phase,payload,revision) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE payload=VALUES(payload),revision=VALUES(revision)')->execute([$run['id'],$level,$phase,json_encode($payload,JSON_UNESCAPED_UNICODE),$in['revision']]);
  ck_log($stu,$level,$phase,'draft_save',['revision'=>$in['revision'],'payload'=>$payload]);
 }
 if($expired) $pdo->prepare('UPDATE ck_drafts SET frozen=1 WHERE run_id=? AND level_no=? AND phase=?')->execute([$run['id'],$level,$phase]);
 $saved=ck_drafts($run,$level)[$phase]??null;
 $pdo->commit();ck_json(['success'=>true,'saved'=>$saved,'expired'=>$expired]);
}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
