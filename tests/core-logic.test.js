const test=require('node:test');
const assert=require('node:assert/strict');
const Core=require('../core-logic.js');

test('studyDate uses the local calendar date',()=>{
  assert.equal(Core.studyDate(new Date(2026,7,27,23,59,0)),'2026-08-27');
});

test('daysBetween compares date-only values safely',()=>{
  assert.equal(Core.daysBetween('2026-08-27','2026-08-28'),1);
  assert.equal(Core.daysBetween('2026-08-28','2026-08-27'),-1);
});

test('enabled languages are unique, valid and include primary',()=>{
  assert.deepEqual(Core.normalizeEnabledLanguages(['zh','zh','bad'],'ja',['ja','zh','ko']),['ja','zh']);
});

test('mastery merge never lowers progress',()=>{
  assert.deepEqual(Core.mergeMastery({a:80,b:10},{a:70,b:25,c:4}),{a:80,b:25,c:4});
});

test('newer local profile preferences win before cloud upload',()=>{
  const result=Core.resolveProfilePreferences({selected:'zh',enabledLanguages:['zh','ja'],audioPreference:'female',onboardingCompleted:true,profilePrefsUpdatedAt:'2026-08-27T12:00:00Z'},{selected_language:'ja',enabled_languages:['ja'],audio_preference:'male',onboarding_completed:true,learning_preferences_updated_at:'2026-08-27T11:00:00Z'},['ja','zh']);
  assert.equal(result.source,'local');
  assert.equal(result.selected,'zh');
  assert.deepEqual(result.enabledLanguages,['zh','ja']);
});

test('equal preference timestamps favor local state',()=>{
  const result=Core.resolveProfilePreferences({selected:'zh',enabledLanguages:['zh','ja'],audioPreference:'female',profilePrefsUpdatedAt:'2026-08-27T12:00:00Z'},{selected_language:'ja',enabled_languages:['ja'],audio_preference:'auto',learning_preferences_updated_at:'2026-08-27T12:00:00Z'},['ja','zh']);
  assert.equal(result.source,'local');
  assert.equal(result.selected,'zh');
});

test('dirty local preferences win even when remote preference timestamp is newer',()=>{
  const result=Core.resolveProfilePreferences({selected:'zh',enabledLanguages:['zh','ja'],audioPreference:'female',profilePrefsDirty:true,profilePrefsUpdatedAt:'2026-08-27T10:00:00Z'},{selected_language:'ja',enabled_languages:['ja'],audio_preference:'auto',learning_preferences_updated_at:'2026-08-27T13:00:00Z'},['ja','zh']);
  assert.equal(result.source,'local');
  assert.equal(result.selected,'zh');
  assert.equal(result.profilePrefsDirty,true);
});

test('unrelated profile updated_at does not override a newer local preference timestamp',()=>{
  const result=Core.resolveProfilePreferences({selected:'zh',enabledLanguages:['zh','ja'],audioPreference:'female',profilePrefsUpdatedAt:'2026-08-27T12:00:00Z'},{selected_language:'ja',enabled_languages:['ja'],audio_preference:'auto',learning_preferences_updated_at:'2026-08-27T11:00:00Z',updated_at:'2026-08-27T14:00:00Z'},['ja','zh']);
  assert.equal(result.source,'local');
  assert.equal(result.selected,'zh');
});

test('newer remote learning preference timestamp wins on another device',()=>{
  const result=Core.resolveProfilePreferences({selected:'ja',enabledLanguages:['ja'],audioPreference:'auto',profilePrefsUpdatedAt:'2026-08-27T10:00:00Z'},{selected_language:'zh',enabled_languages:['zh','ja'],audio_preference:'female',onboarding_completed:true,learning_preferences_updated_at:'2026-08-27T11:00:00Z',updated_at:'2026-08-27T12:00:00Z'},['ja','zh']);
  assert.equal(result.source,'remote');
  assert.equal(result.selected,'zh');
  assert.deepEqual(result.enabledLanguages,['zh','ja']);
  assert.equal(result.audioPreference,'female');
});
