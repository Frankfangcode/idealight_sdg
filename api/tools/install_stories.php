<?php
// CLI only. Add tables in the configured database; never create/drop a database.
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require_once __DIR__.'/../src/db.php';
$p=db();
$p->exec(file_get_contents(__DIR__.'/../migrations/2026_10_stories.sql'));
echo "Dual-story tables installed; existing tables unchanged.\n";
