import {test} from 'node:test';
import assert from 'node:assert/strict';
import {student,api,phase,sql} from './helpers.mjs';
test('unsent interrogation text and target are restored by server without browser storage',async()=>{
 const s=await student('2'); phase(s,'interrogation');
 const save=await api(s,'ck_draft.php',{levelNo:1,phase:'interrogation',revision:1,payload:{selected:'3',draft:'你確定有看到嗎？'}});
 assert.equal(save.status,200);
 const state=await api(s,'ck_state.php');
 assert.equal(state.drafts.interrogation.payload.draft,'你確定有看到嗎？');
 assert.equal(state.drafts.interrogation.payload.selected,'3');
 assert.equal(sql(`SELECT COUNT(*) FROM ck_chat_messages WHERE stu_id='${s.id}'`),'0');
});
test('late offline draft is archived without overwriting the frozen answer',async()=>{
 const s=await student('2');phase(s,'interrogation');
 await api(s,'ck_draft.php',{levelNo:1,phase:'interrogation',revision:1,payload:{selected:'3',draft:'原本草稿'}});
 sql(`UPDATE ck_phase_timers SET started_at=DATE_SUB(NOW(),INTERVAL 1 HOUR) WHERE stu_id='${s.id}'`);
 const r=await api(s,'ck_draft.php',{levelNo:1,phase:'interrogation',revision:2,payload:{selected:'3',draft:'斷線期間最後的文字'}});
 assert.equal(r.status,200);assert.equal(r.expired,true);
 assert.equal(sql(`SELECT JSON_UNQUOTE(JSON_EXTRACT(payload,'$.payload.draft')) FROM ck_events WHERE stu_id='${s.id}' AND event='draft_late'`),'斷線期間最後的文字');
 assert.equal((await api(s,'ck_state.php')).drafts.interrogation.payload.draft,'原本草稿');
});
test('reconnecting an already-saved draft does not falsely create a late unsent record',async()=>{
 const s=await student('2');phase(s,'interrogation');
 const body={levelNo:1,phase:'interrogation',revision:1,payload:{selected:'3',draft:'已保存文字'}};
 await api(s,'ck_draft.php',body);phase(s,'combined');
 assert.equal((await api(s,'ck_draft.php',body)).status,200);
 assert.equal(sql(`SELECT COUNT(*) FROM ck_events WHERE stu_id='${s.id}' AND event='draft_late'`),'0');
});
