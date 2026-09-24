<?php
require_once __DIR__.'/../src/api.php';require_once __DIR__.'/../src/review.php';
$stu=ck_require_stu_id();ck_run($stu);
if(!ck_post_completed($stu)) ck_fail('請先完成六關調查與後測問卷，再查看調查成果。',409);
$q=db()->prepare('SELECT l.level_no AS no,l.name,COALESCE(SUM(e.is_correct),0) AS score FROM ck_levels l LEFT JOIN ck_evidence e ON e.level_no=l.level_no AND e.stu_id=? GROUP BY l.level_no,l.name ORDER BY l.level_no');$q->execute([$stu]);
$score=ck_score($stu);
ck_json(['success'=>true,'score'=>$score,'maxScore'=>36,'rank'=>ck_rank($score),'levels'=>$q->fetchAll(),'characters'=>ck_characters(),'truth'=>ck_config('truth'),'debrief'=>ck_config('debrief')]);
