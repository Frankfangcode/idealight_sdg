import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

test('drink source retains all six chapters, teacher decisions and media gaps without cake substitutions',()=>{
 const path='api/stories/drink-v2.json';
 assert.ok(existsSync(path),'Drink story has not been imported');
 const story=JSON.parse(readFileSync(path,'utf8'));
 assert.equal(story.id,'drink');
 assert.deepEqual(story.characters.map(c=>c.name),['周一興','白二晴','顧三曜','韓四城','夏五喬','唐六雅']);
 assert.equal(story.levels.length,6);
 // User-approved precedence: individual labels win; appendix fills missing labels.
 assert.equal(story.levels[1].testimonies['4'].correct,'flaw'); // 韓四城
 assert.equal(story.levels[1].testimonies['5'].correct,'reasonable'); // 夏五喬
 assert.equal(story.levels[1].testimonies['6'].correct,'reasonable'); // 唐六雅
 assert.equal(story.levels[2].testimonies['3'].correct,'flaw'); // 顧三曜
 assert.deepEqual(story.levels.map(l=>Object.values(l.testimonies).filter(t=>t.correct==='reasonable').length),[2,2,2,1,2,1]);
 assert.match(story.levels[0].video.script,/19:42:18/);
 assert.match(story.levels[5].video.script,/12.1 毫升/);
 for(const level of story.levels){
  assert.equal(Object.keys(level.testimonies).length,6);
  assert.equal(level.video.src,`media/drink/intro-L${level.no}.mp4`);
  for(const t of Object.values(level.testimonies)){assert.ok(t.text);assert.ok(t.criterion);assert.ok(t.followup);}
 }
});

test('both stories use the same character intervention while hiding future and teacher material',()=>{
 assert.ok(existsSync('api/src/story_ai.php'),'Story AI adapter is not implemented');
 const raw=execFileSync(process.env.TEST_PHP_BINARY||'php',['-r',`require 'api/src/story_ai.php';
 $story=['title'=>'Drink','characters'=>[['key'=>'1','name'=>'A','role'=>'R','trait'=>'T'],['key'=>'2','name'=>'B','role'=>'R','trait'=>'T']],
 'truth'=>'SECRET_TRUTH','levels'=>[
 ['no'=>1,'video'=>['script'=>'PUBLIC_SCENE'],'testimonies'=>['1'=>['text'=>'PUBLIC_STATEMENT','criterion'=>'SECRET_KEY']]],
 ['no'=>2,'video'=>['script'=>'SECRET_FUTURE'],'testimonies'=>['1'=>['text'=>'SECRET_FUTURE']]]]];
 $history=[['char_key'=>'2','role'=>'player','content'=>'OTHER_CHARACTER_QUESTION'],['char_key'=>'1','role'=>'player','content'=>'MY_QUESTION']];
 echo json_encode(['control'=>story_chat_prompt($story,'control',1,'1',$history),'experiment'=>story_chat_prompt($story,'experiment',1,'1',$history)],JSON_UNESCAPED_UNICODE);`],{encoding:'utf8'});
 const out=JSON.parse(raw);
 assert.ok(!raw.includes('SECRET_'));assert.ok(!JSON.stringify(out.control).includes('OTHER_CHARACTER_QUESTION'));
 assert.ok(JSON.stringify(out.experiment).includes('OTHER_CHARACTER_QUESTION'));
 assert.ok(raw.includes('MY_QUESTION'));assert.ok(!raw.includes('這跟蛋糕有什麼關係'));
});

test('public story payload contains only the current chapter and no teacher material',()=>{
 const code=`require 'api/src/story_content.php';
 $story=['id'=>'drink','version'=>'v2','title'=>'Drink','subtitle'=>'','brief'=>[],
 'characters'=>[['key'=>'1','name'=>'Name','role'=>'Role','trait'=>'','image'=>null]],
 'truth'=>['body'=>'SECRET_TRUTH'],'levels'=>[
 ['no'=>1,'name'=>'First','task'=>'Task','skills'=>'Skill','video'=>['src'=>'media/drink/missing.mp4','script'=>'PUBLIC_SCRIPT'],
 'testimonies'=>['1'=>['text'=>'PUBLIC_STATEMENT','correct'=>'flaw','criterion'=>'SECRET_CRITERION','followup'=>'SECRET_FOLLOWUP']],
 'rankingCriterion'=>'SECRET_RANKING','conclusion'=>'SECRET_CONCLUSION'],
 ['no'=>2,'name'=>'Second','task'=>'SECRET_FUTURE','testimonies'=>[]]]];
 echo json_encode(story_public($story,1));`;
 assert.ok(existsSync('api/src/story_content.php'),'Public story reader is not implemented');
 const raw=execFileSync(process.env.TEST_PHP_BINARY||'php',['-r',code],{encoding:'utf8'});
 const result=JSON.parse(raw);
 assert.equal(result.level.testimonies['1'].text,'PUBLIC_STATEMENT');
 assert.equal(result.level.video.available,false);
 assert.equal(result.characters[0].char_key,'1');
 assert.ok(!raw.includes('SECRET_'));
});
