const CACHE='language-lab-free-v11-2';
const SUPABASE_REQUEST='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
const SUPABASE_PINNED='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.3/dist/umd/supabase.min.js';
const ASSETS=[
  './','./index.html','./styles.css','./app.js','./manifest.webmanifest','./icon.svg',
  './languages.js','./v7-content.js','./v8-content.js','./v9-content.js','./course-export.js',
  './src/app.js','./src/utils.js','./src/data.js','./src/event-db.js','./src/store.js','./src/cloud.js','./src/learning.js',
  './src/audio.js','./src/writing.js','./src/auth-ui.js','./src/home.js','./src/practice.js','./src/course.js'
];
const STATIC_PATHS=new Set(ASSETS.map(asset=>new URL(asset,self.location.href).pathname));

async function cacheSupabaseRuntime(cache){
  try{
    const response=await fetch(SUPABASE_PINNED,{mode:'cors'});
    if(response.ok)await cache.put(SUPABASE_REQUEST,response.clone());
  }catch(error){console.warn('[Language Lab] Supabase runtime was not pre-cached',error)}
}

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(async cache=>{
    await cache.addAll(ASSETS);
    await cacheSupabaseRuntime(cache);
  }).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);

  if(request.url===SUPABASE_REQUEST){
    event.respondWith(caches.open(CACHE).then(async cache=>{
      const cached=await cache.match(SUPABASE_REQUEST);
      if(cached)return cached;
      try{
        const response=await fetch(SUPABASE_PINNED,{mode:'cors'});
        if(response.ok)await cache.put(SUPABASE_REQUEST,response.clone());
        return response;
      }catch{return Response.error()}
    }));
    return;
  }

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
