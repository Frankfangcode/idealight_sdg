import {test} from 'node:test';import assert from 'node:assert/strict';import {student,base,sql,phase} from './helpers.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || '/tmp/idealight-revision/browser/node_modules/playwright/index.mjs');
async function pageFor(s){
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1});
 await context.addCookies([{name:'PHPSESSID',value:s.cookie.split('=')[1],url:base}]);
 const page=await context.newPage();browser.pageErrors=[];page.on('pageerror',e=>browser.pageErrors.push(e.message));
 await page.route('**/media/*.mp4',route=>route.fulfill({path:'/tmp/idealight-revision/test-video.mp4',contentType:'video/mp4'}));
 return {browser,page};
}
test('onboarding shows one task per page and unlocks next only after video ends',async()=>{
 const s=await student('2');const {browser,page}=await pageFor(s);
 try{
 await page.goto(base+'/control/game.html');
 await page.getByRole('heading',{name:'觀看調查說明'}).waitFor({timeout:5000});
 assert.equal(await page.getByRole('button',{name:'誰該負責？'}).isVisible(),false);
 await page.locator('video').evaluate(v=>v.play());
 await page.getByRole('button',{name:'誰該負責？'}).click();
 await page.getByRole('heading',{name:'六個人，六種說法'}).waitFor();
 assert.equal(await page.locator('.roster__item').count(),6);
 await page.getByRole('button',{name:'調查須知'}).click();
 await page.getByRole('button',{name:'開始調查'}).click();
 await page.locator('#introVideo').waitFor();
 assert.equal(await page.getByRole('button',{name:'看六人的發言'}).isVisible(),false);
 await page.locator('video').evaluate(v=>v.play());
 await page.getByRole('button',{name:'看六人的發言'}).click();
 await page.locator('.tgrid').waitFor();
 }finally{await browser.close();assert.deepEqual(browser.pageErrors,[]);}
});
test('combined page preserves editable classifications and reasoning after reload, then submits once',async()=>{
 const s=await student('2');phase(s,'combined');
 sql(`UPDATE ck_run_settings SET onboarding_step=3 WHERE run_id=(SELECT id FROM ck_runs WHERE stu_id='${s.id}')`);
 const {browser,page}=await pageFor(s);
 try{
 await page.goto(base+'/control/game.html');
 await page.locator('#reason').waitFor({timeout:5000});
 for(const k of ['1','2','3','4','5','6'])await page.locator(`[data-action="assign"][data-key="${k}"][data-to="flaw"]`).click();
 await page.locator('[data-action="pickWorst"][data-key="3"]').click();
 await page.locator('#reason').fill('看到片段不等於能證明他拿走蛋糕。');
 await page.waitForFunction(()=>document.querySelector('#saveStatus')?.textContent==='草稿已保存');
 await page.reload();await page.locator('#reason').waitFor();
 assert.equal(await page.locator('#reason').inputValue(),'看到片段不等於能證明他拿走蛋糕。');
 await page.locator('[data-action="assign"][data-key="1"][data-to="reasonable"]').click();
 assert.equal(await page.locator('#reason').inputValue(),'看到片段不等於能證明他拿走蛋糕。');
 await page.getByRole('button',{name:'送出本關作答',exact:true}).click();
 await page.getByRole('button',{name:'確認送出',exact:true}).click();
 await page.getByText('本關作答已保存。完成後測問卷後，可查看總分與解析。').waitFor();
 assert.equal(await page.locator('.fb__score').count(),0);
 assert.equal(sql(`SELECT zone FROM ck_evidence WHERE stu_id='${s.id}' AND char_key='1'`),'reasonable');
 }finally{await browser.close();assert.deepEqual(browser.pageErrors,[]);}
});
test('post-survey results show detective rank and saved feedback with no additional questionnaire',async()=>{
 const s=await student('2');
 sql(`INSERT INTO ck_evidence(stu_id,level_no,char_key,zone,is_correct) SELECT '${s.id}',level_no,char_key,correct,1 FROM ck_testimonies; INSERT INTO ck_judgments(stu_id,level_no,pick_char,reason,is_flaw) SELECT '${s.id}',level_no,'3','觀察有時間範圍的限制。',1 FROM ck_levels; UPDATE ck_runs SET finished_at=NOW() WHERE stu_id='${s.id}'; UPDATE ck_progress SET level_no=7 WHERE stu_id='${s.id}'; INSERT INTO ck_surveys(stu_id,kind,opened_at,completed_at) VALUES('${s.id}','post',NOW(),NOW())`);
 const {browser,page}=await pageFor(s);
 try{
 await page.goto(base+'/control/results.html');
 await page.getByRole('heading',{name:'金階偵探'}).waitFor({timeout:5000});
 assert.ok((await page.locator('.detective-card').innerText()).includes('36 / 36'));
 await page.locator('.result-level summary').first().click();
 await page.getByText('你引用了觀察紀錄，但仍需要說明觀察如何支持結論，以及紀錄無法證明的部分。',{exact:true}).waitFor();
 assert.equal(await page.locator('iframe').count(),0);
 await page.getByRole('heading',{name:'沒有人單獨偷走。六個人都在。'}).waitFor({timeout:3000});
 }finally{await browser.close();assert.deepEqual(browser.pageErrors,[]);}
});
test('retry recovers when submission committed but its network response was lost',async()=>{
 const s=await student('2');phase(s,'combined');
 sql(`UPDATE ck_run_settings SET onboarding_step=3 WHERE run_id=(SELECT id FROM ck_runs WHERE stu_id='${s.id}')`);
 const {browser,page}=await pageFor(s);let lost=false;
 try{
 await page.route('**/ck_response.php',async route=>{
   if(!lost){await route.fetch();lost=true;await route.abort('failed');}else await route.continue();
 });
 await page.route('**/ck_draft.php',route=>lost?route.abort('failed'):route.continue());
 await page.goto(base+'/control/game.html');await page.locator('#reason').waitFor();
 await page.locator('#reason').fill('保留最後的理由');
 await page.waitForFunction(()=>document.querySelector('#saveStatus')?.textContent==='草稿已保存');
 sql(`UPDATE ck_phase_timers SET started_at=DATE_SUB(NOW(),INTERVAL 250 SECOND) WHERE stu_id='${s.id}'`);
 await page.reload();await page.getByRole('button',{name:'重試保存本關作答',exact:true}).waitFor({timeout:7000});
 assert.equal(lost,true);
 await page.getByRole('button',{name:'重試保存本關作答',exact:true}).click();
 await page.getByText('本關作答已保存。完成後測問卷後，可查看總分與解析。').waitFor({timeout:5000});
 assert.equal(sql(`SELECT COUNT(*) FROM ck_judgments WHERE stu_id='${s.id}'`),'1');
 }finally{await browser.close();assert.deepEqual(browser.pageErrors,[]);}
});
test('reconnect archives offline interrogation text after moving to combined',async()=>{
 const s=await student('2');phase(s,'interrogation');
 sql(`UPDATE ck_run_settings SET onboarding_step=3 WHERE run_id=(SELECT id FROM ck_runs WHERE stu_id='${s.id}')`);
 const {browser,page}=await pageFor(s);
 try{
 await page.goto(base+'/control/game.html');await page.locator('.interro').waitFor();
 // A previous tab retained this unsent text while its timer advanced on the server.
 await page.addInitScript(id=>localStorage.setItem('ck-ui-state-v2',JSON.stringify({stuId:id,levels:Array.from({length:6},(_,i)=>({draft:i===0?'斷線保存的提問':'',selected:'3',draftRevision:i===0?{interrogation:Date.now()}:{} }))})),s.id);
 phase(s,'combined');await page.reload();await page.locator('#reason').waitFor();
 await page.waitForTimeout(700);
 assert.equal(sql(`SELECT JSON_UNQUOTE(JSON_EXTRACT(payload,'$.payload.draft')) FROM ck_events WHERE stu_id='${s.id}' AND event='draft_late'`),'斷線保存的提問');
 }finally{await browser.close();assert.deepEqual(browser.pageErrors,[]);}
});
test('mobile layout keeps timer visible, escapes drafts, and shows inline final-15-second warning',async()=>{
 const s=await student('2');phase(s,'combined');
 sql(`UPDATE ck_run_settings SET onboarding_step=3 WHERE run_id=(SELECT id FROM ck_runs WHERE stu_id='${s.id}')`);
 const {browser,page}=await pageFor(s);
 try{
 await page.setViewportSize({width:375,height:812});await page.goto(base+'/control/game.html');await page.locator('#reason').waitFor();
 const text='<img src=x onerror="window.pwned=true">';await page.locator('#reason').fill(text);
 await page.waitForFunction(()=>document.querySelector('#saveStatus')?.textContent==='草稿已保存');
 sql(`UPDATE ck_phase_timers SET started_at=DATE_SUB(NOW(),INTERVAL 226 SECOND) WHERE stu_id='${s.id}'`);
 await page.reload();await page.locator('#deadlineHint').waitFor();
 assert.equal(await page.locator('#reason').inputValue(),text);assert.equal(await page.evaluate(()=>window.pwned),undefined);
 assert.equal(await page.locator('.timer').getAttribute('data-state'),'danger');
 // Calibrate overflow measurement with a known too-wide element before checking the real page.
 const result=await page.evaluate(()=>{const el=document.createElement('div');el.style.cssText='width:800px;height:1px';document.body.append(el);const detects=document.documentElement.scrollWidth>innerWidth;el.remove();return {detects,actual:document.documentElement.scrollWidth,viewport:innerWidth};});
 assert.equal(result.detects,true);assert.ok(result.actual<=result.viewport);
 assert.equal(await page.locator('[role="dialog"]').isVisible(),false);
 }finally{await browser.close();assert.deepEqual(browser.pageErrors,[]);}
});
test('finished run archives the last offline draft before redirecting to the post survey',async()=>{
 const s=await student('2');
 sql(`UPDATE ck_progress SET level_no=7 WHERE stu_id='${s.id}';UPDATE ck_runs SET finished_at=NOW() WHERE stu_id='${s.id}'`);
 const {browser,page}=await pageFor(s);
 try{
 await page.addInitScript(id=>localStorage.setItem('ck-ui-state-v2',JSON.stringify({stuId:id,levels:Array.from({length:6},(_,i)=>({draft:i===5?'第六關尚未同步的提問':'',selected:'3',draftRevision:i===5?{interrogation:Date.now()}:{} }))})),s.id);
 await page.goto(base+'/control/game.html');await page.waitForURL('**/survey.html?kind=post');
 assert.equal(sql(`SELECT JSON_UNQUOTE(JSON_EXTRACT(payload,'$.payload.draft')) FROM ck_events WHERE stu_id='${s.id}' AND event='draft_late' AND level_no=6`),'第六關尚未同步的提問');
 }finally{await browser.close();assert.deepEqual(browser.pageErrors,[]);}
});
