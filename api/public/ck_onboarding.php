<?php
require_once __DIR__.'/../src/api.php';require_once __DIR__.'/../src/review.php';
ck_require_post();$stu=ck_require_stu_id();$run=ck_run($stu);$step=ck_input()['step']??null;
if(!is_int($step)||$step<1||$step>3)ck_fail('開場步驟錯誤');
if($step>(int)$run['onboarding_step']+1 || ($step===1&&!ck_video_progress($run,0)['completed']))ck_fail('請先完成目前開場步驟',409);
db()->prepare('UPDATE ck_run_settings SET onboarding_step=GREATEST(onboarding_step,?) WHERE run_id=?')->execute([$step,$run['id']]);
ck_json(['success'=>true,'step'=>max($step,(int)$run['onboarding_step'])]);
