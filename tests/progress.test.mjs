import {test} from 'node:test';import assert from 'node:assert/strict';import {student,api,phase,sql} from './helpers.mjs';
test('cannot skip video to feedback or leave interrogation before its deadline',async()=>{
 const s=await student('2');
 assert.equal((await api(s,'ck_advance.php',{levelNo:1,phase:'feedback'})).status,409);
 phase(s,'interrogation');
 assert.equal((await api(s,'ck_advance.php',{levelNo:1,phase:'combined'})).status,409);
 sql(`UPDATE ck_phase_timers SET started_at=DATE_SUB(NOW(), INTERVAL 200 SECOND) WHERE stu_id='${s.id}'`);
 assert.equal((await api(s,'ck_advance.php',{levelNo:1,phase:'combined'})).status,200);
 const state=await api(s,'ck_state.php');assert.equal(state.progress.phase,'combined');assert.ok(state.progress.remaining<=240 && state.progress.remaining>230);
});
