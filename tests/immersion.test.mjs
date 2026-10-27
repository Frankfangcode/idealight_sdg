import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openUi,uiState} from './ui-harness.mjs';

async function saveDraft({route,name,body,state}) {
 if(name!=='ck_draft.php')return false;
 const saved={payload:body.payload,revision:body.revision,frozen:false};
 state.drafts[body.phase]=saved;
 await route.fulfill({json:{success:true,saved,expired:false}});return true;
}

test('switching interview subjects shows their exact original statement and preserves the draft and shared timer',async t=>{
 const state=uiState({onboardingStep:3,progress:{levelNo:1,phase:'interrogation',finished:false,remaining:120}});
 state.level.testimonies['4'].text='我只拍到走廊。<img src=x onerror="window.pwned=true">';
 state.level.testimonies['5'].text='我看到的是系統紀錄，沒有看到拿走蛋糕的人。';
 const {page,requests}=await openUi(t,{state,apiHandler:saveDraft});
 await page.locator('.suspect[data-key="4"]').click();
 const reference=page.getByRole('complementary',{name:'羅四影的原始發言'});
 await reference.waitFor({timeout:3000});
 assert.equal(await reference.locator('blockquote').innerText(),state.level.testimonies['4'].text);
 assert.equal(await page.evaluate(()=>window.pwned),undefined);
 await page.locator('#askInput').fill('你拍攝時站在哪裡？');
 const before=await page.locator('.timer__text').innerText();
 await page.locator('.suspect[data-key="5"]').click();
 assert.equal(await page.locator('.chat__reference blockquote').innerText(),state.level.testimonies['5'].text);
 assert.equal(await page.locator('#askInput').inputValue(),'你拍攝時站在哪裡？');
 const seconds=v=>v.split(':').reduce((a,n)=>a*60+Number(n),0);
 assert.ok(seconds(await page.locator('.timer__text').innerText())<=seconds(before));
 await page.waitForFunction(()=>document.querySelector('#saveStatus').textContent==='草稿已保存');
 await page.reload();
 await page.getByRole('complementary',{name:'許五澄的原始發言'}).waitFor();
 assert.equal(await page.locator('#askInput').inputValue(),'你拍攝時站在哪裡？');
 assert.equal(requests.some(r=>r.name==='ck_chat.php'),false,'Reading the original statement must not send an AI question');
});

test('moving between classification and judgment keeps answers and restores the combined draft',async t=>{
 const state=uiState({onboardingStep:3,progress:{levelNo:1,phase:'combined',finished:false,remaining:230}});
 const {page}=await openUi(t,{state,apiHandler:saveDraft});
 await page.locator('#reasoning').waitFor({timeout:3000});
 const reasonable=await page.locator('.zone[data-zone="reasonable"]').boundingBox();
 const flaw=await page.locator('.zone[data-zone="flaw"]').boundingBox();
 const tray=await page.locator('.tray').boundingBox();
 const judgment=await page.locator('#reasoning').boundingBox();
 assert.ok(Math.abs(reasonable.y-flaw.y)<1,'The two classified groups must be comparable side by side');
 assert.ok(judgment.y>=tray.y+tray.height,'Judgment follows the complete classification area, including unclassified cards');
 await page.locator('#reason').fill('我先保留判斷，仍需要能直接支持結論的證據。');
 await page.locator('[data-action="assign"][data-key="1"][data-to="reasonable"]').click();
 await page.getByRole('button',{name:'找出誰最不合理',exact:true}).click();
 const target=await page.locator('#reasoning').boundingBox();
 assert.ok(target.y>=0 && target.y<800,'The original navigation brings judgment into view');
 await page.locator('[data-action="pickWorst"][data-key="5"]').click();
 assert.equal(await page.locator('#reason').inputValue(),'我先保留判斷，仍需要能直接支持結論的證據。');
 await page.waitForFunction(()=>document.querySelector('#saveStatus').textContent==='草稿已保存');
 await page.reload();
 await page.locator('#reason').waitFor();
 assert.equal(await page.locator('#reason').inputValue(),'我先保留判斷，仍需要能直接支持結論的證據。');
 assert.equal(await page.locator('[data-action="pickWorst"][data-key="5"]').getAttribute('aria-checked'),'true');
 assert.equal(await page.locator('.zone[data-zone="reasonable"] .tcard[data-key="1"]').count(),1);
 assert.equal(await page.locator('[data-action="confirmSubmit"]').isDisabled(),true);
});
