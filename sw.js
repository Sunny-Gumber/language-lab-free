const CACHE='language-lab-free-v11-2';
const ASSETS=[
  './','./index.html','./styles.css','./app.js','./manifest.webmanifest','./icon.svg',
  './languages.js','./v7-content.js','./v8-content.js','./v9-content.js','./course-export.js',
  './src/app.js','./src/utils.js','./src/data.js','./src/store.js','./src/cloud.js','./src/learning.js',
  './src/audio.js','./src/writing.js','./src/auth-ui.js','./src/home.js','./src/practice.js','./src/course.js'
];
const STATIC_PATHS=new Set(ASSETS.map(asset=>new URL(asset,self.location.href).pathname));

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  const navigation=request.mode==='navigate';
  if(!navigation&&!STATIC_PATHS.has(url.pathname))return;

  event.respondWith(fetch(request).then(response=>{
    if(response.ok&&response.type==='basic')caches.open(CACHE).then(cache=>cache.put(request,response.clone()));
    return response;
  }).catch(async()=>{
    const cached=await caches.match(request);
    if(cached)return cached;
    if(navigation)return caches.match('./index.html');
    return Response.error();
  }));
});
