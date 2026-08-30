import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';
import path from'node:path';
import vm from'node:vm';
import{fileURLToPath,pathToFileURL}from'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

async function normalizedCourses(){
  const sandbox={console};
  const context=vm.createContext(sandbox);context.window=context;
  for(const file of['languages.js','v7-content.js','v8-content.js','v9-content.js','course-export.js'])new vm.Script(read(file),{filename:file}).runInContext(context);
  globalThis.LANGUAGE_LAB_COURSES=structuredClone(context.LANGUAGE_LAB_COURSES);
  const japanese=globalThis.LANGUAGE_LAB_COURSES.find(course=>course.id==='ja');
  const soundUnit=japanese?.units?.find(unit=>unit.title==='Japanese Sound System');
  const dogItem=soundUnit?.items?.find(item=>item.example?.native==='いぬ');
  if(dogItem?.example)dogItem.example.kanjiForm='犬';
  try{
    const url=new URL('../src/data.js',import.meta.url);url.searchParams.set('test',String(Date.now()));
    return(await import(url.href)).courses;
  }finally{delete globalThis.LANGUAGE_LAB_COURSES}
}

test('course content normalizes with unique stable target IDs after pedagogical reorder',async()=>{
  const courses=await normalizedCourses();
  assert.equal(courses.length,10);
  for(const course of courses){
    const ids=[...course.units.flatMap(unit=>unit.items.map(item=>item.id)),...course.vocab.map(word=>word.id)];
    assert.equal(new Set(ids).size,ids.length,`Duplicate target ID in ${course.id}`);
    for(const unit of course.units)for(const item of unit.items){
      assert.ok(item.speechForms.includes(item.native),`Missing native speech form for ${item.id}`);
      if(item.example?.native)assert.ok(item.example.speechForms.includes(item.example.native),`Missing example speech form for ${item.id}`);
    }
  }
  const japanese=courses.find(course=>course.id==='ja');
  assert.equal(japanese.units[0].title,'Japanese Sound System');
  assert.equal(japanese.units[1].title,'Greetings & Polite Basics');
  assert.equal(japanese.units[2].title,'Introduce Yourself');
  assert.match(japanese.units[0].items[0].id,/^item:ja:u1:i1$/);
  const dog=japanese.units.find(unit=>unit.title==='Japanese Sound System').items.find(item=>item.example?.native==='いぬ');
  assert.deepEqual(dog.example.speechForms,['いぬ','犬']);
});