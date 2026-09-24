import {test} from 'node:test';import assert from 'node:assert/strict';import {student,api,sql,phase,base} from './helpers.mjs';
test('an existing legacy run resumes its separate evidence and ranking phases',async()=>{
 const s=await student('2');sql(`DELETE FROM ck_run_settings WHERE run_id=(SELECT id FROM ck_runs WHERE stu_id='${s.id}')`);phase(s,'evidence');
 assert.equal((await api(s,'ck_state.php')).flowVersion,1);
 const placements=Object.fromEntries(['1','2','3','4','5','6'].map(k=>[k,'flaw']));
 assert.equal((await api(s,'ck_evidence.php',{levelNo:1,placements})).status,200);
 assert.equal((await api(s,'ck_advance.php',{levelNo:1,phase:'ranking'})).status,200);
 assert.equal((await api(s,'ck_judgment.php',{levelNo:1,pickChar:'3',reason:'既有回合接續'})).status,200);
 assert.equal((await api(s,'ck_advance.php',{levelNo:1,phase:'feedback'})).status,200);
 assert.equal((await api(s,'ck_feedback.php',{levelNo:1})).detailed,false);
});
test('registration and login establish a new run using the real HTTP entry points',async()=>{
 const id='r'+Date.now();
 const reg=await fetch(base+'/api/public/register.php',{method:'POST',body:new URLSearchParams({ID:id,name:'Test',gender:'3',age:'20'}),redirect:'manual'});
 assert.equal(reg.status,302);
 const login=await fetch(base+'/api/public/login.php',{method:'POST',body:new URLSearchParams({ID:id,name:'Test'})});
 assert.equal((await login.json()).success,true);
 assert.equal(sql(`SELECT flow_version FROM ck_run_settings s JOIN ck_runs r ON s.run_id=r.id WHERE r.stu_id='${id}'`),'2');
 // Balance the allocation counter consumed by the registration case.
 await student();
});
