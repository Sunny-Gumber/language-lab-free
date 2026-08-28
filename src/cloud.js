import{applyRemotePositions,applyRemotePrefs,dirtyPositions,dirtyPreferenceSnapshot,getEventCursor,getState,markEventsSynced,markPrefsSynced,mergeEvents,setEventCursor,setScope,subscribe,unsyncedEvents}from'./store.js';
import{debounce}from'./utils.js';

const SUPABASE_URL='https://ykaluwgryohxcsccdacf.supabase.co';
const SUPABASE_KEY='sb_publishable_gTQmkM5ljY6LT2oL4hP7rw_D_Ph0BHI';
const PAGE_SIZE=500;
let client=null,session=null,realtime=null,status='Guest · this device',syncing=false,queued=false,initialized=false,scopeGeneration=0;
const authListeners=new Set(),statusListeners=new Set();

function setStatus(next){status=next;for(const listener of statusListeners){try{listener(status)}catch{}}}
function currentRedirectUrl(){const url=new URL(window.location.href);url.hash='';url.search='';return url.toString()}
function isCurrent(userId,generation){return session?.user?.id===userId&&scopeGeneration===generation}
function eventToCloud(event,userId){return{id:event.id,user_id:userId,language_code:event.languageCode,target_id:event.targetId,activity:event.activity,skill:event.skill||null,score:event.score==null?null:Number(event.score),xp_delta:Number(event.xpDelta||0),study_date:event.studyDate,client_created_at:event.clientCreatedAt,metadata:event.metadata||{}}}
function eventFromCloud(row){return{id:row.id,languageCode:row.language_code,targetId:row.target_id,activity:row.activity,skill:row.skill,score:row.score,xpDelta:row.xp_delta,studyDate:row.study_date,clientCreatedAt:row.client_created_at,createdAt:row.created_at,metadata:row.metadata||{},synced:true}}

const PREF_COLUMNS={primaryLanguage:'primary_language',enabledLanguages:'enabled_languages',audioPreference:'audio_preference',dailyGoalXp:'daily_goal_xp',onboardingCompleted:'onboarding_completed'};
function preferencePayload(snapshot){
  const payload={};
  for(const field of snapshot.fields||[])if(PREF_COLUMNS[field])payload[PREF_COLUMNS[field]]=snapshot.values[field];
  return payload;
}

async function ensureProfile(user){
  const metadata=user.user_metadata||{},payload={id:user.id,display_name:metadata.full_name||metadata.name||null,avatar_url:metadata.avatar_url||null,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'};
  const{error}=await client.from('profiles').upsert(payload,{onConflict:'id'});if(error)throw error;
}
async function fetchProfile(userId){const{data,error}=await client.from('profiles').select('id,display_name,avatar_url,timezone,primary_language,enabled_languages,audio_preference,daily_goal_xp,onboarding_completed,updated_at').eq('id',userId).maybeSingle();if(error)throw error;return data}
async function fetchEvents(userId,cursor=null){
  const collected=[];
  for(let start=0;;start+=PAGE_SIZE){
    let query=client.from('learning_events').select('id,language_code,target_id,activity,skill,score,xp_delta,study_date,client_created_at,created_at,metadata').eq('user_id',userId).order('created_at',{ascending:true});
    if(cursor)query=query.gte('created_at',cursor);
    const{data,error}=await query.range(start,start+PAGE_SIZE-1);if(error)throw error;
    const rows=data||[];collected.push(...rows.map(eventFromCloud));if(rows.length<PAGE_SIZE)break;
  }
  return collected;
}
async function fetchPositions(userId){const{data,error}=await client.from('course_positions').select('language_code,unit_index,item_index,client_updated_at,updated_at').eq('user_id',userId);if(error)throw error;return data||[]}

async function pushPreferences(userId,generation){
  const snapshot=dirtyPreferenceSnapshot();if(!snapshot.fields.length)return false;
  const payload=preferencePayload(snapshot);if(!Object.keys(payload).length)return false;
  const{error}=await client.from('profiles').update(payload).eq('id',userId);if(error)throw error;
  if(isCurrent(userId,generation))markPrefsSynced(snapshot);return true;
}
async function pushEvents(userId,generation){
  const pending=unsyncedEvents();if(!pending.length)return 0;
  for(let start=0;start<pending.length;start+=200){
    const batch=pending.slice(start,start+200),rows=batch.map(event=>eventToCloud(event,userId));
    const{error}=await client.from('learning_events').upsert(rows,{onConflict:'id',ignoreDuplicates:true});if(error)throw error;
    if(!isCurrent(userId,generation))return start+batch.length;
    markEventsSynced(batch.map(event=>event.id));
  }
  return pending.length;
}
async function pushPositions(userId){
  const pending=dirtyPositions();if(!pending.length)return 0;
  const rows=pending.map(position=>({user_id:userId,language_code:position.languageCode,unit_index:position.unitIndex,item_index:position.itemIndex,client_updated_at:position.clientUpdatedAt||new Date().toISOString()}));
  const{error}=await client.from('course_positions').upsert(rows,{onConflict:'user_id,language_code'});if(error)throw error;return pending.length;
}
function advanceCursor(events){
  const latest=(events||[]).map(event=>event.createdAt||event.created_at).filter(Boolean).sort().at(-1);
  if(latest)setEventCursor(latest);
}

export async function syncNow(reason='manual'){
  const user=session?.user;if(!client||!user)return;
  if(syncing){queued=true;return}
  const userId=user.id,generation=scopeGeneration;syncing=true;queued=false;setStatus('⟳ Syncing');
  try{
    await pushPreferences(userId,generation);if(!isCurrent(userId,generation))return;
    await pushEvents(userId,generation);if(!isCurrent(userId,generation))return;
    await pushPositions(userId);if(!isCurrent(userId,generation))return;
    const cursor=getEventCursor();
    const[profile,events,positions]=await Promise.all([fetchProfile(userId),fetchEvents(userId,cursor),fetchPositions(userId)]);if(!isCurrent(userId,generation))return;
    applyRemotePrefs(profile);mergeEvents(events);advanceCursor(events);applyRemotePositions(positions);
    setStatus('☁ Synced');window.dispatchEvent(new CustomEvent('language-lab-cloud-synced',{detail:{reason,userId}}));
  }catch(error){if(isCurrent(userId,generation)){console.warn('[Language Lab] cloud sync failed',error);setStatus(navigator.onLine?'☁ Sync pending':'Offline · saved locally')}}
  finally{syncing=false;if(queued&&session?.user)setTimeout(()=>syncNow('queued'),0)}
}

const queueSync=debounce(()=>syncNow('local-change'),700);
const resumeSync=debounce(()=>syncNow('resume'),350);
function stopRealtime(){if(realtime&&client){try{client.removeChannel(realtime)}catch{}}realtime=null}
function startRealtime(userId,generation){
  stopRealtime();if(!client?.channel)return;
  realtime=client.channel(`language-lab-v12-${userId}`)
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'learning_events',filter:`user_id=eq.${userId}`},payload=>{if(isCurrent(userId,generation)&&payload.new){const event=eventFromCloud(payload.new);mergeEvents([event]);advanceCursor([event])}})
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'profiles',filter:`id=eq.${userId}`},payload=>{if(isCurrent(userId,generation)&&payload.new)applyRemotePrefs(payload.new)})
    .on('postgres_changes',{event:'*',schema:'public',table:'course_positions',filter:`user_id=eq.${userId}`},payload=>{if(isCurrent(userId,generation)&&payload.new)applyRemotePositions([payload.new])})
    .subscribe();
}

async function activateSession(nextSession){
  scopeGeneration++;const generation=scopeGeneration;session=nextSession||null;queued=false;stopRealtime();
  if(!session?.user){await setScope('guest');setStatus('Guest · this device');for(const listener of authListeners)listener(null);return}
  const user=session.user,userId=user.id;await setScope(`user:${userId}`);setStatus('⟳ Loading account');
  try{await ensureProfile(user);if(!isCurrent(userId,generation))return;startRealtime(userId,generation);await syncNow('sign-in')}
  catch(error){if(isCurrent(userId,generation)){console.warn('[Language Lab] account initialization failed',error);setStatus(navigator.onLine?'☁ Sync pending':'Offline · saved locally')}}
  if(isCurrent(userId,generation))for(const listener of authListeners)listener(user);
}

export async function initializeCloud(){
  if(initialized)return;initialized=true;
  if(!globalThis.supabase?.createClient){await setScope('guest');setStatus('Guest · cloud unavailable');for(const listener of authListeners)listener(null);return}
  client=globalThis.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const{data,error}=await client.auth.getSession();if(error)console.warn('[Language Lab] session read failed',error);await activateSession(data?.session||null);
  client.auth.onAuthStateChange((event,nextSession)=>{if(event==='TOKEN_REFRESHED'){session=nextSession||session;return}activateSession(nextSession).catch(error=>console.warn('[Language Lab] auth state update failed',error))});
  subscribe((_,reason)=>{if(session?.user&&['event','prefs','position','reset','guest-import'].includes(reason))queueSync()});
  window.addEventListener('online',()=>syncNow('online'));
  window.addEventListener('focus',()=>resumeSync());
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')resumeSync()});
}

export function subscribeAuth(listener){authListeners.add(listener);return()=>authListeners.delete(listener)}
export function subscribeStatus(listener){statusListeners.add(listener);listener(status);return()=>statusListeners.delete(listener)}
export function getSession(){return session}
export function getUser(){return session?.user||null}
export function isSignedIn(){return Boolean(session?.user)}
export function getClient(){return client}
export function displayName(user=getUser()){if(!user)return'Guest';const metadata=user.user_metadata||{};return metadata.full_name||metadata.name||(user.email?user.email.split('@')[0]:'Learner')}
export async function signInWithGoogle(){if(!client)throw new Error('Google sign-in is unavailable right now.');const{data,error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:currentRedirectUrl()}});if(error)throw error;if(data?.url)window.location.assign(data.url)}
export async function signOut(){if(!client){await activateSession(null);return}const{error}=await client.auth.signOut();if(error)throw error;if(session?.user)await activateSession(null)}
