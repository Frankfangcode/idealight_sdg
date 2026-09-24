import {test} from 'node:test';import assert from 'node:assert/strict';
import {student,api,phase,sql} from './helpers.mjs';
test('classification and reasoning submit atomically; retry preserves first answer',async()=>{
 const s=await student('1');phase(s,'combined');
 const body={levelNo:1,placements:Object.fromEntries(['1','2','3','4','5','6'].map(k=>[k,'flaw'])),pickChar:'3',reason:'影片只呈現片段，不能證明取走蛋糕。'};
 assert.equal((await api(s,'ck_response.php',body)).status,200);
 assert.equal(sql(`SELECT COUNT(*) FROM ck_evidence WHERE stu_id='${s.id}'`),'6');
 assert.equal(sql(`SELECT reason FROM ck_judgments WHERE stu_id='${s.id}'`),body.reason);
 assert.equal(sql(`SELECT phase FROM ck_progress WHERE stu_id='${s.id}'`),'feedback');
 assert.equal((await api(s,'ck_response.php',{...body,reason:'changed'})).status,200);
 assert.equal(sql(`SELECT reason FROM ck_judgments WHERE stu_id='${s.id}'`),body.reason);
});
