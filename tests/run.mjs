// Run from the repository root on Windows or macOS; no shell glob expansion required.
import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const files=readdirSync(new URL('./',import.meta.url)).filter(f=>f.endsWith('.test.mjs')).sort().map(f=>'tests/'+f);
const result=spawnSync(process.execPath,['--test','--test-concurrency=1',...files],{cwd:root,stdio:'inherit'});
if(result.error)throw result.error;
process.exit(result.status??1);
