// Language Lab Free — V9 deep lesson UI for Japanese and Mandarin
(function(){
  function supported(){return typeof lang!=='undefined'&&['ja','zh'].includes(lang.id)&&lang.courseQuality?.version>=9}
  function injectStyles(){
    if(document.getElementById('v9CourseStyles'))return;
    const s=document.createElement('style');s.id='v9CourseStyles';s.textContent=`
      .v9-deep{margin-top:18px}.v9-deep-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}.v9-version{font-size:11px;font-weight:900;padding:6px 9px;border-radius:999px;background:#e0f2fe;color:#075985;white-space:nowrap}.v9-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.v9-card{border:1px solid #dbe4f0;border-radius:18px;padding:16px;background:#fff}.v9-card h3{margin:4px 0 10px}.v9-objectives{margin:0;padding-left:20px}.v9-objectives li{margin:6px 0}.v9-dialogue{display:grid;gap:9px}.v9-line{display:grid;grid-template-columns:28px 1fr;gap:8px;align-items:start}.v9-speaker{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#0f172a;color:#fff;font-size:11px;font-weight:900}.v9-native{font-size:18px;font-weight:800;line-height:1.45}.v9-meaning{font-size:12px;color:#64748b;margin-top:2px}.v9-reading-native{font-size:19px;font-weight:750;line-height:1.65;margin:6px 0}.v9-reading-roman{font-size:12px;color:#475569;line-height:1.5}.v9-reading-meaning{margin-top:8px;color:#334155;line-height:1.5}.v9-char-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.v9-char{border:1px solid #e2e8f0;border-radius:12px;padding:10px;text-align:center}.v9-char strong{font-size:26px;display:block}.v9-char b{font-size:11px;display:block;margin-top:4px}.v9-char small{font-size:10px;color:#64748b;display:block;margin-top:3px}.v9-task{padding:13px;border-radius:13px;background:#f8fafc;border:1px dashed #cbd5e1;font-weight:700;line-height:1.45}.v9-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.v9-checkpoint{grid-column:1/-1;border-color:#bfdbfe;background:linear-gradient(135deg,#eff6ff,#fff)}.v9-can{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}.v9-can span{padding:9px;border-radius:10px;background:#fff;border:1px solid #dbeafe;font-size:12px}.v9-guide{margin-top:16px}.v9-stage-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.v9-stage-card{border:1px solid #e2e8f0;border-radius:14px;padding:12px;background:#fff}.v9-stage-card strong{display:block}.v9-stage-card small{display:block;color:#64748b;margin:4px 0 8px}.v9-stagebar{height:7px;background:#e2e8f0;border-radius:99px;overflow:hidden}.v9-stagebar span{display:block;height:100%;background:#0f172a}.v9-disclaimer{font-size:11px;color:#64748b;margin-top:10px}
      @media(max-width:760px){.v9-grid{grid-template-columns:1fr}.v9-checkpoint{grid-column:1}.v9-char-grid{grid-template-columns:repeat(3,1fr)}.v9-stage-cards{grid-template-columns:1fr}.v9-can{grid-template-columns:1fr}}
    `;document.head.appendChild(s)
  }
  function stageLabel(stage){const c=lang.curriculum?.stages?.find(x=>x.id===stage);return c?.label||String(stage||'Course')}
  function isStageEnd(stage){const units=lang.units.filter(u=>u.stage===stage);return units.length&&curUnit()===units[units.length-1]}
  function stageScore(stage){
    const units=lang.units.filter(u=>u.stage===stage),items=units.flatMap(u=>u.items);if(!items.length)return 0;
    const values=items.map(i=>window.LanguageLabSkills?.itemAverage?.(lang.id,i.native)??Number(ls().mastery?.[i.native]||0));
    return Math.round(values.reduce((a,b)=>a+b,0)/values.length)
  }
  function switchTab(name){document.querySelector(`.tab[data-tab="${name}"]`)?.click()}
  function renderDeep(){
    const learn=document.getElementById('learnTab');if(!learn)return;
    let root=document.getElementById('v9DeepLesson');
    if(!supported()){root?.remove();return}
    const u=curUnit(),p=u.v9;if(!p){root?.remove();return}
    if(!root){root=document.createElement('section');root.id='v9DeepLesson';root.className='v9-deep';learn.appendChild(root)}
    const checkpoint=isStageEnd(u.stage)?lang.stageCheckpoints?.[u.stage]:null;
    root.innerHTML=`<div class="v9-deep-head"><div><span class="eyebrow">Integrated lesson pack</span><h2>${u.title}</h2><p class="muted">Grammar + context + reading + production</p></div><span class="v9-version">V9 · ${stageLabel(u.stage)}</span></div><div class="v9-grid"><article class="v9-card"><span class="eyebrow">Lesson objectives</span><h3>What you should be able to do</h3><ul class="v9-objectives">${p.objectives.map(x=>`<li>${x}</li>`).join('')}</ul>${p.note?`<p class="v9-disclaimer">${p.note}</p>`:''}</article><article class="v9-card"><span class="eyebrow">Mini dialogue</span><h3>Use it in context</h3><div class="v9-dialogue">${p.dialogue.map(x=>`<div class="v9-line"><span class="v9-speaker">${x[0]}</span><div><div class="v9-native" ${lang.rtl?'dir="rtl"':''}>${x[1]}</div><div class="v9-meaning">${x[2]}</div></div></div>`).join('')}</div><div class="v9-actions"><button id="v9HearDialogue" class="secondary small">🔊 Hear dialogue</button><button id="v9SpeakPractice" class="secondary small">🎙 Practice speaking</button></div></article><article class="v9-card"><span class="eyebrow">Reading challenge</span><h3>Read for meaning</h3><div class="v9-reading-native" ${lang.rtl?'dir="rtl"':''}>${p.reading.native}</div><div class="v9-reading-roman">${p.reading.roman||''}</div><div class="v9-reading-meaning">${p.reading.meaning}</div><div class="v9-actions"><button id="v9HearReading" class="secondary small">🔊 Hear reading</button><button id="v9QuizPractice" class="secondary small">🧠 Review vocabulary</button></div></article><article class="v9-card"><span class="eyebrow">${lang.id==='ja'?'Kanji':'Hanzi'} focus</span><h3>Character recognition</h3><div class="v9-char-grid">${p.characterFocus.map(c=>`<div class="v9-char"><strong>${c.char}</strong><b>${c.reading}</b><small>${c.meaning}</small></div>`).join('')}</div><div class="v9-task">Production task: ${p.production}</div><div class="v9-actions"><button id="v9WritePractice" class="secondary small">✍ Writing practice</button></div></article>${checkpoint?`<article class="v9-card v9-checkpoint"><span class="eyebrow">Stage checkpoint</span><h3>${checkpoint.title} · ${stageScore(u.stage)}% current mastery</h3><div class="v9-can">${checkpoint.canDo.map(x=>`<span>✓ ${x}</span>`).join('')}</div><div class="v9-task"><b>Checkpoint task:</b> ${checkpoint.task}</div></article>`:''}</div>`;
    document.getElementById('v9HearDialogue')?.addEventListener('click',()=>speak(p.dialogue.map(x=>x[1]).join(lang.id==='zh'?'。':'。'),.76));
    document.getElementById('v9HearReading')?.addEventListener('click',()=>speak(p.reading.native,.72));
    document.getElementById('v9SpeakPractice')?.addEventListener('click',()=>switchTab('speak'));
    document.getElementById('v9WritePractice')?.addEventListener('click',()=>switchTab('write'));
    document.getElementById('v9QuizPractice')?.addEventListener('click',()=>switchTab('cards'));
  }
  function renderGuideUpgrade(){
    const guide=document.getElementById('guideTab');if(!guide)return;
    let root=document.getElementById('v9CourseGuide');
    if(!supported()){root?.remove();return}
    if(!root){root=document.createElement('article');root.id='v9CourseGuide';root.className='card v9-guide';guide.appendChild(root)}
    const q=lang.courseQuality,stages=lang.curriculum?.stages||[];
    root.innerHTML=`<span class="eyebrow">V9 course design</span><h2>${q.label}</h2><p>${q.alignment}</p><div class="v9-stage-cards">${stages.map(s=>{const cp=lang.stageCheckpoints?.[s.id],sc=s.available?stageScore(s.id):0;return`<div class="v9-stage-card"><strong>${s.label}</strong><small>${cp?.canDo?.[0]||s.description}</small><div class="v9-stagebar"><span style="width:${Math.min(100,sc)}%"></span></div><small>${s.available?sc+'% current mastery':'Planned'}</small></div>`}).join('')}</div><h3>Teaching principles</h3><ul class="bullet-list">${q.principles.map(x=>`<li>${x}</li>`).join('')}</ul><p class="v9-disclaimer">Level names describe the internal course progression and should not be treated as an official exam certification.</p>`
  }
  function wrap(){
    try{const base=renderUnit;renderUnit=function(){const r=base.apply(this,arguments);setTimeout(renderDeep,0);return r}}catch{}
    try{const base=renderGuide;renderGuide=function(){const r=base.apply(this,arguments);setTimeout(renderGuideUpgrade,0);return r}}catch{}
    try{const base=renderCourse;renderCourse=function(){const r=base.apply(this,arguments);setTimeout(()=>{renderDeep();renderGuideUpgrade()},0);return r}}catch{}
  }
  function init(){injectStyles();wrap();renderDeep();renderGuideUpgrade();window.addEventListener('language-lab-cloud-synced',()=>{renderDeep();renderGuideUpgrade()})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();