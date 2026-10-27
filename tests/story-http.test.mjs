import test from 'node:test';
import assert from 'node:assert/strict';
import {storyServer,phpJson,elapseIntroduction} from './story-harness.mjs';

test('all four assignments must rest three minutes and refresh cannot bypass the server',async t=>{
 const server=await storyServer(t);
 for(const code of ['1-1','1-2','2-1','2-2']){
  const s=await server.student();assert.equal(s.login.group,code);
  const state=await server.api(s,'state');
  phpJson(`require 'api/src/db.php';db()->prepare('UPDATE ck_story_runs SET finished_at=? WHERE id=?')->execute([date('Y-m-d H:i:s'),$argv[1]]);echo '{}';`,[String(state.runId)]);
  const rest=await server.api(s,'state');assert.ok(rest.nextStory.breakRemaining>=178&&rest.nextStory.breakRemaining<=180);
  assert.equal((await server.api(s,'nextStory',{runId:state.runId})).status,409);
  assert.ok((await server.api(s,'state')).nextStory.breakRemaining>0);
  phpJson(`require 'api/src/db.php';db()->prepare('UPDATE ck_story_runs SET finished_at=? WHERE id=?')->execute([date('Y-m-d H:i:s',time()-181),$argv[1]]);echo '{}';`,[String(state.runId)]);
  assert.equal((await server.api(s,'nextStory',{runId:state.runId})).status,200);
  assert.equal((await server.api(s,'state')).story.position,2);
 }
});

test('two-story students can complete pre-survey and post-survey only after both stories',async t=>{
 const server=await storyServer(t,{SURVEYCAKE_PRE_URL:'http://127.0.0.1/pre',SURVEYCAKE_POST_URL:'http://127.0.0.1/post'}),s=await server.student();
 const survey=async(kind,complete=false)=>{
  const res=await fetch(server.base+'/api/public/ck_survey.php?kind='+kind,{method:complete?'POST':'GET',headers:{Cookie:s.cookie,'Content-Type':'application/json'},body:complete?JSON.stringify({kind,action:'complete'}):undefined});
  return {status:res.status,body:await res.text()};
 };
 let r=await survey('pre');assert.equal(r.status,200);assert.equal(JSON.parse(r.body).configured,true);
 r=await survey('pre',true);assert.equal(JSON.parse(r.body).completed,true);
 assert.equal((await survey('post')).status,409);
 phpJson(`require 'api/src/story_game.php';$runs=story_runs($argv[1]);foreach($runs as $r)db()->prepare('UPDATE ck_story_runs SET finished_at=NOW() WHERE id=?')->execute([$r['id']]);db()->prepare('UPDATE ck_story_studies SET current_position=2,completed_at=NOW() WHERE stu_id=?')->execute([$argv[1]]);echo '{}';`,[s.id]);
 assert.equal((await survey('post')).status,200);
 assert.equal(JSON.parse((await survey('post',true)).body).completed,true);
 assert.equal((await server.api(s,'state')).postCompleted,true);
 const count=phpJson(`require 'api/src/db.php';$q=db()->prepare('SELECT COUNT(*) FROM ck_runs WHERE stu_id=?');$q->execute([$argv[1]]);echo $q->fetchColumn();`,[s.id]);assert.equal(count,0);
});

test('students who already took the pre-survey can skip it without being marked completed',async t=>{
 const server=await storyServer(t,{SURVEYCAKE_PRE_URL:'http://127.0.0.1/pre',SURVEYCAKE_POST_URL:'http://127.0.0.1/post'}),s=await server.student();
 const post=async body=>{const res=await fetch(server.base+'/api/public/ck_survey.php',{method:'POST',headers:{Cookie:s.cookie,'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:res.status,body:await res.text()};};
 let r=await post({kind:'pre',action:'skip'});assert.equal(r.status,200);assert.equal(JSON.parse(r.body).skipped,true);
 const row=phpJson(`require 'api/src/db.php';$q=db()->prepare("SELECT (SELECT COUNT(*) FROM ck_surveys WHERE stu_id=? AND kind='pre' AND completed_at IS NOT NULL) done,(SELECT COUNT(*) FROM ck_events WHERE stu_id=? AND phase='survey' AND event='skip') skips");$q->execute([$argv[1],$argv[1]]);echo json_encode($q->fetch());`,[s.id]);
 assert.equal(Number(row.done),0);assert.equal(Number(row.skips),1);
 assert.equal((await post({kind:'post',action:'skip'})).status,409);
});

test('a student cannot write another student or future story, read their feedback, or skip missing media',async t=>{
 const server=await storyServer(t,{}, {media:'missing'}),a=await server.student(),b=await server.student();
 const first=await server.api(a,'state'),other=await server.api(b,'state');
 assert.equal(other.level.video.available,false);
 assert.equal((await fetch(server.base+'/'+other.level.video.src)).status,404);
 assert.equal((await server.api(a,'onboarding',{runId:other.runId,step:2})).status,409);
 assert.equal((await server.api(a,'feedback',{runId:other.runId,levelNo:1})).status,404);
 const future=phpJson(`require 'api/src/stories.php';echo story_runs($argv[1])[1]['id'];`,[a.id]);
 assert.equal((await server.api(a,'onboarding',{runId:future,step:2})).status,409);
 await elapseIntroduction(server,b,other.runId);await server.api(b,'onboarding',{runId:other.runId,step:3});
 assert.equal((await server.api(b,'video',{runId:other.runId,levelNo:1,position:10,duration:10,completed:true})).status,409);
 const state=await server.api(b,'state');assert.equal(state.progress.phase,'video');assert.equal(state.videoProgress.completed,false);
 assert.equal((await server.api(a,'state')).onboardingStep,first.onboardingStep);
});

test('HTTP login joins the new study, restores state, rejects strangers and protects private story files',async t=>{
 const server=await storyServer(t),s=await server.student();
 assert.equal(s.login.success,true);assert.equal(s.login.group,'1-1');
 const state=await server.api(s,'state');assert.equal(state.status,200);assert.equal(state.story.id,'cake');
 assert.equal((await server.api(null,'state')).status,401);
 const denied=await server.api(s,'onboarding',{runId:state.runId+999,step:2});assert.equal(denied.status,409);
 const good=await elapseIntroduction(server,s,state.runId);assert.equal(good.step,2);
 assert.equal((await server.api(s,'state')).onboardingStep,2);
 assert.equal((await fetch(server.base+'/api/stories/cake-20260929.json')).status,404);
 const legacy=await fetch(server.base+'/api/public/ck_results.php',{headers:{Cookie:s.cookie}});assert.equal(legacy.status,409);
 assert.match((await legacy.json()).message,/兩個故事/);
 const count=phpJson(`require 'api/src/db.php';$q=db()->prepare('SELECT COUNT(*) FROM ck_runs WHERE stu_id=?');$q->execute([$argv[1]]);echo $q->fetchColumn();`,[s.id]);assert.equal(count,0);
});

test('teacher-handled completion releases two separate story results only after both stories finish',async t=>{
 const server=await storyServer(t),s=await server.student(),state=await server.api(s,'state');
 assert.equal((await server.api(s,'results')).status,409);
 assert.equal((await server.api(s,'release',{runId:state.runId})).status,409);
 const ids=phpJson(`require 'api/src/story_game.php';$runs=story_runs($argv[1]);foreach($runs as $i=>$r){for($n=1;$n<=6;$n++){$w=story_work((int)$r['id'],$n);$w['answer']=['score'=>$i===0?1:2,'placements'=>[],'evidence'=>[],'pick'=>'1','reason'=>'Synthetic','timedOut'=>false];story_save_work((int)$r['id'],$n,$w);}db()->prepare("UPDATE ck_story_runs SET level_no=7,finished_at=NOW() WHERE id=?")->execute([$r['id']]);}db()->prepare('UPDATE ck_story_studies SET current_position=2,completed_at=NOW() WHERE stu_id=?')->execute([$argv[1]]);echo json_encode(array_column($runs,'id'));`,[s.id]);
 assert.equal((await server.api(s,'results')).status,409);
 assert.equal((await server.api(s,'release',{runId:ids[1]})).success,true);
 const results=await server.api(s,'results');assert.equal(results.status,200);
 assert.deepEqual(results.stories.map(x=>x.storyId),['cake','drink']);assert.deepEqual(results.stories.map(x=>x.score),[6,12]);
 assert.equal(results.score,undefined);assert.equal(results.stories[1].characters[0].name,'周一興');
 assert.ok(results.stories.every(x=>x.truth.body));
});

test('feedback keeps control answers private while experimental students see scored explanations and cached AI',async t=>{
 const server=await storyServer(t);const students=[await server.student(),await server.student(),await server.student()];
 const answer=(run)=>phpJson(`require 'api/src/story_game.php';$run=(int)$argv[1];db()->prepare("UPDATE ck_story_runs SET phase='feedback',onboarding_step=3 WHERE id=?")->execute([$run]);$w=story_work($run,1);$w['answer']=['score'=>1,'placements'=>['1'=>'reasonable'],'evidence'=>['1'=>['zone'=>'reasonable','isCorrect'=>true]],'pick'=>'1','reason'=>'我引用了第一位角色的觀察。','timedOut'=>false];story_save_work($run,1,$w);echo '{}';`,[String(run)]);
 // 第一個故事是前測：控制組不揭露、也不呼叫 AI
 const control=await server.api(students[0],'state');answer(control.runId);
 let r=await server.api(students[0],'feedback',{runId:control.runId,levelNo:1});
 assert.equal(r.status,200);assert.equal(r.detailed,false);assert.equal(r.testimonies,undefined);assert.equal(r.totalScore,undefined);
 assert.equal(r.readingRemaining,null);
 await server.api(students[0],'feedback',{runId:control.runId,levelNo:1});
 // 實驗組的前測同樣不揭露、不呼叫 AI
 const exp=students[2],pre=await server.api(exp,'state');answer(pre.runId);
 r=await server.api(exp,'feedback',{runId:pre.runId,levelNo:1});
 assert.equal(r.status,200);assert.equal(r.detailed,false);assert.equal(r.testimonies,undefined);
 assert.equal(r.score,1);assert.equal(r.totalScore,1);assert.equal(r.aiSkipped,true);assert.equal(r.ai,null);
 assert.equal(r.readingRemaining,30);
 phpJson(`require 'api/src/story_game.php';$w=story_work((int)$argv[1],1);$w['timers']['feedback']=microtime(true)-20;story_save_work((int)$argv[1],1,$w);echo '{}';`,[String(pre.runId)]);
 const resumed=await server.api(exp,'feedback',{runId:pre.runId,levelNo:1});assert.ok(resumed.readingRemaining<=10&&resumed.readingRemaining>=9);
 assert.equal(server.requests.length,0);
 // 實驗組第二個故事：逐則解析與 AI 評語，第二次讀取用快取
 const second=phpJson(`require 'api/src/stories.php';$r=story_runs($argv[1]);db()->prepare('UPDATE ck_story_runs SET finished_at=NOW() WHERE id=?')->execute([$r[0]['id']]);db()->prepare('UPDATE ck_story_studies SET current_position=2 WHERE stu_id=?')->execute([$argv[1]]);echo $r[1]['id'];`,[exp.id]);
 answer(second);
 r=await server.api(exp,'feedback',{runId:second,levelNo:1});
 assert.equal(r.status,200);assert.equal(r.detailed,true);assert.equal(r.totalScore,1);assert.ok(r.testimonies['1'].criterion);assert.ok(r.ai);assert.equal(r.aiSkipped,false);
 assert.equal(r.readingRemaining,30);
 await server.api(exp,'feedback',{runId:second,levelNo:1});
 assert.equal(server.requests.length,1);
});

test('streamed questioning persists per-story messages and refuses expired questions',async t=>{
 const server=await storyServer(t),s=await server.student();const state=await server.api(s,'state');
 phpJson(`require 'api/src/story_game.php';$run=(int)$argv[1];db()->prepare("UPDATE ck_story_runs SET phase='interrogation',onboarding_step=3 WHERE id=?")->execute([$run]);$w=story_work($run,1);$w['timers']['interrogation']=microtime(true);story_save_work($run,1,$w);echo '{}';`,[String(state.runId)]);
 const res=await fetch(server.base+'/api/public/story.php?action=chat',{method:'POST',headers:{Cookie:s.cookie,'Content-Type':'application/json'},body:JSON.stringify({runId:state.runId,levelNo:1,charKey:'1',message:'你看到了什麼？'})});
 assert.equal(res.status,200);const events=(await res.text()).trim().split('\n').map(JSON.parse);
 assert.ok(events.some(x=>x.t==='delta'));assert.equal(events.at(-1).t,'done');assert.equal(events.at(-1).aiOk,true);
 const after=await server.api(s,'state');assert.deepEqual(after.chat.map(x=>x.role),['player','character']);
 assert.equal(after.chat[0].content,'你看到了什麼？');assert.equal(server.requests.length,1);
 phpJson(`require 'api/src/story_game.php';$w=story_work((int)$argv[1],1);$w['timers']['interrogation']-=245;story_save_work((int)$argv[1],1,$w);echo '{}';`,[String(state.runId)]);
 assert.equal((await server.api(s,'chat',{runId:state.runId,levelNo:1,charKey:'1',message:'Too late'})).status,409);
});
