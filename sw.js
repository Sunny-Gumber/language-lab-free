const CACHE='language-lab-free-github-v26';
const ASSETS=['./','./index.html','./styles.css','./auth.css','./app.js','./app-core.js','./languages.js','./core-logic.js','./storage-scope.js','./v7-content.js','./v8-content.js','./skills-v10.js','./v9-content.js','./v9-course-ui.js','./cloud-sync-v10.js','./v6-learning.js','./v8-listen-speak.js','./v10-hardening.js','./onboarding-v10.js','./my-languages-v10.js','./supabase-client.js','./auth.js','./manifest.webmanifest'];
const STATIC_PATHS=new Set(ASSETS.map(x=>new URL(x,self.location.href).pathname));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;
  const url=new URL(request.url);
  // Supabase, OAuth, CDN and every other cross-origin request bypass this service worker completely.
  if(url.origin!==self.location.origin)return;
  const isNavigation=request.mode==='navigate';
  if(!isNavigation&&!STATIC_PATHS.has(url.pathname))return;
  event.respondWith(fetch(request).then(response=>{
    if(response.ok&&response.type==='basic'){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy))}
    return response;
  }).catch(async()=>{
    const cached=await caches.match(request);if(cached)return cached;
    if(isNavigation)return caches.match('./index.html');
    return Response.error();
  }));
});
