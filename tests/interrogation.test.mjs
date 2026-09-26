import {test} from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {student,phase,base,api,sql,config} from './helpers.mjs';
for(const group of ['1','2'])test(`interrogation group ${group}: streams, persists and applies the correct sharing boundary`,async()=>{
 const s=await student(group);phase(s,'interrogation');
 const q='測試觀察甲：你當時看到什麼？';
 const r=await fetch(base+'/api/public/ck_chat.php',{method:'POST',headers:{Cookie:s.cookie,'Content-Type':'application/json'},body:JSON.stringify({levelNo:1,charKey:'1',message:q})});
 assert.equal(r.status,200);const lines=(await r.text()).trim().split('\n').map(JSON.parse);const done=lines.find(x=>x.t==='done');
 assert.equal(done.aiOk,true);assert.ok(lines.some(x=>x.t==='delta'));assert.ok(done.content);
 assert.equal(sql(`SELECT COUNT(*) FROM ck_chat_messages WHERE stu_id='${s.id}' AND role='character' AND ai_ok=1 AND model='local-test'`),'1');
 const messages=JSON.parse(execFileSync(config.phpBinary,['-r',`require 'api/src/interrogation.php';echo json_encode(ck_chat_messages_for(ck_run('${s.id}'),1,'2',ck_chat_history('${s.id}',1)));`],{env:config.phpEnv,encoding:'utf8'}));
 assert.equal(JSON.stringify(messages).includes(q),group==='1');
 const nudge=await api(s,'ck_nudge.php',{levelNo:1,charKey:'2'});assert.ok(nudge.content);
 assert.equal((await api(s,'ck_nudge.php',{levelNo:1,charKey:'2'})).content,null);
 sql(`UPDATE ck_phase_timers SET started_at=DATE_SUB(NOW(),INTERVAL 200 SECOND) WHERE stu_id='${s.id}'`);
 assert.equal((await api(s,'ck_chat.php',{levelNo:1,charKey:'2',message:'時間到了還能問嗎？'})).status,409);
});
