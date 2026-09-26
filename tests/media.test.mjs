import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,writeFileSync,readFileSync,existsSync,rmSync,lstatSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFileSync} from 'node:child_process';
test('demo media preparation makes real files for Windows and preserves existing video files',()=>{
 const dir=mkdtempSync(join(tmpdir(),'idealight-media-'));
 try{
 const source=join(dir,'video.mp4'),target=join(dir,'media');writeFileSync(source,'synthetic-video-bytes');
 const args=['api/tools/prepare_demo_media.php','--source='+source,'--target='+target];
 execFileSync(process.env.TEST_PHP_BINARY||'php',args);
 for(const name of ['intro-guide',...Array.from({length:6},(_,i)=>`intro-L${i+1}`)]){const file=join(target,name+'.mp4');assert.equal(lstatSync(file).isSymbolicLink(),false);assert.equal(readFileSync(file,'utf8'),'synthetic-video-bytes');}
 writeFileSync(join(target,'intro-L1.mp4'),'existing-original');execFileSync(process.env.TEST_PHP_BINARY||'php',args);
 assert.equal(readFileSync(join(target,'intro-L1.mp4'),'utf8'),'existing-original');assert.ok(existsSync(source));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
