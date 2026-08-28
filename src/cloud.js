import{applyRemotePositions,applyRemotePrefs,dirtyPositions,getState,markEventsSynced,markPositionsSynced,markPrefsSynced,mergeEvents,setScope,subscribe,unsyncedEvents}from'./store.js';
import{debounce}from'./utils.js';

const SUPABASE_URL='https://ykaluwgryohxcsccdacf.supabase.co';
const SUPABASE_KEY='sb_publishable_gTQmkM5ljY6LT2oL4hP7rw_D_Ph0BHI';
const PAGE_SIZE=500;
let client=null,session=null,realtime=null,status='Guest · this device',syncing=false,queued=false,initialized=false;
const authListeners=new Set(),statusListeners=new Set();

function setStatus(next){status=next;for(const listener of statusListeners){try{listener(status)}catch{}}}
function currentRedirectUrl(){const url=new URL(window.location.href);url.hash='';url.search='';return url.toString()}
function profilePayload(){const prefs=getState().prefs;return{primary_language:prefs.primaryLanguage,enabled_languages:prefs.enabledLanguages,audio_preference:prefs.audioPreference,daily_goal_xp:prefs.dailyGoalXp,onboarding_completed:prefs.onboardingCompleted,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'}}
function eventToCloud(event,userId){return{id:event.id,user_id:userId,language_code:event.languageCode,target_id:event.targetId,activity:event.activity,skill:event.skill||null,score:event.score==null?null:Number(event.score),xp_delta:Number(event.xpDelta||0),study_date:event.studyDate,client_created_at:event.clientCreatedAt,metadata:event.metadata||{}}}
function eventFromCloud(row){return{id:row.id,languageCode:row.language_code,targetId:row.target_id,activity:row.activity,skill:row.skill,score:row.score,xpDelta:row.xp_delta,studyDate:row.study_date,clientCreatedAt:row.client_created_at,createdAt:row.created_at,metadata:row.metadata||{},synced:true}}

async function ensureProfile(user){const metadata=user.user_metadata||{},payload={id:user.id,display_name:metadata.full_name||metadata.name||null,avatar_url:metadata.avatar_url||null,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'};const{error}=await client.from('profiles').upsert(payload,{onConflict:'id'});if(error)throw error}
async function pullProfile(userId){const{data,error}=await client.from('profiles').select('id,display_name,avatar_url,timezone,primary_language,enabled_languages,audio_preference,daily_goal_xp,onboarding_completed,updated_at').eq('id',userId).maybeSingle();if(error)throw error;if(data&&!getState().prefs.dirty)applyRemotePrefs(data);return data}
async function pullEvents(userId){const collected=[];for(let start=0;;start+=PAGE_SIZE){const{data,error}=await client.from('learning_events').select('id,language_code,target_id,activity,skill,score,xp_delta,study_date,client_created_at,created_at,metadata').eq('user_id',userId).order('created_at',{ascending:true}).range(start,start+PAGE_SIZE-1);if(error)throw error;const rows=data||[];collected.push(...rows.map(eventFromCloud));if(rows.length<PAGE_SIZE)break}mergeEvents(collected);return collected.length}
async function pullPositions(userId){const{data,error}=await client.from('course_positions').select('language_code,unit_index,item_index,updated_at').eq('user_id',userId);if(error)throw error;applyRemotePositions(data||[]);return(data||[]).length}

async function pushPreferences(userId){if(!getState().prefs.dirty)return false;const{error}=await client.from('profiles').update(profilePayload()).eq('id',userId);if(error)throw error;markPrefsSynced();return true}
async function pushEvents(userId){const pending=unsyncedEvents();if(!pending.length)return 0;for(let start=0;start<pending.length;start+=200){const batch=pending.slice(start,start+200),rows=batch.map(event=>eventToCloud(event,userId));const{error}=await client.from('learning_events').upsert(rows,{onConflict:'id',ignoreDuplicates:true});if(error)throw error;markEventsSynced(batch.map(event=>event.id))}return pending.length}
async function pushPositions(userId){const pending=dirtyPositions();if(!pending.length)return 0;const rows=pending.map(position=>({user_id:userId,language_code:position.languageCode,unit_index:position.unitIndex,item_index:position.itemIndex}));const{error}=await client.from('course_positions').upsert(rows,{onConflict:'user_id,language_code'});if(error)throw error;markPositionsSynced(pending.map(position=>position.languageCode));return pending.length}

export async function syncNow(reason='manual'){
  const user=session?.user;if(!client||!user)return;
  if(syncing){queued=true;return}
  syncing=true;queued=false;setStatus('⟳ Syncing');
  try{
    await pushPreferences(user.id);await pushEvents(user.id);await pushPositions(user.id);
    await Promise.all([pullProfile(user.id),pullEvents(user.id),pullPositions(user.id)]);
    setStatus('☁ Synced');window.dispatchEvent(new CustomEvent('language-lab-cloud-synced',{detail:{reason,userId:user.id}}));
  }catch(error){console.warn('[Language Lab] cloud sync failed',error);setStatus(navigator.onLine?'☁ Sync pending':'Offline · saved locally')}
  finally{syncing=false;if(queued)setTimeout(()=>syncNow('queued'),0)}
}

const queueSync=debounce(()=>syncNow('local-change'),700);
function stopRealtime(){if(realtime&&client){try{client.removeChannel(realtime)}catch{}}realtime=null}
function startRealtime(userId){
  stopRealtime();if(!client?.channel)return;
  realtime=client.channel(`language-lab-v11-${userId}`)
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'learning_events',filter:`user_id=eq.${userId}`},payload=>{if(payload.new)mergeEvents([eventFromCloud(payload.new)])})
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'profiles',filter:`id=eq.${userId}`},payload=>{if(payload.new&&!getState().prefs.dirty)applyRemotePrefs(payload.new)})
    .on('postgres_changes',{event:'*',schema:'public',table:'course_positions',filter:`user_id=eq.${userId}`},payload=>{if(payload.new)applyRemotePositions([payload.new])})
    .subscribe();
}

async function activateSession(nextSession){
  session=nextSession||null;queued=false;stopRealtime();
  if(!session?.user){setScope('guest');setStatus('Guest · this device');for(const listener of authListeners)listener(null);return}
  const user=session.user;setScope(`user:${user.id}`);setStatus('⟳ Loading account');
  try{await ensureProfile(user);await Promise.all([pullProfile(user.id),pullEvents(user.id),pullPositions(user.id)]);await pushPreferences(user.id);await pushEvents(user.id);await pushPositions(user.id);startRealtime(user.id);setStatus('☁ Synced')}
  catch(error){console.warn('[Language Lab] account initialization failed',error);setStatus(navigator.onLine?'☁ Sync pending':'Offline · saved locally')}
  for(const listener of authListeners)listener(user);
}

export async function initializeCloud(){
  if(initialized)return;initialized=true;
  if(!globalThis.supabase?.createClient){setScope('guest');setStatus('Guest · cloud unavailable');for(const listener of authListeners)listener(null);return}
  client=globalThis.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const{data,error}=await client.auth.getSession();if(error)console.warn('[Language Lab] session read failed',error);await activateSession(data?.session||null);
  client.auth.onAuthStateChange((event,nextSession)=>{if(event==='TOKEN_REFRESHED'){session=nextSession||session;return}activateSession(nextSession).catch(error=>console.warn('[Language Lab] auth state update failed',error))});
  subscribe((_,reason)=>{if(session?.user&&['event','prefs','position','reset'].includes(reason))queueSync()});
  window.addEventListener('online',()=>syncNow('online'));window.addEventListener('focus',()=>syncNow('focus'));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')syncNow('visible')});
}

export function subscribeAuth(listener){authListeners.add(listener);return()=>authListeners.delete(listener)}
export function subscribeStatus(listener){statusListeners.add(listener);listener(status);return()=>statusListeners.delete(listener)}
export function getSession(){return session}
export function getUser(){return session?.user||null}
export function isSignedIn(){return Boolean(session?.user)}
export function getClient(){return client}
export function displayName(user=getUser()){if(!user)return'Guest';const metadata=user.user_metadata||{};return metadata.full_name||metadata.name||(user.email?user.email.split('@')[0]:'Learner')}
export async function signInWithGoogle(){if(!client)throw new Error('Google sign-in is unavailable right now.');const{data,error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:currentRedirectUrl()}});if(error)throw error;if(data?.url)window.location.assign(data.url)}
export async function signOut(){if(!client){await activateSession(null);return}const{error}=await client.auth.signOut();if(error)throw error;await activateSession(null)}
export async function deleteCloudLearning(languageCode=null){const user=getUser();if(!client||!user)return;let query=client.from('learning_events').delete().eq('user_id',user.id);if(languageCode)query=query.eq('language_code',languageCode);const{error}=await query;if(error)throw error}
