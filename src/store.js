import{courseCodes}from'./data.js';
import{loadEvents,putEvents}from'./event-db.js';
import{randomId,safeJson,todayLocal,unique}from'./utils.js';

const VERSION=12;
const PREFIX='llf:v12:';
const PREF_KEYS=['primaryLanguage','enabledLanguages','audioPreference','dailyGoalXp','onboardingCompleted'];
let scope='guest',state=null,channel=null;
const listeners=new Set();

function defaultState(nextScope='guest'){
  const guest=nextScope==='guest';
  return{
    version:VERSION,
    prefs:{primaryLanguage:'ja',enabledLanguages:guest?[...courseCodes]:['ja'],audioPreference:'auto',dailyGoalXp:30,onboardingCompleted:guest,dirty:false},
    ui:{currentLanguage:'ja',positions:{},positionDirty:{},exactVoices:{},activeStage:{},practiceMode:'listen'},
    sync:{eventCursor:null,prefDirtyFields:[]},
    events:[]
  };
}
function key(nextScope=scope){return`${PREFIX}${nextScope}`}
function timeMs(value){const parsed=Date.parse(value||'');return Number.isFinite(parsed)?parsed:0}
function normalizePosition(value){
  const position=value&&typeof value==='object'?value:{};
  return{unitIndex:Math.max(0,Number(position.unitIndex)||0),itemIndex:Math.max(0,Number(position.itemIndex)||0),clientUpdatedAt:position.clientUpdatedAt||position.client_updated_at||null};
}
function normalize(input,nextScope=scope){
  const base=defaultState(nextScope),value=input&&typeof input==='object'?input:{};
  const prefs={...base.prefs,...(value.prefs||{})};
  const primary=courseCodes.includes(prefs.primaryLanguage)?prefs.primaryLanguage:'ja';
  prefs.primaryLanguage=primary;
  prefs.enabledLanguages=unique((Array.isArray(prefs.enabledLanguages)?prefs.enabledLanguages:[]).filter(code=>courseCodes.includes(code)));
  if(nextScope==='guest')prefs.enabledLanguages=[...courseCodes];else if(!prefs.enabledLanguages.includes(primary))prefs.enabledLanguages.unshift(primary);
  prefs.audioPreference=['auto','female','male'].includes(prefs.audioPreference)?prefs.audioPreference:'auto';
  prefs.dailyGoalXp=Math.min(200,Math.max(10,Number(prefs.dailyGoalXp)||30));
  prefs.onboardingCompleted=nextScope==='guest'?true:Boolean(prefs.onboardingCompleted);

  const ui={...base.ui,...(value.ui||{})};
  ui.currentLanguage=courseCodes.includes(ui.currentLanguage)?ui.currentLanguage:primary;
  if(nextScope!=='guest'&&!prefs.enabledLanguages.includes(ui.currentLanguage))ui.currentLanguage=primary;
  const positions={};for(const[code,position]of Object.entries(ui.positions||{}))if(courseCodes.includes(code))positions[code]=normalizePosition(position);ui.positions=positions;
  ui.positionDirty=ui.positionDirty&&typeof ui.positionDirty==='object'?ui.positionDirty:{};
  ui.exactVoices=ui.exactVoices&&typeof ui.exactVoices==='object'?ui.exactVoices:{};
  ui.activeStage=ui.activeStage&&typeof ui.activeStage==='object'?ui.activeStage:{};
  ui.practiceMode=['listen','shadow','meaning','conversation'].includes(ui.practiceMode)?ui.practiceMode:'listen';

  const sync={...base.sync,...(value.sync||{})};
  sync.eventCursor=typeof sync.eventCursor==='string'&&sync.eventCursor?sync.eventCursor:null;
  sync.prefDirtyFields=unique((Array.isArray(sync.prefDirtyFields)?sync.prefDirtyFields:[]).filter(field=>PREF_KEYS.includes(field)));
  prefs.dirty=sync.prefDirtyFields.length>0;

  return{version:VERSION,prefs,ui,sync,events:Array.isArray(value.events)?value.events.filter(event=>event&&event.id):[]};
}
function metaSnapshot(){return{...state,events:[]}}
function saveMeta(){try{localStorage.setItem(key(),JSON.stringify(metaSnapshot()))}catch(error){console.warn('[Language Lab] local preferences could not be saved',error)}}
function notify(reason='change'){for(const listener of listeners){try{listener(state,reason)}catch(error){console.error('[Language Lab] store listener failed',error)}}}
function broadcast(reason){try{channel?.postMessage({scope,reason})}catch{}}
function emit(reason='change'){saveMeta();notify(reason);broadcast(reason)}
function persistEvents(events){putEvents(scope,events).catch(error=>console.warn('[Language Lab] event persistence failed',error))}

function clearLegacyDataOnce(){
  if(localStorage.getItem(`${PREFIX}legacy-cleared`)==='1')return;
  const removablePrefixes=['languageLabFree','languageLabV8','languageLabScoped','languageLabAuthMode','llf:v11:'],keys=[];
  for(let index=0;index<localStorage.length;index++)keys.push(localStorage.key(index));
  for(const storageKey of keys)if(removablePrefixes.some(prefix=>String(storageKey).startsWith(prefix)))localStorage.removeItem(storageKey);
  localStorage.setItem(`${PREFIX}legacy-cleared`,'1');
}
function ensureChannel(){
  if(channel||typeof BroadcastChannel==='undefined')return;
  channel=new BroadcastChannel('language-lab-v12');
  channel.onmessage=async event=>{
    if(event.data?.scope!==scope)return;
    const currentEvents=await loadEvents(scope);
    const next=normalize(safeJson(localStorage.getItem(key()),null),scope);
    next.events=currentEvents;
    state=next;
    notify('peer');
  };
}

export async function initializeStore(){
  clearLegacyDataOnce();ensureChannel();
  const raw=safeJson(localStorage.getItem(key()),null);
  state=normalize(raw,scope);
  if(Array.isArray(raw?.events)&&raw.events.length){await putEvents(scope,raw.events)}
  state.events=await loadEvents(scope);
  if(!state.events.length&&state.sync.eventCursor)state.sync.eventCursor=null;
  saveMeta();
  window.addEventListener('storage',async event=>{
    if(event.key!==key())return;
    const next=normalize(safeJson(event.newValue,null),scope);
    next.events=await loadEvents(scope);
    state=next;
    notify('storage');
  });
  return state;
}
export function getScope(){return scope}
export function getState(){if(!state)throw new Error('Language Lab store is not initialized.');return state}
export async function setScope(nextScope){
  const normalizedScope=nextScope||'guest';
  if(normalizedScope===scope&&state)return state;
  if(state)saveMeta();
  scope=normalizedScope;
  const raw=safeJson(localStorage.getItem(key()),null);
  state=normalize(raw,scope);
  if(Array.isArray(raw?.events)&&raw.events.length)await putEvents(scope,raw.events);
  state.events=await loadEvents(scope);
  if(!state.events.length&&state.sync.eventCursor)state.sync.eventCursor=null;
  saveMeta();notify('scope');broadcast('scope');
  return state;
}
export function subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener)}

export function updatePrefs(patch,{dirty=true}={}){
  const current=getState(),changed=[];
  for(const keyName of PREF_KEYS){
    if(!(keyName in(patch||{})))continue;
    const before=JSON.stringify(current.prefs[keyName]);
    const after=JSON.stringify(patch[keyName]);
    if(before!==after)changed.push(keyName);
  }
  current.prefs={...current.prefs,...patch};
  if(dirty&&changed.length)current.sync.prefDirtyFields=unique([...current.sync.prefDirtyFields,...changed]);
  state=normalize(current,scope);emit('prefs');return state.prefs;
}
export function dirtyPreferenceSnapshot(){
  const current=getState(),fields=[...current.sync.prefDirtyFields];
  return{fields,values:Object.fromEntries(fields.map(field=>[field,current.prefs[field]]))};
}
export function applyRemotePrefs(profile){
  if(!profile)return getState().prefs;
  const current=getState(),dirty=new Set(current.sync.prefDirtyFields);
  const remote={primaryLanguage:profile.primary_language,enabledLanguages:profile.enabled_languages,audioPreference:profile.audio_preference,dailyGoalXp:profile.daily_goal_xp,onboardingCompleted:profile.onboarding_completed};
  for(const[field,value]of Object.entries(remote))if(!dirty.has(field)&&value!=null)current.prefs[field]=value;
  state=normalize(current,scope);emit('remote-prefs');return state.prefs;
}
export function markPrefsSynced(snapshot){
  const current=getState();let changed=false;
  for(const field of snapshot?.fields||[]){
    if(JSON.stringify(current.prefs[field])!==JSON.stringify(snapshot.values?.[field]))continue;
    const index=current.sync.prefDirtyFields.indexOf(field);
    if(index>=0){current.sync.prefDirtyFields.splice(index,1);changed=true}
  }
  if(changed){state=normalize(current,scope);emit('prefs-synced')}
}
export function updateUi(patch,reason='ui'){const current=getState();current.ui={...current.ui,...patch};state=normalize(current,scope);emit(reason);return state.ui}

export function setPosition(languageCode,unitIndex,itemIndex){
  if(!courseCodes.includes(languageCode))return;
  const current=getState(),next={unitIndex:Math.max(0,Number(unitIndex)||0),itemIndex:Math.max(0,Number(itemIndex)||0),clientUpdatedAt:new Date().toISOString()},previous=current.ui.positions[languageCode];
  current.ui.currentLanguage=languageCode;
  if(previous?.unitIndex===next.unitIndex&&previous?.itemIndex===next.itemIndex)return;
  current.ui.positions[languageCode]=next;
  if(scope!=='guest')current.ui.positionDirty[languageCode]=true;
  emit('position');
}
export function getPosition(languageCode){const position=getState().ui.positions[languageCode];return position||{unitIndex:0,itemIndex:0,clientUpdatedAt:null}}
export function dirtyPositions(){const current=getState();return Object.keys(current.ui.positionDirty||{}).filter(code=>current.ui.positionDirty[code]&&current.ui.positions[code]).map(code=>({languageCode:code,...current.ui.positions[code]}))}
export function applyRemotePositions(rows){
  const current=getState();let changed=false;
  for(const row of rows||[]){
    const code=row.language_code||row.languageCode;if(!courseCodes.includes(code))continue;
    const remote={unitIndex:Math.max(0,Number(row.unit_index??row.unitIndex)||0),itemIndex:Math.max(0,Number(row.item_index??row.itemIndex)||0),clientUpdatedAt:row.client_updated_at||row.clientUpdatedAt||row.updated_at||null};
    const local=current.ui.positions[code],dirty=Boolean(current.ui.positionDirty?.[code]);
    if(dirty&&timeMs(remote.clientUpdatedAt)<timeMs(local?.clientUpdatedAt))continue;
    if(!dirty&&local&&timeMs(remote.clientUpdatedAt)<timeMs(local.clientUpdatedAt))continue;
    if(!local||local.unitIndex!==remote.unitIndex||local.itemIndex!==remote.itemIndex||local.clientUpdatedAt!==remote.clientUpdatedAt){current.ui.positions[code]=remote;changed=true}
    if(dirty){delete current.ui.positionDirty[code];changed=true}
  }
  if(changed)emit('remote-positions');return changed;
}

export function recordEvent(event){
  const current=getState();if(!event?.id||current.events.some(existing=>existing.id===event.id))return false;
  const next={...event,synced:Boolean(event.synced)};current.events.push(next);persistEvents([next]);emit('event');return true;
}
export function mergeEvents(events){
  const current=getState(),byId=new Map(current.events.map(event=>[event.id,event])),changedEvents=[];let changed=false;
  for(const event of events||[]){
    if(!event?.id)continue;
    const existing=byId.get(event.id);
    if(existing){
      const merged={...existing,...event,synced:true};
      if(JSON.stringify(existing)!==JSON.stringify(merged)){Object.assign(existing,merged);changedEvents.push(existing);changed=true}
      continue;
    }
    const next={...event,synced:true};current.events.push(next);byId.set(next.id,next);changedEvents.push(next);changed=true;
  }
  if(changed){current.events.sort((a,b)=>String(a.clientCreatedAt||a.client_created_at||'').localeCompare(String(b.clientCreatedAt||b.client_created_at||'')));persistEvents(changedEvents);emit('remote-events')}
  return changed;
}
export function unsyncedEvents(){return getState().events.filter(event=>!event.synced)}
export function markEventsSynced(ids){
  const wanted=new Set(ids||[]);if(!wanted.size)return;
  const changed=[];for(const event of getState().events)if(wanted.has(event.id)&&!event.synced){event.synced=true;changed.push(event)}
  if(changed.length){persistEvents(changed);emit('events-synced')}
}
export function getEventCursor(){return getState().sync.eventCursor}
export function setEventCursor(value){
  if(!value)return;
  const current=getState();
  if(current.sync.eventCursor&&timeMs(current.sync.eventCursor)>=timeMs(value))return;
  current.sync.eventCursor=value;emit('event-cursor');
}

function resetEvent(languageCode){return{id:randomId(),languageCode,targetId:'*',activity:'reset',skill:null,score:null,xpDelta:0,studyDate:todayLocal(),clientCreatedAt:new Date().toISOString(),metadata:{scope:'course'},synced:false}}
export function resetLearning(languageCode=null){
  const codes=languageCode?[languageCode]:courseCodes;
  for(const code of codes)if(courseCodes.includes(code))recordEvent(resetEvent(code));
  const current=getState();
  if(languageCode){current.ui.positions[languageCode]={unitIndex:0,itemIndex:0,clientUpdatedAt:new Date().toISOString()};if(scope!=='guest')current.ui.positionDirty[languageCode]=true}
  else{current.ui.positions={};current.ui.positionDirty={}}
  emit('reset');
}

function importDecisionKey(userId){return`${PREFIX}guest-import:${userId}`}
export function guestImportWasDecided(userId){return localStorage.getItem(importDecisionKey(userId))==='1'}
export function markGuestImportDecided(userId){if(userId)localStorage.setItem(importDecisionKey(userId),'1')}
export async function guestImportAvailable(userId){
  if(!userId||guestImportWasDecided(userId))return false;
  const events=await loadEvents('guest');
  return events.some(event=>['practice','favorite'].includes(event.activity));
}
export async function importGuestLearning(userId){
  if(!userId||scope==='guest')return 0;
  const guestEvents=await loadEvents('guest');
  const current=getState(),byId=new Set(current.events.map(event=>event.id)),added=[];
  for(const event of guestEvents){if(!event?.id||byId.has(event.id))continue;const next={...event,synced:false};delete next.createdAt;delete next.created_at;current.events.push(next);byId.add(next.id);added.push(next)}
  if(added.length)persistEvents(added);
  const guestMeta=normalize(safeJson(localStorage.getItem(key('guest')),null),'guest');
  for(const[code,position]of Object.entries(guestMeta.ui.positions||{}))if(!current.ui.positions[code]){current.ui.positions[code]={...position,clientUpdatedAt:new Date().toISOString()};current.ui.positionDirty[code]=true}
  markGuestImportDecided(userId);emit('guest-import');return added.length;
}
