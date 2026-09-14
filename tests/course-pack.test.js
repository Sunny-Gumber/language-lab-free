import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';
import path from'node:path';
import vm from'node:vm';
import{fileURLToPath}from'node:url';
import{COURSE_PACK_SCHEMA_VERSION,compileLegacyCoursePack,compileLegacyReferencePacks,validateCoursePack}from'../src/course-pack.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

async function normalizedCourses(){
  const sandbox={console};
  const context=vm.createContext(sandbox);context.window=context;
  for(const file of['languages.js','v7-content.js','v8-content.js','v9-content.js','course-export.js'])new vm.Script(read(file),{filename:file}).runInContext(context);
  globalThis.LANGUAGE_LAB_COURSES=structuredClone(context.LANGUAGE_LAB_COURSES);
  try{
    const url=new URL('../src/data.js',import.meta.url);url.searchParams.set('coursePackTest',`${Date.now()}-${Math.random()}`);
    return(await import(url.href)).courses;
  }finally{delete globalThis.LANGUAGE_LAB_COURSES}
}

function targetIds(course){return new Set([...course.units.flatMap(unit=>unit.items.map(item=>item.id)),...course.vocab.map(word=>word.id)])}

test('V15 reference packs compile from normalized Japanese and Mandarin without changing stable target identity',async()=>{
  const courses=await normalizedCourses(),packs=compileLegacyReferencePacks(courses);
  assert.deepEqual(packs.map(pack=>pack.course.id),['ja','zh']);
  for(const pack of packs){
    const course=courses.find(candidate=>candidate.id===pack.course.id),validation=validateCoursePack(pack);
    assert.equal(pack.schemaVersion,COURSE_PACK_SCHEMA_VERSION);
    assert.deepEqual(validation,{valid:true,errors:[]});
    assert.equal(pack.units.length,course.units.length);
    assert.deepEqual(pack.units.map(unit=>unit.id),course.units.map(unit=>unit.id));
    const conceptIds=new Set(pack.concepts.map(concept=>concept.id));
    for(const id of targetIds(course))assert.ok(conceptIds.has(id),`Missing legacy target ${id} in ${course.id} pack`);
    for(const unit of pack.units){
      assert.ok(unit.activities.some(activity=>activity.type==='mission'));
      assert.ok(unit.activities.some(activity=>activity.type==='free-speaking'));
      assert.ok(unit.activities.some(activity=>activity.type==='complete'));
    }
  }
});

test('V15 compiler preserves authored connected dialogue, reading and stage checkpoints',async()=>{
  const courses=await normalizedCourses(),japanese=courses.find(course=>course.id==='ja'),pack=compileLegacyCoursePack(japanese);
  const sourceDialogue=japanese.units.find(unit=>(unit.v14?.dialogue||unit.v9?.dialogue||[]).length);
  assert.ok(sourceDialogue,'Expected an authored Japanese dialogue');
  const packedDialogue=pack.units.find(unit=>unit.id===sourceDialogue.id).activities.find(activity=>activity.type==='model-dialogue');
  assert.ok(packedDialogue);
  assert.equal(packedDialogue.lines.length,(sourceDialogue.v14?.dialogue||sourceDialogue.v9?.dialogue).length);

  const sourceReading=japanese.units.find(unit=>(unit.v14?.reading||unit.v9?.reading)?.native);
  assert.ok(sourceReading,'Expected an authored Japanese reading');
  const packedReading=pack.units.find(unit=>unit.id===sourceReading.id).activities.find(activity=>activity.type==='reading');
  assert.equal(packedReading.reading.native,(sourceReading.v14?.reading||sourceReading.v9?.reading).native);

  const checkpointActivities=pack.units.flatMap(unit=>unit.activities.filter(activity=>activity.type==='checkpoint'));
  assert.ok(checkpointActivities.length>=1,'Expected stage checkpoint templates');
  for(const activity of checkpointActivities){
    assert.ok(activity.checkpoint.stageId);
    assert.ok(activity.checkpoint.canDo.length||activity.checkpoint.task);
  }
});

test('V15 compiler is read-only and validation rejects broken references/types',async()=>{
  const courses=await normalizedCourses(),japanese=courses.find(course=>course.id==='ja'),before=JSON.stringify(japanese),pack=compileLegacyCoursePack(japanese);
  assert.equal(JSON.stringify(japanese),before,'Compiler must not mutate normalized V14 data');

  const missingConcept=structuredClone(pack);missingConcept.units[0].activities[0].conceptIds=['concept:missing'];
  const missingResult=validateCoursePack(missingConcept);
  assert.equal(missingResult.valid,false);
  assert.ok(missingResult.errors.some(error=>error.includes('unknown concept')));

  const badType=structuredClone(pack);badType.units[0].activities[0].type='ai-decides-everything';
  const typeResult=validateCoursePack(badType);
  assert.equal(typeResult.valid,false);
  assert.ok(typeResult.errors.some(error=>error.includes('Unknown activity type')));
});
