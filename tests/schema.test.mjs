import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';import {sql} from './helpers.mjs';
test('documented fresh database schema and seed install together',()=>{
 const name='idealight_test_install_'+process.pid;
 try {
 const text=(readFileSync('api/schema.sql','utf8')+'\n'+readFileSync('api/schema_cake.sql','utf8')+'\n'+readFileSync('api/seed_cake.sql','utf8')).replaceAll('idealightsdg',name);
 execFileSync('mysql',['--no-defaults','--socket=/tmp/idealight-revision/run/mysql.sock','-u','root'],{input:text,encoding:'utf8'});
 assert.equal(sql(`SELECT COUNT(*) FROM ${name}.ck_levels`),'6');
 }finally{sql(`DROP DATABASE IF EXISTS ${name}`);}
});
