import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {sql,mysqlScript} from './helpers.mjs';
test('documented fresh database schema and seed install together',()=>{
 const name='idealight_test_install_'+process.pid;
 try {
 const text=(readFileSync('api/schema.sql','utf8')+'\n'+readFileSync('api/schema_cake.sql','utf8')+'\n'+readFileSync('api/seed_cake.sql','utf8')).replaceAll('idealightsdg',name);
 mysqlScript(text);
 assert.equal(sql(`SELECT COUNT(*) FROM ${name}.ck_levels`),'6');
 }finally{sql(`DROP DATABASE IF EXISTS ${name}`);}
});
