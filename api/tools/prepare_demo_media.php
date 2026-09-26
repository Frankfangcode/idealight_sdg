<?php
// CLI-only local preview helper. Real deployment media must replace these demo copies deliberately.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$options=getopt('', ['source:', 'target:']);
$root=dirname(__DIR__,2);
$source=$options['source']??$root.'/video.mp4';
$target=$options['target']??$root.'/media';
if (!is_file($source) || !is_readable($source)) { fwrite(STDERR,"找不到可讀取的測試影片。\n"); exit(1); }
if (!is_dir($target) && !mkdir($target,0775,true)) { fwrite(STDERR,"無法建立影片資料夾。\n"); exit(1); }
foreach (array_merge(['intro-guide'],array_map(fn($n)=>'intro-L'.$n,range(1,6))) as $name) {
    $file=$target.'/'.$name.'.mp4';
    // Never replace existing files or links. In particular, do not overwrite actual lesson videos.
    if (file_exists($file) || is_link($file)) { echo "保留既有影片：{$name}\n"; continue; }
    if (!copy($source,$file)) { fwrite(STDERR,"複製失敗：{$name}\n"); exit(1); }
    echo "建立測試影片：{$name}\n";
}
echo "這些是試播素材，不能視為正式關卡影片。\n";
