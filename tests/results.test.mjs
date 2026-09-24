import {test} from 'node:test';import assert from 'node:assert/strict';import {student,api,sql} from './helpers.mjs';
test('control results stay private until six levels and the post survey are completed',async()=>{
 const s=await student('2');
 assert.equal((await api(s,'ck_results.php')).status,409);
 sql(`INSERT INTO ck_evidence(stu_id,level_no,char_key,zone,is_correct) SELECT '${s.id}',level_no,char_key,correct,1 FROM ck_testimonies`);
 sql(`INSERT INTO ck_judgments(stu_id,level_no,pick_char,reason,is_flaw) SELECT '${s.id}',level_no,'3','只有片段，不能下定論。',1 FROM ck_levels`);
 sql(`UPDATE ck_progress SET level_no=7 WHERE stu_id='${s.id}'; UPDATE ck_runs SET finished_at=NOW() WHERE stu_id='${s.id}'`);
 assert.equal((await api(s,'ck_feedback.php',{levelNo:1})).detailed,false);
 assert.equal((await api(s,'ck_results.php')).status,409);
 await api(s,'ck_survey.php?kind=post');
 assert.equal((await api(s,'ck_survey.php',{kind:'post',action:'complete'})).status,200);
 const r=await api(s,'ck_results.php');assert.equal(r.score,36);assert.equal(r.rank,'金階偵探');assert.equal(r.levels.length,6);
 const fb=await api(s,'ck_feedback.php',{levelNo:1});assert.equal(fb.detailed,true);assert.ok(fb.ai);
 assert.equal(sql(`SELECT COUNT(*) FROM ck_feedback_audit a JOIN ck_feedback f ON f.id=a.feedback_id WHERE f.stu_id='${s.id}' AND a.status='ok'`),'1');
});
