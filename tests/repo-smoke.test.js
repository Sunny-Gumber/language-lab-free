const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('every local runtime script loaded by app.js exists',()=>{
  const app=read('app.js');
  const refs=[...app.matchAll(/loadScript\(['"]\.\/([^'"]+)['"]\)/g)].map(m=>m[1]);
  assert.ok(refs.length>5);
  for(const ref of refs)assert.ok(fs.existsSync(path.join(root,ref)),`Missing runtime file: ${ref}`);
});

test('service worker asset list contains only existing local files',()=>{
  const sw=read('sw.js');
  const match=sw.match(/const ASSETS=\[(.*?)\];/s);assert.ok(match,'ASSETS list missing');
  const refs=[...match[1].matchAll(/['"]\.\/([^'"]*)['"]/g)].map(m=>m[1]).filter(Boolean);
  for(const ref of refs)assert.ok(fs.existsSync(path.join(root,ref)),`Missing cached asset: ${ref}`);
});

test('service worker explicitly bypasses cross-origin traffic',()=>{
  const sw=read('sw.js');
  assert.match(sw,/url\.origin!==self\.location\.origin/);
});

test('V10 loader does not reference superseded runtime modules',()=>{
  const app=read('app.js');
  for(const old of ['./cloud-sync.js','./onboarding.js','./my-languages.js','./v8-skills.js'])assert.equal(app.includes(old),false,`Legacy module still loaded: ${old}`);
});

test('manifest icon files exist',()=>{
  const manifest=JSON.parse(read('manifest.webmanifest'));
  assert.ok(Array.isArray(manifest.icons)&&manifest.icons.length>0);
  for(const icon of manifest.icons){const src=String(icon.src||'').replace(/^\.\//,'');assert.ok(src&&fs.existsSync(path.join(root,src)),`Missing manifest icon: ${src}`)}
});
