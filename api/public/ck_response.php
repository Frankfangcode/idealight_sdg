<?php
// Combined classification and reasoning: one transaction, one timer, one immutable result.
require_once __DIR__.'/../src/api.php';require_once __DIR__.'/../src/review.php';
ck_require_post();$stu=ck_require_stu_id();$run=ck_run($stu);$in=ck_input();$level=ck_valid_level((int)($in['levelNo']??0));
$pdo=db();$pdo->beginTransaction();
try {
 $progress=ck_progress_locked($stu);
 if((int)$progress['level_no']!==$level){$pdo->rollBack();ck_fail('不能提交其他關卡',409);}
 $q=$pdo->prepare('SELECT COUNT(*) FROM ck_judgments WHERE stu_id=? AND level_no=?');$q->execute([$stu,$level]);
 if((int)$q->fetchColumn()>0 && $progress['phase']==='feedback'){$pdo->commit();ck_json(['success'=>true,'submitted'=>true,'phase'=>'feedback']);}
 if($progress['phase']!=='combined'){$pdo->rollBack();ck_fail('尚未進入分類與推理階段',409);}
 $remaining=ck_timer_remaining($stu,$level,'combined');$timedOut=$remaining<=0;
 $payload=['placements'=>$in['placements']??[],'pick'=>$in['pickChar']??null,'reason'=>$in['reason']??''];
 if($remaining < -3) $payload=ck_drafts($run,$level)['combined']['payload']??[];
 try{$p=ck_clean_draft('combined',$payload,$level);}catch(InvalidArgumentException $e){$pdo->rollBack();ck_fail($e->getMessage());}
 $key=ck_answer_key($level);
 if(!$timedOut && (!$p['pick'] || trim($p['reason'])==='' || count(array_filter($p['placements'],fn($v)=>$v!=='unclassified'))!==count($key))){$pdo->rollBack();ck_fail('請完成六張分類、選擇一人並寫下理由');}
 $ins=$pdo->prepare('INSERT INTO ck_evidence(stu_id,level_no,char_key,zone,is_correct,timed_out) VALUES(?,?,?,?,?,?)');
 foreach($key as $k=>$correct){$z=$p['placements'][$k]??'unclassified';$ins->execute([$stu,$level,$k,$z,(int)($z===$correct),(int)$timedOut]);}
 $pdo->prepare('INSERT INTO ck_judgments(stu_id,level_no,pick_char,reason,is_flaw,timed_out) VALUES(?,?,?,?,?,?)')->execute([$stu,$level,$p['pick'],trim($p['reason'])===''?null:$p['reason'],(int)(($key[$p['pick']??'']??'')==='flaw'),(int)$timedOut]);
 $pdo->prepare('UPDATE ck_drafts SET frozen=1 WHERE run_id=? AND level_no=?')->execute([$run['id'],$level]);
 $pdo->prepare("UPDATE ck_progress SET phase='feedback' WHERE stu_id=?")->execute([$stu]);
 ck_log($stu,$level,'combined','submit',['timedOut'=>$timedOut]);
 $pdo->commit();ck_json(['success'=>true,'submitted'=>true,'phase'=>'feedback','timedOut'=>$timedOut]);
}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
