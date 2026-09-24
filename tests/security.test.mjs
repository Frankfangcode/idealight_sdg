import {test} from 'node:test';import assert from 'node:assert/strict';import {student,api,phase,sql} from './helpers.mjs';
test('new runs cannot bypass the combined submission through legacy endpoints',async()=>{
 const s=await student('2');phase(s,'combined');
 const placements=Object.fromEntries(['1','2','3','4','5','6'].map(k=>[k,'flaw']));
 assert.equal((await api(s,'ck_evidence.php',{levelNo:1,placements})).status,409);
 assert.equal((await api(s,'ck_judgment.php',{levelNo:1,pickChar:'3',reason:'early'})).status,409);
 assert.equal(sql(`SELECT COUNT(*) FROM ck_evidence WHERE stu_id='${s.id}'`),'0');
});
test('control cannot query the story explanation before the post survey',async()=>{
 const s=await student('2');
 sql(`UPDATE ck_progress SET level_no=7 WHERE stu_id='${s.id}'; UPDATE ck_runs SET finished_at=NOW() WHERE stu_id='${s.id}'`);
 assert.equal((await api(s,'ck_truth.php')).status,409);
});
test('unauthenticated and cross-student requests cannot read or alter another answer',async()=>{
 for(const route of ['ck_state.php','ck_results.php','ck_feedback.php?levelNo=1'])assert.equal((await api(null,route)).status,401);
 const a=await student('2'),b=await student('2');phase(a,'combined');phase(b,'combined');
 assert.equal((await api(a,'ck_draft.php',{stu_id:b.id,levelNo:1,phase:'combined',revision:1,payload:{reason:'<img src=x onerror=alert(1)>'}})).status,200);
 assert.equal((await api(b,'ck_state.php')).drafts.combined,undefined);
 const draft=(await api(a,'ck_state.php')).drafts.combined;assert.equal(draft.payload.reason,'<img src=x onerror=alert(1)>');
 assert.equal((await api(a,'ck_draft.php',{levelNo:2,phase:'combined',revision:2,payload:{reason:'future'}})).status,409);
 assert.equal((await api(a,'ck_response.php',{levelNo:1,placements:{'invalid':'flaw'},reason:'invalid'})).status,400);
 assert.equal(sql(`SELECT COUNT(*) FROM ck_evidence WHERE stu_id='${a.id}'`),'0');
 assert.equal((await api(a,'ck_survey.php',{kind:'post',action:'complete'})).status,409);
});
