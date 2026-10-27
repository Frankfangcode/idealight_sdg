<?php
/** Immutable, server-only story content; a run pins the content version. */
function story_load(string $id,string $version): array {
    $files=['cake:20260929'=>'cake-20260929.json','drink:v2-20261002'=>'drink-v2.json'];
    $file=$files[$id.':'.$version]??null;
    if(!$file)throw new RuntimeException('Unknown story version');
    $data=json_decode(file_get_contents(__DIR__.'/../stories/'.$file),true,512,JSON_THROW_ON_ERROR);
    return $data;
}
function story_public(array $story,int $levelNo): array {
    $characters=[];
    foreach($story['characters'] as $c)$characters[]=['char_key'=>(string)$c['key'],'name'=>$c['name'],'role'=>$c['role'],'trait'=>$c['trait'],'image'=>$c['image']??null];
    $config=$story['config']??[];
    $config['meta']=['id'=>$story['id'],'title'=>$story['title'],'subtitle'=>$story['subtitle']];
    $config['brief']=$story['brief'];
    $config['INTERROGATION']=['seconds'=>60,'maxChars'=>200,'graceSeconds'=>3,'nudgeIdleSeconds'=>25];
    $config['PHASE_SECONDS']=['video'=>10,'testimony'=>60,'combined'=>120,'feedback'=>30];
    $config['ZONES']=['reasonable'=>['label'=>'合理說法','hint'=>'來源、範圍與限制清楚的說法。'],'flaw'=>['label'=>'有瑕疵','hint'=>'推論或技巧使用有瑕疵的說法。'],'unclassified'=>['label'=>'待分類','hint'=>'請閱讀證詞，再放入適合的分類。']];
    $config['RANKING_QUESTION']='誰的說法最不合理？請根據證據說明理由。';
    $config['SHOW_OWN_CLASSIFICATION']=true;
    // Only approved config fields cross the server boundary; never spread arbitrary story settings.
    $config=array_intersect_key($config,array_flip(['meta','brief','INTERROGATION','PHASE_SECONDS','ZONES','RANKING_QUESTION','SHOW_OWN_CLASSIFICATION']));
    $out=['config'=>$config,'characters'=>$characters,'levelCount'=>count($story['levels']),
        'outline'=>array_map(fn($l)=>['no'=>$l['no'],'name'=>$l['name']],$story['levels'])];
    $level=$story['levels'][$levelNo-1]??null;
    if($level){
        $t=[];foreach($level['testimonies'] as $key=>$item)$t[$key]=['text'=>$item['text']];
        $src=$level['video']['src'];
        $out['level']=['no'=>$level['no'],'name'=>$level['name'],'skills'=>$level['skills'],'task'=>$level['task'],
            'reasonableCount'=>count(array_filter($level['testimonies'],fn($t)=>$t['correct']==='reasonable')),
            'rankingCriterion'=>null,'video'=>['src'=>$src,'available'=>is_file(dirname(__DIR__,2).'/'.$src)],'testimonies'=>$t];
    }
    return $out;
}
