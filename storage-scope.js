// Language Lab Free — V10 account-scoped browser storage
(function(){
  const CORE=window.LanguageLabCore||{};
  const STORAGE_KEY='languageLabFreeV3';
  const GUEST_STORAGE_KEY='languageLabFreeGuestV3';
  const ACCOUNT_STORAGE_PREFIX='languageLabFreeAccountV3:';
  const ACTIVE_SCOPE_KEY='languageLabFreeActiveScopeV3';
  const LEGACY_BACKUP_KEY='languageLabFreeLegacyBackupV3';
  const EXTRA_PREFIX='languageLabScopedExtra:';
  const MIGRATION_PREFIX='languageLabScopedMigrated:';

  function safeParse(raw,fallback={}){try{return raw?JSON.parse(raw):fallback}catch{return fallback}}
  function scopeForUser(user){return user?.id?`account:${user.id}`:'guest'}
  function activeScope(){return localStorage.getItem(ACTIVE_SCOPE_KEY)||'guest'}
  function keyForScope(scope){return scope==='guest'?GUEST_STORAGE_KEY:scope?.startsWith('account:')?ACCOUNT_STORAGE_PREFIX+scope.slice(8):null}
  function blankState(scope=activeScope()){return {selected:scope==='guest'?'ja':null,primaryLanguage:null,xp:0,streak:1,lastStudy:null,languages:{},enabledLanguages:[],audioPreference:'auto',onboardingCompleted:false,profilePrefsUpdatedAt:null,profilePrefsDirty:false}}
  function readState(){return safeParse(localStorage.getItem(STORAGE_KEY),blankState())||blankState()}
  function readScoped(scope=activeScope()){
    const key=keyForScope(scope),raw=key?localStorage.getItem(key):null;
    return raw?safeParse(raw,null):null;
  }
  function applyGlobalState(data){
    try{
      if(typeof state!=='undefined')state=data;
      if(typeof lang!=='undefined'&&typeof LANGUAGES!=='undefined')lang=LANGUAGES.find(x=>x.id===data.selected)||LANGUAGES[0];
    }catch{}
  }
  function persistCurrent(data=readState()){
    const key=keyForScope(activeScope());if(key)localStorage.setItem(key,JSON.stringify(data));
  }
  function writeState(data,{persist=true}={}){
    localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
    if(persist)persistCurrent(data);
    applyGlobalState(data);
    return data;
  }
  function switchScope(nextUser){
    const target=scopeForUser(nextUser),current=localStorage.getItem(ACTIVE_SCOPE_KEY),shared=readState();
    if(current===target){persistCurrent(shared);applyGlobalState(shared);return false}
    if(current){const key=keyForScope(current);if(key)localStorage.setItem(key,JSON.stringify(shared))}
    else if(!localStorage.getItem(LEGACY_BACKUP_KEY))localStorage.setItem(LEGACY_BACKUP_KEY,JSON.stringify(shared));
    const next=readScoped(target)||blankState(target);
    localStorage.setItem(ACTIVE_SCOPE_KEY,target);
    const key=keyForScope(target);if(key)localStorage.setItem(key,JSON.stringify(next));
    localStorage.setItem(STORAGE_KEY,JSON.stringify(next));
    applyGlobalState(next);
    window.dispatchEvent(new CustomEvent('language-lab-local-scope-changed',{detail:{scope:target,userId:nextUser?.id||null}}));
    return true;
  }

  function extraKey(name,scope=activeScope()){return `${EXTRA_PREFIX}${encodeURIComponent(scope)}:${encodeURIComponent(name)}`}
  function getExtra(name,fallback=null,scope=activeScope()){
    const raw=localStorage.getItem(extraKey(name,scope));
    if(raw==null)return fallback;
    return safeParse(raw,fallback);
  }
  function setExtra(name,value,scope=activeScope()){localStorage.setItem(extraKey(name,scope),JSON.stringify(value));return value}
  function removeExtra(name,scope=activeScope()){localStorage.removeItem(extraKey(name,scope))}

  function legacyScopedKey(baseKey,scope=activeScope()){return `${EXTRA_PREFIX}${encodeURIComponent(scope)}:legacy:${encodeURIComponent(baseKey)}`}
  function activateLegacyKey(baseKey,defaultRaw=null){
    const key=legacyScopedKey(baseKey),saved=localStorage.getItem(key),migratedKey=MIGRATION_PREFIX+baseKey;
    if(saved!==null){localStorage.setItem(baseKey,saved);return saved}
    // V10 intentionally does not migrate old unscoped learning extras into an account.
    // Resetting a daily mission/voice choice once is safer than leaking one user's data into another scope.
    if(localStorage.getItem(migratedKey)!=='1')localStorage.setItem(migratedKey,'1');
    if(defaultRaw===null)localStorage.removeItem(baseKey);else localStorage.setItem(baseKey,defaultRaw);
    return defaultRaw;
  }
  function persistLegacyKey(baseKey){
    const raw=localStorage.getItem(baseKey),key=legacyScopedKey(baseKey);
    if(raw===null)localStorage.removeItem(key);else localStorage.setItem(key,raw);
    return raw;
  }

  function studyDate(date=new Date()){return CORE.studyDate?CORE.studyDate(date):`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
  function daysBetween(a,b){return CORE.daysBetween?CORE.daysBetween(a,b):0}

  window.LanguageLabStorage={STORAGE_KEY,ACTIVE_SCOPE_KEY,scopeForUser,activeScope,keyForScope,blankState,readState,readScoped,writeState,persistCurrent,switchScope,getExtra,setExtra,removeExtra,activateLegacyKey,persistLegacyKey,studyDate,daysBetween};
})();
