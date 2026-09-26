import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const root=fileURLToPath(new URL('../',import.meta.url));
const keys=['1','2','3','4','5','6'];
export function uiState(overrides={}) {
 return {success:true,stuId:'ui-only',flowVersion:2,onboardingStep:0,
  guideVideo:{src:'media/intro-guide.mp4',position:0,completed:false},videoProgress:{position:0,completed:false},
  postCompleted:false,hasAiFeedback:true,totalScore:0,levelCount:6,
  config:{meta:{title:'消失的月蝕巧克力莓果千層蛋糕'},brief:{question:'誰該負責？'},PHASE_SECONDS:{combined:240},
   INTERROGATION:{seconds:150,maxChars:200,nudgeIdleSeconds:25},
   ZONES:{reasonable:{label:'合理說法'},flaw:{label:'有瑕疵'},unclassified:{label:'未分類'}}},
  characters:['陳一承','葉二寧','高三川','羅四影','許五澄','蔡六禾'].map((name,i)=>({char_key:keys[i],name,
   role:['宿舍自治會生活股股長','食品科學系學生','宿舍社群管理員','攝影社學生','資工系學生','樓層總務'][i],trait:'角色介紹'})),
  outline:keys.map((k,i)=>({no:i+1,name:i===0?'B-9 空了':'案件調查'})),
  progress:{levelNo:1,phase:'video',finished:false,remaining:null},drafts:{},chat:[],placements:{},judgment:null,
  level:{no:1,name:'B-9 空了',task:'六名角色只陳述食物失蹤前後自己所看見、聽見或親自經歷的片段。先圈出可觀察事實，再區分記憶、推測與結論，判斷每項證詞能支持到哪個範圍。',reasonableCount:2,
   video:{src:'media/intro-L1.mp4'},testimonies:Object.fromEntries(keys.map(k=>[k,{text:'我看見冰箱的位置，但沒有看見誰拿走蛋糕。'}]))},...overrides};
}
export function uiFeedback(detailed=true) {
 if(!detailed)return {success:true,detailed:false,message:'本關作答已保存。完成後測問卷後，可查看總分與解析。'};
 return {success:true,detailed,totalScore:10,
  testimonies:Object.fromEntries(keys.map((k,i)=>[k,{correct:i<2?'reasonable':'flaw',criterion:'這段觀察能說明物品的位置，但不足以指認拿走物品的人。',followup:'你親眼看到了什麼？'}])),
  evidence:Object.fromEntries(keys.map((k,i)=>[k,{zone:i<4?'reasonable':'flaw',isCorrect:i<2||i>=4}])),
  ai:'你引用了觀察紀錄，但仍需要說明觀察如何支持結論，以及紀錄無法證明的部分。',
  conclusion:'時間接近不代表同一個動作，還需要其他證據。',message:'本關作答已保存。完成後測問卷後，可查看總分與解析。'};
}
export async function openUi(t,{state=uiState(),feedback=uiFeedback(),before,apiHandler}={}) {
 const server=createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  // This server cannot execute PHP or serve credentials. No connection to a database exists.
  if(!/^\/(assets\/|control\/game\.html$|media\/intro-[\w-]+\.mp4$)/.test(pathname)){res.writeHead(404).end();return;}
  const file=pathname.startsWith('/media/')?resolve(root,'tests/fixtures/one-second.mp4'):resolve(root,'.'+pathname);
  if(!file.startsWith(root)){res.writeHead(403).end();return;}
  try{const body=await readFile(file);const type={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.mp4':'video/mp4','.jpg':'image/jpeg','.woff2':'font/woff2'}[extname(file)]||'application/octet-stream';res.writeHead(200,{'Content-Type':type}).end(body);}
  catch{res.writeHead(404).end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,channel:'chrome',args:['--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));
 t.after(async()=>{await browser.close();await new Promise(r=>server.close(r));assert.deepEqual(errors,[]);});
 await page.route('**/api/**',async route=>{
  const name=new URL(route.request().url()).pathname.split('/').pop(),body=route.request().postDataJSON();requests.push({name,body});
  if(apiHandler && await apiHandler({route,name,body,state}))return;
  let result;
  if(name==='ck_state.php')result=state;
  else if(name==='ck_video.php'){
   const p=body.levelNo===0?state.guideVideo:state.videoProgress;
   p.position=body.position;p.completed=body.completed;result={success:true,...p};
  }else if(name==='ck_onboarding.php'){state.onboardingStep=body.step;result={success:true,step:body.step};}
  else if(name==='ck_feedback.php')result=feedback;
  else if(name==='ck_advance.php'){state.progress.phase=body.phase;result={success:true};}
  else {await route.fulfill({status:400,json:{success:false,message:'Unexpected test API: '+name}});return;}
  await route.fulfill({json:result});
 });
 if(before)await before(page);
 await page.goto(base+'/control/game.html');
 return {page,state,requests,base};
}
