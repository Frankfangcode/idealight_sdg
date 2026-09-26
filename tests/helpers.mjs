import {execFileSync} from 'node:child_process';
import {testConfig,normalizeMysqlOutput} from './test-config.mjs';
export const config=testConfig();
export const base=config.base;
export function sql(query) { return mysqlScript(query,config.database).trim(); }
export function mysqlScript(query,database) {
  const args=[...config.mysqlArgs,...(database?[database]:[])];
  return normalizeMysqlOutput(execFileSync(config.mysqlBinary,args,{input:query,encoding:'utf8',env:config.clientEnv}));
}
let serial=0;
export async function student(group=null) {
  const id='t'+Date.now()+String(++serial);
  sql(`INSERT INTO students(stu_id,name,age,\`group\`) VALUES ('${id}','Test',20,${group ? `'${group}'` : 'NULL'})`);
  const r=await fetch(base+'/api/public/login.php',{method:'POST',body:new URLSearchParams({ID:id,name:'Test'})});
  const body=await r.text();
  if (!body.startsWith('{')) throw new Error(body);
  const cookie=r.headers.getSetCookie().filter(value=>value.startsWith('PHPSESSID=')).at(-1)?.split(';')[0];
  const login=JSON.parse(body);if(!login.success||!cookie)throw new Error('Test login failed: '+body);
  return {id,cookie,login};
}
export async function api(s,path,body) {
 const r=await fetch(base+'/api/public/'+path,{method:body===undefined?'GET':'POST',headers:{Cookie:s?.cookie||'','Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 const raw=await r.text();
 let data;try {data=JSON.parse(raw)} catch {throw new Error(`${path}: ${r.status} ${raw}`)}
 return {status:r.status,...data};
}
export function phase(s,p,level=1){sql(`UPDATE ck_progress SET phase='${p}',level_no=${level} WHERE stu_id='${s.id}'`)}
