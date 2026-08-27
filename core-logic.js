// Language Lab Free — V10 shared pure logic (browser + Node tests)
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.LanguageLabCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const AUDIO_PREFS=new Set(['auto','female','male']);

  function studyDate(date=new Date()){
    const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }

  function daysBetween(a,b){
    if(!a||!b)return 0;
    const p=s=>{const [y,m,d]=String(s).split('-').map(Number);return Date.UTC(y,m-1,d)};
    return Math.round((p(b)-p(a))/86400000);
  }

  function normalizeAudio(value){return AUDIO_PREFS.has(value)?value:'auto'}

  function normalizeEnabledLanguages(list,selected,validCodes){
    const valid=validCodes?new Set(validCodes):null,out=[];
    for(const value of Array.isArray(list)?list:[]){
      const code=String(value||'');
      if(!code||(valid&&!valid.has(code))||out.includes(code))continue;
      out.push(code);
    }
    const primary=String(selected||'');
    if(primary&&(!valid||valid.has(primary))&&!out.includes(primary))out.unshift(primary);
    return out;
  }

  function mergeMastery(a={},b={}){
    const out={...a};
    for(const [k,v] of Object.entries(b||{}))out[k]=Math.max(Number(out[k]||0),Number(v||0));
    return out;
  }

  function union(a=[],b=[]){return [...new Set([...(a||[]),...(b||[])])]} 

  function canonical(value){
    if(Array.isArray(value))return value.map(canonical);
    if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));
    return value;
  }
  function deepEqual(a,b){return JSON.stringify(canonical(a))===JSON.stringify(canonical(b))}
  function sameSet(a=[],b=[]){return deepEqual([...new Set(a)].sort(),[...new Set(b)].sort())}

  function timeValue(value){const n=Date.parse(value||'');return Number.isFinite(n)?n:0}

  function resolveProfilePreferences(local={},remote=null,validCodes=[]){
    const remotePrefTimestamp=remote?.learning_preferences_updated_at||remote?.updated_at||null;
    const localTs=timeValue(local.profilePrefsUpdatedAt),remoteTs=timeValue(remotePrefTimestamp);
    // Unsynced local preferences always win until the server confirms the exact values.
    const useRemote=Boolean(remote)&&!local.profilePrefsDirty&&remoteTs>localTs;
    const selected=(useRemote?remote?.selected_language:local.selected)||local.selected||remote?.selected_language||validCodes[0]||'ja';
    const enabled=normalizeEnabledLanguages(useRemote?remote?.enabled_languages:local.enabledLanguages,selected,validCodes);
    return {
      selected,
      enabledLanguages:enabled.length?enabled:[selected],
      audioPreference:normalizeAudio(useRemote?remote?.audio_preference:local.audioPreference),
      onboardingCompleted:Boolean(useRemote?remote?.onboarding_completed:local.onboardingCompleted),
      profilePrefsUpdatedAt:useRemote?(remotePrefTimestamp||local.profilePrefsUpdatedAt||null):(local.profilePrefsUpdatedAt||remotePrefTimestamp||null),
      profilePrefsDirty:Boolean(local.profilePrefsDirty&&!useRemote),
      source:useRemote?'remote':'local'
    };
  }

  return {studyDate,daysBetween,normalizeAudio,normalizeEnabledLanguages,mergeMastery,union,deepEqual,sameSet,resolveProfilePreferences};
});
