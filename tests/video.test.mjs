import {test} from 'node:test';import assert from 'node:assert/strict';import {student,api} from './helpers.mjs';
test('character introduction advances without a guide video; instructions and level-video completion remain required',async()=>{
 const s=await student('1');
 assert.equal((await api(s,'ck_onboarding.php',{step:3})).status,409);
 assert.equal((await api(s,'ck_onboarding.php',{step:2})).status,200);
 assert.equal((await api(s,'ck_state.php')).onboardingStep,2);
 assert.equal((await api(s,'ck_onboarding.php',{step:3})).status,200);
 assert.equal((await api(s,'ck_onboarding.php',{step:1})).step,3);
 assert.equal((await api(s,'ck_advance.php',{levelNo:1,phase:'testimony'})).status,409);
 assert.equal((await api(s,'ck_video.php',{levelNo:1,position:1,duration:1,completed:true})).status,200);
 const state=await api(s,'ck_state.php');assert.equal(state.onboardingStep,3);assert.equal(state.videoProgress.completed,true);
 assert.equal(state.guideVideo.completed,false);
 assert.equal((await api(s,'ck_advance.php',{levelNo:1,phase:'testimony'})).status,200);
});
