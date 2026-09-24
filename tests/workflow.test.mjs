import {test} from 'node:test';import assert from 'node:assert/strict';import {student,api,sql} from './helpers.mjs';
for(const group of ['1','2'])test(`six-level workflow for group ${group}: timers, saved feedback, post survey and score`,async()=>{
 const s=await student(group);
 await api(s,'ck_video.php',{levelNo:0,position:1,duration:1,completed:true});
 for(const step of [1,2,3])assert.equal((await api(s,'ck_onboarding.php',{step})).status,200);
 for(let n=1;n<=6;n++){
 assert.equal((await api(s,'ck_video.php',{levelNo:n,position:1,duration:1,completed:true})).status,200);
 for(const p of ['testimony','interrogation'])assert.equal((await api(s,'ck_advance.php',{levelNo:n,phase:p})).status,200);
 sql(`UPDATE ck_phase_timers SET started_at=DATE_SUB(NOW(),INTERVAL 200 SECOND) WHERE stu_id='${s.id}' AND phase='interrogation'`);
 assert.equal((await api(s,'ck_advance.php',{levelNo:n,phase:'combined'})).status,200);
 const placements=Object.fromEntries(sql(`SELECT char_key,correct FROM ck_testimonies WHERE level_no=${n}`).split('\n').map(r=>r.split('\t')));
 assert.equal((await api(s,'ck_response.php',{levelNo:n,placements,pickChar:'3',reason:'從看到的片段還不能推論到完整結論。'})).status,200);
 const feedback=await api(s,'ck_feedback.php',{levelNo:n});assert.equal(feedback.detailed,group==='1');
 if(group==='1')assert.equal(feedback.totalScore,n*6);else {assert.equal(feedback.totalScore,undefined);assert.equal(feedback.ai,undefined);}
 assert.equal((await api(s,'ck_advance.php',{levelNo:n,nextLevel:true})).status,200);
 }
 assert.equal(sql(`SELECT COUNT(*) FROM ck_feedback_audit a JOIN ck_feedback f ON f.id=a.feedback_id WHERE f.stu_id='${s.id}'`),'6');
 assert.equal((await api(s,'ck_results.php')).status,409);
 assert.equal((await api(s,'ck_survey.php',{kind:'post',action:'complete'})).status,409);
 await api(s,'ck_survey.php?kind=post');
 assert.equal((await api(s,'ck_survey.php',{kind:'post',action:'complete'})).status,200);
 const result=await api(s,'ck_results.php');assert.equal(result.score,36);assert.equal(result.rank,'金階偵探');
 assert.equal((await api(s,'ck_truth.php')).status,200);
});
