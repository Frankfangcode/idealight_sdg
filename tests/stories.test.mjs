import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {phpJson,token} from './story-harness.mjs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {php} from './story-harness.mjs';

test('simultaneous enrollment serializes allocation and duplicate login keeps one pair of runs',async()=>{
 const key='test_'+token(),ids=Array.from({length:4},()=> 'dc_'+token());
 try{
  phpJson(`require 'api/src/db.php';foreach(json_decode($argv[1],true) as $id)db()->prepare('INSERT INTO students(stu_id,name,age) VALUES(?,?,20)')->execute([$id,'Dual story test']);echo '{}';`,[JSON.stringify(ids)]);
  const outputs=await Promise.all([...ids,ids[0]].map(id=>promisify(execFile)(php,['-r',`require 'api/src/stories.php';echo json_encode(story_enroll($argv[1],$argv[2]));`,id,key],{encoding:'utf8'})));
  const rows=outputs.map(r=>JSON.parse(r.stdout)),unique=[...new Map(rows.map(r=>[r.id,r])).values()].sort((a,b)=>a.allocation_no-b.allocation_no);
  assert.deepEqual(unique.map(r=>r.code),['1-1','1-2','2-1','2-2']);assert.equal(rows[0].id,rows[4].id);
  assert.equal(phpJson(`require 'api/src/stories.php';echo count(story_runs($argv[1]));`,[ids[0]]),2);
  const first=phpJson(`require 'api/src/stories.php';$r=story_runs($argv[1])[0];db()->prepare('UPDATE ck_story_runs SET level_no=7,finished_at=? WHERE id=?')->execute([date('Y-m-d H:i:s',time()-301),$r['id']]);echo $r['id'];`,[ids[0]]);
  const switches=await Promise.all([1,2].map(()=>promisify(execFile)(php,['-r',`require 'api/src/story_game.php';echo json_encode(story_action($argv[1],'nextStory',['runId'=>(int)$argv[2]]));`,ids[0],String(first)],{encoding:'utf8'})));
  assert.deepEqual(JSON.parse(switches[0].stdout),JSON.parse(switches[1].stdout));
  assert.equal(phpJson(`require 'api/src/stories.php';$q=db()->prepare("SELECT COUNT(*) FROM ck_story_events WHERE run_id=? AND event_type='story_start'");$q->execute([story_runs($argv[1])[1]['id']]);echo $q->fetchColumn();`,[ids[0]]),1);
 }finally{
  phpJson(`require 'api/src/db.php';foreach(json_decode($argv[1],true) as $id)db()->prepare('DELETE FROM students WHERE stu_id=? AND name=?')->execute([$id,'Dual story test']);db()->prepare('DELETE FROM ck_story_allocation WHERE study_key=?')->execute([$argv[2]]);echo '{}';`,[JSON.stringify(ids),key]);
 }
});

test('first logins allocate four fixed sequences, repeat safely, and leave legacy students alone',()=>{
 assert.ok(existsSync('api/src/stories.php'),'Story allocation is not implemented');
 const tag=token();
 const out=phpJson(`require 'api/src/stories.php';
 $p=db(); $key='test_'.$argv[1]; $ids=[]; $result=[];
 try {
  for($i=0;$i<5;$i++){
   $id='ds_'.$argv[1].'_'.$i;$ids[]=$id;
   $p->prepare('INSERT INTO students(stu_id,name,age) VALUES(?,?,20)')->execute([$id,'Dual story test']);
   $a=story_enroll($id,$key);$b=story_enroll($id,$key);
   $result[]=['code'=>$a['code'],'same'=>$a['id']===$b['id'],'order'=>array_column(story_runs($id),'story_id')];
  }
  $id='ds_'.$argv[1].'_old';$ids[]=$id;
  $p->prepare('INSERT INTO students(stu_id,name,age) VALUES(?,?,20)')->execute([$id,'Dual story test']);
  $p->prepare("INSERT INTO ck_runs(stu_id,cond) VALUES(?,'control')")->execute([$id]);
  $legacy=story_enroll($id,$key);
  echo json_encode(['students'=>$result,'legacy'=>$legacy]);
 } finally {
  foreach($ids as $id)$p->prepare('DELETE FROM students WHERE stu_id=? AND name=?')->execute([$id,'Dual story test']);
  $p->prepare('DELETE FROM ck_story_allocation WHERE study_key=?')->execute([$key]);
 }`,[tag]);
 assert.deepEqual(out.students.map(x=>x.code),['1-1','1-2','2-1','2-2','1-1']);
 assert.ok(out.students.every(x=>x.same));
 assert.deepEqual(out.students.map(x=>x.order),[['cake','drink'],['drink','cake'],['cake','drink'],['drink','cake'],['cake','drink']]);
 assert.equal(out.legacy,null);
});

test('installing tables alone does not enroll real students before explicit launch',()=>{
 const enabled=phpJson(`require 'api/src/stories.php';putenv('STORY_STUDY_ENABLED=0');echo json_encode(story_enabled());`);
 assert.equal(enabled,false);
});
