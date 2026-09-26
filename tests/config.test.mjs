import {test} from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
test('explicit empty environment value wins over defaults and dotenv, including XAMPP empty DB passwords',()=>{
 const result=execFileSync(process.env.TEST_PHP_BINARY||'php',['-r',"require 'api/src/config.php';echo ck_env('IDEALIGHT_EMPTY_TEST','fallback') === '' ? 'empty' : 'unexpected-fallback';"],{encoding:'utf8',env:{...process.env,IDEALIGHT_EMPTY_TEST:''}});
 assert.equal(result,'empty');
});
