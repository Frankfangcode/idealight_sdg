import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openUi,uiState,uiFeedback} from './ui-harness.mjs';

test('allowed autoplay starts without player controls and unlocks next only after viewing is saved',async t=>{
 const {page,requests}=await openUi(t);
 await page.locator('video').waitFor();
 assert.equal(await page.getByRole('button',{name:'誰該負責？'}).isVisible(),false);
 await page.waitForFunction(()=>document.querySelector('video').currentTime>0,{},{timeout:3000});
 assert.equal(await page.locator('video').evaluate(v=>v.controls),false);
 await page.getByRole('button',{name:'誰該負責？'}).waitFor();
 assert.ok(requests.some(r=>r.name==='ck_video.php'&&r.body.completed===true));
 await page.getByRole('button',{name:'誰該負責？'}).click();
 await page.getByRole('heading',{name:'六個人，六種說法'}).waitFor();
});

test('blocked autoplay offers a start action and keeps completion locked until playback finishes',async t=>{
 const {page}=await openUi(t,{before:page=>page.addInitScript(()=>{
  const play=HTMLMediaElement.prototype.play;let first=true;
  HTMLMediaElement.prototype.play=function(){if(first){first=false;return Promise.reject(new DOMException('Autoplay blocked','NotAllowedError'));}return play.call(this);};
 })});
 const start=page.getByRole('button',{name:'開始播放',exact:true});
 await start.waitFor({timeout:3000});
 assert.equal(await page.getByRole('button',{name:'誰該負責？'}).isVisible(),false);
 await start.click();
 await page.waitForFunction(()=>document.querySelector('video').currentTime>0);
 assert.equal(await start.isVisible(),false);
 await page.getByRole('button',{name:'誰該負責？'}).waitFor();
});

test('failed media can be reloaded and played without exposing controls or skipping the completion gate',async t=>{
 let fail=true;
 const {page}=await openUi(t,{state:uiState({onboardingStep:3}),before:page=>page.route('**/media/*.mp4',route=>fail?route.fulfill({status:404,body:''}):route.continue())});
 await page.getByRole('button',{name:'重新載入影片'}).waitFor();
 assert.equal(await page.getByRole('button',{name:'看六人的發言'}).isVisible(),false);
 fail=false;await page.getByRole('button',{name:'重新載入影片'}).click();
 await page.waitForFunction(()=>document.querySelector('video').currentTime>0,{},{timeout:3000});
 assert.equal(await page.locator('video').evaluate(v=>v.controls),false);
 await page.getByRole('button',{name:'看六人的發言'}).waitFor();
});

test('feedback header shows the newly earned score and stays visible while explanations scroll',async t=>{
 const state=uiState({onboardingStep:3,totalScore:6,progress:{levelNo:1,phase:'feedback',finished:false,remaining:null},
  placements:{'1':'reasonable','2':'reasonable','3':'reasonable','4':'reasonable','5':'flaw','6':'flaw'},judgment:{pick_char:'3',reason:'間接線索不足以指認人。'}});
 const {page}=await openUi(t,{state,feedback:uiFeedback()});
 const score=page.locator('.modal__head .feedback-score');
 await score.waitFor({timeout:3000});
 assert.match(await score.innerText(),/4\s*\/\s*6/);
 assert.match(await score.innerText(),/10\s*\/\s*36/);
 assert.match(await page.locator('.score-progress').innerText(),/10\/36/);
 await page.locator('.modal__body').evaluate(e=>e.scrollTop=e.scrollHeight);
 const rect=await score.boundingBox();assert.ok(rect.y>=0&&rect.y+rect.height<800);
});

test('control-group completion does not reveal scores or teaching feedback',async t=>{
 const state=uiState({onboardingStep:3,hasAiFeedback:false,totalScore:undefined,
  progress:{levelNo:1,phase:'feedback',finished:false,remaining:null},judgment:{pick_char:'3',reason:'間接線索不足以指認人。'}});
 const {page}=await openUi(t,{state,feedback:uiFeedback(false)});
 await page.getByText('本關作答已保存。完成後測問卷後，可查看總分與解析。',{exact:true}).waitFor();
 assert.equal(await page.locator('.feedback-score,.feedback-subtitle,.fbitem').count(),0);
 assert.doesNotMatch(await page.locator('.score-progress').innerText(),/得分|\/36/);
 assert.equal(await page.getByRole('button',{name:'確認，進入下一關',exact:true}).isVisible(),true);
});

test('a failed viewing save can be retried without replaying or unlocking early',async t=>{
 let failed=false;
 const {page}=await openUi(t,{apiHandler:async({route,name,body})=>{
  if(name==='ck_video.php'&&body.completed&&!failed){failed=true;await route.fulfill({status:503,json:{success:false,message:'暫時無法保存'}});return true;}
 }});
 await page.getByRole('button',{name:'重試保存',exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'誰該負責？'}).isVisible(),false);
 assert.equal(await page.locator('video').evaluate(v=>v.ended),true);
 await page.getByRole('button',{name:'重試保存',exact:true}).click();
 await page.getByRole('button',{name:'誰該負責？'}).waitFor();
 assert.equal(await page.locator('video').evaluate(v=>v.ended),true);
});
