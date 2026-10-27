import {execFileSync,spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import {mkdirSync,createWriteStream,mkdtempSync,cpSync,copyFileSync,rmSync,existsSync,realpathSync,readdirSync} from 'node:fs';
import {resolve,dirname,basename} from 'node:path';
import {tmpdir} from 'node:os';
import assert from 'node:assert/strict';
export const php=process.env.TEST_PHP_BINARY||'php';
export function phpJson(code,args=[]){
 return JSON.parse(execFileSync(php,['-r',code,...args],{encoding:'utf8',cwd:process.cwd()}));
}
export const token=()=>randomBytes(6).toString('hex');

export async function storyServer(t,extraEnv={}, {media}={}){
 let siteRoot=process.cwd(),siteEnv={};
 let removeSite=()=>{};
 if(media!==undefined){
  assert.ok(['missing','present'].includes(media));
  const parent=realpathSync(tmpdir());
  siteRoot=mkdtempSync(resolve(parent,'idealight-story-media-'));
  removeSite=()=>{
   assert.equal(dirname(realpathSync(siteRoot)),parent);
   assert.ok(basename(siteRoot).startsWith('idealight-story-media-'));
   rmSync(siteRoot,{recursive:true,force:true});
   assert.equal(existsSync(siteRoot),false,'Disposable test site must be removed');
  };
  try{
   for(const folder of ['api','assets','control'])cpSync(resolve(folder),resolve(siteRoot,folder),{recursive:true});
   copyFileSync('login.html',resolve(siteRoot,'login.html'));
   mkdirSync(resolve(siteRoot,'tests'));copyFileSync('tests/router.php',resolve(siteRoot,'tests/router.php'));
   // Missing-video fixtures retain the supplied portraits, but never copy lab videos.
   for(const story of ['cake','drink']){
    const folder=resolve('media',story),target=resolve(siteRoot,'media',story);
    if(existsSync(folder)){
     mkdirSync(target,{recursive:true});
     for(const file of readdirSync(folder,{withFileTypes:true})){
      if(file.isFile()&&/\.(jpe?g|png|webp)$/i.test(file.name))copyFileSync(resolve(folder,file.name),resolve(target,file.name));
     }
    }
   }
   if(media==='present'){
    mkdirSync(resolve(siteRoot,'media/drink'),{recursive:true});
    copyFileSync('tests/fixtures/one-second.mp4',resolve(siteRoot,'media/drink/intro-L1.mp4'));
   }
   // Pass database settings to the child without copying .env; AI is overridden below.
   siteEnv=phpJson(`require 'api/src/config.php';$out=[];foreach(['DB_HOST','DB_NAME','DB_USER','DB_PASS'] as $key){$value=ck_env($key);if($value!==null)$out[$key]=$value;}echo json_encode((object)$out);`);
  }catch(e){removeSite();throw e;}
 }
 const requests=[];
 const fake=createServer(async(req,res)=>{let raw='';for await(const c of req)raw+=c;const body=JSON.parse(raw||'{}');requests.push(body);
  if(body.stream){res.writeHead(200,{'Content-Type':'text/event-stream'});res.end('data: '+JSON.stringify({choices:[{delta:{content:'我只知道當時公開的紀錄。'}}]})+'\n\ndata: [DONE]\n\n');}
  else {res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{content:'你引用了證據，仍可說明推論的限制。'}}]}));}
 });
 await new Promise(r=>fake.listen(0,'127.0.0.1',r));
 const probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
 const key='test_'+token();mkdirSync('.screenshots/dual-story/sessions',{recursive:true});
 const log=createWriteStream(`.screenshots/dual-story/${key}.log`);
 const server=spawn(php,['-d','session.save_path='+resolve('.screenshots/dual-story/sessions'),'-S',`127.0.0.1:${port}`,'-t','.', 'tests/router.php'],{
  cwd:siteRoot,env:{...process.env,...siteEnv,STORY_STUDY_ENABLED:'1',STORY_STUDY_KEY:key,LLM_API_KEY:'synthetic-test',LLM_BASE_URL:`http://127.0.0.1:${fake.address().port}`,LLM_MODEL:'local-test',SURVEYCAKE_PRE_URL:'',SURVEYCAKE_POST_URL:'',...extraEnv},stdio:['ignore','pipe','pipe']});
 server.stdout.pipe(log);server.stderr.pipe(log);const base=`http://127.0.0.1:${port}`;
 const ids=[];
 t.after(async()=>{
  try{
   phpJson(`require 'api/src/stories.php';$ids=json_decode($argv[1],true);foreach($ids as $id){db()->prepare('DELETE FROM students WHERE stu_id=? AND name=?')->execute([$id,'Dual story test']);}db()->prepare('DELETE FROM ck_story_allocation WHERE study_key=?')->execute([$argv[2]]);echo '{}';`,[JSON.stringify(ids),key]);
   for(const id of ids){const res=await fetch(base+'/api/public/login.php',{method:'POST',body:new URLSearchParams({ID:id,name:'Dual story test'})});assert.equal((await res.json()).success,false,'Deleted synthetic student must no longer be able to log in');}
  }finally{
   try{server.kill();await new Promise(r=>server.exitCode!==null?r():server.once('exit',r));log.end();await new Promise(r=>fake.close(r));}
   finally{removeSite();}
  }
 });
 for(let i=0;i<60;i++){try{await fetch(base+'/login.html');break;}catch{if(i===59)throw Error('PHP server did not start');await new Promise(r=>setTimeout(r,50));}}
 async function student(){const id='dh_'+token();ids.push(id);phpJson(`require 'api/src/db.php';db()->prepare('INSERT INTO students(stu_id,name,age) VALUES(?,?,20)')->execute([$argv[1],'Dual story test']);echo '{}';`,[id]);
  const res=await fetch(base+'/api/public/login.php',{method:'POST',body:new URLSearchParams({ID:id,name:'Dual story test'})});
  const login=await res.json();const cookie=res.headers.getSetCookie().findLast(s=>s.startsWith('PHPSESSID='))?.split(';')[0];return {id,cookie,login};}
 async function api(student,action,body){const res=await fetch(base+'/api/public/story.php?action='+action,{method:body===undefined?'GET':'POST',headers:{Cookie:student?.cookie||'','Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const raw=await res.text();let data;try{data=JSON.parse(raw);}catch{throw Error(action+': '+res.status+' '+raw);}return {status:res.status,...data};}
 return {base,student,api,requests};
}
// Advance only a synthetic participant's introduction clock, without real waiting.
export async function elapseIntroduction(server,student,runId){
 await server.api(student,'onboarding',{runId,step:1});
 phpJson(`require 'api/src/db.php';db()->prepare("UPDATE ck_story_events SET payload=? WHERE run_id=? AND event_key='onboarding-clock'")->execute([json_encode(['startedAt'=>microtime(true)-26]),$argv[1]]);echo '{}';`,[String(runId)]);
 return server.api(student,'onboarding',{runId,step:2});
}
