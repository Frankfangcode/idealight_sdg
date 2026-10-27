import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {storyServer,phpJson,elapseIntroduction} from './story-harness.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');

async function open(t,server,s){
 const browser=await chromium.launch({headless:true,channel:'chrome'});const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1});
 await context.addCookies([{name:'PHPSESSID',value:s.cookie.split('=')[1],url:server.base}]);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 t.after(async()=>{await browser.close();assert.deepEqual(errors,[]);});
 await page.goto(server.base+'/control/game.html');return page;
}

test('completed video counts down then automatically opens testimony, whose minute also advances',async t=>{
 const server=await storyServer(t,{}, {media:'present'});await server.student();const s=await server.student(),state=await server.api(s,'state');
 phpJson(`require 'api/src/db.php';db()->prepare('UPDATE ck_story_runs SET onboarding_step=3 WHERE id=?')->execute([$argv[1]]);echo '{}';`,[String(state.runId)]);
 const page=await open(t,server,s);await page.locator('#introVideo').waitFor();
 assert.equal(await page.locator('#timer').count(),0,'No ten-second timer before the video ends');
 await page.locator('#introVideo').evaluate(async v=>{v.muted=true;await v.play();});
 await page.locator('[data-action=videoDone]:not([hidden])').waitFor();
 assert.match(await page.locator('#topbarRight #timer').innerText(),/0:(10|09)/);
 await page.reload();await page.locator('#timer').waitFor();
 assert.equal(await page.locator('#videoStart').isHidden(),true,'A completed video must not request playback again after reload');
 assert.match(await page.locator('#videoStatus').innerText(),/已看完/);
 await page.locator('.tgrid').waitFor({timeout:13000});
 assert.equal((await server.api(s,'state')).progress.phase,'testimony');
 assert.match(await page.locator('#timer').innerText(),/1:00|0:5\d/);
 assert.equal(await page.locator('[data-action=toInterrogation]').isDisabled(),true);
 phpJson(`require 'api/src/story_game.php';$w=story_work((int)$argv[1],1);$w['timers']['testimony']=microtime(true)-59;story_save_work((int)$argv[1],1,$w);echo '{}';`,[String(state.runId)]);
 await page.reload();await page.locator('#askInput').waitFor({timeout:6000});
 assert.equal((await server.api(s,'state')).progress.phase,'interrogation');
});

test('mixed testimony cards fill each column without large holes and preserve reading controls',async t=>{
 const server=await storyServer(t);await server.student();const s=await server.student(),state=await server.api(s,'state');
 phpJson(`require 'api/src/db.php';db()->prepare("UPDATE ck_story_runs SET phase='testimony',onboarding_step=3 WHERE id=?")->execute([$argv[1]]);echo '{}';`,[String(state.runId)]);
 const page=await open(t,server,s),cards=page.locator('.tgrid .tcard');await cards.first().waitFor();
 await cards.nth(0).click();await cards.nth(1).click();
 const gaps=()=>cards.evaluateAll(es=>[0,1,2].map(i=>es[i+3].getBoundingClientRect().top-es[i].getBoundingClientRect().bottom));
 await page.waitForTimeout(100);
 assert.ok((await gaps()).every(g=>g>=8&&g<=28),`Gaps between cards in each column: ${await gaps()}`);
 await cards.nth(0).click();await page.waitForTimeout(100);
 assert.ok((await gaps()).every(g=>g>=8&&g<=28));
 await page.setViewportSize({width:375,height:812});await page.waitForTimeout(100);
 const bounds=await cards.evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right};}));
 for(let i=1;i<bounds.length;i++){assert.ok(bounds[i].top>=bounds[i-1].bottom);assert.equal(bounds[i].left,bounds[0].left);}
 assert.ok(bounds.every(r=>r.right<=375));
 for(let i=0;i<6;i++){if(await cards.nth(i).getAttribute('aria-expanded')==='false')await cards.nth(i).click();}
 assert.equal(await page.getByRole('button',{name:'進入訊問階段',exact:true}).isEnabled(),true);
 await page.getByRole('button',{name:'進入訊問階段',exact:true}).click();
 await page.locator('#askInput').waitFor();
 assert.equal((await server.api(s,'state')).progress.phase,'interrogation');
});

test('each story loads its supplied portraits on introduction, testimony and interrogation',async t=>{
 const server=await storyServer(t);
 const names=['zhou_yixing','bai_erqing','gu_sanyao','han_sicheng','xia_wuqiao','tang_liuya'];
 for(const story of ['cake','drink']){
  const s=await server.student(),state=await server.api(s,'state'),page=await open(t,server,s);
  assert.equal(state.story.id,story);
  const paths=Array.from({length:6},(_,i)=>story==='cake'?`media/cake/char_${i+1}.jpg`:`media/drink/ref_${names[i]}.jpeg`);
  await page.locator('.roster').waitFor();
  assert.deepEqual(await page.locator('.roster__photo').evaluateAll(es=>es.map(e=>e.getAttribute('src'))),paths.map(p=>'../'+p));
  await page.locator('.roster__photo').evaluateAll(es=>Promise.all(es.map(e=>e.decode())));
  const phase=p=>phpJson(`require 'api/src/story_game.php';$id=(int)$argv[1];db()->prepare('UPDATE ck_story_runs SET phase=?,onboarding_step=3 WHERE id=?')->execute([$argv[2],$id]);$w=story_work($id,1);$w['timers'][$argv[2]]=microtime(true);story_save_work($id,1,$w);echo '{}';`,[String(state.runId),p]);
  const assertPhoto=async(locator,path)=>{
   const url=await locator.evaluate(e=>getComputedStyle(e).backgroundImage);
   assert.ok(url.includes(path),url);
   await locator.evaluate(e=>new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=()=>reject(Error('portrait failed'));i.src=getComputedStyle(e).backgroundImage.slice(5,-2);}));
  };
  phase('testimony');await page.reload();await page.locator('.tcard__photo').first().waitFor();
  for(let i=0;i<6;i++)await assertPhoto(page.locator(`.tcard__photo[data-key="${i+1}"]`),paths[i]);
  phase('interrogation');await page.reload();
  for(let i=0;i<6;i++){
   await page.locator(`[data-action="pick"][data-key="${i+1}"]`).click();
   await assertPhoto(page.locator('.chat__portrait'),paths[i]);
   await assertPhoto(page.locator(`[data-action="pick"][data-key="${i+1}"] .avatar`),paths[i]);
  }
 }
});

test('experimental first-story feedback shows classification score without explanations or AI',async t=>{
 const server=await storyServer(t);await server.student();await server.student();const s=await server.student();
 const state=await server.api(s,'state');
 phpJson(`require 'api/src/story_game.php';$id=(int)$argv[1];db()->prepare("UPDATE ck_story_runs SET phase='feedback',onboarding_step=3 WHERE id=?")->execute([$id]);$w=story_work($id,1);$w['answer']=['score'=>2,'placements'=>[],'evidence'=>[],'pick'=>'1','reason'=>'Synthetic','timedOut'=>false];story_save_work($id,1,$w);echo '{}';`,[String(state.runId)]);
 const page=await open(t,server,s);
 await page.locator('.feedback-score').waitFor({timeout:4000});
 assert.match(await page.locator('.feedback-score').innerText(),/本關得分\s*2\s*\/6/);
 assert.equal(await page.getByRole('heading',{name:'你的推理評語',exact:true}).count(),0);
 assert.equal(server.requests.length,0);
 assert.match(await page.locator('#feedbackClock').innerText(),/0:(30|29)/);
 phpJson(`require 'api/src/story_game.php';$w=story_work((int)$argv[1],1);$w['timers']['feedback']=microtime(true)-29;story_save_work((int)$argv[1],1,$w);echo '{}';`,[String(state.runId)]);
 await page.reload();await page.locator('#introVideo').waitFor({timeout:6000});
 assert.equal((await server.api(s,'state')).progress.levelNo,2);
});
test('character introduction counts down and starts the investigation without a duplicate instructions page',async t=>{
 const server=await storyServer(t),s=await server.student(),page=await open(t,server,s);
 await page.locator('#introClock').waitFor({timeout:4000});
 assert.equal(await page.locator('[data-action=start]').isDisabled(),true);
 assert.match(await page.locator('#introClock').innerText(),/^0:2[0-5]$/);
 assert.equal(await page.locator('#topbarRight #introClock').count(),1,'Introduction countdown belongs in the same top-right area as stage timers');
 assert.equal(await page.locator('#introClock').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=24),true);
 const state=await server.api(s,'state');
 phpJson(`require 'api/src/db.php';db()->prepare("UPDATE ck_story_events SET payload=? WHERE run_id=? AND event_key='onboarding-clock'")->execute([json_encode(['startedAt'=>microtime(true)-24]),$argv[1]]);echo '{}';`,[String(state.runId)]);
 await page.reload();
 await page.locator('#introVideo').waitFor({timeout:5000});
 assert.equal(await page.getByRole('heading',{name:'調查須知',exact:true}).count(),0);
 assert.equal((await server.api(s,'state')).onboardingStep,3);
});

test('consent presents investigation instructions below the timeline and starts the game without a pre-survey',async t=>{
 const server=await storyServer(t),s=await server.student(),page=await open(t,server,s);
 await page.goto(server.base+'/control/consent.html');
 await page.locator('#story-overview').waitFor({timeout:4000});
 const instructions=page.locator('#story-overview > p').first();
 await instructions.waitFor({timeout:4000});
 assert.equal(await instructions.evaluate(e=>!!(document.querySelector('img[src*="experiment-timeline"]').compareDocumentPosition(e)&Node.DOCUMENT_POSITION_FOLLOWING)),true);
 assert.equal(await page.locator('#start-btn').isDisabled(),true);
 assert.equal(await page.locator('img[src*="experiment-overview"]').isVisible(),false);
 await page.locator('#agree').check();await page.locator('#start-btn').click();
 await page.waitForURL('**/game.html',{timeout:4000});
});
test('hidden pre-survey redirects without recording completion and post-survey uses the new link',async t=>{
 const server=await storyServer(t,{SURVEYCAKE_POST_URL:'https://www.surveycake.com/s/1QN67'}),s=await server.student(),page=await open(t,server,s);
 await page.route('https://www.surveycake.com/**',route=>route.fulfill({contentType:'text/html',body:'<p>Survey fixture</p>'}));
 await page.goto(server.base+'/control/survey.html?kind=pre');
 await page.waitForURL('**/game.html',{timeout:4000});
 const rows=phpJson(`require 'api/src/db.php';$q=db()->prepare("SELECT COUNT(*) FROM ck_surveys WHERE stu_id=? AND kind='pre'");$q->execute([$argv[1]]);echo $q->fetchColumn();`,[s.id]);assert.equal(rows,0);
 phpJson(`require 'api/src/story_game.php';foreach(story_runs($argv[1]) as $r)db()->prepare('UPDATE ck_story_runs SET finished_at=NOW() WHERE id=?')->execute([$r['id']]);db()->prepare('UPDATE ck_story_studies SET current_position=2,completed_at=NOW() WHERE stu_id=?')->execute([$argv[1]]);echo '{}';`,[s.id]);
 await page.goto(server.base+'/control/survey.html?kind=post');await page.locator('iframe').waitFor();
 const url=new URL(await page.locator('iframe').getAttribute('src'));assert.equal(url.origin+url.pathname,'https://www.surveycake.com/s/1QN67');assert.equal(url.searchParams.get('stu_id'),s.id);
 assert.equal(await page.locator('#skip').count(),0);
});
test('drink interrogation identifies its own character and classification shows valid counts and instructions',async t=>{
 const server=await storyServer(t);await server.student();const s=await server.student();const state=await server.api(s,'state');
 const phase=p=>phpJson(`require 'api/src/story_game.php';$id=(int)$argv[1];db()->prepare('UPDATE ck_story_runs SET phase=?,onboarding_step=3 WHERE id=?')->execute([$argv[2],$id]);$w=story_work($id,1);$w['timers'][$argv[2]]=microtime(true);story_save_work($id,1,$w);echo '{}';`,[String(state.runId),p]);
 phase('interrogation');const page=await open(t,server,s);
 await page.locator('[data-action="pick"][data-key="1"]').click();
 assert.equal(await page.locator('.chat__portrait[data-key="1"]').count(),1);
 assert.match(await page.locator('.chat__portrait').evaluate(e=>getComputedStyle(e).backgroundImage),/media\/drink\/ref_zhou_yixing\.jpeg/);
 phase('combined');await page.reload();await page.locator('.zone__hint').first().waitFor();
 const text=await page.locator('#main').innerText();assert.doesNotMatch(text,/undefined|NaN/);assert.match(text,/2 則合理、4 則有瑕疵/);
});
test('drink uses its own characters, saves onboarding and clearly blocks a missing video',async t=>{
 const server=await storyServer(t,{}, {media:'missing'});await server.student();const s=await server.student();const page=await open(t,server,s);
 await page.getByRole('button',{name:'開始調查',exact:true}).waitFor();
 assert.match(await page.locator('#main').innerText(),/周一興/);
 assert.equal(await page.locator('.roster img[src*="img/game/char_"]').count(),0);
 await elapseIntroduction(server,s,(await server.api(s,'state')).runId);await page.reload();
 await page.getByText('本關影片素材待補',{exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'看六人的發言',exact:true}).count(),0);
 await page.reload();await page.getByText('本關影片素材待補',{exact:true}).waitFor();
 assert.equal((await server.api(s,'state')).onboardingStep,3);
});

test('available drink video plays to completion and unlocks testimony in an isolated site',async t=>{
 const server=await storyServer(t,{}, {media:'present'});await server.student();const s=await server.student();
 const state=await server.api(s,'state');assert.equal(state.level.video.available,true);
 await elapseIntroduction(server,s,state.runId);await server.api(s,'onboarding',{runId:state.runId,step:3});
 const page=await open(t,server,s);
 await page.locator('#introVideo').waitFor({timeout:5000});
 assert.equal(await page.locator('#introVideo').evaluate(v=>v.controls),false);
 await page.locator('#introVideo').evaluate(async v=>{v.muted=true;await v.play();});
 await page.locator('#introVideo').evaluate(v=>v.pause());
 await page.waitForFunction(()=>!document.querySelector('#introVideo').paused,{},{timeout:1500});
 const next=page.getByRole('button',{name:'看六人的發言',exact:true});await next.waitFor({timeout:5000});
 assert.equal(await page.locator('#introVideo').evaluate(v=>v.ended),true);
 assert.equal((await server.api(s,'state')).videoProgress.completed,true);
 await next.click();
 await page.waitForFunction(()=>document.querySelector('#introVideo')===null);
 assert.equal((await server.api(s,'state')).progress.phase,'testimony');
});

test('completed stories open post-survey and released results keep both scores separate',async t=>{
 const server=await storyServer(t),s=await server.student();
 phpJson(`require 'api/src/story_game.php';$runs=story_runs($argv[1]);foreach($runs as $i=>$r){for($n=1;$n<=6;$n++){$w=story_work((int)$r['id'],$n);$w['answer']=['score'=>$i===0?1:2,'placements'=>[],'evidence'=>[],'pick'=>'1','reason'=>'Synthetic reasoning','timedOut'=>false];story_save_work((int)$r['id'],$n,$w);}db()->prepare('UPDATE ck_story_runs SET level_no=7,finished_at=NOW(),onboarding_step=3 WHERE id=?')->execute([$r['id']]);}db()->prepare('UPDATE ck_story_studies SET current_position=2,completed_at=NOW() WHERE stu_id=?')->execute([$argv[1]]);echo '{}';`,[s.id]);
 const page=await open(t,server,s);
 await page.waitForURL('**/survey.html?kind=post',{timeout:4000});
 const state=await server.api(s,'state');await server.api(s,'release',{runId:state.runId});
 await page.goto(server.base+'/control/results.html');
 await page.locator('.story-result').first().waitFor({timeout:6000});
 assert.equal(await page.locator('.story-result').count(),2);
 assert.equal(await page.locator('.story-result').nth(0).locator('.result-score').innerText(),'6 / 36');
 assert.equal(await page.locator('.story-result').nth(1).locator('.result-score').innerText(),'12 / 36');
 const drink=page.locator('.story-result').nth(1);await drink.locator('details[data-level]').first().locator('summary').click();
 await drink.getByRole('heading',{name:'你的推理評語',exact:true}).waitFor();
 assert.match(await drink.locator('.result-feedback').first().innerText(),/周一興/);
});

test('finished first story enforces the three-minute break, then opens a clean second story',async t=>{
 const server=await storyServer(t),s=await server.student();const state=await server.api(s,'state');
 phpJson(`require 'api/src/story_game.php';$id=(int)$argv[1];for($n=1;$n<=6;$n++){$w=story_work($id,$n);$w['answer']=['score'=>1,'placements'=>[],'evidence'=>[],'pick'=>'1','reason'=>'CAKE_ONLY','timedOut'=>false];story_save_work($id,$n,$w);}db()->prepare("UPDATE ck_story_runs SET level_no=7,finished_at=NOW(),onboarding_step=3 WHERE id=?")->execute([$id]);echo '{}';`,[String(state.runId)]);
 phpJson(`require 'api/src/db.php';db()->prepare("UPDATE ck_story_runs SET level_no=6,phase='feedback',finished_at=NULL WHERE id=?")->execute([$argv[1]]);echo '{}';`,[String(state.runId)]);
 const page=await open(t,server,s);
 await page.getByRole('button',{name:'完成這個故事',exact:true}).click({timeout:6000});
 const rest=page.getByRole('button',{name:'休息結束後才能開始',exact:true});await rest.waitFor({timeout:6000});
 assert.equal(await rest.isDisabled(),true);assert.match(await page.locator('#breakClock').innerText(),/^(3:00|2:5\d)$/);
 assert.match(await page.locator('#main').innerText(),/第九杯飲料/);
 assert.equal((await server.api(s,'nextStory',{runId:state.runId})).status,409);
 phpJson(`require 'api/src/db.php';db()->prepare('UPDATE ck_story_runs SET finished_at=? WHERE id=?')->execute([date('Y-m-d H:i:s',time()-181),$argv[1]]);echo '{}';`,[String(state.runId)]);
 await page.reload();
 await page.getByRole('button',{name:'開始下一個故事',exact:true}).waitFor({timeout:6000});
 assert.equal((await server.api(s,'state')).story.id,'cake');
 await page.getByRole('button',{name:'開始下一個故事',exact:true}).click();
 await page.getByRole('button',{name:'開始調查',exact:true}).waitFor();
 assert.match(await page.locator('#main').innerText(),/周一興/);
 assert.equal((await server.api(s,'state')).story.id,'drink');
 assert.ok(!(await page.locator('#main').innerText()).includes('CAKE_ONLY'));
});
