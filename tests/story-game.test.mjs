import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {phpJson,token} from './story-harness.mjs';

function scenario(code){return phpJson(`require 'api/src/story_game.php';
 $id='dg_'.$argv[1];$key='test_'.$argv[1];$p=db();
 try {
  $p->prepare('INSERT INTO students(stu_id,name,age) VALUES(?,?,20)')->execute([$id,'Dual story test']);
  story_enroll($id,$key);$runs=story_runs($id);$runId=(int)$runs[0]['id'];
  ${code}
 } finally {
  if($p->inTransaction())$p->rollBack();
  $p->prepare('DELETE FROM students WHERE stu_id=? AND name=?')->execute([$id,'Dual story test']);
  $p->prepare('DELETE FROM ck_story_allocation WHERE study_key=?')->execute([$key]);
 }`,[token()]);}

test('opening character introduction enforces 25 seconds across reloads and rejects early skipping',()=>{
 const r=scenario(`
 $before=story_state($id);story_action($id,'onboarding',['runId'=>$runId,'step'=>1]);
 $first=story_state($id);story_action($id,'onboarding',['runId'=>$runId,'step'=>1]);$again=story_state($id);
 $blocked=false;try{story_action($id,'onboarding',['runId'=>$runId,'step'=>2]);}catch(StoryError $e){$blocked=$e->getCode()===409;}
 $p->prepare("UPDATE ck_story_events SET payload=? WHERE run_id=? AND event_key='onboarding-clock'")->execute([json_encode(['startedAt'=>microtime(true)-26]),$runId]);
 $expired=story_state($id);
 echo json_encode(compact('before','first','again','expired','blocked'));`);
 assert.equal(r.before.onboardingRemaining,null);
 assert.equal(r.first.onboardingRemaining,25);
 assert.ok(r.again.onboardingRemaining<=25&&r.again.onboardingRemaining>=24);
 assert.equal(r.blocked,true);
 assert.equal(r.expired.onboardingStep,2);
 assert.equal(r.expired.onboardingRemaining,0);
});

test('video completion starts ten seconds once and testimony starts a persistent minute',()=>{
 const r=scenario(`
 $p->prepare('UPDATE ck_story_runs SET onboarding_step=3 WHERE id=?')->execute([$runId]);
 $before=story_state($id);
 $in=['runId'=>$runId,'levelNo'=>1,'position'=>1,'duration'=>1,'completed'=>true];
 story_action($id,'video',$in);$completed=story_state($id);
 $w=story_work($runId,1);$w['timers']['video']=microtime(true)-5;story_save_work($runId,1,$w);
 story_action($id,'video',$in);$again=story_state($id);
 story_action($id,'advance',['runId'=>$runId,'levelNo'=>1,'phase'=>'testimony']);$reading=story_state($id);
 $w=story_work($runId,1);$w['timers']['testimony']=microtime(true)-30;story_save_work($runId,1,$w);
 story_action($id,'advance',['runId'=>$runId,'levelNo'=>1,'phase'=>'testimony']);$reload=story_state($id);
 echo json_encode(compact('before','completed','again','reading','reload'));`);
 assert.equal(r.before.progress.remaining,null);
 assert.equal(r.completed.progress.remaining,10);
 assert.ok(r.again.progress.remaining<=5&&r.again.progress.remaining>=4);
 assert.equal(r.reading.progress.remaining,60);
 assert.ok(r.reload.progress.remaining<=30&&r.reload.progress.remaining>=29);
});

test('past chapter draft sync archives unsent text without overwriting submitted answers',()=>{
 const r=scenario(`
 $w=story_work($runId,1);$w['answer']=['reason'=>'Submitted','score'=>1];story_save_work($runId,1,$w);
 $p->prepare("UPDATE ck_story_runs SET level_no=2,phase='video' WHERE id=?")->execute([$runId]);
 $in=['runId'=>$runId,'levelNo'=>1,'phase'=>'combined','revision'=>3,'payload'=>['reason'=>'Recovered text']];
 $first=story_action($id,'draft',$in);
 $p->prepare('UPDATE ck_story_runs SET level_no=7,finished_at=NOW() WHERE id=?')->execute([$runId]);
 $in['revision']=4;$last=story_action($id,'draft',$in);
 echo json_encode(['first'=>$first,'last'=>$last,'work'=>story_work($runId,1)]);`);
 assert.equal(r.first.archived,true);assert.equal(r.last.archived,true);
 assert.equal(r.work.answer.reason,'Submitted');assert.equal(r.work.lateDrafts.combined['4'].reason,'Recovered text');
});
test('retrying next chapter after a lost response returns the same destination',()=>{
 const r=scenario(`
 $p->prepare("UPDATE ck_story_runs SET phase='feedback' WHERE id=?")->execute([$runId]);
 $w=story_work($runId,1);$w['answer']=['score'=>0];story_save_work($runId,1,$w);
 $in=['runId'=>$runId,'levelNo'=>1,'nextLevel'=>true];
 $first=story_action($id,'advance',$in);$again=story_action($id,'advance',$in);
 echo json_encode(['first'=>$first,'again'=>$again,'level'=>story_run($id)['level_no']]);`);
 assert.deepEqual(r.again,r.first);assert.equal(r.level,2);
});
test('research events preserve draft revisions and server times without duplicating retries',()=>{
 const r=scenario(`
 $p->prepare("UPDATE ck_story_runs SET phase='combined' WHERE id=?")->execute([$runId]);
 $w=story_work($runId,1);$w['timers']['combined']=microtime(true);story_save_work($runId,1,$w);
 $in=['runId'=>$runId,'levelNo'=>1,'phase'=>'combined','revision'=>1,'payload'=>['reason'=>'First reasoning']];
 story_action($id,'draft',$in);$in['revision']=2;$in['payload']['reason']='Revised reasoning';story_action($id,'draft',$in);story_action($id,'draft',$in);
 $q=$p->prepare("SELECT event_type,payload,created_at FROM ck_story_events WHERE run_id=? ORDER BY id");$q->execute([$runId]);echo json_encode($q->fetchAll());`);
 assert.equal(r.length,2);assert.deepEqual(r.map(e=>JSON.parse(e.payload).payload.reason),['First reasoning','Revised reasoning']);
 assert.ok(r.every(e=>e.event_type==='draft_save'&&e.created_at));
});

test('new story state restores onboarding and rejects changing another run or skipping the video',()=>{
 assert.ok(existsSync('api/src/story_game.php'),'Story gameplay is not implemented');
 const r=scenario(`
  $state=story_state($id);
  story_event($runId,0,'onboarding-clock','onboarding_clock',['startedAt'=>microtime(true)-26]);
  story_action($id,'onboarding',['runId'=>$runId,'step'=>2]);
  story_action($id,'onboarding',['runId'=>$runId,'step'=>3]);
  $after=story_state($id);$errors=[];
  foreach([['runId'=>$runId,'levelNo'=>1,'phase'=>'testimony'],['runId'=>$runId+9999,'step'=>3]] as $in){
   try{story_action($id,isset($in['phase'])?'advance':'onboarding',$in);}catch(StoryError $e){$errors[]=$e->getCode();}
  }
  echo json_encode(['state'=>$state,'after'=>$after,'errors'=>$errors]);`);
 assert.equal(r.state.story.id,'cake');assert.equal(r.state.story.position,1);
 assert.equal(r.state.onboardingStep,0);assert.equal(r.after.onboardingStep,3);
 assert.equal(r.state.hasAiFeedback,false);assert.equal(r.state.totalScore,undefined);
 assert.deepEqual(r.errors,[409,409]);
 assert.equal(r.after.progress.phase,'video');
});

test('idle prompts are saved to the selected character without repeated nudges or an AI call',()=>{
 const r=scenario(`
  $p->prepare("UPDATE ck_story_runs SET phase='interrogation',onboarding_step=3 WHERE id=?")->execute([$runId]);
  $w=story_work($runId,1);$w['timers']['interrogation']=microtime(true)-26;story_save_work($runId,1,$w);
  $in=['runId'=>$runId,'levelNo'=>1,'charKey'=>'2'];$first=story_action($id,'nudge',$in);$second=story_action($id,'nudge',$in);
  echo json_encode(['first'=>$first,'second'=>$second,'chat'=>story_state($id)['chat']]);`);
 assert.ok(r.first.content);assert.equal(r.second.content,null);assert.equal(r.chat.length,1);
 assert.equal(r.chat[0].char_key,'2');assert.equal(r.chat[0].role,'nudge');
});

test('six completed chapters lead to a deliberate story switch and stale run requests cannot write into story two',()=>{
 const r=scenario(`
  $p->prepare("UPDATE ck_story_runs SET phase='feedback',level_no=6,onboarding_step=3 WHERE id=?")->execute([$runId]);
  for($n=1;$n<=6;$n++){ $w=story_work($runId,$n);$w['answer']=['reason'=>'CAKE_ONLY','score'=>1,'placements'=>[],'pick'=>'1'];story_save_work($runId,$n,$w); }
  $finish=story_action($id,'advance',['runId'=>$runId,'levelNo'=>6,'nextLevel'=>true]);
  $middle=story_state($id);$blocked=null;
  try{story_action($id,'nextStory',['runId'=>$runId]);}catch(StoryError $e){$blocked=$e->getCode();}
  $p->prepare('UPDATE ck_story_runs SET finished_at=? WHERE id=?')->execute([date('Y-m-d H:i:s',time()-181),$runId]);
  $switch=story_action($id,'nextStory',['runId'=>$runId]);
  $again=story_action($id,'nextStory',['runId'=>$runId]);$error=null;
  try{story_action($id,'draft',['runId'=>$runId,'levelNo'=>1,'phase'=>'combined','revision'=>10,'payload'=>['reason'=>'STALE']]);}catch(StoryError $e){$error=$e->getCode();}
  $new=story_run($id);echo json_encode(['finish'=>$finish,'middle'=>$middle,'blocked'=>$blocked,'switch'=>$switch,'again'=>$again,'new'=>$new,'newWork'=>story_work((int)$new['id'],1),'oldWork'=>story_work($runId,1),'error'=>$error]);`);
 assert.equal(r.finish.finished,true);assert.equal(r.middle.nextStory.title,'第九杯飲料');
 assert.ok(r.middle.nextStory.breakRemaining>170&&r.middle.nextStory.breakRemaining<=180);assert.equal(r.blocked,409);
 assert.equal(r.switch.runId,r.again.runId);assert.equal(r.new.story_id,'drink');assert.equal(r.new.onboarding_step,0);
 assert.equal(r.newWork.answer,undefined);assert.equal(r.oldWork.answer.reason,'CAKE_ONLY');assert.equal(r.error,409);
});

test('combined submission scores on the server once and timeout uses saved work rather than a late replacement',()=>{
 const r=scenario(`
  $p->prepare("UPDATE ck_story_runs SET phase='combined',onboarding_step=3 WHERE id=?")->execute([$runId]);
  $w=story_work($runId,1);$w['timers']['combined']=microtime(true)-245;
  $w['drafts']['combined']=['revision'=>1,'frozen'=>false,'payload'=>['placements'=>['1'=>'reasonable'],'pick'=>'1','reason'=>'Before deadline']];
  story_save_work($runId,1,$w);
  $in=['runId'=>$runId,'levelNo'=>1,'placements'=>['1'=>'flaw'],'pickChar'=>'2','reason'=>'Late replacement'];
  $first=story_action($id,'response',$in);$again=story_action($id,'response',$in);
  $work=story_work($runId,1);echo json_encode(['first'=>$first,'again'=>$again,'answer'=>$work['answer'],'state'=>story_state($id)]);`);
 assert.equal(r.first.submitted,true);assert.equal(r.first.timedOut,true);assert.equal(r.again.submitted,true);
 assert.equal(r.answer.reason,'Before deadline');assert.equal(r.answer.pick,'1');assert.equal(r.answer.placements['1'],'reasonable');
 assert.equal(Object.keys(r.answer.placements).length,6);assert.equal(r.answer.placements['2'],'unclassified');
 assert.equal(r.state.progress.phase,'feedback');assert.equal(r.state.totalScore,undefined);
});

test('draft revisions restore after reload and late text is archived without changing frozen work',()=>{
 const r=scenario(`
  $p->prepare("UPDATE ck_story_runs SET phase='combined',onboarding_step=3 WHERE id=?")->execute([$runId]);
  $w=story_work($runId,1);$w['timers']['combined']=microtime(true);story_save_work($runId,1,$w);
  $in=['runId'=>$runId,'levelNo'=>1,'phase'=>'combined','revision'=>2,'payload'=>['placements'=>['1'=>'flaw'],'pick'=>'1','reason'=>'Saved reasoning']];
  story_action($id,'draft',$in);$in['revision']=1;$in['payload']['reason']='Stale';story_action($id,'draft',$in);
  $saved=story_state($id)['drafts']['combined'];
  $w=story_work($runId,1);$w['timers']['combined']-=245;story_save_work($runId,1,$w);
  $in['revision']=3;$in['payload']['reason']='Late reasoning';$late=story_action($id,'draft',$in);
  echo json_encode(['saved'=>$saved,'late'=>$late,'work'=>story_work($runId,1)]);`);
 assert.equal(r.saved.payload.reason,'Saved reasoning');assert.equal(r.saved.revision,2);
 assert.equal(r.late.expired,true);assert.equal(r.work.drafts.combined.payload.reason,'Saved reasoning');
 assert.equal(r.work.lateDrafts.combined['3'].reason,'Late reasoning');
});

test('video completion unlocks testimony and interrogation time survives reload without early advance',()=>{
 const r=scenario(`
  story_event($runId,0,'onboarding-clock','onboarding_clock',['startedAt'=>microtime(true)-26]);
  story_action($id,'onboarding',['runId'=>$runId,'step'=>2]);story_action($id,'onboarding',['runId'=>$runId,'step'=>3]);
  story_action($id,'video',['runId'=>$runId,'levelNo'=>1,'position'=>10,'duration'=>10,'completed'=>true]);
  story_action($id,'advance',['runId'=>$runId,'levelNo'=>1,'phase'=>'testimony']);
  story_action($id,'advance',['runId'=>$runId,'levelNo'=>1,'phase'=>'interrogation']);
  $before=story_state($id);$error=null;
  try{story_action($id,'advance',['runId'=>$runId,'levelNo'=>1,'phase'=>'combined']);}catch(StoryError $e){$error=$e->getCode();}
  $w=story_work($runId,1);$w['timers']['interrogation']-=61;story_save_work($runId,1,$w);
  story_action($id,'advance',['runId'=>$runId,'levelNo'=>1,'phase'=>'combined']);
  echo json_encode(['before'=>$before,'error'=>$error,'after'=>story_state($id)]);`);
 assert.equal(r.before.progress.phase,'interrogation');assert.ok(r.before.progress.remaining<=60&&r.before.progress.remaining>55);
 assert.equal(r.error,409);assert.equal(r.after.progress.phase,'combined');assert.ok(r.after.progress.remaining<=120&&r.after.progress.remaining>115);
 assert.equal(r.after.videoProgress.completed,true);
});
