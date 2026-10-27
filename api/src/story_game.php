<?php
require_once __DIR__.'/stories.php';
require_once __DIR__.'/story_content.php';

class StoryError extends RuntimeException {}
function story_error(string $message,int $status=400): void {throw new StoryError($message,$status);}
/** 第一個故事完成後，至少休息三分鐘才能開始第二個故事（施測規定）。 */
const STORY_BREAK_SECONDS=180;
const STORY_INTRO_SECONDS=25;
function story_run(string $stu, bool $lock=false): array {
    $q=db()->prepare('SELECT r.*,s.stu_id,s.cond,s.current_position,s.released_at,s.completed_at FROM ck_story_runs r JOIN ck_story_studies s ON s.id=r.study_id WHERE s.stu_id=? AND r.position=s.current_position'.($lock?' FOR UPDATE':''));
    $q->execute([$stu]);$run=$q->fetch();
    if(!$run)story_error('找不到調查紀錄，請重新登入',409);
    return $run;
}
function story_work(int $runId,int $level): array {
    $q=db()->prepare('SELECT payload FROM ck_story_work WHERE run_id=? AND level_no=?');$q->execute([$runId,$level]);$json=$q->fetchColumn();
    return $json===false?['video'=>['position'=>0,'completed'=>false],'timers'=>[],'drafts'=>[]]:json_decode($json,true,512,JSON_THROW_ON_ERROR);
}
function story_save_work(int $runId,int $level,array $work): void {
    db()->prepare('INSERT INTO ck_story_work(run_id,level_no,payload) VALUES(?,?,?) ON DUPLICATE KEY UPDATE payload=VALUES(payload)')
        ->execute([$runId,$level,json_encode($work,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)]);
}
function story_event(int $runId,int $level,string $key,string $type,array $payload): void {
    db()->prepare('INSERT IGNORE INTO ck_story_events(run_id,level_no,event_key,event_type,payload) VALUES(?,?,?,?,?)')
        ->execute([$runId,$level,$key,$type,json_encode($payload,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)]);
}
function story_remaining(array $work,string $phase): ?float {
    if($phase==='feedback'&&!isset($work['timers']['feedback']))return null;
    if($phase==='video'&&!($work['video']['completed']??false))return null;
    $seconds=['video'=>10,'testimony'=>60,'interrogation'=>60,'combined'=>120,'feedback'=>30][$phase]??null;
    return $seconds===null?null:($seconds-(microtime(true)-($work['timers'][$phase]??0)));
}
function story_score(int $runId): int {
    $q=db()->prepare("SELECT COALESCE(SUM(JSON_EXTRACT(payload,'$.answer.score')),0) FROM ck_story_work WHERE run_id=?");$q->execute([$runId]);return (int)$q->fetchColumn();
}
function story_history(int $runId,int $level): array {
    $q=db()->prepare('SELECT char_key,role,content FROM ck_story_messages WHERE run_id=? AND level_no=? ORDER BY id');$q->execute([$runId,$level]);return $q->fetchAll();
}
function story_clean_draft(array $story,int $level,string $phase,array $payload): array {
    $keys=array_map('strval',array_keys($story['levels'][$level-1]['testimonies']));
    if($phase==='interrogation'){
        $selected=$payload['selected']??null;$text=$payload['draft']??'';
        if(($selected!==null&&!in_array($selected,$keys,true))||!is_string($text)||mb_strlen($text)>200)story_error('訊問草稿格式錯誤');
        return ['selected'=>$selected,'draft'=>$text,'submitted'=>false];
    }
    $placements=$payload['placements']??[];$pick=$payload['pick']??null;$reason=$payload['reason']??'';
    if(!is_array($placements)||!is_string($reason)||strlen($reason)>65535||($pick!==null&&!in_array($pick,$keys,true)))story_error('作答草稿格式錯誤');
    foreach($placements as $key=>$zone)if(!in_array((string)$key,$keys,true)||!in_array($zone,['reasonable','flaw','unclassified'],true))story_error('分類格式錯誤');
    return ['placements'=>$placements,'pick'=>$pick,'reason'=>$reason];
}
function story_state(string $stu): array {
    $run=story_run($stu);$story=story_load($run['story_id'],$run['story_version']);$level=(int)$run['level_no'];
    $introRemaining=null;
    if((int)$run['onboarding_step']<2){
        $q=db()->prepare("SELECT payload FROM ck_story_events WHERE run_id=? AND event_key='onboarding-clock'");$q->execute([$run['id']]);$clock=$q->fetchColumn();
        if($clock!==false){
            $introRemaining=max(0,(int)ceil(STORY_INTRO_SECONDS-(microtime(true)-json_decode($clock,true)['startedAt'])));
            if($introRemaining===0){
                db()->prepare('UPDATE ck_story_runs SET onboarding_step=2 WHERE id=? AND onboarding_step<2')->execute([$run['id']]);
                $run=story_run($stu);
            }
        }
    }
    $work=story_work((int)$run['id'],$level);$finished=$run['finished_at']!==null;
    // Existing participants may already be reading when these timers are introduced.
    if(!$finished&&($run['phase']==='testimony'||($run['phase']==='video'&&$work['video']['completed']))&&!isset($work['timers'][$run['phase']])){
        $work['timers'][$run['phase']]=microtime(true);story_save_work((int)$run['id'],$level,$work);
    }
    $out=story_public($story,$level)+['success'=>true,'mode'=>'stories','stuId'=>$stu,'runId'=>(int)$run['id'],
        'story'=>['id'=>$run['story_id'],'position'=>(int)$run['position'],'title'=>$story['title']],
        'flowVersion'=>2,'onboardingStep'=>(int)$run['onboarding_step'],'onboardingRemaining'=>$introRemaining,'hasAiFeedback'=>$run['cond']==='experiment',
        'videoProgress'=>$work['video'],'postCompleted'=>$run['released_at']!==null,
        'progress'=>['levelNo'=>$level,'phase'=>$run['phase'],'finished'=>$finished,
            'remaining'=>($remaining=story_remaining($work,$run['phase']))===null?null:max(0,(int)ceil($remaining))],
        'drafts'=>$work['drafts'],'placements'=>$work['answer']['placements']??new stdClass(),
        'judgment'=>isset($work['answer'])?['pick_char'=>$work['answer']['pick'],'reason'=>$work['answer']['reason']]:null,'chat'=>story_history((int)$run['id'],$level),
        'studyCompleted'=>$run['completed_at']!==null];
    if($run['cond']==='experiment')$out['totalScore']=story_score((int)$run['id']);
    if($finished&&(int)$run['position']===1){
        $next=story_runs($stu)[1];
        $out['nextStory']=['id'=>$next['story_id'],'title'=>$next['story_id']==='drink'?'第九杯飲料':'消失的蛋糕','breakRemaining'=>story_break_remaining((int)$run['id'])];
    }
    return $out;
}
/**
 * 兩個故事之間強制休息的剩餘秒數。
 * finished_at 是 PHP 的 date() 寫的，所以也用 PHP 的時間比；不能用 MySQL 的 NOW()——
 * 這台主機 PHP 時區是 Europe/Berlin、MySQL 是台灣時間，差 6 小時，休息會直接被跳過。
 */
function story_break_remaining(int $firstRunId): int {
    $q=db()->prepare('SELECT finished_at FROM ck_story_runs WHERE id=?');$q->execute([$firstRunId]);$at=$q->fetchColumn();
    if(!$at)return STORY_BREAK_SECONDS;
    return max(0,STORY_BREAK_SECONDS-(time()-strtotime($at)));
}
function story_results(string $stu): array {
    $study=story_study($stu);
    if(!$study||$study['completed_at']===null||$study['released_at']===null)story_error('請先完成兩個故事與老師安排的問卷',409);
    require_once __DIR__.'/review.php';$results=[];
    foreach(story_runs($stu) as $run){
        if($run['finished_at']===null)story_error('仍有故事尚未完成',409);
        $story=story_load($run['story_id'],$run['story_version']);$score=story_score((int)$run['id']);$levels=[];
        foreach($story['levels'] as $level){$work=story_work((int)$run['id'],$level['no']);$levels[]=['no'=>$level['no'],'name'=>$level['name'],'score'=>$work['answer']['score']??0];}
        $truth=$story['truth'];$debrief=$story['debrief'];
        $results[]=['runId'=>(int)$run['id'],'storyId'=>$run['story_id'],'title'=>$story['title'],'position'=>(int)$run['position'],
            'score'=>$score,'maxScore'=>36,'rank'=>ck_rank($score),'levels'=>$levels,'characters'=>story_public($story,7)['characters'],
            'truth'=>['headline'=>$truth['headline']??$truth['title']??'案件真相','body'=>$truth['body'],'points'=>$truth['points']??[]],
            'debrief'=>['title'=>$debrief['title'],'items'=>$debrief['items']??[$debrief['body']??''],'closing'=>$debrief['closing']??'']];
    }
    return ['success'=>true,'mode'=>'stories','stories'=>$results];
}
function story_action(string $stu,string $action,array $in): array {
    $p=db();$p->beginTransaction();
    try {
        $run=story_run($stu,true);$runId=(int)$run['id'];
        if($action==='nextStory'){
            if(!is_int($in['runId']??null))story_error('故事編號錯誤');
            $runs=story_runs($stu);$first=$runs[0];$second=$runs[1];
            if($in['runId']!==(int)$first['id']||$first['finished_at']===null)story_error('請先完成第一個故事',409);
            if($second['started_at']===null&&story_break_remaining((int)$first['id'])>0)story_error('休息時間還沒結束，請稍候再開始下一個故事',409);
            $p->prepare('UPDATE ck_story_studies SET current_position=2 WHERE id=?')->execute([$run['study_id']]);
            $p->prepare('UPDATE ck_story_runs SET started_at=COALESCE(started_at,NOW(3)) WHERE id=?')->execute([$second['id']]);
            story_event((int)$second['id'],1,'story_start','story_start',['previousRunId'=>(int)$first['id']]);
            $p->commit();return ['success'=>true,'runId'=>(int)$second['id']];
        }
        if(!is_int($in['runId']??null)||$in['runId']!==$runId)story_error('故事已變更，請重新整理後繼續',409);
        if($action==='release'){
            $runs=story_runs($stu);
            if($run['completed_at']===null||count(array_filter($runs,fn($r)=>$r['finished_at']!==null))!==2)story_error('請先完成兩個故事',409);
            $p->prepare('UPDATE ck_story_studies SET released_at=COALESCE(released_at,NOW(3)) WHERE id=?')->execute([$run['study_id']]);
            story_event($runId,7,'release','results_release',['selfReported'=>true]);
            $p->commit();return ['success'=>true,'released'=>true];
        }
        if($action==='advance'&&($in['nextLevel']??false)===true&&is_int($in['levelNo']??null)&&$in['levelNo']>=1&&$in['levelNo']+1===(int)$run['level_no']&&isset(story_work($runId,$in['levelNo'])['answer'])){
            $p->commit();return ['success'=>true,'levelNo'=>(int)$run['level_no'],'phase'=>$run['phase'],'finished'=>$run['finished_at']!==null];
        }
        $pastDraft=$action==='draft'&&is_int($in['levelNo']??null)&&$in['levelNo']>=1&&$in['levelNo']<=6&&$in['levelNo']<(int)$run['level_no'];
        if($run['finished_at']!==null&&!$pastDraft)story_error('這個故事已完成',409);
        $story=story_load($run['story_id'],$run['story_version']);$level=$pastDraft?$in['levelNo']:(int)$run['level_no'];$work=story_work($runId,$level);
        if($action!=='onboarding' && (!is_int($in['levelNo']??null)||$in['levelNo']!==$level))story_error('關卡已變更，請重新整理',409);
        $result=['success'=>true];
        if($action==='onboarding'){
            $step=$in['step']??null;$old=(int)$run['onboarding_step'];
            if(!is_int($step)||!in_array($step,[$old,min(3,max(1,$old)+1),$old<2?1:$old],true))story_error('請依序閱讀角色介紹與調查須知',409);
            if($old<2&&$step>=2){
                $q=$p->prepare("SELECT payload FROM ck_story_events WHERE run_id=? AND event_key='onboarding-clock'");$q->execute([$runId]);$clock=$q->fetchColumn();
                if($clock===false||microtime(true)-json_decode($clock,true)['startedAt']<STORY_INTRO_SECONDS)story_error('請先閱讀角色介紹滿 25 秒',409);
            }
            if($step===1)story_event($runId,0,'onboarding-clock','onboarding_clock',['startedAt'=>microtime(true)]);
            $p->prepare('UPDATE ck_story_runs SET onboarding_step=? WHERE id=?')->execute([$step,$runId]);$result['step']=$step;
            story_event($runId,0,'onboarding-'.$step,'onboarding',['step'=>$step]);
        }elseif($action==='nudge'){
            require_once __DIR__.'/interrogation.php';$char=$in['charKey']??null;
            if(!is_string($char)||!isset($story['levels'][$level-1]['testimonies'][$char]))story_error('角色不存在');
            $result['content']=null;
            if($run['phase']==='interrogation'&&story_remaining($work,'interrogation')>0){
                $q=$p->prepare('SELECT role,TIMESTAMPDIFF(SECOND,created_at,NOW(3)) AS age FROM ck_story_messages WHERE run_id=? AND level_no=? AND char_key=? ORDER BY id');$q->execute([$runId,$level,$char]);$rows=$q->fetchAll();$last=$rows?end($rows):null;
                $idle=$last?(int)$last['age']:microtime(true)-($work['timers']['interrogation']??microtime(true));
                if($idle>=25&&(!$last||$last['role']==='character')){
                    $counts=array_count_values(array_column($rows,'role'))+['player'=>0,'nudge'=>0];
                    $line=$counts['player']===0?CK_CHAT_NUDGE_OPENING:CK_CHAT_NUDGES[$counts['nudge']%count(CK_CHAT_NUDGES)];
                    $p->prepare("INSERT INTO ck_story_messages(run_id,level_no,char_key,role,content) VALUES(?,?,?,'nudge',?)")->execute([$runId,$level,$char,$line]);$result['content']=$line;
                }
            }
        }elseif($action==='response'){
            if(isset($work['answer'])&&$run['phase']==='feedback'){$p->commit();return ['success'=>true,'submitted'=>true,'phase'=>'feedback'];}
            if($run['phase']!=='combined')story_error('尚未進入分類與推理階段',409);
            $remaining=story_remaining($work,'combined');$timedOut=$remaining<=0;
            $payload=['placements'=>$in['placements']??[],'pick'=>$in['pickChar']??null,'reason'=>$in['reason']??''];
            if($remaining < -3)$payload=$work['drafts']['combined']['payload']??[];
            $answer=story_clean_draft($story,$level,'combined',$payload);$key=$story['levels'][$level-1]['testimonies'];
            if(!$timedOut&&(!$answer['pick']||trim($answer['reason'])===''||count(array_filter($answer['placements'],fn($v)=>$v!=='unclassified'))!==count($key)))story_error('請完成六張分類、選擇一人並寫下理由');
            $answer['score']=0;$answer['evidence']=[];
            foreach($key as $k=>$t){$zone=$answer['placements'][$k]??'unclassified';$correct=$zone===$t['correct'];$answer['placements'][$k]=$zone;
                $answer['evidence'][$k]=['zone'=>$zone,'isCorrect'=>$correct];$answer['score']+=(int)$correct;}
            $answer['timedOut']=$timedOut;$answer['submittedAt']=gmdate('c');$work['answer']=$answer;
            if(isset($work['drafts']['combined']))$work['drafts']['combined']['frozen']=true;
            story_save_work($runId,$level,$work);$p->prepare("UPDATE ck_story_runs SET phase='feedback' WHERE id=?")->execute([$runId]);
            $result+=['submitted'=>true,'phase'=>'feedback','timedOut'=>$timedOut];
            story_event($runId,$level,'submit','submit',$answer);
        }elseif($action==='draft'){
            $phase=$in['phase']??'';$revision=$in['revision']??0;
            if(!in_array($phase,['interrogation','combined'],true)||!is_int($revision)||$revision<1||!is_array($in['payload']??null))story_error('草稿格式錯誤');
            $order=['video'=>0,'testimony'=>1,'interrogation'=>2,'combined'=>3,'feedback'=>4];
            if(!$pastDraft&&$order[$phase]>$order[$run['phase']])story_error('尚未進入這個階段',409);
            $payload=story_clean_draft($story,$level,$phase,$in['payload']);$saved=$work['drafts'][$phase]??null;
            $expired=$pastDraft||$run['phase']!==$phase||story_remaining($work,$phase)<-3||($saved['frozen']??false);
            if($expired){
                if($revision>($saved['revision']??0))$work['lateDrafts'][$phase][(string)$revision]=$payload;
                if($saved)$work['drafts'][$phase]['frozen']=true;
            }elseif($revision>($saved['revision']??0))$work['drafts'][$phase]=['payload'=>$payload,'revision'=>$revision,'frozen'=>false];
            story_save_work($runId,$level,$work);$result+=['saved'=>$work['drafts'][$phase]??null,'expired'=>$expired,'archived'=>$expired];
            story_event($runId,$level,'draft-'.$phase.'-'.$revision,'draft_save',['phase'=>$phase,'revision'=>$revision,'payload'=>$payload,'expired'=>$expired,'accepted'=>$expired||$revision>($saved['revision']??0)]);
        }elseif($action==='video'){
            if($run['phase']!=='video'||(int)$run['onboarding_step']<3)story_error('現在不是影片階段',409);
            $position=$in['position']??null;$duration=$in['duration']??null;$completed=($in['completed']??false)===true;
            if(!is_numeric($position)||!is_numeric($duration)||!is_finite((float)$position)||!is_finite((float)$duration)||$position<0||$duration<=0||$duration>28800||$position>$duration+1)story_error('影片進度格式錯誤');
            if(!is_file(dirname(__DIR__,2).'/'.$story['levels'][$level-1]['video']['src']))story_error('本關影片素材待補，請告知老師',409);
            if($completed&&$position<$duration-1)story_error('影片尚未播放完成',409);
            $work['video']=['position'=>max($work['video']['position'],(float)$position),'completed'=>$work['video']['completed']||$completed];
            if($work['video']['completed']&&!isset($work['timers']['video']))$work['timers']['video']=microtime(true);
            story_save_work($runId,$level,$work);$result['videoProgress']=$work['video'];
            story_event($runId,$level,'video-'.hash('sha256',json_encode($work['video'])),$completed?'video_complete':'video_progress',$work['video']);
        }elseif($action==='advance'){
            if(($in['nextLevel']??false)===true){
                if($run['phase']!=='feedback'||!isset($work['answer']))story_error('請先完成本關作答',409);
                $next=$level+1;$finished=$next>count($story['levels']);
                if($finished){
                    $q=$p->prepare("SELECT COUNT(*) FROM ck_story_work WHERE run_id=? AND JSON_EXTRACT(payload,'$.answer') IS NOT NULL");$q->execute([$runId]);
                    if((int)$q->fetchColumn()!==count($story['levels']))story_error('仍有關卡尚未完成',409);
                }
                $p->prepare('UPDATE ck_story_runs SET level_no=?,phase=?,finished_at=? WHERE id=?')->execute([$next,'video',$finished?date('Y-m-d H:i:s'):null,$runId]);
                if($finished&&(int)$run['position']===2)$p->prepare('UPDATE ck_story_studies SET completed_at=COALESCE(completed_at,NOW(3)) WHERE id=?')->execute([$run['study_id']]);
                story_event($runId,$level,'level_complete','level_complete',['nextLevel'=>$next,'storyFinished'=>$finished]);
                $p->commit();return ['success'=>true,'levelNo'=>$next,'phase'=>'video','finished'=>$finished];
            }
            $steps=['video','testimony','interrogation','combined','feedback'];$current=$run['phase'];$to=$in['phase']??'';
            if($to!==$current){
                $index=array_search($current,$steps,true);
                if(($steps[$index+1]??null)!==$to||$current==='combined')story_error('請依序完成目前階段',409);
                if($current==='video'&&(!$work['video']['completed']||(int)$run['onboarding_step']<3))story_error('請先完成開場與本關影片',409);
                if($current==='interrogation'&&story_remaining($work,$current)>0)story_error('訊問時間尚未結束',409);
                if(in_array($to,['testimony','interrogation','combined'],true))$work['timers'][$to]=microtime(true);
                if(isset($work['drafts'][$current]))$work['drafts'][$current]['frozen']=true;
                story_save_work($runId,$level,$work);
                $p->prepare('UPDATE ck_story_runs SET phase=? WHERE id=?')->execute([$to,$runId]);
                story_event($runId,$level,'phase-'.$to,'phase_enter',['phase'=>$to,'timerStart'=>$work['timers'][$to]??null]);
            }
            $result+=['phase'=>$to,'levelNo'=>$level];
        }else story_error('不支援的操作');
        $p->commit();return $result;
    }catch(Throwable $e){if($p->inTransaction())$p->rollBack();throw $e;}
}
