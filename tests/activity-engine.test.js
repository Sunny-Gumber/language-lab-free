import test from'node:test';
import assert from'node:assert/strict';
import{buildInterleavedActivityPlan,canonicalActivityType,assertInterleavedActivityPlan}from'../src/activity-engine.js';

const target=(id,kind='new')=>({id,kind,native:id,meaning:`Meaning ${id}`});

function positions(plan,type,id){
  return plan.map((activity,index)=>({activity,index})).filter(({activity})=>canonicalActivityType(activity)===type&&(!id||activity.target?.id===id)).map(({index})=>index);
}

test('new targets are introduced before delayed retrieval instead of learn-retrieve pairs',()=>{
  const plan=buildInterleavedActivityPlan({unitId:'unit:test',targets:[target('a'),target('b'),target('c')],dialogue:[{native:'context'}],reading:{native:'reading'},production:'Respond'});
  assert.doesNotThrow(()=>assertInterleavedActivityPlan(plan));
  for(const id of['a','b','c']){
    const intro=positions(plan,'concept-intro',id)[0],retrieve=positions(plan,'fixed-retrieval',id)[0];
    assert.ok(Number.isInteger(intro)&&Number.isInteger(retrieve),`Missing intro/retrieval for ${id}`);
    assert.ok(retrieve-intro>=2,`${id} retrieval should be delayed by at least one intervening activity`);
  }
  assert.deepEqual(plan.slice(0,2).map(canonicalActivityType),['mission','model-dialogue']);
});

test('review targets are tested before re-teaching while new targets remain delayed',()=>{
  const plan=buildInterleavedActivityPlan({unitId:'unit:mixed',targets:[target('r1','review'),target('n1','new'),target('r2','review')],production:'Respond'});
  const r1Retrieve=positions(plan,'fixed-retrieval','r1')[0],n1Intro=positions(plan,'concept-intro','n1')[0],r2Retrieve=positions(plan,'fixed-retrieval','r2')[0],n1Retrieve=positions(plan,'fixed-retrieval','n1')[0];
  assert.ok(r1Retrieve<n1Intro,'Existing review should be retrieved before new teaching when queued first');
  assert.ok(n1Intro<r2Retrieve&&r2Retrieve<n1Retrieve,'An intervening review should space the new target retrieval');
  assert.equal(positions(plan,'concept-intro','r1').length,0,'Review targets should not be re-taught before first retrieval');
});

test('single-target sessions remain valid without fabricated filler content',()=>{
  const plan=buildInterleavedActivityPlan({unitId:'unit:single',targets:[target('only')],production:'Respond'});
  const retrieval=plan.find(activity=>canonicalActivityType(activity)==='fixed-retrieval');
  assert.equal(retrieval.spacingLimited,true);
  assert.doesNotThrow(()=>assertInterleavedActivityPlan(plan));
});

test('activity engine emits canonical V15 types with V14 renderer aliases',()=>{
  const plan=buildInterleavedActivityPlan({unitId:'unit:typed',targets:[target('a'),target('b')],production:'Respond'});
  const canonical=plan.map(canonicalActivityType);
  assert.ok(canonical.includes('concept-intro'));
  assert.ok(canonical.includes('fixed-retrieval'));
  assert.ok(canonical.includes('free-speaking'));
  for(const activity of plan)assert.ok(activity.activityType,'Every planned step should retain its canonical V15 activity type');
});
