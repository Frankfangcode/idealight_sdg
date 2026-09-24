<?php
require_once __DIR__.'/../src/api.php';require_once __DIR__.'/../src/review.php';
ck_require_post();$stu=ck_require_stu_id();$run=ck_run($stu);$in=ck_input();$level=ck_valid_level((int)($in['levelNo']??0));
$to=(string)($in['phase']??'');$next=($in['nextLevel']??false)===true;
$pdo=db();$pdo->beginTransaction();
try {
 $p=ck_progress_locked($stu);$current=$p['phase'];
 if((int)$p['level_no']!==$level){$pdo->rollBack();ck_fail('關卡已變更，請重新整理',409);}
 $steps=(int)$run['flow_version']>=2?['video','testimony','interrogation','combined','feedback']:['video','testimony','interrogation','evidence','ranking','feedback'];
 $i=array_search($current,$steps,true);
 if($next) {
  if($current!=='feedback'){$pdo->rollBack();ck_fail('請先完成本關作答',409);}
  $q=$pdo->prepare('SELECT COUNT(*) FROM ck_judgments WHERE stu_id=? AND level_no=?');$q->execute([$stu,$level]);
  if(!(int)$q->fetchColumn()){$pdo->rollBack();ck_fail('作答尚未保存',409);}
  $target=$level+1;$pdo->prepare('UPDATE ck_progress SET level_no=?,phase=? WHERE stu_id=?')->execute([$target,'video',$stu]);
  if($target>ck_level_count())$pdo->prepare('UPDATE ck_runs SET finished_at=COALESCE(finished_at,NOW()) WHERE id=?')->execute([$run['id']]);
  ck_log($stu,$level,'feedback','level_complete');$pdo->commit();ck_json(['success'=>true,'levelNo'=>$target,'phase'=>'video','finished'=>$target>ck_level_count()]);
 }
 if($to===$current){$pdo->commit();ck_json(['success'=>true,'phase'=>$current]);}
 if($i===false || ($steps[$i+1]??null)!==$to || $current==='combined'){$pdo->rollBack();ck_fail('請依序完成目前階段',409);}
 if($current==='interrogation' && ck_timer_remaining($stu,$level,$current)>0){$pdo->commit();ck_fail('訊問時間尚未結束',409);}
 if($current==='video' && (int)$run['flow_version']>=2) {
  $q=$pdo->prepare('SELECT completed FROM ck_video_progress WHERE run_id=? AND level_no=?');$q->execute([$run['id'],$level]);
  if(!(bool)$q->fetchColumn() || (int)$run['onboarding_step']<3){$pdo->rollBack();ck_fail('請先完成開場與本關影片',409);}
 }
 if(in_array($current,['evidence','ranking'],true)){
  $table=$current==='evidence'?'ck_evidence':'ck_judgments';$q=$pdo->prepare("SELECT COUNT(*) FROM $table WHERE stu_id=? AND level_no=?");$q->execute([$stu,$level]);
  if(!(int)$q->fetchColumn()){$pdo->rollBack();ck_fail('請先提交目前作答',409);}
 }
 $pdo->prepare('UPDATE ck_drafts SET frozen=1 WHERE run_id=? AND level_no=? AND phase=?')->execute([$run['id'],$level,$current]);
 $pdo->prepare('UPDATE ck_progress SET phase=? WHERE stu_id=?')->execute([$to,$stu]);ck_timer_start($stu,$level,$to);
 ck_log($stu,$level,$to,'phase_enter',['from'=>$current]);$pdo->commit();ck_json(['success'=>true,'levelNo'=>$level,'phase'=>$to]);
}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
