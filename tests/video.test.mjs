import {test} from 'node:test';import assert from 'node:assert/strict';import {student,api} from './helpers.mjs';
test('onboarding advances in order; video progress survives reloading',async()=>{
 const s=await student('2');
 assert.equal((await api(s,'ck_onboarding.php',{step:3})).status,409);
 assert.equal((await api(s,'ck_video.php',{levelNo:0,position:1,duration:1,completed:true})).status,200);
 assert.equal((await api(s,'ck_onboarding.php',{step:1})).status,200);
 assert.equal((await api(s,'ck_onboarding.php',{step:2})).status,200);
 assert.equal((await api(s,'ck_onboarding.php',{step:3})).status,200);
 assert.equal((await api(s,'ck_video.php',{levelNo:1,position:1,duration:1,completed:true})).status,200);
 const state=await api(s,'ck_state.php');assert.equal(state.onboardingStep,3);assert.equal(state.videoProgress.completed,true);
 assert.equal((await api(s,'ck_advance.php',{levelNo:1,phase:'testimony'})).status,200);
});
