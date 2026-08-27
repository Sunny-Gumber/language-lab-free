// Language Lab Free — V6.1 guided learning experience
(function(){
  const DAILY_KEY='languageLabFreeV6Daily';
  let daily=null;

  function safeState(){try{return typeof state!=='undefined'?state:JSON.parse(localStorage.getItem('languageLabFreeV3')||'{}')}catch{return {}}}
  function selectedLanguage(){const s=safeState();return (typeof LANGUAGES!=='undefined'&&LANGUAGES.find(l=>l.id===s.selected))||LANGUAGES?.[0]}
  function langState(id){const s=safeState();return s.languages?.[id]||{mastery:{},xp:0,writes:0,quizTotal:0,quizCorrect:0,favorites:[]}}
  function dateKey(){return new Date().toLocaleDateString('en-CA')}
  function readDaily(){try{const x=JSON.parse(localStorage.getItem(DAILY_KEY)||'null');return x&&x.date===dateKey()?x:null}catch{return null}}
  function writeDaily(){if(daily)localStorage.setItem(DAILY_KEY,JSON.stringify(daily))}
  function weakItems(l){const st=langState(l.id);return l.units.flatMap((u,ui)=>u.items.map((item,ii)=>({item,ui,ii,score:Number(st.mastery?.[item.native]||0)}))).sort((a,b)=>a.score-b.score)}
  function dailyPlan(){const l=selectedLanguage();const weak=weakItems(l);const target=weak.find(x=>x.score>0&&x.score<70)||weak[0]||{ui:0,ii:0,item:l.units[0].items[0],score:0};return {date:dateKey(),language:l.id,targetUnit:target.ui,targetItem:target.ii,targetNative:target.item.native,steps:[false,false,false,false],completed:false};}
  function ensureDaily(){daily=readDaily()||dailyPlan();writeDaily();return daily}

  function injectStyles(){if(document.getElementById('v6Styles'))return;const s=document.createElement('style');s.id='v6Styles';s.textContent=`
    .v6-today{margin:22px 0;display:grid;grid-template-columns:1.4fr repeat(4,minmax(110px,.55fr));gap:12px;padding:18px;border:1px solid #dbe4f0;border-radius:20px;background:linear-gradient(135deg,#fff,#f8fbff);box-shadow:0 10px 30px rgba(15,23,42,.05)}
    .v6-today-main h3{margin:4px 0 5px;font-size:20px}.v6-today-main p{margin:0;color:#64748b}.v6-step{border:1px solid #e2e8f0;background:#fff;border-radius:14px;padding:12px;text-align:left;display:flex;gap:8px;align-items:center;font-weight:750}.v6-step.done{background:#f0fdf4;border-color:#bbf7d0;color:#166534}.v6-step span:first-child{font-size:20px}.v6-start{margin-top:12px}
    .v6-mission{position:sticky;top:72px;z-index:15;margin:0 0 14px;padding:10px 14px;border-radius:14px;background:#0f172a;color:#fff;display:flex;align-items:center;gap:12px;box-shadow:0 8px 24px rgba(15,23,42,.18)}.v6-mission.hidden{display:none}.v6-mission strong{font-size:13px}.v6-mission small{opacity:.72}.v6-mission-progress{flex:1;height:7px;background:rgba(255,255,255,.16);border-radius:99px;overflow:hidden}.v6-mission-progress span{display:block;height:100%;background:#fff;border-radius:99px}.v6-mission button{border:0;background:#fff;color:#0f172a;border-radius:9px;padding:7px 10px;font-weight:800;cursor:pointer}
    .v6-review-card{margin-top:14px;padding:16px;border:1px dashed #cbd5e1;border-radius:16px;display:flex;justify-content:space-between;align-items:center;gap:12px;background:#fff}.v6-review-card p{margin:3px 0 0;color:#64748b}.v6-review-card button{white-space:nowrap}
    @media(max-width:900px){.v6-today{grid-template-columns:1fr 1fr}.v6-today-main{grid-column:1/-1}.v6-mission{top:64px}}
    @media(max-width:560px){.v6-today{grid-template-columns:1fr 1fr;padding:14px}.v6-step{font-size:12px}.v6-mission small{display:none}.v6-mission{gap:7px;padding:9px}.v6-mission strong{font-size:11px}}
  `;document.head.appendChild(s)}

  function stepMeta(){return [
    ['👂','Listen','Hear the target'],
    ['✍️','Write','Write from memory'],
    ['🧠','Recall','Use flashcards'],
    ['✅','Check','Finish a quiz']
  ]}
  function completedCount(){return ensureDaily().steps.filter(Boolean).length}
  function renderHomeMission(){
    const hero=document.querySelector('.hero');if(!hero)return;
    let box=document.getElementById('v6Today');if(!box){box=document.createElement('section');box.id='v6Today';box.className='v6-today';hero.insertAdjacentElement('afterend',box)}
    const d=ensureDaily(),l=LANGUAGES.find(x=>x.id===d.language)||selectedLanguage(),meta=stepMeta();
    box.innerHTML=`<div class="v6-today-main"><span class="eyebrow">Today's 5-minute lesson</span><h3>${l.flag} ${l.name} · ${d.completed?'Mission complete':'Build one strong memory'}</h3><p>${d.completed?'Nice work. Come back tomorrow for a fresh target.':`Focus item: <b>${d.targetNative}</b> · ${completedCount()}/4 activities complete`}</p><button id="v6StartDaily" class="primary v6-start">${d.completed?'Review again':'Start daily lesson'}</button></div>${meta.map((m,i)=>`<div class="v6-step ${d.steps[i]?'done':''}"><span>${d.steps[i]?'✓':m[0]}</span><span>${m[1]}<br><small>${m[2]}</small></span></div>`).join('')}`;
    document.getElementById('v6StartDaily')?.addEventListener('click',startDaily);
  }

  function makeMissionBar(){
    const course=document.getElementById('courseScreen');if(!course||document.getElementById('v6Mission'))return;
    const bar=document.createElement('div');bar.id='v6Mission';bar.className='v6-mission hidden';course.querySelector('.course-head')?.insertAdjacentElement('afterend',bar);renderMissionBar();
  }
  function renderMissionBar(){
    const bar=document.getElementById('v6Mission');if(!bar)return;const d=ensureDaily(),n=completedCount(),meta=stepMeta(),next=d.steps.findIndex(x=>!x);bar.classList.toggle('hidden',!window.__v6DailyActive);bar.innerHTML=`<strong>Today's lesson</strong><small>${n}/4 complete${next>=0?' · Next: '+meta[next][1]:''}</small><div class="v6-mission-progress"><span style="width:${n*25}%"></span></div><button id="v6NextStep">${next>=0?'Next':'Done'}</button>`;document.getElementById('v6NextStep')?.addEventListener('click',()=>nextDailyStep());
  }

  function switchTab(name){document.querySelector(`.tab[data-tab="${name}"]`)?.click()}
  function restorePosition(){const s=safeState(),st=s.languages?.[s.selected]||{};if(typeof unitI!=='undefined'&&Number.isInteger(st.currentUnit)){unitI=Math.max(0,Math.min(st.currentUnit,(lang?.units?.length||1)-1));itemI=Math.max(0,Math.min(Number(st.currentLesson||0),(lang?.units?.[unitI]?.items?.length||1)-1));try{renderUnit()}catch{}}}
  function savePosition(){try{if(typeof state==='undefined'||typeof lang==='undefined'||typeof unitI==='undefined'||typeof itemI==='undefined')return;const st=state.languages[lang.id]||(state.languages[lang.id]={mastery:{},writes:0,quizCorrect:0,quizTotal:0,favorites:[],xp:0});if(st.currentUnit!==unitI||st.currentLesson!==itemI){st.currentUnit=unitI;st.currentLesson=itemI;localStorage.setItem('languageLabFreeV3',JSON.stringify(state));}}catch{}}

  function startDaily(){
    const d=ensureDaily();window.__v6DailyActive=true;
    openCourse(d.language);unitI=d.targetUnit;itemI=d.targetItem;renderUnit();switchTab('learn');renderMissionBar();document.getElementById('courseScreen')?.scrollIntoView({block:'start'});
  }
  function nextDailyStep(){const d=ensureDaily(),next=d.steps.findIndex(x=>!x);if(next===-1){d.completed=true;writeDaily();window.__v6DailyActive=false;renderMissionBar();goHome();renderHomeMission();return}const tabs=['learn','write','cards','quiz'];switchTab(tabs[next]);}
  function markStep(i){const d=ensureDaily();if(!window.__v6DailyActive||d.steps[i])return;d.steps[i]=true;d.completed=d.steps.every(Boolean);writeDaily();renderMissionBar();if(d.completed)setTimeout(()=>{renderHomeMission()},150)}

  function wireActivityTracking(){
    document.getElementById('hearBtn')?.addEventListener('click',()=>markStep(0));
    document.getElementById('writeDoneBtn')?.addEventListener('click',()=>setTimeout(()=>{if((document.getElementById('writeFeedback')?.textContent||'').startsWith('Good'))markStep(1)},0));
    document.getElementById('cardGood')?.addEventListener('click',()=>markStep(2));
    document.getElementById('nextQuizBtn')?.addEventListener('click',()=>{const count=document.getElementById('quizCount')?.textContent||'';if(/10\s*\/\s*10/.test(count))markStep(3)});
  }

  function addReviewShortcut(){
    const stats=document.querySelector('.home-stats');if(!stats||document.getElementById('v6ReviewCard'))return;const l=selectedLanguage(),weak=weakItems(l).filter(x=>x.score>0&&x.score<70);if(!weak.length)return;const card=document.createElement('div');card.id='v6ReviewCard';card.className='v6-review-card';card.innerHTML=`<div><b>🧠 ${weak.length} item${weak.length===1?'':'s'} need review in ${l.name}</b><p>Start with your weakest item: ${weak[0].item.native} (${weak[0].score}% mastery)</p></div><button class="secondary">Review now</button>`;stats.insertAdjacentElement('afterend',card);card.querySelector('button').addEventListener('click',()=>{openCourse(l.id);unitI=weak[0].ui;itemI=weak[0].ii;renderUnit();switchTab('learn')});
  }

  function replaceHomeButtons(){
    const dailyBtn=document.getElementById('dailyBtn');if(dailyBtn){const clone=dailyBtn.cloneNode(true);clone.textContent="Today's mission";dailyBtn.replaceWith(clone);clone.addEventListener('click',startDaily)}
    const resume=document.getElementById('resumeBtn');if(resume){const clone=resume.cloneNode(true);resume.replaceWith(clone);clone.addEventListener('click',()=>{openCourse(safeState().selected||'ja');restorePosition()})}
  }

  function init(){injectStyles();ensureDaily();replaceHomeButtons();makeMissionBar();wireActivityTracking();renderHomeMission();addReviewShortcut();setInterval(savePosition,1500);window.addEventListener('language-lab-cloud-synced',()=>{renderHomeMission();addReviewShortcut()});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
