import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {sql,mysqlScript} from './helpers.mjs';
test('legacy chat migration follows existing student collation and preserves data on repeat',()=>{
 const name='idealight_test_migrate_'+process.pid;
 const version=sql('SELECT VERSION()');
 const collations=version.includes('MariaDB')?['utf8mb4_unicode_ci','utf8mb4_general_ci']:['utf8mb4_unicode_ci','utf8mb4_0900_ai_ci'];
 try{
 for(const collation of collations){
 mysqlScript(`CREATE DATABASE IF NOT EXISTS ${name}; USE ${name}; CREATE TABLE students(stu_id VARCHAR(50) COLLATE ${collation} PRIMARY KEY) ENGINE=InnoDB; INSERT INTO students VALUES('existing');CREATE TABLE ck_config(ck_key VARCHAR(50) PRIMARY KEY,ck_value JSON,is_public TINYINT)`);
 const migration=readFileSync('api/migrations/2026_09_interrogation_chat.sql','utf8').replaceAll('idealightsdg',name);
 mysqlScript(migration,name);
 mysqlScript("INSERT INTO ck_chat_messages(stu_id,level_no,char_key,role,content) VALUES('existing',1,'1','player','既有研究資料')",name);
 mysqlScript(migration,name);
 assert.equal(sql(`SELECT content FROM ${name}.ck_chat_messages`),'既有研究資料');
 assert.equal(sql(`SELECT COLLATION_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='${name}' AND TABLE_NAME='ck_chat_messages' AND COLUMN_NAME='stu_id'`),collation);
 sql(`DROP DATABASE ${name}`);
 }
 }finally{sql(`DROP DATABASE IF EXISTS ${name}`);}
});
test('review migration adds missing tables and does not reset existing assignments or answers on repeat',()=>{
 const name='idealight_test_review_migrate_'+process.pid;
 try{
 const schema=['api/schema.sql','api/schema_cake.sql'].map(f=>readFileSync(f,'utf8')).join('\n').replaceAll('idealightsdg',name);
 mysqlScript(schema);
 mysqlScript("DROP TABLE ck_feedback_audit,ck_video_progress,ck_drafts,ck_run_settings,ck_allocation;INSERT INTO students(stu_id,name) VALUES('existing','既有學生');INSERT INTO ck_runs(stu_id,cond) VALUES('existing','control');",name);
 const migration=readFileSync('api/migrations/2026_09_review.sql','utf8');
 mysqlScript(migration,name);
 mysqlScript("UPDATE ck_allocation SET next_group=1;INSERT INTO ck_drafts(run_id,level_no,phase,payload,revision) SELECT id,1,'combined','{\"reason\":\"既有理由\"}',7 FROM ck_runs;",name);
 mysqlScript(migration,name);
 assert.equal(sql(`SELECT next_group FROM ${name}.ck_allocation`),'1');
 assert.equal(sql(`SELECT JSON_UNQUOTE(JSON_EXTRACT(payload,'$.reason')) FROM ${name}.ck_drafts`),'既有理由');
 assert.equal(sql(`SELECT name FROM ${name}.students`),'既有學生');
 assert.equal(sql(`SELECT COUNT(*) FROM ${name}.ck_run_settings`),'0');
 }finally{sql(`DROP DATABASE IF EXISTS ${name}`);}
});
