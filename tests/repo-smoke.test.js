import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';
import path from'node:path';
import{fileURLToPath}from'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const exists=name=>fs.existsSync(path.join(root,name));

test('index loads the V11 module entry point and required course data',()=>{
  const html=read('index.html');
  assert.match(html,/name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/);
  assert.match(html,/<script type="module" src="\.\/app\.js"><\/script>/);
  for(const file of ['languages.js','v7-content.js','v8-content.js','v9-content.js','course-export.js']){
    assert.match(html,new RegExp(`src="\\.\\/${file.replaceAll('.','\\.')}"`));
    assert.ok(exists(file),`Missing course runtime: ${file}`);
  }
});

test('every relative ES-module import resolves to a file',()=>{
  const srcDir=path.join(root,'src');
  const modules=fs.readdirSync(srcDir).filter(name=>name.endsWith('.js'));
  assert.ok(modules.length>=10);
  for(const module of modules){
    const code=read(path.join('src',module));
    for(const match of code.matchAll(/from['"](\.\/[^'"]+)['"]/g)){
      const target=path.resolve(srcDir,match[1]);
      assert.ok(fs.existsSync(target),`${module} imports missing ${match[1]}`);
    }
  }
});

test('clean modules do not monkey-patch functions or inject CSS',()=>{
  const code=fs.readdirSync(path.join(root,'src')).filter(name=>name.endsWith('.js')).map(name=>read(path.join('src',name))).join('\n');
  assert.equal(code.includes("createElement('style')"),false);
  assert.equal(code.includes('cloneNode('),false);
  assert.equal(code.includes('window.speak='),false);
});

test('service worker caches only existing local assets and bypasses cross-origin traffic',()=>{
  const sw=read('sw.js');
  const match=sw.match(/const ASSETS=\[(.*?)\];/s);
  assert.ok(match,'ASSETS list missing');
  const refs=[...match[1].matchAll(/['"]\.\/([^'"]*)['"]/g)].map(item=>item[1]).filter(Boolean);
  for(const ref of refs)assert.ok(exists(ref),`Missing cached asset: ${ref}`);
  assert.match(sw,/url\.origin!==self\.location\.origin/);
  assert.match(sw,/self\.skipWaiting\(\)/);
  assert.match(sw,/self\.clients\.claim\(\)/);
});

test('manifest icon files exist',()=>{
  const manifest=JSON.parse(read('manifest.webmanifest'));
  assert.ok(Array.isArray(manifest.icons)&&manifest.icons.length>0);
  for(const icon of manifest.icons){
    const src=String(icon.src||'').replace(/^\.\//,'');
    assert.ok(src&&exists(src),`Missing manifest icon: ${src}`);
  }
});

test('top-level V11 entry no longer references legacy runtime modules',()=>{
  const runtime=read('index.html')+'\n'+read('app.js')+'\n'+read('sw.js');
  for(const old of ['app-core.js','auth.js','auth.css','cloud-sync-v10.js','core-logic.js','storage-scope.js','skills-v10.js','v6-learning.js','v8-listen-speak.js','v9-course-ui.js','v10-hardening.js','onboarding-v10.js','my-languages-v10.js','supabase-client.js']){
    assert.equal(runtime.includes(old),false,`Legacy runtime still referenced: ${old}`);
  }
});
