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
  for(const file of ['languages.js','v7-content.js','v8-content.js','v9-content.js','course-export.js']){
    assert.match(html,new RegExp(`src="\\.\\/${file.replaceAll('.','\\.')}"`));
    assert.ok(exists(file),`Missing course content layer: ${file}`);
  }
});

test('every relative ES-module import resolves to a file',()=>{
  const srcDir=path.join(root,'src'),modules=srcModules();
  assert.ok(modules.length>=11);
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
  const known=new Set([...pageIds,...dynamicIds,'visitorTopNav','visitorHow','languagesSection']);
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

test('V12 home separates first-visit start UX from learner dashboard',()=>{
  assert.ok(exists('home-v12.css'));
  const home=read('src/home.js');
  assert.match(home,/hasLearningHistory/);
  assert.match(home,/visitor-mode/);
  assert.match(home,/What do you want to learn\?/);
  assert.match(home,/Start learning free/);
  assert.match(home,/openPractice\(button\.dataset\.language\)/);
  assert.match(home,/Keep your language/);
});

test('V11.2 uses structural target IDs and stage-aware practice data',()=>{
  const data=read('src/data.js');
  assert.match(data,/structuralItemId/);
  assert.match(data,/stageId/);
  assert.match(data,/conversationItems/);
  assert.equal(data.includes('hashString'),false);
});

test('event history is backed by IndexedDB rather than localStorage snapshots',()=>{
  assert.ok(exists('src/event-db.js'));
  const store=read('src/store.js');
  assert.match(store,/from'\.\/event-db\.js'/);
  assert.match(store,/events:\[\]/);
  assert.match(store,/eventCursor/);
});

test('service worker caches only known app assets, V12 home CSS, pinned Supabase runtime and bypasses API traffic',()=>{
  const sw=read('sw.js');
  const match=sw.match(/const ASSETS=\[(.*?)\];/s);assert.ok(match,'ASSETS list missing');
  const refs=[...match[1].matchAll(/['"]\.\/([^'"]*)['"]/g)].map(item=>item[1]).filter(Boolean);
  for(const ref of refs)assert.ok(exists(ref),`Missing cached asset: ${ref}`);
  assert.ok(refs.includes('home-v12.css'),'V12 home stylesheet is not cached');
  assert.match(sw,/language-lab-free-v12/);
  assert.match(sw,/url\.origin!==self\.location\.origin/);
  assert.match(sw,/SUPABASE_PINNED/);
  assert.match(sw,/@supabase\/supabase-js@2\.112\.3/);
  assert.match(sw,/self\.skipWaiting\(\)/);
  assert.match(sw,/self\.clients\.claim\(\)/);
});

test('manifest icon files exist',()=>{
  const manifest=JSON.parse(read('manifest.webmanifest'));assert.ok(Array.isArray(manifest.icons)&&manifest.icons.length>0);
  for(const icon of manifest.icons){const src=String(icon.src||'').replace(/^\.\//,'');assert.ok(src&&exists(src),`Missing manifest icon: ${src}`)}
});

test('database migrations are versioned in the repository',()=>{
  for(const file of[
    'supabase/migrations/20260827_v11_event_learning_model.sql',
    'supabase/migrations/20260828_v11_course_positions.sql',
    'supabase/migrations/20260828_v11_remove_legacy_progress_schema.sql',
    'supabase/migrations/20260828_v11_2_position_conflict_guard.sql'
  ])assert.ok(exists(file),`Missing migration: ${file}`);
});

test('top-level runtime no longer references legacy runtime modules',()=>{
  const runtime=read('index.html')+'\n'+read('app.js')+'\n'+read('sw.js');
  for(const old of ['app-core.js','auth.js','auth.css','cloud-sync-v10.js','core-logic.js','storage-scope.js','skills-v10.js','v6-learning.js','v8-listen-speak.js','v9-course-ui.js','v10-hardening.js','onboarding-v10.js','my-languages-v10.js','supabase-client.js'])assert.equal(runtime.includes(old),false,`Legacy runtime still referenced: ${old}`);
});
