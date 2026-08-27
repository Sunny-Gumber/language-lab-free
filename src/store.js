import{courseCodes}from'./data.js';
import{safeJson,unique}from'./utils.js';

const VERSION=11;
const PREFIX='llf:v11:';
let scope='guest';
let state=null;
const listeners=new Set();

function defaultState(nextScope='guest'){
  const guest=nextScope==='guest';
  return{
    version:VERSION,
    prefs:{
      primaryLanguage:'ja',
      enabledLanguages:guest?[...courseCodes]:['ja'],
      audioPreference:'auto',
      dailyGoalXp:30,
      onboardingCompleted:guest,
      dirty:false
    },
    ui:{
      currentLanguage:'ja',
      positions:{},
      exactVoices:{},
      activeStage:{},
      practiceMode:'listen'
    },
    events:[]
  };
}

function key(nextScope=scope){return`${PREFIX}${nextScope}`}

function normalize(input,nextScope=scope){
  const base=defaultState(nextScope);
  const value=input&&typeof input==='object'?input:{};
  const prefs={...base.prefs,...(value.prefs||{})};
  const primary=courseCodes.includes(prefs.primaryLanguage)?prefs.primaryLanguage:'ja';
  prefs.primaryLanguage=primary;
  prefs.enabledLanguages=unique((Array.isArray(prefs.enabledLanguages)?prefs.enabledLanguages:[]).filter(code=>courseCodes.includes(code)));
  if(nextScope==='guest')prefs.enabledLanguages=[...courseCodes];
  else if(!prefs.enabledLanguages.includes(primary))prefs.enabledLanguages.unshift(primary);
  prefs.audioPreference=['auto','female','male'].includes(prefs.audioPreference)?prefs.audioPreference:'auto';
  prefs.dailyGoalXp=Math.min(200,Math.max(10,Number(prefs.dailyGoalXp)||30));
  prefs.onboardingCompleted=nextScope==='guest'?true:Boolean(prefs.onboardingCompleted);
  prefs.dirty=Boolean(prefs.dirty);

  const ui={...base.ui,...(value.ui||{})};
  ui.currentLanguage=courseCodes.includes(ui.currentLanguage)?ui.currentLanguage:primary;
  ui.positions=ui.positions&&typeof ui.positions==='object'?ui.positions:{};
  ui.exactVoices=ui.exactVoices&&typeof ui.exactVoices==='object'?ui.exactVoices:{};
  ui.activeStage=ui.activeStage&&typeof ui.activeStage==='object'?ui.activeStage:{};

  const events=Array.isArray(value.events)?value.events.filter(event=>event&&event.id):[];
  return{version:VERSION,prefs,ui,events};
}

function save(){localStorage.setItem(key(),JSON.stringify(state))}
function emit(reason='change'){
  save();
  for(const listener of listeners){
    try{listener(state,reason)}catch(error){console.error('[Language Lab] store listener failed',error)}
  }
}

function clearLegacyDataOnce(){
  if(localStorage.getItem(`${PREFIX}legacy-cleared`)==='1')return;
  const removablePrefixes=['languageLabFree','languageLabV8','languageLabScoped','languageLabAuthMode'];
  const keys=[];
  for(let index=0;index<localStorage.length;index++)keys.push(localStorage.key(index));
  for(const storageKey of keys){
    if(removablePrefixes.some(prefix=>String(storageKey).startsWith(prefix)))localStorage.removeItem(storageKey);
  }
  localStorage.setItem(`${PREFIX}legacy-cleared`,'1');
}

export function initializeStore(){
  clearLegacyDataOnce();
  state=normalize(safeJson(localStorage.getItem(key()),null),scope);
  save();
  window.addEventListener('storage',event=>{
    if(event.key!==key())return;
    state=normalize(safeJson(event.newValue,null),scope);
    for(const listener of listeners)listener(state,'storage');
  });
  return state;
}

export function getScope(){return scope}
export function getState(){if(!state)initializeStore();return state}

export function setScope(nextScope){
  const normalizedScope=nextScope||'guest';
  if(normalizedScope===scope&&state)return state;
  if(state)save();
  scope=normalizedScope;
  state=normalize(safeJson(localStorage.getItem(key()),null),scope);
  emit('scope');
  return state;
}

export function subscribe(listener){
  listeners.add(listener);
  return()=>listeners.delete(listener);
}

export function updatePrefs(patch,{dirty=true}={}){
  const current=getState();
  current.prefs={...current.prefs,...patch};
  if(dirty)current.prefs.dirty=true;
  state=normalize(current,scope);
  emit('prefs');
  return state.prefs;
}

export function applyRemotePrefs(profile){
  if(!profile)return getState().prefs;
  const current=getState();
  if(current.prefs.dirty)return current.prefs;
  current.prefs={
    ...current.prefs,
    primaryLanguage:profile.primary_language||current.prefs.primaryLanguage,
    enabledLanguages:Array.isArray(profile.enabled_languages)?profile.enabled_languages:current.prefs.enabledLanguages,
    audioPreference:profile.audio_preference||current.prefs.audioPreference,
    dailyGoalXp:Number(profile.daily_goal_xp)||current.prefs.dailyGoalXp,
    onboardingCompleted:Boolean(profile.onboarding_completed),
    dirty:false
  };
  state=normalize(current,scope);
  emit('remote-prefs');
  return state.prefs;
}

export function markPrefsSynced(){
  const current=getState();
  if(!current.prefs.dirty)return;
  current.prefs.dirty=false;
  emit('prefs-synced');
}

export function updateUi(patch,reason='ui'){
  const current=getState();
  current.ui={...current.ui,...patch};
  state=normalize(current,scope);
  emit(reason);
  return state.ui;
}

export function setPosition(languageCode,unitIndex,itemIndex){
  const current=getState();
  current.ui.positions[languageCode]={unitIndex:Number(unitIndex)||0,itemIndex:Number(itemIndex)||0};
  current.ui.currentLanguage=languageCode;
  emit('position');
}

export function getPosition(languageCode){return getState().ui.positions[languageCode]||{unitIndex:0,itemIndex:0}}

export function recordEvent(event){
  const current=getState();
  if(!event?.id||current.events.some(existing=>existing.id===event.id))return false;
  current.events.push({...event,synced:Boolean(event.synced)});
  emit('event');
  return true;
}

export function mergeEvents(events){
  const current=getState();
  const byId=new Map(current.events.map(event=>[event.id,event]));
  let changed=false;
  for(const event of events||[]){
    if(!event?.id)continue;
    const existing=byId.get(event.id);
    if(existing){
      if(!existing.synced){existing.synced=true;changed=true}
      continue;
    }
    const next={...event,synced:true};
    current.events.push(next);
    byId.set(next.id,next);
    changed=true;
  }
  if(changed){
    current.events.sort((a,b)=>String(a.clientCreatedAt||a.client_created_at||'').localeCompare(String(b.clientCreatedAt||b.client_created_at||'')));
    emit('remote-events');
  }
  return changed;
}

export function unsyncedEvents(){return getState().events.filter(event=>!event.synced)}

export function markEventsSynced(ids){
  const wanted=new Set(ids||[]);
  if(!wanted.size)return;
  let changed=false;
  for(const event of getState().events){
    if(wanted.has(event.id)&&!event.synced){event.synced=true;changed=true}
  }
  if(changed)emit('events-synced');
}

export function resetLearning(languageCode=null){
  const current=getState();
  current.events=languageCode?current.events.filter(event=>event.languageCode!==languageCode):[];
  if(languageCode)delete current.ui.positions[languageCode];
  else current.ui.positions={};
  emit('reset');
}
