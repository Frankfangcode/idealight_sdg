import {test} from 'node:test';
import assert from 'node:assert/strict';
import {student,sql,api,base,config} from './helpers.mjs';
test('first logins alternate control/experiment; re-login keeps allocation',async()=>{
 const a=await student(),b=await student();
 const rows=sql(`SELECT cond FROM ck_runs WHERE stu_id IN ('${a.id}','${b.id}') ORDER BY id`).split('\n');
 assert.deepEqual(rows,['control','experiment']);
 await fetch(base+'/api/public/login.php',{method:'POST',body:new URLSearchParams({ID:a.id,name:'Test'})});
 assert.equal(sql(`SELECT COUNT(*) FROM ck_runs WHERE stu_id='${a.id}'`),'1');
 assert.equal((await api(a,'ck_state.php')).hasAiFeedback,false);
});
test('simultaneous allocation transactions keep groups balanced and a single run per student',async()=>{
 const {execFile}=await import('node:child_process');const {promisify}=await import('node:util');const run=promisify(execFile);
 const ids=Array.from({length:4},(_,i)=>'c'+Date.now()+i);
 for(const id of ids)sql(`INSERT INTO students(stu_id,name,age) VALUES('${id}','Concurrent',20)`);
 const env=config.phpEnv;
 await Promise.all([...ids,ids[0]].map(id=>run(config.phpBinary,['-r',`require 'api/src/scenario_repo.php';ck_run('${id}');`],{env})));
 const rows=sql(`SELECT cond FROM ck_runs WHERE stu_id IN (${ids.map(x=>`'${x}'`).join(',')}) ORDER BY id`).split('\n');
 assert.deepEqual(rows,['control','experiment','control','experiment']);
 assert.equal(sql(`SELECT COUNT(*) FROM ck_runs WHERE stu_id='${ids[0]}'`),'1');
});
