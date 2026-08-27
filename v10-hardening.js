// Language Lab Free — V10 compatibility hardening for legacy learning layers
(function(){
  const Store=window.LanguageLabStorage;
  const LEGACY_KEYS=[
    ['languageLabFreeV6Daily',null],
    ['languageLabFreeV6Goal',null],
    ['languageLabV8VoicePrefs','{}']
  ];
  let legacyLast={};

  function installStudyDateEngine(){
    try{
      if(typeof touchStreak!=='function'||!Store)return;
      touchStreak=function(){
        const t=Store.studyDate();
        if(!state.lastStudy){state.lastStudy=t;state.streak=1;return}
        if(state.lastStudy===t)return;
        const d=Store.daysBetween(state.lastStudy,t);
        state.streak=d===1?(state.streak||1)+1:1;
        state.lastStudy=t;
      };
    }catch(e){console.debug('[Language Lab Free] study-date hardening skipped',e)}
  }

  function activateLegacyExtras(){
    if(!Store)return;
    for(const [key,fallback] of LEGACY_KEYS){Store.activateLegacyKey(key,fallback);legacyLast[key]=localStorage.getItem(key)}
  }
  function persistLegacyExtras(){if(!Store)return;for(const [key] of LEGACY_KEYS){const now=localStorage.getItem(key);if(now!==legacyLast[key]){Store.persistLegacyKey(key);legacyLast[key]=now}}}
  function wrapScopeSwitch(){
    if(!Store?.switchScope||Store.__v10Wrapped)return;
    const base=Store.switchScope.bind(Store);
    Store.switchScope=function(nextUser){persistLegacyExtras();const changed=base(nextUser);if(changed)activateLegacyExtras();return changed};
    Store.__v10Wrapped=true;
  }

  function resetCourseGlobals(){
    try{
      const s=Store?.readState?.()||{},next=LANGUAGES.find(l=>l.id===s.selected)||LANGUAGES[0],st=s.languages?.[next.id]||{};
      lang=next;unitI=Math.max(0,Math.min(Number(st.currentUnit||0),next.units.length-1));itemI=Math.max(0,Math.min(Number(st.currentLesson||0),next.units[unitI]?.items?.length-1||0));speakI=0;cardI=0;quizI=0;
      if(document.getElementById('courseScreen')?.classList.contains('active'))goHome();
    }catch(e){console.debug('[Language Lab Free] course reset after account switch skipped',e)}
  }

  function fixConversationAvailability(){
    try{
      const b=document.querySelector('[data-v8mode="conversation"]');if(!b||typeof lang==='undefined')return;
      const available=['ja','zh'].includes(lang.id);b.hidden=!available;b.disabled=!available;b.title=available?'Conversation practice':'A dedicated conversation pack is not available for this language yet.';
      if(!available&&b.classList.contains('active'))document.querySelector('[data-v8mode="listen"]')?.click();
    }catch{}
  }
  function addAccuracyDisclosures(){
    const write=$('writeTab');if(write&&!document.getElementById('v10WritingDisclosure')){const p=document.createElement('p');p.id='v10WritingDisclosure';p.className='tiny muted';p.textContent='Writing completion records practice activity and drawing effort; it does not yet validate character shape or stroke order with AI.';write.prepend(p)}
  }
  function $(id){return document.getElementById(id)}

  function init(){
    installStudyDateEngine();activateLegacyExtras();wrapScopeSwitch();addAccuracyDisclosures();fixConversationAvailability();
    setInterval(persistLegacyExtras,700);
    window.addEventListener('language-lab-local-scope-changed',()=>{activateLegacyExtras();resetCourseGlobals();setTimeout(fixConversationAvailability,80)});
    window.addEventListener('language-lab-cloud-synced',fixConversationAvailability);
    const name=$('courseName');if(name)new MutationObserver(()=>setTimeout(fixConversationAvailability,0)).observe(name,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
