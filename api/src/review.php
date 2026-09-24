<?php
require_once __DIR__ . '/scenario_repo.php';

function ck_drafts(array $run, int $levelNo): array {
    $q=db()->prepare('SELECT phase,payload,revision,frozen FROM ck_drafts WHERE run_id=? AND level_no=?');
    $q->execute([$run['id'],$levelNo]); $out=[];
    foreach ($q as $r) $out[$r['phase']]=['payload'=>json_decode($r['payload'],true),'revision'=>(int)$r['revision'],'frozen'=>(bool)$r['frozen']];
    return $out;
}
function ck_archive_draft(string $stu, int $level, string $phase, int $revision, array $payload): void {
    // Research record only: never changes the frozen/scored answer. Deduplicate reconnect retries.
    $saved=db()->prepare('SELECT d.revision FROM ck_drafts d JOIN ck_runs r ON r.id=d.run_id WHERE r.stu_id=? AND d.level_no=? AND d.phase=?');
    $saved->execute([$stu,$level,$phase]);
    if ($revision <= (int)$saved->fetchColumn()) return;
    $q=db()->prepare("SELECT id FROM ck_events WHERE stu_id=? AND level_no=? AND phase=? AND event='draft_late' AND JSON_EXTRACT(payload,'$.revision')=? LIMIT 1");
    $q->execute([$stu,$level,$phase,$revision]);
    if (!$q->fetchColumn()) ck_log($stu,$level,$phase,'draft_late',['revision'=>$revision,'payload'=>$payload,'submitted'=>false]);
}
function ck_progress_locked(string $stuId): array {
    $q=db()->prepare('SELECT level_no,phase FROM ck_progress WHERE stu_id=? FOR UPDATE');
    $q->execute([$stuId]); return $q->fetch() ?: [];
}
function ck_clean_draft(string $phase, array $p, int $level): array {
    $keys=array_map('strval',array_keys(ck_answer_key($level)));
    if ($phase==='interrogation') {
        $key=$p['selected']??null; $text=$p['draft']??'';
        if (($key!==null && !in_array($key,$keys,true)) || !is_string($text) || mb_strlen($text)>200) throw new InvalidArgumentException('訊問草稿格式錯誤');
        return ['selected'=>$key,'draft'=>$text,'submitted'=>false];
    }
    $placements=$p['placements']??[]; $pick=$p['pick']??null; $reason=$p['reason']??'';
    if (!is_array($placements) || !is_string($reason) || strlen($reason)>65535 || ($pick!==null && !in_array($pick,$keys,true))) throw new InvalidArgumentException('作答草稿格式錯誤');
    foreach($placements as $k=>$v) if(!in_array((string)$k,$keys,true) || !in_array($v,['reasonable','flaw','unclassified'],true)) throw new InvalidArgumentException('分類格式錯誤');
    return ['placements'=>$placements,'pick'=>$pick,'reason'=>$reason];
}
function ck_post_completed(string $stuId): bool {
    $q=db()->prepare("SELECT COUNT(*) FROM ck_surveys s JOIN ck_runs r ON r.stu_id=s.stu_id WHERE s.stu_id=? AND s.kind='post' AND s.completed_at IS NOT NULL AND r.finished_at IS NOT NULL");
    $q->execute([$stuId]);return (int)$q->fetchColumn()>0;
}
function ck_score(string $stuId): int {
    $q=db()->prepare('SELECT COALESCE(SUM(is_correct),0) FROM ck_evidence WHERE stu_id=?');$q->execute([$stuId]);return (int)$q->fetchColumn();
}
function ck_rank(int $score): string {
    if ($score===36) return '金階偵探';
    if ($score>=28) return '高階偵探';
    if ($score>=19) return '中階偵探';
    if ($score>=10) return '初階偵探';
    return '見習偵探';
}
function ck_video_progress(array $run,int $level): array {
    $q=db()->prepare('SELECT position_seconds,completed FROM ck_video_progress WHERE run_id=? AND level_no=?');$q->execute([$run['id'],$level]);$r=$q->fetch();
    return ['position'=>(float)($r['position_seconds']??0),'completed'=>(bool)($r['completed']??false)];
}
