import fs from'node:fs';
import path from'node:path';
import vm from'node:vm';
import{fileURLToPath}from'node:url';
import{compileLegacyReferencePacks,compileLegacyCoursePack,validateCoursePack}from'../src/course-pack.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

async function normalizedCourses(){
  const sandbox={console};
  const context=vm.createContext(sandbox);context.window=context;
  for(const file of['languages.js','v7-content.js','v8-content.js','v9-content.js','course-export.js'])new vm.Script(read(file),{filename:file}).runInContext(context);
  globalThis.LANGUAGE_LAB_COURSES=structuredClone(context.LANGUAGE_LAB_COURSES);
  try{
    const url=new URL('../src/data.js',import.meta.url);url.searchParams.set('coursePackBuild',String(Date.now()));
    return(await import(url.href)).courses;
  }finally{delete globalThis.LANGUAGE_LAB_COURSES}
}

const args=new Set(process.argv.slice(2)),courses=await normalizedCourses();
const packs=args.has('--all')?courses.map(compileLegacyCoursePack):compileLegacyReferencePacks(courses);
for(const pack of packs){
  const result=validateCoursePack(pack);
  if(!result.valid)throw new Error(`${pack.course.id}: ${result.errors.join('; ')}`);
  const activityCount=pack.units.reduce((sum,unit)=>sum+unit.activities.length,0);
  console.log(`${pack.course.id}: ${pack.units.length} units, ${pack.concepts.length} concepts, ${activityCount} activity templates`);
}

if(args.has('--write')){
  const output=path.join(root,'course-packs','generated');fs.mkdirSync(output,{recursive:true});
  for(const pack of packs)fs.writeFileSync(path.join(output,`${pack.course.id}.json`),`${JSON.stringify(pack,null,2)}\n`);
  console.log(`Wrote ${packs.length} course pack(s) to ${path.relative(root,output)}`);
}
