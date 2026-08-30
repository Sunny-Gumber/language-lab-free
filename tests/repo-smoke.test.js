import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';
import path from'node:path';
import{fileURLToPath}from'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const exists=name=>fs.existsSync(path.join(root,name));
const srcModules=()=>fs.readdirSync(path.join(root,'src')).filter(name=>name.endsWith('.js'));

test('index loads the clean module entry point and required course data',()=>{
  const html=read('index.html');
  assert.match(html,/name="viewport"\s+content="width=device-width,\s*initial-scale=1,\s*viewport-fit=cover"/);
  assert.match(html,/<script type="module" src="\.\/app\.js"><\/script>/);
  for(const file of['languages.js','v7-content.js','v8-content.js','v9-content.js','course-export.js']){
    assert.match(html,new RegExp(`src="\\.\\/${file.replaceAll('.','\\.')}"`));
    assert.ok(exists(file),`Missing course content layer: ${file}`);
  }
});

test('every relative ES-module import resolves to a file',()=>{
  const srcDir=path.join(root,'src'),modules=srcModules();
  assert.ok(modules.length>=15);
  for(const module of modules){
    const code=read(path.join('src',module));
    for(const match of code.matchAll(/from['"](\.\/[^'"]+)['"]/g)){
      const target=path.resolve(srcDir,match[1]);
      assert.ok(fs.existsSync(target),`${module} imports missing ${match[1]}`);
    }
  }
});

test('literal DOM ids used by modules are declared or created intentionally',()=>{
  const html=read('index.html');
  const pageIds=[...html.matchAll(/\sid="([^"]+)"/g)].map(match=>match[1]);
  const duplicates=pageIds.filter((id,index)=>pageIds.indexOf(id)!==index);
  assert.deepEqual([...new Set(duplicates)],[],`Duplicate ids: ${[...new Set(duplicates)].join(', ')}`);
  const modules=srcModules().map(name=>({name,code:read(path.join('src',name))}));
  const dynamicIds=modules.flatMap(({code})=>[
    ...[...code.matchAll(/\bid=["']([^"']+)["']/g)].map(match=>match[1]),
    ...[...code.matchAll(/\bid=\\?"([^\\"]+)\\?"/g)].map(match=>match[1])
  ]);
  const known=new Set([...pageIds,...dynamicIds,'visitorTopNav','visitorHow','languagesSection','journeyTab','reviewTab','exploreTab']);
  for(const{name,code}of modules){
    const refs=new Set([
      ...[...code.matchAll(/\$\(['"]([^'"]+)['"]\)/g)].map(match=>match[1]),
      ...[...code.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map(match=>match[1])
    ]);
    for(const id of refs)assert.ok(known.has(id),`${name} references undeclared DOM id #${id}`);
  }
});

test('clean modules do not monkey-patch functions or inject style rules',()=>{
  const code=srcModules().map(name=>read(path.join('src',name))).join('\n');
  assert.equal(code.includes("createElement('style')"),false);
  assert.equal(code.includes('cloneNode('),false);
  assert.equal(code.includes('window.speak='),false);
});

test('home is honest about Japanese/Mandarin depth and eight foundation courses',()=>{
  assert.ok(exists('home-v12.css'));
  const home=read('src/home.js');
  assert.match(home,/Deeper structured paths/);
  assert.match(home,/Japanese &nbsp; 🇨🇳 Mandarin/);
  assert.match(home,/Foundation courses/);
  assert.match(home,/8 more languages/);
});

test('V14 uses connected input, retrieval, reading and free response as the normal Journey',()=>{
  assert.ok(exists('src/journey-v14.js'));assert.ok(exists('src/learning-flow.js'));assert.ok(exists('journey-v14.css'));
  const app=read('src/app.js'),journey=read('src/journey-v14.js'),flow=read('src/learning-flow.js');
  assert.match(app,/from'\.\/journey-v14\.js'/);assert.match(app,/version:'14\.0\.1'/);assert.match(app,/tab:'journey'/);
  for(const label of['Journey','Practice','Review','Explore','Progress'])assert.match(journey,new RegExp(label));
  for(const type of["type:'mission'","type:'dialogue'","type:'learn'","type:'retrieve'","type:'reading'","type:'scenario'","type:'complete'"])assert.match(flow,new RegExp(type.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(journey,/Free-response scenario/);assert.match(journey,/Respond in your own words/);assert.match(journey,/Connected reading/);assert.match(journey,/Model conversation/);
  assert.match(journey,/bestSpeechMatch/);assert.match(journey,/speechForms/);assert.match(journey,/hindiPronunciationLabel/);
});

test('V14 keeps adaptive review/new planning while making all units testable',()=>{
  const flow=read('src/learning-flow.js'),session=read('src/session.js'),journey=read('src/journey-v14.js');
  assert.match(flow,/buildJourneySession/);assert.match(flow,/plan\.queue/);
  assert.match(session,/sessionMixFromEvents/);assert.match(session,/review:4,newItems:1/);assert.match(session,/review:2,newItems:3/);
  assert.match(journey,/unlocked:true/);assert.match(journey,/All units are open during the test phase/);
});

test('speech practice uses authored accepted forms instead of one surface string',()=>{
  const practice=read('src/practice.js'),data=read('src/data.js'),utils=read('src/utils.js');
  assert.match(practice,/bestSpeechMatch/);assert.match(practice,/speechForms/);
  assert.match(data,/kanjiForm/);assert.match(data,/speechAliases/);assert.match(data,/speechForms/);
  assert.match(utils,/registerSpeechForms/);assert.match(utils,/bestSpeechMatch/);
});

test('event history remains backed by IndexedDB and derived learning uses revision caches',()=>{
  assert.ok(exists('src/event-db.js'));
  const store=read('src/store.js'),learning=read('src/learning.js'),data=read('src/data.js');
  assert.match(store,/from'\.\/event-db\.js'/);assert.match(store,/events:\[\]/);assert.match(store,/eventCursor/);assert.match(store,/getEventRevision/);
  assert.match(learning,/function eventIndex\(/);assert.match(learning,/mastery:new Map\(\)/);
  assert.match(data,/PRACTICE_CACHE/);assert.match(data,/ITEM_LOOKUP/);
});

test('superseded V13/V10 runtime files are removed instead of kept as parallel code',()=>{
  for(const file of['src/journey.js','src/resumable-journey.js','journey-v13.css','v10-hardening.js'])assert.equal(exists(file),false,`Obsolete runtime should be removed: ${file}`);
});

test('service worker caches V14 flow assets, pinned Supabase runtime and bypasses API traffic',()=>{
  const sw=read('sw.js');
  const match=sw.match(/const ASSETS=\[(.*?)\];/s);assert.ok(match,'ASSETS list missing');
  const refs=[...match[1].matchAll(/['"]\.\/([^'"]*)['"]/g)].map(item=>item[1]).filter(Boolean);
  for(const ref of refs)assert.ok(exists(ref),`Missing cached asset: ${ref}`);
  for(const required of['home-v12.css','journey-v14.css','src/journey-v14.js','src/learning-flow.js','src/session.js'])assert.ok(refs.includes(required),`V14 cache missing ${required}`);
  assert.match(sw,/language-lab-free-v14-0-1/);assert.match(sw,/url\.origin!==self\.location\.origin/);assert.match(sw,/SUPABASE_PINNED/);assert.match(sw,/@supabase\/supabase-js@2\.112\.3/);assert.match(sw,/self\.skipWaiting\(\)/);assert.match(sw,/self\.clients\.claim\(\)/);
});

test('manifest icon files exist',()=>{
  const manifest=JSON.parse(read('manifest.webmanifest'));assert.ok(Array.isArray(manifest.icons)&&manifest.icons.length>0);
  for(const icon of manifest.icons){const src=String(icon.src||'').replace(/^\.\//,'');assert.ok(src&&exists(src),`Missing manifest icon: ${src}`)}
});

test('database migrations remain versioned in the repository',()=>{
  for(const file of[
    'supabase/migrations/20260827_v11_event_learning_model.sql',
    'supabase/migrations/20260828_v11_course_positions.sql',
    'supabase/migrations/20260828_v11_remove_legacy_progress_schema.sql',
    'supabase/migrations/20260828_v11_2_position_conflict_guard.sql'
  ])assert.ok(exists(file),`Missing migration: ${file}`);
});

test('top-level runtime does not reference legacy runtime modules',()=>{
  const runtime=read('index.html')+'\n'+read('app.js')+'\n'+read('sw.js');
  for(const old of['app-core.js','auth.js','auth.css','cloud-sync-v10.js','core-logic.js','storage-scope.js','skills-v10.js','v6-learning.js','v8-listen-speak.js','v9-course-ui.js','v10-hardening.js','onboarding-v10.js','my-languages-v10.js','supabase-client.js'])assert.equal(runtime.includes(old),false,`Legacy runtime still referenced: ${old}`);
});