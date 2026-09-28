import {test} from 'node:test';
import assert from 'node:assert/strict';
import {student,sql,api,base,config} from './helpers.mjs';
import {readFileSync} from 'node:fs';
test('numeric group 1 is control and group 2 is experiment',async()=>{
 for(const [group,condition] of [['1','control'],['2','experiment']]){
  const s=await student(group);
  assert.equal(sql(`SELECT cond FROM ck_runs WHERE stu_id='${s.id}'`),condition);
  assert.equal((await api(s,'ck_state.php')).hasAiFeedback,condition==='experiment');
 }
});
test('legacy numeric labels follow frozen conditions without changing existing runs or progress',async()=>{
 const a=await student('1'),b=await student('2');
 sql(`UPDATE students SET \`group\`='2' WHERE stu_id='${a.id}';UPDATE students SET \`group\`=NULL WHERE stu_id='${b.id}'`);
 const before=sql(`SELECT r.id,r.cond,p.phase FROM ck_runs r JOIN ck_progress p ON p.stu_id=r.stu_id WHERE r.stu_id IN ('${a.id}','${b.id}') ORDER BY r.id`);
 const migration=readFileSync(new URL('../api/migrations/2026_09_group_codes.sql',import.meta.url),'utf8');
 sql(migration);sql(migration);
 assert.equal(sql(`SELECT \`group\` FROM students WHERE stu_id='${a.id}'`),'1');
 assert.equal(sql(`SELECT \`group\` FROM students WHERE stu_id='${b.id}'`),'2');
 assert.equal(sql(`SELECT r.id,r.cond,p.phase FROM ck_runs r JOIN ck_progress p ON p.stu_id=r.stu_id WHERE r.stu_id IN ('${a.id}','${b.id}') ORDER BY r.id`),before);
});
test('first logins alternate control/experiment; re-login keeps allocation',async()=>{
 const a=await student(),b=await student();
 assert.equal(a.login.group,'1');assert.equal(b.login.group,'2');
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
