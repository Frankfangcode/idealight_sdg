<?php
// PHP development server has no .htaccess support. Match production private boundaries.
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
if (preg_match('~(^|/)\.|^/(tests|docs|api/(src|tools|migrations))(/|$)|\.(sql|md)$~i', $path)) {
    http_response_code(404); echo 'Not found'; return true;
}
return false;
