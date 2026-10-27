<?php
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require_once __DIR__.'/../src/scenario_repo.php';
$config=ck_public_config();$meta=$config['meta']??[];
$story=['id'=>'cake','version'=>'20260929','title'=>'消失的蛋糕',
 'subtitle'=>$meta['subtitle']??'六關批判思考調查','brief'=>ck_config('brief'),'characters'=>[],'levels'=>[],
 'truth'=>ck_config('truth'),'debrief'=>ck_config('debrief')];
foreach(ck_characters() as $c)$story['characters'][]=['key'=>$c['char_key'],'name'=>$c['name'],'role'=>$c['role'],'trait'=>$c['trait'],'image'=>'assets/img/game/char_'.$c['char_key'].'.jpg'];
foreach(db()->query('SELECT * FROM ck_levels ORDER BY level_no') as $l){
 $no=(int)$l['level_no'];$q=db()->prepare('SELECT * FROM ck_testimonies WHERE level_no=? ORDER BY char_key');$q->execute([$no]);$items=[];
 foreach($q as $t)$items[$t['char_key']]=['text'=>$t['text'],'correct'=>$t['correct'],'criterion'=>$t['criterion'],'followup'=>$t['followup']];
 $qa=db()->prepare('SELECT char_key,q,a,detail FROM ck_questions WHERE level_no=? ORDER BY char_key,seq');$qa->execute([$no]);
 $story['levels'][]=['no'=>$no,'name'=>$l['name'],'skills'=>$l['skills'],'task'=>$l['task'],
 'video'=>['src'=>$l['video_src'],'script'=>$l['video_script']],'testimonies'=>$items,'questions'=>$qa->fetchAll(),
 'rankingCriterion'=>$l['ranking_criterion'],'conclusion'=>$l['conclusion'],'aiFeedbackOpening'=>$l['ai_feedback_opening']];
}
$file=__DIR__.'/../stories/cake-20260929.json';
if(is_file($file))throw new RuntimeException('Pinned story already exists; use a new version for changes');
file_put_contents($file,json_encode($story,JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES)."\n");
echo "Cake story snapshot saved. No database records changed.\n";
