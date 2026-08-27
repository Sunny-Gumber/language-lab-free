// Language Lab Free — V8 five-skill mastery + staged course navigator
(function(){
  const PREFIX='__v8skill__';
  const SKILLS=[
    {id:'listening',icon:'👂',label:'Listening',hint:'Hear and distinguish the target'},
    {id:'recognition',icon:'👁️',label:'Recognition',hint:'Recognize form and meaning'},
    {id:'writing',icon:'✍️',label:'Writing',hint:'Produce the form from memory'},
    {id:'recall',icon:'🧠',label:'Recall',hint:'Retrieve meaning without prompts'},
    {id:'speaking',icon:'🎙️',label:'Speaking',hint:'Say the target clearly'}
  ];
  const relevant={listening:'all',recognition:'all',writing:'items',recall:'vocab',speaking:'vocab'};

  function key(native,skill){return `${PREFIX}${skill}__${encodeURIComponent(native)}`}
  function store(langId){
    try{
      if(typeof state==='undefined') return null;
      if(!state.languages[langId]) state.languages[langId]={mastery:{},writes:0,quizCorrect:0,quizTotal:0,favorites:[],xp:0};
      if(!state.languages[langId].mastery) state.languages[langId].mastery={};
      return state.languages[langId];
    }catch{return null}
  }
  function score(langId,native,skill){const st=store(langId);return Math.max(0,Math.min(100,Number(st?.mastery?.[key(native,skill)]||0)))}
  function add(langId,native,skill,amount){
    const st=store(langId);if(!st||!native)return 0;
    const k=key(native,skill),before=Number(st.mastery[k]||0),after=Math.min(100,before+Math.max(0,Number(amount||0)));
    if(after===before)return after;
    st.mastery[k]=after;
    try{save(true)}catch{localStorage.setItem('languageLabFreeV3',JSON.stringify(state))}
    renderSkillUI();
    return after;
  }
  function targetsFor(l,skill){
    const items=l.units.flatMap(u=>u.items).map(x=>({native:x.native,roman:x.roman,type:'item'}));
    const vocab=(l.vocab||[]).map(x=>({native:x.native,roman:x.roman,type:'vocab'}));
    const raw=relevant[skill]==='items'?items:relevant[skill]==='vocab'?vocab:[...items,...vocab];
    const seen=new Set();return raw.filter(x=>{if(seen.has(x.native))return false;seen.add(x.native);return true});
  }
  function average(langId,skill){
    const l=LANGUAGES.find(x=>x.id===langId);if(!l)return 0;
    const arr=targetsFor(l,skill),tracked=arr.map(x=>score(langId,x.native,skill)).filter(x=>x>0);
    return tracked.length?Math.round(tracked.reduce((a,b)=>a+b,0)/tracked.length):0;
  }
  function itemAverage(langId,native){
    const vals=SKILLS.map(s=>score(langId,native,s.id)),tracked=vals.filter(v=>v>0);
    if(tracked.length)return Math.round(tracked.reduce((a,b)=>a+b,0)/tracked.length);
    const st=store(langId);return Number(st?.mastery?.[native]||0);
  }
  function weakestSkill(langId){return SKILLS.map(s=>({...s,value:average(langId,s.id)})).sort((a,b)=>a.value-b.value)[0]}
  function weakTarget(l,skill){const arr=targetsFor(l,skill);return arr.sort((a,b)=>score(l.id,a.native,skill)-score(l.id,b.native,skill))[0]||null}
  function findItem(l,native){for(let ui=0;ui<l.units.length;ui++){const ii=l.units[ui].items.findIndex(x=>x.native===native);if(ii>=0)return{ui,ii}}return null}

  function injectStyles(){if(document.getElementById('v8SkillStyles'))return;const s=document.createElement('style');s.id='v8SkillStyles';s.textContent=`
    .v8-stage-nav{margin:12px 0 14px;padding:12px;border:1px solid #dbe4f0;border-radius:18px;background:#fff;box-shadow:0 8px 24px rgba(15,23,42,.04)}
    .v8-stage-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:9px}.v8-stage-head small{color:#64748b}
    .v8-stage-list{display:flex;gap:8px;overflow:auto;padding-bottom:2px}.v8-stage{min-width:145px;text-align:left;padding:9px 11px;border:1px solid #dbe4f0;border-radius:12px;background:#fff}.v8-stage b,.v8-stage small{display:block}.v8-stage small{margin-top:3px;color:#64748b;line-height:1.25}.v8-stage.active{border-color:#0f172a;background:#f8fafc}.v8-stage.planned{opacity:.55;cursor:not-allowed}
    .v8-skill-card{margin:14px 0;padding:18px;border:1px solid #dbe4f0;border-radius:18px;background:#fff}.v8-skill-title{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px}.v8-skill-title p{margin:4px 0 0}.v8-skill-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:9px}.v8-skill{border:1px solid #e2e8f0;border-radius:14px;padding:11px;background:#fff;text-align:left}.v8-skill strong{font-size:18px}.v8-skill small{display:block;color:#64748b;margin:4px 0 8px}.v8-skillbar{height:7px;background:#e2e8f0;border-radius:99px;overflow:hidden}.v8-skillbar span{display:block;height:100%;background:#0f172a}.v8-skill button{margin-top:9px;width:100%;border:1px solid #cbd5e1;background:#fff;border-radius:9px;padding:6px;font-weight:800}.v8-weak{font-size:12px;font-weight:800;padding:6px 9px;border-radius:99px;background:#fef3c7;color:#92400e;white-space:nowrap}
    .v8-item-skills{display:flex;flex-wrap:wrap;gap:6px;margin:9px 0}.v8-item-skill{font-size:11px;font-weight:800;padding:5px 7px;border-radius:99px;background:#f1f5f9;color:#475569}.v8-item-skill.trained{background:#ecfdf5;color:#166534}
    .v8-note{margin-top:10px;font-size:11px;color:#64748b}.v8-stage-badge{font-size:10px;padding:3px 6px;border-radius:8px;background:#e2e8f0;color:#334155;margin-left:6px}
    @media(max-width:900px){.v8-skill-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:560px){.v8-skill-grid{grid-template-columns:1fr}.v8-stage-nav{margin-top:8px}}
  `;document.head.appendChild(s)}

  function stageForUnit(l,index){return l.curriculum?.stages?.find(s=>s.available&&index>=s.startUnit&&index<=s.endUnit)||null}
  function renderStageNav(){
    const course=document.getElementById('courseScreen'),head=course?.querySelector('.course-head');if(!head||typeof lang==='undefined')return;
    let box=document.getElementById('v8StageNav');if(!box){box=document.createElement('section');box.id='v8StageNav';box.className='v8-stage-nav';head.insertAdjacentElement('afterend',box)}
    const stages=lang.curriculum?.stages||[];if(!stages.length){box.style.display='none';return}box.style.display='block';
    const current=stageForUnit(lang,Number(unitI||0));
    box.innerHTML=`<div class="v8-stage-head"><div><b>Learning path</b><small>${lang.id==='ja'||lang.id==='zh'?'Full staged path is available now.':'Foundation is available now; later stages are mapped for expansion.'}</small></div>${current?`<span class="badge">${current.label}</span>`:''}</div><div class="v8-stage-list">${stages.map(s=>`<button class="v8-stage ${s.available?'':'planned'} ${current?.id===s.id?'active':''}" data-v8-stage="${s.id}" ${s.available?'':'disabled'}><b>${s.label}</b><small>${s.description}</small></button>`).join('')}</div>`;
    box.querySelectorAll('[data-v8-stage]:not([disabled])').forEach(b=>b.onclick=()=>{
      const st=stages.find(x=>x.id===b.dataset.v8Stage);if(!st)return;
      unitI=st.startUnit||0;itemI=0;renderUnit();document.getElementById('unitSelect').value=unitI;document.querySelector('[data-tab="learn"]')?.click();renderStageNav();
    });
  }

  function renderItemSkills(){
    const focus=document.getElementById('focusGuide');if(!focus||typeof lang==='undefined'||typeof curItem!=='function')return;
    let el=document.getElementById('v8ItemSkills');if(!el){el=document.createElement('div');el.id='v8ItemSkills';el.className='v8-item-skills';focus.insertAdjacentElement('afterend',el)}
    const native=curItem().native;el.innerHTML=SKILLS.map(s=>{const v=score(lang.id,native,s.id);return`<span class="v8-item-skill ${v?'trained':''}" title="${s.hint}">${s.icon} ${v}%</span>`}).join('');
  }

  function renderSkillPanel(){
    const progress=document.getElementById('progressTab'),stats=progress?.querySelector('.stats-grid');if(!stats||typeof lang==='undefined')return;
    let panel=document.getElementById('v8SkillPanel');if(!panel){panel=document.createElement('article');panel.id='v8SkillPanel';panel.className='v8-skill-card';stats.insertAdjacentElement('afterend',panel)}
    const wk=weakestSkill(lang.id),values=SKILLS.map(s=>({...s,value:average(lang.id,s.id)}));
    panel.innerHTML=`<div class="v8-skill-title"><div><span class="eyebrow">V8 skill profile</span><h3>What can you actually do?</h3><p class="muted">Mastery is now separated by skill instead of relying only on one overall score.</p></div><span class="v8-weak">Focus next: ${wk.icon} ${wk.label}</span></div><div class="v8-skill-grid">${values.map(s=>`<div class="v8-skill"><strong>${s.icon} ${s.value}%</strong><b>${s.label}</b><small>${s.hint}</small><div class="v8-skillbar"><span style="width:${s.value}%"></span></div><button data-v8-practice="${s.id}">Practice weakest</button></div>`).join('')}</div><p class="v8-note">Existing V7 overall mastery is preserved. These five scores begin building from V8 practice and are stored inside the existing synced mastery data, so no new database table is required.</p>`;
    panel.querySelectorAll('[data-v8-practice]').forEach(b=>b.onclick=()=>practice(b.dataset.v8Practice));
  }

  function enhanceMasteryRows(){
    const list=document.getElementById('masteryList');if(!list||typeof lang==='undefined')return;
    const rows=[...list.querySelectorAll('.mastery-row')];const items=lang.units.flatMap(u=>u.items);
    rows.forEach((row,i)=>{const item=items[i];if(!item)return;row.title=`Skill average: ${itemAverage(lang.id,item.native)}% · Listening ${score(lang.id,item.native,'listening')}% · Recognition ${score(lang.id,item.native,'recognition')}% · Writing ${score(lang.id,item.native,'writing')}%`;});
  }

  function renderSkillUI(){try{renderStageNav();renderItemSkills();renderSkillPanel();enhanceMasteryRows()}catch(e){console.debug('[Language Lab Free] V8 skill UI refresh skipped',e)}}

  function practice(skill){
    if(typeof lang==='undefined')return;const target=weakTarget(lang,skill);if(!target)return;
    if(skill==='listening'||skill==='writing'||(skill==='recognition'&&target.type==='item')){
      const pos=findItem(lang,target.native);if(pos){unitI=pos.ui;itemI=pos.ii;renderUnit()}
      document.querySelector(`[data-tab="${skill==='writing'?'write':'learn'}"]`)?.click();
      if(skill==='listening')document.getElementById('focusNative')?.scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }
    if(skill==='recognition'){document.querySelector('[data-tab="quiz"]')?.click();return}
    if(skill==='recall'){const i=lang.vocab.findIndex(x=>x.native===target.native);if(i>=0){cardOrder=lang.vocab.map((_,j)=>j);cardI=i;renderCard()}document.querySelector('[data-tab="cards"]')?.click();return}
    if(skill==='speaking'){const i=lang.vocab.findIndex(x=>x.native===target.native);if(i>=0){speakI=i;renderSpeak()}document.querySelector('[data-tab="speak"]')?.click()}
  }

  function hookPracticeEvents(){
    document.getElementById('hearBtn')?.addEventListener('click',()=>setTimeout(()=>add(lang.id,curItem().native,'listening',6),0));
    document.getElementById('slowBtn')?.addEventListener('click',()=>setTimeout(()=>add(lang.id,curItem().native,'listening',2),0));
    document.getElementById('exampleBtn')?.addEventListener('click',()=>setTimeout(()=>add(lang.id,curItem().native,'listening',2),0));
    document.getElementById('writeDoneBtn')?.addEventListener('click',()=>setTimeout(()=>{if((document.getElementById('writeFeedback')?.textContent||'').startsWith('Good'))add(lang.id,curItem().native,'writing',12)},0));

    document.addEventListener('click',e=>{
      const word=e.target.closest('[data-word]');if(word&&typeof lang!=='undefined'){const w=lang.vocab[Number(word.dataset.word)];if(w)add(lang.id,w.native,'listening',2)}
      const answer=e.target.closest('[data-answer]');
      if(answer&&typeof quiz!=='undefined'&&typeof quizI!=='undefined'&&!quizAnswered&&quiz[quizI]){
        const q=quiz[quizI],given=decodeURIComponent(answer.dataset.answer||'');if(given===q.meaning)setTimeout(()=>add(lang.id,q.native,'recognition',12),0);
      }
    },true);

    document.getElementById('cardGood')?.addEventListener('click',()=>{
      try{const w=lang.vocab[cardOrder[cardI%cardOrder.length]];if(w)setTimeout(()=>add(lang.id,w.native,'recall',10),0)}catch{}
    },true);

    const match=document.getElementById('matchText');if(match){let last='';new MutationObserver(()=>{
      const text=match.textContent||'';if(!/%$/.test(text)||text===last)return;last=text;const value=parseInt(text,10);if(!Number.isFinite(value)||typeof lang==='undefined')return;
      const w=lang.vocab[speakI%lang.vocab.length];if(!w)return;add(lang.id,w.native,'speaking',value>=85?15:value>=60?8:2);if(value>=60)try{mastery(w.native,value>=85?6:3)}catch{}
    }).observe(match,{childList:true,characterData:true,subtree:true})}

    const build=document.getElementById('builderFeedback');if(build){new MutationObserver(()=>{
      if((build.textContent||'')==='Correct!'&&typeof lang!=='undefined'){const w=lang.vocab[Math.min(1,lang.vocab.length-1)];if(w)add(lang.id,w.native,'recall',5)}
    }).observe(build,{childList:true,characterData:true,subtree:true})}
  }

  function wrapCoreRenders(){
    try{const baseUnit=renderUnit;renderUnit=function(){const r=baseUnit.apply(this,arguments);setTimeout(()=>{renderItemSkills();renderStageNav()},0);return r}}catch{}
    try{const baseProgress=renderProgress;renderProgress=function(){const r=baseProgress.apply(this,arguments);setTimeout(()=>{renderSkillPanel();enhanceMasteryRows()},0);return r}}catch{}
    try{const baseCourse=renderCourse;renderCourse=function(){const r=baseCourse.apply(this,arguments);setTimeout(renderSkillUI,0);return r}}catch{}
  }

  function init(){injectStyles();wrapCoreRenders();hookPracticeEvents();renderSkillUI();window.addEventListener('language-lab-cloud-synced',renderSkillUI);window.addEventListener('focus',renderSkillUI)}
  window.LanguageLabSkills={skills:SKILLS,score,add,average,itemAverage,weakestSkill,weakTarget,render:renderSkillUI};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
