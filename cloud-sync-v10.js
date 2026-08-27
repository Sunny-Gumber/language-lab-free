// Language Lab Free — V10 deterministic cloud sync
(function(){
  const cloud=window.LANGUAGE_LAB_SUPABASE||{},client=cloud.client||null;
  const Store=window.LanguageLabStorage,Core=window.LanguageLabCore||{};
  const LOCAL_WATCH_MS=1400,CLOUD_RECONCILE_MS=60*60*1000,REALTIME_DEBOUNCE_MS=450;
  let user=null,syncing=false,queued=false,initializedFor=null,lastSnapshot='',localTimer=null,cloudTimer=null,realtimeChannel=null,realtimeTimer=null,scopeGeneration=0,ignoreRealtimeUntil=0;
  const validCodes=()=>typeof LANGUAGES!=='undefined'?LANGUAGES.map(l=>l.id):[];
  const readLocal=()=>Store?.readState?.()||{};
  const writeLocal=data=>Store?.writeState?.(data)||localStorage.setItem('languageLabFreeV3',JSON.stringify(data));
  const maxDate=(a,b)=>!a?b:!b?a:(a>b?a:b);
  const mergeMastery=(a,b)=>Core.mergeMastery?Core.mergeMastery(a,b):{...(a||{}),...(b||{})};
  const union=(a,b)=>Core.union?Core.union(a,b):[...new Set([...(a||[]),...(b||[])])];
  const deepEqual=(a,b)=>Core.deepEqual?Core.deepEqual(a,b):JSON.stringify(a)===JSON.stringify(b);
  const sameSet=(a,b)=>Core.sameSet?Core.sameSet(a,b):deepEqual([...(a||[])].sort(),[...(b||[])].sort());
  const normalizeEnabled=(list,primary)=>Core.normalizeEnabledLanguages?Core.normalizeEnabledLanguages(list,primary,validCodes()):[...new Set([primary,...(list||[])].filter(Boolean))];
  const normalizeAudio=v=>Core.normalizeAudio?Core.normalizeAudio(v):(['auto','female','male'].includes(v)?v:'auto');

  function setStatus(text,kind=''){
    let el=document.getElementById('cloudSyncStatus');
    if(!el){const top=document.querySelector('.top-actions');if(!top)return;el=document.createElement('span');el.id='cloudSyncStatus';el.className='cloud-sync-status';const account=document.getElementById('authAccountBtn');account?top.insertBefore(el,account):top.appendChild(el)}
    el.textContent=text;el.dataset.state=kind;el.title=text;
  }
  function injectStyle(){if(document.getElementById('cloudSyncStyle'))return;const s=document.createElement('style');s.id='cloudSyncStyle';s.textContent=`.cloud-sync-status{font-size:11px;font-weight:800;color:#64748b;white-space:nowrap}.cloud-sync-status[data-state="ok"]{color:#15803d}.cloud-sync-status[data-state="busy"]{color:#2563eb}.cloud-sync-status[data-state="error"]{color:#b45309}@media(max-width:560px){.cloud-sync-status{display:none}}`;document.head.appendChild(s)}
  function refreshUI(full=false){try{renderTop?.();renderLanguages?.();if(full&&document.getElementById('courseScreen')?.classList.contains('active'))renderCourse?.();else if(document.getElementById('progressTab')?.classList.contains('active'))renderProgress?.()}catch(e){console.debug('[Language Lab Free] UI refresh skipped',e)}}
  function expectedScope(userId){return `account:${userId}`}
  function syncStillValid(userId,generation){return Boolean(user&&user.id===userId&&generation===scopeGeneration&&Store?.activeScope?.()===expectedScope(userId))}
  function langDefaults(v={}){return {mastery:{},writes:0,quizCorrect:0,quizTotal:0,favorites:[],xp:0,...v,mastery:{...(v.mastery||{})},favorites:[...(v.favorites||[])]}}

  async function fetchCloud(userId){
    const [p,l,a]=await Promise.all([
      client.from('profiles').select('id,total_xp,current_streak,longest_streak,last_study_date,selected_language,enabled_languages,audio_preference,onboarding_completed,timezone,updated_at').eq('id',userId).maybeSingle(),
      client.from('language_progress').select('language_code,current_unit,current_lesson,mastery,favorites,writing_attempts,quiz_correct,quiz_total,xp,updated_at').eq('user_id',userId),
      client.from('study_activity').select('activity_date,xp_earned,study_minutes,updated_at').eq('user_id',userId).order('activity_date',{ascending:false}).limit(60)
    ]);
    for(const r of [p,l,a])if(r.error)throw r.error;
    return {profile:p.data,languages:l.data||[],activity:a.data||[]};
  }

  function mergeCloudIntoLocal(local,remote){
    const p=remote.profile||null,primaryLocal=local.primaryLanguage||local.selected||'ja';
    const prefInput={...local,selected:primaryLocal};
    const prefs=Core.resolveProfilePreferences?Core.resolveProfilePreferences(prefInput,p,validCodes()):{selected:p?.selected_language||primaryLocal,enabledLanguages:normalizeEnabled(p?.enabled_languages,primaryLocal),audioPreference:normalizeAudio(p?.audio_preference),onboardingCompleted:Boolean(p?.onboarding_completed),profilePrefsUpdatedAt:p?.updated_at||local.profilePrefsUpdatedAt||null};
    const primary=prefs.selected||primaryLocal;
    const enabled=normalizeEnabled(prefs.enabledLanguages,primary);
    const currentSelected=enabled.includes(local.selected)?local.selected:primary;
    const out={...local,selected:currentSelected,primaryLanguage:primary,enabledLanguages:enabled,audioPreference:prefs.audioPreference,onboardingCompleted:prefs.onboardingCompleted,profilePrefsUpdatedAt:prefs.profilePrefsUpdatedAt,xp:Number(local.xp||0),streak:Number(local.streak||1),lastStudy:local.lastStudy||null,languages:{...(local.languages||{})}};
    if(p){out.xp=Math.max(out.xp,Number(p.total_xp||0));out.streak=Math.max(out.streak,Number(p.current_streak||0));out.lastStudy=maxDate(out.lastStudy,p.last_study_date)}
    for(const r of remote.languages){
      const l=langDefaults(out.languages[r.language_code]);
      out.languages[r.language_code]={...l,mastery:mergeMastery(l.mastery,r.mastery||{}),favorites:union(l.favorites,r.favorites||[]),writes:Math.max(Number(l.writes||0),Number(r.writing_attempts||0)),quizCorrect:Math.max(Number(l.quizCorrect||0),Number(r.quiz_correct||0)),quizTotal:Math.max(Number(l.quizTotal||0),Number(r.quiz_total||0)),xp:Math.max(Number(l.xp||0),Number(r.xp||0)),currentUnit:Math.max(Number(l.currentUnit||0),Number(r.current_unit||0)),currentLesson:Math.max(Number(l.currentLesson||0),Number(r.current_lesson||0))};
    }
    return out;
  }

  function profilePayload(s,remote,userId){
    const primary=s.primaryLanguage||s.selected||remote.profile?.selected_language||'ja';
    return {id:userId,total_xp:Math.max(Number(s.xp||0),Number(remote.profile?.total_xp||0)),current_streak:Math.max(Number(s.streak||0),Number(remote.profile?.current_streak||0)),longest_streak:Math.max(Number(remote.profile?.longest_streak||0),Number(s.streak||0)),last_study_date:maxDate(s.lastStudy||null,remote.profile?.last_study_date||null),selected_language:primary,enabled_languages:normalizeEnabled(s.enabledLanguages,primary),audio_preference:normalizeAudio(s.audioPreference||remote.profile?.audio_preference),onboarding_completed:Boolean(s.onboardingCompleted||remote.profile?.onboarding_completed),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'};
  }
  function profileChanged(payload,remote){
    const p=remote.profile;if(!p)return true;
    return Number(p.total_xp||0)!==payload.total_xp||Number(p.current_streak||0)!==payload.current_streak||Number(p.longest_streak||0)!==payload.longest_streak||(p.last_study_date||null)!==(payload.last_study_date||null)||(p.selected_language||null)!==payload.selected_language||!sameSet(p.enabled_languages||[],payload.enabled_languages||[])||normalizeAudio(p.audio_preference)!==payload.audio_preference||Boolean(p.onboarding_completed)!==payload.onboarding_completed||(p.timezone||'UTC')!==payload.timezone;
  }
  function languageRow(code,v,remoteRow,userId){
    const r=remoteRow||{};
    return {user_id:userId,language_code:code,current_unit:Math.max(Number(v.currentUnit||0),Number(r.current_unit||0)),current_lesson:Math.max(Number(v.currentLesson||0),Number(r.current_lesson||0)),mastery:mergeMastery(v.mastery||{},r.mastery||{}),favorites:union(v.favorites||[],r.favorites||[]),writing_attempts:Math.max(Number(v.writes||0),Number(r.writing_attempts||0)),quiz_correct:Math.max(Number(v.quizCorrect||0),Number(r.quiz_correct||0)),quiz_total:Math.max(Number(v.quizTotal||0),Number(r.quiz_total||0)),xp:Math.max(Number(v.xp||0),Number(r.xp||0))};
  }
  function languageChanged(row,r){return !r||Number(r.current_unit||0)!==row.current_unit||Number(r.current_lesson||0)!==row.current_lesson||!deepEqual(r.mastery||{},row.mastery)||!sameSet(r.favorites||[],row.favorites||[])||Number(r.writing_attempts||0)!==row.writing_attempts||Number(r.quiz_correct||0)!==row.quiz_correct||Number(r.quiz_total||0)!==row.quiz_total||Number(r.xp||0)!==row.xp}

  async function pushState(s,remote,userId){
    const profile=profilePayload(s,remote,userId),remoteByLang=Object.fromEntries((remote.languages||[]).map(r=>[r.language_code,r]));
    const rows=Object.entries(s.languages||{}).map(([code,v])=>languageRow(code,v,remoteByLang[code],userId)).filter(row=>languageChanged(row,remoteByLang[row.language_code]));
    const today=Store?.studyDate?.()||Core.studyDate?.()||new Date().toISOString().slice(0,10),previousDays=(remote.activity||[]).filter(x=>x.activity_date!==today).reduce((sum,x)=>sum+Number(x.xp_earned||0),0),earnedToday=Math.max(0,Number(profile.total_xp||0)-previousDays),current=(remote.activity||[]).find(x=>x.activity_date===today),activityRow=profile.last_study_date===today?{user_id:userId,activity_date:today,xp_earned:Math.max(Number(current?.xp_earned||0),earnedToday),study_minutes:Number(current?.study_minutes||0)}:null;
    const activityChanged=activityRow&&(!current||Number(current.xp_earned||0)!==activityRow.xp_earned||Number(current.study_minutes||0)!==activityRow.study_minutes);
    if(!profileChanged(profile,remote)&&!rows.length&&!activityChanged)return false;
    ignoreRealtimeUntil=Date.now()+1800;
    if(profileChanged(profile,remote)){const {error}=await client.from('profiles').upsert(profile,{onConflict:'id'});if(error)throw error}
    if(rows.length){const {error}=await client.from('language_progress').upsert(rows,{onConflict:'user_id,language_code'});if(error)throw error}
    if(activityChanged){const {error}=await client.from('study_activity').upsert(activityRow,{onConflict:'user_id,activity_date'});if(error)throw error}
    return true;
  }

  async function sync(reason='change'){
    if(!client||!user)return;
    if(syncing){queued=true;return}
    const userId=user.id,generation=scopeGeneration;if(!syncStillValid(userId,generation))return;
    syncing=true;queued=false;setStatus('⟳ Syncing','busy');
    try{
      const remote=await fetchCloud(userId);if(!syncStillValid(userId,generation))return;
      const merged=mergeCloudIntoLocal(readLocal(),remote);writeLocal(merged);refreshUI();
      await pushState(merged,remote,userId);if(!syncStillValid(userId,generation))return;
      const confirmed=await fetchCloud(userId);if(!syncStillValid(userId,generation))return;
      const finalState=mergeCloudIntoLocal(readLocal(),confirmed);writeLocal(finalState);refreshUI();lastSnapshot=JSON.stringify(finalState);setStatus('☁ Synced','ok');window.dispatchEvent(new CustomEvent('language-lab-cloud-synced',{detail:{reason,userId}}));
    }catch(error){if(syncStillValid(userId,generation)){console.warn('[Language Lab Free] Cloud sync failed:',error);setStatus(navigator.onLine?'☁ Sync pending':'Offline · saved locally','error')}}
    finally{syncing=false;if(queued&&syncStillValid(userId,generation))setTimeout(()=>sync('queued'),350)}
  }

  function watchLocal(){clearInterval(localTimer);lastSnapshot=localStorage.getItem(Store?.STORAGE_KEY||'languageLabFreeV3')||'';localTimer=setInterval(()=>{if(!user)return;const now=localStorage.getItem(Store?.STORAGE_KEY||'languageLabFreeV3')||'';if(now!==lastSnapshot){lastSnapshot=now;Store?.persistCurrent?.(readLocal());sync('local-change')}},LOCAL_WATCH_MS)}
  function watchCloud(){clearInterval(cloudTimer);cloudTimer=setInterval(()=>{if(user&&navigator.onLine)sync('hourly-cloud-reconcile')},CLOUD_RECONCILE_MS)}
  function stopRealtime(){clearTimeout(realtimeTimer);realtimeTimer=null;if(realtimeChannel&&client){try{client.removeChannel(realtimeChannel)}catch{}}realtimeChannel=null}
  function queueRealtime(reason){if(Date.now()<ignoreRealtimeUntil)return;clearTimeout(realtimeTimer);realtimeTimer=setTimeout(()=>sync(reason),REALTIME_DEBOUNCE_MS)}
  function startRealtime(){stopRealtime();if(!client?.channel||!user)return;const userId=user.id;try{realtimeChannel=client.channel(`language-lab-${userId}`).on('postgres_changes',{event:'*',schema:'public',table:'profiles',filter:`id=eq.${userId}`},()=>queueRealtime('realtime-profile')).on('postgres_changes',{event:'*',schema:'public',table:'language_progress',filter:`user_id=eq.${userId}`},()=>queueRealtime('realtime-language')).on('postgres_changes',{event:'*',schema:'public',table:'study_activity',filter:`user_id=eq.${userId}`},()=>queueRealtime('realtime-activity')).subscribe()}catch(error){console.debug('[Language Lab Free] Realtime unavailable; hourly reconciliation remains active.',error)}}
  function stopWatchers(){clearInterval(localTimer);clearInterval(cloudTimer);localTimer=null;cloudTimer=null;stopRealtime()}

  async function start(nextUser){
    const next=nextUser||null,nextId=next?.id||null;stopWatchers();
    const changed=Store?.switchScope?.(next)||false;if(changed)scopeGeneration++;
    user=next;
    if(!user){initializedFor=null;syncing=false;queued=false;setStatus('Guest · this device','');refreshUI(true);return}
    if(initializedFor===nextId&&Store?.activeScope?.()===expectedScope(nextId)){watchLocal();watchCloud();startRealtime();return}
    initializedFor=nextId;syncing=false;queued=false;setStatus('⟳ Loading cloud','busy');await sync('sign-in');watchLocal();watchCloud();startRealtime();
  }

  function setProfilePreferences(patch={}){
    const s=readLocal(),primary=patch.primaryLanguage||patch.selected_language||s.primaryLanguage||s.selected||'ja';
    if(patch.primaryLanguage||patch.selected_language){s.primaryLanguage=primary;if(!s.selected||!validCodes().includes(s.selected))s.selected=primary}
    if(patch.enabledLanguages||patch.enabled_languages)s.enabledLanguages=normalizeEnabled(patch.enabledLanguages||patch.enabled_languages,primary);
    if(patch.audioPreference||patch.audio_preference)s.audioPreference=normalizeAudio(patch.audioPreference||patch.audio_preference);
    if('onboardingCompleted'in patch||'onboarding_completed'in patch)s.onboardingCompleted=Boolean(patch.onboardingCompleted??patch.onboarding_completed);
    s.profilePrefsUpdatedAt=new Date().toISOString();writeLocal(s);refreshUI();return user?sync('profile-preferences'):Promise.resolve();
  }

  window.addEventListener('language-lab-auth-changed',e=>start(e.detail?.user||null));
  window.addEventListener('online',()=>{if(user)sync('online')});
  window.addEventListener('offline',()=>setStatus(user?'Offline · saved locally':'Guest · this device','error'));
  window.addEventListener('storage',e=>{if(e.key===(Store?.STORAGE_KEY||'languageLabFreeV3')&&user)sync('other-tab');if(e.key===Store?.ACTIVE_SCOPE_KEY&&user&&!syncStillValid(user.id,scopeGeneration))start(window.LanguageLabAuth?.getUser?.()||null)});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&user)sync('visible')});
  window.addEventListener('focus',()=>{if(user)sync('focus')});

  function init(){injectStyle();start(window.LanguageLabAuth?.getUser?.()||null)}
  window.LanguageLabCloudSync={sync:()=>sync('manual'),setProfilePreferences,status:()=>({signedIn:Boolean(user),syncing,userId:user?.id||null,scope:Store?.activeScope?.()||null})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
