// Explicit test targets prevent accidentally using the live-AI preview or a real research database.
export function normalizeMysqlOutput(text) { return text.replaceAll('\r\n','\n'); }
export function testConfig(env=process.env) {
 if(!/^idealight_test_[a-z0-9_]+$/.test(env.TEST_DB||''))throw new Error('Use an isolated TEST_DB');
 if(!env.TEST_URL)throw new Error('Set TEST_URL explicitly to the mock test server');
 const url=new URL(env.TEST_URL);
 if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname))throw new Error('Use a local test URL');
 const host=env.TEST_DB_HOST||'127.0.0.1',port=env.TEST_DB_PORT||'3306';
 const user=env.TEST_DB_USER||'root',password=env.TEST_DB_PASS||'';
 const mysqlArgs=['--no-defaults','--default-character-set=utf8mb4'];
 if(env.TEST_DB_SOCKET)mysqlArgs.push('--socket='+env.TEST_DB_SOCKET);
 else mysqlArgs.push('--protocol=TCP','--host='+host,'--port='+port);
 mysqlArgs.push('--user='+user,'-N','-B');
 return {database:env.TEST_DB,base:env.TEST_URL,mysqlBinary:env.TEST_MYSQL_BINARY||'mysql',phpBinary:env.TEST_PHP_BINARY||'php',mysqlArgs,
 clientEnv:{...env,MYSQL_PWD:password},phpEnv:{...env,DB_HOST:`${host};port=${port}`,DB_NAME:env.TEST_DB,DB_USER:user,DB_PASS:password}};
}
