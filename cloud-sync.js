// Language Lab Free — reliable multi-device cloud sync with account-isolated local state
(function(){
  const STORAGE_KEY='languageLabFreeV3';
  const GUEST_STORAGE_KEY='languageLabFreeGuestV3';
  const ACCOUNT_STORAGE_PREFIX='languageLabFreeAccountV3:';
  const ACTIVE_SCOPE_KEY='languageLabFreeActiveScopeV3';
  const LEGACY_BACKUP_KEY='languageLabFreeLegacyBackupV3';
  const cloud=window.LANGUAGE_LAB_SUPABASE||{};
  const client=cloud.client||null;
  const LOCAL_WATCH_MS=1200;
  const CLOUD_RECONCILE_MS=60*60*1000;
  let user=null,syncing=false,queued=false,initializedFor=undefined,lastSnapshot='',localTimer=null,cloudTimer=null,realtimeChannel=null,scopeGeneration=0;

  function safeParse(raw,fallback={}){try{return raw?JSON.parse(raw):fallback}catch{return fallback}}
  function readLocal(){return safeParse(localStorage.getItem(STORAGE_KEY),{})||{}}
  function scopeForUser(u){return u?.id?`account:${u.id}`:'guest'}
  function keyForScope(scope){return scope==='guest'?GUEST_STORAGE_KEY:scope?.startsWith('account:')?ACCOUNT_STORAGE_PREFIX+scope.slice(8):null}
  function blankState(scope){return {selected:scope==='guest'?'ja':null,xp:0,streak:1,lastStudy:null,languages:{}}}
  function readScoped(scope){const key=keyForScope(scope);if(!key)return null;const raw=localStorage.getItem(key);return raw?safeParse(raw,null):null}
  function applyGlobalState(data){try{if(typeof state!=='undefined')state=data;if(typeof lang!=='undefined'&&typeof LANGUAGES!=='undefined')lang=LANGUAGES.find(x=>x.id===data.selected)||LANGUAGES[0]}catch{}}
  function persistScope(data){const scope=localStorage.getItem(ACTIVE_SCOPE_KEY),key=keyForScope(scope);if(key)localStorage.setItem(key,JSON.stringify(data))}
  function writeLocal(data){localStorage.setItem(STORAGE_KEY,JSON.stringify(data));persistScope(data);applyGlobalState(data)}
  function switchScope(nextUser){
    const target=scopeForUser(nextUser),current=localStorage.getItem(ACTIVE_SCOPE_KEY),shared=readLocal();
    if(current===target){persistScope(shared);applyGlobalState(shared);return false}
    if(current){const currentKey=keyForScope(current);if(currentKey)localStorage.setItem(currentKey,JSON.stringify(shared))}
    else if(!localStorage.getItem(LEGACY_BACKUP_KEY))localStorage.setItem(LEGACY_BACKUP_KEY,JSON.stringify(shared));
    const next=readScoped(target)||blankState(target);
    localStorage.setItem(ACTIVE_SCOPE_KEY,target);
    localStorage.setItem(STORAGE_KEY,JSON.stringify(next));
    const nextKey=keyForScope(target);if(nextKey)localStorage.setItem(nextKey,JSON.stringify(next));
    applyGlobalState(next);scopeGeneration++;
    refreshUI(true);
    window.dispatchEvent(new CustomEvent('language-lab-local-scope-changed',{detail:{scope:target,userId:nextUser?.id||null}}));
    return true;
  }

  function langDefaults(v={}){return {mastery:{},writes:0,quizCorrect:0,quizTotal:0,favorites:[],xp:0,...v,mastery:{...(v.mastery||{})},favorites:[...(v.favorites||[])]}}
  function localDate(){const parts=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const x=Object.fromEntries(parts.map(p=>[p.type,p.value]));return `${x.year}-${x.month}-${x.day}`}
  function maxDate(a,b){return !a?b:!b?a:(a>b?a:b)}
  function mergeMastery(a={},b={}){const out={...a};for(const [k,v] of Object.entries(b))out[k]=Math.max(Number(out[k]||0),Number(v||0));return out}
  function union(a=[],b=[]){return [...new Set([...(a||[]),...(b||[])])]} 
  function setStatus(text,kind=''){let el=document.getElementById('cloudSyncStatus');if(!el){const top=document.querySelector('.top-actions');if(!top)return;el=document.createElement('span');el.id='cloudSyncStatus';el.className='cloud-sync-status';const account=document.getElementById('authAccountBtn');account?top.insertBefore(el,account):top.appendChild(el)}el.textContent=text;el.dataset.state=kind;el.title=text}
  function injectStyle(){if(document.getElementById('cloudSyncStyle'))return;const s=document.createElement('style');s.id='cloudSyncStyle';s.textContent=`.cloud-sync-status{font-size:11px;font-weight:800;color:#64748b;white-space:nowrap}.cloud-sync-status[data-state="ok"]{color:#15803d}.cloud-sync-status[data-state="busy"]{color:#2563eb}.cloud-sync-status[data-state="error"]{color:#b45309}@media(max-width:560px){.cloud-sync-status{display:none}}`;document.head.appendChild(s)}
  function refreshUI(full=false){try{if(typeof renderTop==='function')renderTop();if(typeof renderLanguages==='function')renderLanguages();if(full&&document.getElementById('courseScreen')?.classList.contains('active')&&typeof renderCourse==='function')renderCourse();else if(typeof renderProgress==='function'&&document.getElementById('progressTab')?.classList.contains('active'))renderProgress()}catch(e){console.debug('[Language Lab Free] UI refresh skipped',e)}}
  function localHasProgress(s){return Number(s.xp||0)>0||Object.values(s.languages||{}).some(v=>Number(v.xp||0)>0||Number(v.writes||0)>0||Number(v.quizTotal||0)>0||Object.keys(v.mastery||{}).length||v.favorites?.length)}
  function expectedScope(userId){return `account:${userId}`}
  function syncStillValid(userId,generation){return Boolean(user&&user.id===userId&&generation===scopeGeneration&&localStorage.getItem(ACTIVE_SCOPE_KEY)===expectedScope(userId))}

  async function fetchCloud(userId){
    const [p,l,a]=await Promise.all([
      client.from('profiles').select('id,total_xp,current_streak,longest_streak,last_study_date,selected_language,timezone,updated_at').eq('id',userId).maybeSingle(),
      client.from('language_progress').select('language_code,current_unit,current_lesson,mastery,favorites,writing_attempts,quiz_correct,quiz_total,xp,updated_at').eq('user_id',userId),
      client.from('study_activity').select('activity_date,xp_earned,study_minutes,updated_at').eq('user_id',userId).order('activity_date',{ascending:false}).limit(60)
    ]);
    for(const r of [p,l,a])if(r.error)throw r.error;
    return {profile:p.data,languages:l.data||[],activity:a.data||[]}
  }

  function mergeCloudIntoLocal(local,remote){
    const out={selected:local.selected||remote.profile?.selected_language||'ja',xp:Number(local.xp||0),streak:Number(local.streak||1),lastStudy:local.lastStudy||null,languages:{...(local.languages||{})}};
    const p=remote.profile;
    if(p){out.xp=Math.max(out.xp,Number(p.total_xp||0));out.streak=Math.max(out.streak,Number(p.current_streak||0));out.lastStudy=maxDate(out.lastStudy,p.last_study_date);if(!localHasProgress(local)&&p.selected_language)out.selected=p.selected_language}
    for(const r of remote.languages){const l=langDefaults(out.languages[r.language_code]);out.languages[r.language_code]={...l,mastery:mergeMastery(l.mastery,r.mastery||{}),favorites:union(l.favorites,r.favorites||[]),writes:Math.max(Number(l.writes||0),Number(r.writing_attempts||0)),quizCorrect:Math.max(Number(l.quizCorrect||0),Number(r.quiz_correct||0)),quizTotal:Math.max(Number(l.quizTotal||0),Number(r.quiz_total||0)),xp:Math.max(Number(l.xp||0),Number(r.xp||0)),currentUnit:Math.max(Number(l.currentUnit||0),Number(r.current_unit||0)),currentLesson:Math.max(Number(l.currentLesson||0),Number(r.current_lesson||0))}}
    return out
  }

  async function pushState(s,remote,userId){
    const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC',today=localDate();
    const profile={id:userId,total_xp:Math.max(Number(s.xp||0),Number(remote.profile?.total_xp||0)),current_streak:Math.max(Number(s.streak||0),Number(remote.profile?.current_streak||0)),longest_streak:Math.max(Number(remote.profile?.longest_streak||0),Number(s.streak||0)),last_study_date:maxDate(s.lastStudy||null,remote.profile?.last_study_date||null),selected_language:s.selected||remote.profile?.selected_language||'ja',timezone};
    const {error:pe}=await client.from('profiles').upsert(profile,{onConflict:'id'});if(pe)throw pe;
    const remoteByLang=Object.fromEntries((remote.languages||[]).map(r=>[r.language_code,r]));
    const rows=Object.entries(s.languages||{}).map(([code,v])=>{const r=remoteByLang[code]||{};return {user_id:userId,language_code:code,current_unit:Math.max(Number(v.currentUnit||0),Number(r.current_unit||0)),current_lesson:Math.max(Number(v.currentLesson||0),Number(r.current_lesson||0)),mastery:mergeMastery(v.mastery||{},r.mastery||{}),favorites:union(v.favorites||[],r.favorites||[]),writing_attempts:Math.max(Number(v.writes||0),Number(r.writing_attempts||0)),quiz_correct:Math.max(Number(v.quizCorrect||0),Number(r.quiz_correct||0)),quiz_total:Math.max(Number(v.quizTotal||0),Number(r.quiz_total||0)),xp:Math.max(Number(v.xp||0),Number(r.xp||0))}});
    if(rows.length){const {error}=await client.from('language_progress').upsert(rows,{onConflict:'user_id,language_code'});if(error)throw error}
    if(profile.last_study_date===today){const previousDays=(remote.activity||[]).filter(x=>x.activity_date!==today).reduce((sum,x)=>sum+Number(x.xp_earned||0),0),earnedToday=Math.max(0,Number(profile.total_xp||0)-previousDays),current=(remote.activity||[]).find(x=>x.activity_date===today);const {error:ae}=await client.from('study_activity').upsert({user_id:userId,activity_date:today,xp_earned:Math.max(Number(current?.xp_earned||0),earnedToday),study_minutes:Number(current?.study_minutes||0)},{onConflict:'user_id,activity_date'});if(ae)throw ae}
  }

  async function sync(reason='change'){
    if(!client||!user)return;
    if(syncing){queued=true;return}
    const userId=user.id,generation=scopeGeneration;
    if(!syncStillValid(userId,generation))return;
    syncing=true;queued=false;setStatus('⟳ Syncing','busy');
    try{
      const remote=await fetchCloud(userId);if(!syncStillValid(userId,generation))return;
      const merged=mergeCloudIntoLocal(readLocal(),remote);writeLocal(merged);refreshUI();
      await pushState(merged,remote,userId);if(!syncStillValid(userId,generation))return;
      const confirmed=await fetchCloud(userId);if(!syncStillValid(userId,generation))return;
      const finalState=mergeCloudIntoLocal(readLocal(),confirmed);writeLocal(finalState);refreshUI();lastSnapshot=localStorage.getItem(STORAGE_KEY)||JSON.stringify(finalState);setStatus('☁ Synced','ok');window.dispatchEvent(new CustomEvent('language-lab-cloud-synced',{detail:{reason,userId}}))
    }catch(error){if(syncStillValid(userId,generation)){console.warn('[Language Lab Free] Cloud sync failed:',error);setStatus(navigator.onLine?'☁ Sync pending':'Offline · saved locally','error')}}
    finally{syncing=false;if(queued&&syncStillValid(userId,generation))setTimeout(()=>sync('queued'),250)}
  }

  function watchLocal(){clearInterval(localTimer);lastSnapshot=localStorage.getItem(STORAGE_KEY)||'';localTimer=setInterval(()=>{if(!user)return;const now=localStorage.getItem(STORAGE_KEY)||'';if(now!==lastSnapshot){lastSnapshot=now;persistScope(readLocal());sync('local-change')}},LOCAL_WATCH_MS)}
  function watchCloud(){clearInterval(cloudTimer);cloudTimer=setInterval(()=>{if(user&&navigator.onLine)sync('hourly-cloud-reconcile')},CLOUD_RECONCILE_MS)}
  function stopRealtime(){if(realtimeChannel&&client){try{client.removeChannel(realtimeChannel)}catch{}}realtimeChannel=null}
  function startRealtime(){stopRealtime();if(!client?.channel||!user)return;const userId=user.id;try{realtimeChannel=client.channel(`language-lab-${userId}`).on('postgres_changes',{event:'*',schema:'public',table:'profiles',filter:`id=eq.${userId}`},()=>sync('realtime-profile')).on('postgres_changes',{event:'*',schema:'public',table:'language_progress',filter:`user_id=eq.${userId}`},()=>sync('realtime-language')).on('postgres_changes',{event:'*',schema:'public',table:'study_activity',filter:`user_id=eq.${userId}`},()=>sync('realtime-activity')).subscribe()}catch(error){console.debug('[Language Lab Free] Realtime unavailable; hourly reconciliation remains active.',error)}}
  function stopWatchers(){clearInterval(localTimer);clearInterval(cloudTimer);localTimer=null;cloudTimer=null;stopRealtime()}

  async function start(nextUser){
    const next=nextUser||null,nextId=next?.id||null;
    stopWatchers();switchScope(next);user=next;
    if(!user){initializedFor=null;syncing=false;queued=false;setStatus('Guest · this device','');return}
    if(initializedFor===nextId&&localStorage.getItem(ACTIVE_SCOPE_KEY)===expectedScope(nextId)){watchLocal();watchCloud();startRealtime();return}
    initializedFor=nextId;syncing=false;queued=false;setStatus('⟳ Loading cloud','busy');await sync('sign-in');watchLocal();watchCloud();startRealtime()
  }

  window.addEventListener('language-lab-auth-changed',e=>start(e.detail?.user||null));
  window.addEventListener('online',()=>{if(user)sync('online')});
  window.addEventListener('offline',()=>setStatus(user?'Offline · saved locally':'Guest · this device','error'));
  window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY&&user)sync('other-tab');if(e.key===ACTIVE_SCOPE_KEY&&user&&!syncStillValid(user.id,scopeGeneration))start(window.LanguageLabAuth?.getUser?.()||null)});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&user)sync('visible')});
  window.addEventListener('focus',()=>{if(user)sync('focus')});

  function init(){injectStyle();start(window.LanguageLabAuth?.getUser?.()||null)}
  window.LanguageLabCloudSync={sync:()=>sync('manual'),status:()=>({signedIn:Boolean(user),syncing,userId:user?.id||null,scope:localStorage.getItem(ACTIVE_SCOPE_KEY)||null})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
