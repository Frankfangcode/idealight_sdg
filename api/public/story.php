<?php
require_once __DIR__.'/../src/api.php';
require_once __DIR__.'/../src/story_game.php';
$stu=ck_require_stu_id();
$action=(string)($_GET['action']??'');
header('Cache-Control: no-store');
try {
    if($action==='state')ck_json(story_state($stu));
    if($action==='results')ck_json(story_results($stu));
    ck_require_post();
    $in=ck_input();
    if($action==='feedback'){
        require_once __DIR__.'/../src/story_ai.php';
        ck_json(story_feedback($stu,$in));
    }
    if($action==='chat'){
        require_once __DIR__.'/../src/story_ai.php';
        session_write_close();$request=story_start_question($stu,$in);
        header('Content-Type: application/x-ndjson; charset=utf-8');header('X-Accel-Buffering: no');
        if(function_exists('apache_setenv'))@apache_setenv('no-gzip','1');
        while(ob_get_level()>0)ob_end_flush();ob_implicit_flush(true);
        story_stream_question($request,function($line){echo json_encode($line,JSON_UNESCAPED_UNICODE)."\n";flush();});exit;
    }
    ck_json(story_action($stu,$action,$in));
}catch(StoryError $e){ck_fail($e->getMessage(),$e->getCode());}
