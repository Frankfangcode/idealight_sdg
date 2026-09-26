import {test} from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
test('detective rank preserves every approved score boundary',()=>{
 const actual=JSON.parse(execFileSync(process.env.TEST_PHP_BINARY||'php',['-r',"require 'api/src/review.php';echo json_encode(array_map('ck_rank',[0,9,10,18,19,27,28,35,36]));"],{encoding:'utf8'}));
 assert.deepEqual(actual,['見習偵探','見習偵探','初階偵探','初階偵探','中階偵探','中階偵探','高階偵探','高階偵探','金階偵探']);
});
