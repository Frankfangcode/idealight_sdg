import {test} from 'node:test';
import assert from 'node:assert/strict';
import {testConfig} from './test-config.mjs';
test('test configuration supports Windows executables and a separate TCP database without Mac paths',()=>{
 const c=testConfig({TEST_DB:'idealight_test_windows',TEST_URL:'http://127.0.0.1:18081',TEST_DB_PORT:'33080',TEST_DB_PASS:'synthetic',TEST_MYSQL_BINARY:'C:\\xampp\\mysql\\bin\\mysql.exe',TEST_PHP_BINARY:'C:\\xampp\\php\\php.exe'});
 assert.equal(c.mysqlBinary,'C:\\xampp\\mysql\\bin\\mysql.exe');assert.equal(c.phpBinary,'C:\\xampp\\php\\php.exe');
 assert.ok(c.mysqlArgs.includes('--port=33080'));assert.equal(c.mysqlArgs.some(a=>a.includes('/tmp/')),false);
 assert.equal(c.phpEnv.DB_HOST,'127.0.0.1;port=33080');assert.equal(c.phpEnv.DB_NAME,'idealight_test_windows');
 assert.equal(c.clientEnv.MYSQL_PWD,'synthetic');assert.equal(c.mysqlArgs.some(a=>a.includes('synthetic')),false);
});
test('test targets require an explicit local URL and isolated database',()=>{
 const valid={TEST_DB:'idealight_test_windows',TEST_URL:'http://127.0.0.1:18081'};
 assert.throws(()=>testConfig({...valid,TEST_DB:'idealightsdg'}),/isolated/);
 assert.throws(()=>testConfig({...valid,TEST_URL:undefined}),/TEST_URL/);
 assert.throws(()=>testConfig({...valid,TEST_URL:'https://example.com'}),/local/);
});
test('database output normalizes Windows CRLF without losing row or column boundaries',async()=>{
 const {normalizeMysqlOutput}=await import('./test-config.mjs');
 assert.equal(normalizeMysqlOutput('a\t1\r\nb\t2\r\n'),'a\t1\nb\t2\n');
 assert.equal(normalizeMysqlOutput('a\t1\nb\t2\n'),'a\t1\nb\t2\n');
});
