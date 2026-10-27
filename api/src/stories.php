<?php
require_once __DIR__.'/db.php';

/** New study data is separate from all legacy single-story records. */
function story_installed(): bool {
    static $enabled=null;
    if($enabled===null)$enabled=(bool)db()->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='ck_story_studies'")->fetchColumn();
    return $enabled;
}
function story_enabled(): bool {return ck_env('STORY_STUDY_ENABLED','0')==='1' && story_installed();}
function story_study(string $stu): ?array {
    $q=db()->prepare('SELECT * FROM ck_story_studies WHERE stu_id=?');
    $q->execute([$stu]); return $q->fetch() ?: null;
}
function story_runs(string $stu): array {
    $q=db()->prepare('SELECT r.* FROM ck_story_runs r JOIN ck_story_studies s ON s.id=r.study_id WHERE s.stu_id=? ORDER BY r.position');
    $q->execute([$stu]); return $q->fetchAll();
}
function story_enroll(string $stu, ?string $studyKey=null): ?array {
    $p=db();
    $studyKey=$studyKey??ck_env('STORY_STUDY_KEY','cake-drink-v1');
    if (!preg_match('/^[a-zA-Z0-9_-]{1,64}$/D',$studyKey)) throw new RuntimeException('Invalid study key');
    $p->beginTransaction();
    try {
        // Student lock protects repeated logins; allocation lock serializes different students.
        $q=$p->prepare('SELECT stu_id FROM students WHERE stu_id=? FOR UPDATE');$q->execute([$stu]);
        if(!$q->fetchColumn())throw new RuntimeException('Student not found');
        if($study=story_study($stu)){$p->commit();return $study;}
        $q=$p->prepare('SELECT id FROM ck_runs WHERE stu_id=?');$q->execute([$stu]);
        if($q->fetchColumn()){$p->commit();return null;}
        $p->prepare('INSERT IGNORE INTO ck_story_allocation(study_key) VALUES(?)')->execute([$studyKey]);
        $q=$p->prepare('SELECT next_sequence FROM ck_story_allocation WHERE study_key=? FOR UPDATE');$q->execute([$studyKey]);
        $sequence=(int)$q->fetchColumn();$slot=($sequence-1)%4;
        // Apply only to new enrollments; existing studies return above unchanged.
        if(ck_env('STORY_EXPERIMENT_ONLY','0')==='1')$slot=2+(($sequence-1)%2);
        $code=['1-1','1-2','2-1','2-2'][$slot];$cond=$slot<2?'control':'experiment';
        $p->prepare('INSERT INTO ck_story_studies(stu_id,study_key,allocation_no,cond,code) VALUES(?,?,?,?,?)')->execute([$stu,$studyKey,$sequence,$cond,$code]);
        $studyId=(int)$p->lastInsertId();$order=$slot%2===0?['cake','drink']:['drink','cake'];
        $insert=$p->prepare('INSERT INTO ck_story_runs(study_id,story_id,story_version,position,started_at) VALUES(?,?,?,?,?)');
        foreach($order as $i=>$story)$insert->execute([$studyId,$story,$story==='cake'?'20260929':'v2-20261002',$i+1,$i===0?date('Y-m-d H:i:s'):null]);
        $p->prepare('UPDATE ck_story_allocation SET next_sequence=? WHERE study_key=?')->execute([$sequence+1,$studyKey]);
        $study=story_study($stu);$p->commit();return $study;
    }catch(Throwable $e){if($p->inTransaction())$p->rollBack();throw $e;}
}
