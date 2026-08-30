import{findItem,getCourse,stageForUnit}from'./data.js';
import{learningEvents,recordPractice,reviewsDue,unitMastery,weakestTarget}from'./learning.js';
import{buildIntegratedExperience,courseDepth}from'./learning-flow.js';
import{hindiPronunciationLabel}from'./pronunciation-hi.js';
import{getPosition,getState,subscribe,updateUi}from'./store.js';
import{speak}from'./audio.js';
import{shouldShowRoman}from'./session.js';
import{bestSpeechMatch,escapeHtml,shuffle,unique}from'./utils.js';

const $=id=>document.getElementById(id);
const targetOf=event=>event.targetId||event.target_id;
const ASSESSED_SKILLS=new Set(['listening','speaking','recognition','recall']);
const PHASES=['Mission','Model','Learn','Retrieve','Read','Use','Checkpoint','Complete'];

function ensureStyles(){
  if(document.querySelector('link[data-journey-v14]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='./journey-v14.css';link.dataset.journeyV14='true';document.head.append(link);
}
function freshActivityState(){return{answered:false,selected:null,correct:false,options:null,speakingDone:false,speakingMessage:'',revealed:false,attempted:false,heard:'',checkpointChoice:''}}
function savedSessions(){const value=getState().ui.v14JourneySessions;return value&&typeof value==='object'?value:{}}
function phaseIndex(type){return Math.max(0,PHASES.indexOf(({mission:'Mission',dialogue:'Model',learn:'Learn',retrieve:'Retrieve',reading:'Read',scenario:'Use',checkpoint:'Checkpoint',complete:'Complete'})[type]||'Learn'))}
function lineText(line){return line?.kanjiForm||line?.native||''}
function targetLabel(target){return target?.kanjiForm||target?.native||target?.meaning||''}

export class JourneyController{
  constructor(courseController,practiceController){
    this.courseController=courseController;this.practiceController=practiceController;this.course=getCourse('ja');this.lesson=null;this.returnTab='journey';this.recognizer=null;
    ensureStyles();this.installNavigation();this.installPanels();this.bind();
    subscribe((_,reason)=>{if(reason==='event'&&this.isVisible()&&!this.lesson)this.render()});
  }
  installNavigation(){
    const tabs=document.querySelector('#courseScreen .tabs');if(!tabs)return;
    tabs.classList.add('v14-tabs');
    tabs.innerHTML='<button class="tab active" data-tab="journey" type="button">🧭 Journey</button><button class="tab" data-tab="practice" type="button">🎧 Practice</button><button class="tab" data-tab="review" type="button">🧠 Review</button><button class="tab" data-tab="explore" type="button">📚 Explore</button><button class="tab" data-tab="progress" type="button">📈 Progress</button>';
    $('stageNav')?.classList.add('v13-stage-nav-hidden');
  }
  installPanels(){
    const practice=$('practiceTab');if(!practice)return;
    if(!$('journeyTab'))practice.insertAdjacentHTML('beforebegin','<section id="journeyTab" class="panel active"></section>');
    if(!$('reviewTab'))$('progressTab').insertAdjacentHTML('beforebegin','<section id="reviewTab" class="panel"></section>');
    if(!$('exploreTab'))$('progressTab').insertAdjacentHTML('beforebegin','<section id="exploreTab" class="panel"></section>');
    for(const id of['learnTab','guideTab','writeTab','wordsTab','cardsTab','quizTab']){
      const panel=$(id);if(!panel||panel.querySelector('.v14-tool-back'))continue;
      panel.insertAdjacentHTML('afterbegin','<div class="v14-tool-back"><button class="secondary small" data-v14-back type="button">← Back</button><span>Supporting activity</span></div>');
    }
  }
  bind(){
    document.querySelector('#courseScreen .tabs')?.addEventListener('click',event=>{const tab=event.target.closest('[data-tab]')?.dataset.tab;if(['journey','review','explore'].includes(tab))requestAnimationFrame(()=>this.render(tab))});
    $('journeyTab')?.addEventListener('click',event=>this.handleJourneyClick(event));
    $('reviewTab')?.addEventListener('click',event=>this.handleHubClick(event,'review'));
    $('exploreTab')?.addEventListener('click',event=>this.handleHubClick(event,'explore'));
    $('courseScreen')?.addEventListener('click',event=>{const back=event.target.closest('[data-v14-back]');if(!back)return;this.courseController.switchTab(this.returnTab||'journey');this.render(this.returnTab||'journey')});
  }
  isVisible(){return $('courseScreen')?.classList.contains('active')&&$('journeyTab')?.classList.contains('active')}
  syncCourse(){const active=this.courseController?.course;if(active?.id&&active.id!==this.course.id)this.course=active}
  open(languageCode,{resume=true}={}){this.course=getCourse(languageCode);this.lesson=null;if(resume)this.restore();this.render('journey');return Boolean(this.lesson)}

  saved(){return savedSessions()[this.course.id]||null}
  persist(){
    if(!this.lesson)return;const sessions=savedSessions();
    const snapshot={unitIndex:this.lesson.unitIndex,activityIndex:this.lesson.activityIndex,updatedAt:new Date().toISOString()};
    updateUi({v14JourneySessions:{...sessions,[this.course.id]:snapshot}},'v14-journey-session');
  }
  clearSaved(){const sessions={...savedSessions()};if(!sessions[this.course.id])return;delete sessions[this.course.id];updateUi({v14JourneySessions:sessions},'v14-journey-clear')}
  restore(){
    const saved=this.saved();if(!saved)return false;
    const unitIndex=Math.max(0,Math.min(Number(saved.unitIndex)||0,this.course.units.length-1)),experience=buildIntegratedExperience(this.course,unitIndex);
    this.lesson={unitIndex,experience,activityIndex:Math.max(0,Math.min(Number(saved.activityIndex)||0,experience.activities.length-1)),state:freshActivityState(),completionRecorded:false};
    return true;
  }

  unitMetric(unit){
    const ids=new Set((unit.items||[]).map(item=>item.id)),events=learningEvents(this.course.id).filter(event=>ids.has(targetOf(event))),attempted=new Set(events.map(targetOf));
    const coverage=unit.items.length?Math.round(attempted.size/unit.items.length*100):0,activeMastery=unitMastery(this.course.id,unit),completed=events.some(event=>event.metadata?.mode==='v14-unit-complete'&&event.metadata?.unitId===unit.id);
    const readiness=Math.max(completed?75:0,Math.round(coverage*.55+activeMastery*.45));
    return{coverage,activeMastery,readiness,complete:completed||coverage>=80&&activeMastery>=55,activeEvidence:events.filter(event=>ASSESSED_SKILLS.has(event.skill)).length};
  }
  path(){this.syncCourse();return this.course.units.map((unit,index)=>({unit,index,metric:this.unitMetric(unit),unlocked:true}))}
  recommendedIndex(path=this.path()){const first=path.find(entry=>!entry.metric.complete);return first?.index??Math.max(0,path.length-1)}
  courseProgress(path=this.path()){return path.length?Math.round(path.reduce((sum,entry)=>sum+entry.metric.readiness,0)/path.length):0}

  render(targetTab=null){
    this.syncCourse();const active=targetTab||document.querySelector('#courseScreen .tab.active')?.dataset.tab;
    if(active==='review')this.renderReview();else if(active==='explore')this.renderExplore();else if(active==='journey')this.renderJourney();this.renderHeaderProgress();
  }
  renderHeaderProgress(){
    const head=document.querySelector('.course-head');if(!head)return;let summary=head.querySelector('.v14-course-progress');
    if(!summary){summary=document.createElement('div');summary.className='v14-course-progress';head.append(summary)}
    const path=this.path(),recommended=path[this.recommendedIndex(path)],progress=this.courseProgress(path),depth=courseDepth(this.course);
    summary.innerHTML=`<span>${progress}% learning evidence</span><b>${escapeHtml(depth.label)} · ${recommended?`Unit ${recommended.index+1}`:'Course'}</b>`;
  }

  renderJourney(){
    if(this.lesson){this.renderLesson();return}
    const path=this.path(),unitIndex=this.recommendedIndex(path),recommended=path[unitIndex]||path[0],progress=this.courseProgress(path),experience=buildIntegratedExperience(this.course,unitIndex),depth=courseDepth(this.course),saved=this.saved();
    $('journeyTab').innerHTML=`
      <section class="journey-hero-v14">
        <div><span class="eyebrow light">Guided adaptive learning</span><h2>${escapeHtml(experience.canDo)}</h2><p>${escapeHtml(recommended?.unit.goal||'Build practical language through connected input, retrieval and use.')}</p><div class="actions">${saved?'<button class="primary" data-v14-resume type="button">Resume session</button>':`<button class="primary" data-journey-start="${unitIndex}" type="button">Start recommended session</button>`}<button class="secondary dark" data-journey-practice type="button">Practice a weak skill</button></div></div>
        <div class="journey-meter-v14"><strong>${progress}%</strong><span>course evidence</span><div class="progressbar"><span style="width:${progress}%"></span></div><small>${escapeHtml(depth.label)} · ${escapeHtml(experience.stage?.label||'Foundation')}</small></div>
      </section>
      <section class="learning-loop-v14">
        <div><b>1</b><span>Understand a situation</span></div><div><b>2</b><span>Hear connected language</span></div><div><b>3</b><span>Learn useful forms</span></div><div><b>4</b><span>Retrieve from memory</span></div><div><b>5</b><span>Read in context</span></div><div><b>6</b><span>Respond in your own words</span></div>
      </section>
      <section class="session-preview-v14"><div><span class="eyebrow">Recommended session</span><h3>${experience.mix.review} review · ${experience.mix.introduced} new targets</h3><p>${escapeHtml(experience.mix.label)}${experience.dialogue.length?' · connected dialogue':''}${experience.reading?.native?' · reading':''}${experience.checkpoint?' · stage checkpoint':''}</p></div><div><span class="eyebrow">Course depth</span><h3>${escapeHtml(depth.label)}</h3><p>${escapeHtml(depth.detail)}</p></div></section>
      <section class="journey-section-v14"><div class="journey-section-head"><div><span class="eyebrow">Learning path</span><h2>Build ability, not just finished lessons</h2><p>All units are open during the test phase. The recommendation follows the first unit that still needs evidence.</p></div><span class="badge">${path.length} units</span></div><div class="unit-path-v14">${path.map(entry=>this.renderUnitNode(entry,unitIndex)).join('')}</div></section>`;
  }
  renderUnitNode(entry,recommendedIndex){
    const{unit,index,metric}=entry,current=index===recommendedIndex,stage=stageForUnit(this.course,index),state=metric.complete?'Strengthened':metric.readiness>0?'Building':current?'Recommended':'Available';
    const connected=Boolean(unit.v9?.dialogue?.length||unit.v14?.dialogue?.length),reading=Boolean(unit.v9?.reading?.native||unit.v14?.reading?.native);
    return`<button class="unit-node-v14 ${current?'current':''} ${metric.complete?'complete':''}" data-journey-unit="${index}" type="button"><span class="unit-line-dot">${metric.complete?'✓':index+1}</span><div class="unit-node-copy"><div><span class="eyebrow">${escapeHtml(stage?.label||'Course')} · Unit ${index+1}</span><span class="unit-state-v14">${state}</span></div><h3>${escapeHtml(unit.title)}</h3><p>${escapeHtml(unit.goal||'Build the next useful language ability.')}</p><div class="unit-capabilities-v14">${connected?'<span>💬 Dialogue</span>':''}${reading?'<span>📖 Reading</span>':''}<span>🧠 Retrieval</span><span>🎙 Use</span></div><div class="progressbar"><span style="width:${metric.readiness}%"></span></div><small>${metric.coverage}% target coverage · ${metric.activeMastery}% active mastery</small></div></button>`;
  }

  startLesson(unitIndex){
    const experience=buildIntegratedExperience(this.course,unitIndex);if(!experience.activities.length)return;
    this.lesson={unitIndex,experience,activityIndex:0,state:freshActivityState(),completionRecorded:false};this.persist();this.renderLesson();
  }
  currentActivity(){return this.lesson?.experience?.activities?.[this.lesson.activityIndex]||null}
  resetActivityState(){this.lesson.state=freshActivityState()}
  advance(){
    if(!this.lesson)return;const current=this.currentActivity();
    if(current?.type==='retrieve'&&!this.lesson.state.correct&&!current.retry&&!this.lesson.experience.activities.slice(this.lesson.activityIndex+1).some(activity=>activity.type==='retrieve'&&activity.target?.id===current.target?.id&&activity.retry)){
      const insertAt=Math.min(this.lesson.activityIndex+2,this.lesson.experience.activities.length-1);
      this.lesson.experience.activities.splice(insertAt,0,{...current,key:`${current.key}:retry`,retry:true});
    }
    if(this.lesson.activityIndex+1>=this.lesson.experience.activities.length){this.finishToPath();return}
    this.lesson.activityIndex++;this.resetActivityState();
    if(this.currentActivity()?.type==='complete')this.recordUnitCompletion();
    this.persist();this.renderLesson();
  }
  finishToPath(){this.lesson=null;this.clearSaved();this.renderJourney()}
  recordUnitCompletion(){
    if(this.lesson?.completionRecorded)return;const first=this.lesson.experience.targets[0];if(!first)return;
    recordPractice({languageCode:this.course.id,targetId:first.id,skill:'recognition',score:null,xp:0,metadata:{mode:'v14-unit-complete',unitId:this.lesson.experience.unit.id,unitIndex:this.lesson.unitIndex}});
    this.lesson.completionRecorded=true;
  }

  renderLesson(){
    const activity=this.currentActivity();if(!activity){this.finishToPath();return}
    const experience=this.lesson.experience,index=this.lesson.activityIndex,total=experience.activities.length,phase=phaseIndex(activity.type);
    const top=`<div class="guided-top-v14"><button class="secondary small" data-flow-action="back-path" type="button">← Path</button><div><span class="eyebrow">${escapeHtml(experience.stage?.label||'Course')} · Unit ${this.lesson.unitIndex+1}</span><h3>${escapeHtml(experience.unit.title)}</h3></div><span class="badge">${index+1}/${total}</span></div>`;
    const stepper=`<div class="guided-stepper-v14">${PHASES.map((name,i)=>`<span class="${i<phase?'done':i===phase?'active':''}">${i<phase?'✓':i+1}<small>${name}</small></span>`).join('')}</div>`;
    $('journeyTab').innerHTML=`<section class="guided-lesson-v14">${top}${stepper}${this.renderActivity(activity)}</section>`;
  }
  renderActivity(activity){
    if(activity.type==='mission')return this.renderMission();
    if(activity.type==='dialogue')return this.renderDialogue(activity);
    if(activity.type==='learn')return this.renderLearn(activity);
    if(activity.type==='retrieve')return this.renderRetrieve(activity);
    if(activity.type==='reading')return this.renderReading(activity);
    if(activity.type==='scenario')return this.renderScenario(activity);
    if(activity.type==='checkpoint')return this.renderCheckpoint(activity);
    return this.renderComplete();
  }
  renderMission(){
    const e=this.lesson.experience,depth=courseDepth(this.course);
    return`<div class="flow-card-v14 mission"><span class="eyebrow">Your real-world goal</span><h2>${escapeHtml(e.canDo)}</h2><p>${escapeHtml(e.production)}</p><div class="concept-map-v14">${e.concepts.length?e.concepts.map(concept=>`<div><b>${escapeHtml(concept.label)}</b>${concept.reading?`<small>${escapeHtml(concept.reading)}</small>`:''}<span>${escapeHtml(concept.meaning)}</span></div>`).join(''):'<div><b>Meaning</b><span>Understand the situation before memorising forms.</span></div>'}</div><div class="guided-tip-v14"><b>${escapeHtml(depth.label)}</b><span>${escapeHtml(depth.detail)}</span></div></div><button class="primary full" data-flow-action="continue" type="button">Start with connected input →</button>`;
  }
  renderDialogue(activity){
    const lines=activity.dialogue||[];
    return`<div class="flow-card-v14"><span class="eyebrow">Model conversation</span><h2>Hear how the language connects.</h2><p>Listen to the exchange as a situation, not as isolated flashcards.</p><div class="dialogue-v14">${lines.map((line,i)=>`<article><button class="dialogue-speaker-v14" data-dialogue-line="${i}" type="button">${escapeHtml(line.speaker)} 🔊</button><div><b dir="${this.course.rtl?'rtl':'ltr'}">${escapeHtml(lineText(line))}</b>${line.roman?`<small>${escapeHtml(line.roman)}</small>`:''}<span>${escapeHtml(line.meaning)}</span></div></article>`).join('')}</div><div class="actions"><button class="primary" data-flow-action="play-dialogue" type="button">🔊 Hear full exchange</button><button class="secondary" data-flow-action="continue" type="button">Continue →</button></div></div>`;
  }
  targetSupport(target){
    const showRoman=target.roman&&shouldShowRoman(this.course,target.id),hindi=hindiPronunciationLabel(this.course,target.roman);
    return`${target.kanjiForm?`<div class="guided-native-v14 kanji" dir="${this.course.rtl?'rtl':'ltr'}">${escapeHtml(target.kanjiForm)}</div><div class="guided-reading-v14">${escapeHtml(target.native)}</div>`:`<div class="guided-native-v14" dir="${this.course.rtl?'rtl':'ltr'}">${escapeHtml(target.native)}</div>`}${showRoman?`<b class="guided-roman-v14">${escapeHtml(target.roman)}</b>`:target.roman?'<span class="scaffold-faded-v14">Romaji/Pinyin support is fading as recognition grows.</span>':''}${hindi?`<b class="guided-hindi-v14" lang="hi">${escapeHtml(hindi)}</b>`:''}`;
  }
  renderLearn(activity){
    const target=activity.target;
    return`<div class="flow-card-v14 target"><span class="eyebrow">${activity.retry?'Rebuild the connection':activity.target.kind==='new'?'New useful form':'Spaced return'}</span><div class="audio-first-v14"><button class="guided-play-round" data-flow-action="play-target" type="button">🔊</button><small>Hear it first</small></div>${this.targetSupport(target)}<p class="guided-meaning-v14">${escapeHtml(target.meaning)}</p>${target.guide?`<div class="guided-tip-v14"><b>Notice</b><span>${escapeHtml(target.guide)}</span></div>`:''}<div class="actions"><button class="secondary" data-flow-action="slow-target" type="button">🐢 Slower</button><button class="primary" data-flow-action="continue" type="button">Retrieve it →</button></div></div>`;
  }
  retrieveOptions(target){
    if(this.lesson.state.options)return this.lesson.state.options;
    const unit=this.lesson.experience.unit,others=[...unit.items.map(item=>item.example?.native||item.native),...this.course.vocab.map(word=>word.native)].filter(value=>value&&value!==target.native&&value!==target.kanjiForm);
    this.lesson.state.options=shuffle(unique([target.kanjiForm||target.native,...shuffle(others).slice(0,3)]));return this.lesson.state.options;
  }
  renderRetrieve(activity){
    const target=activity.target,state=this.lesson.state,options=this.retrieveOptions(target),correctForm=target.kanjiForm||target.native;
    const feedback=!state.answered?'Choose the form from memory, then say it aloud.':state.correct?'✅ Retrieved. Now produce it aloud.':`Not yet. The target is <b>${escapeHtml(correctForm)}</b>. It will return once more in this session.`;
    return`<div class="flow-card-v14 retrieve"><span class="eyebrow">Active retrieval${activity.retry?' · retry':''}</span><h2>${escapeHtml(target.meaning)}</h2><p>Which form expresses this meaning?</p><div class="guided-options-v14">${options.map(option=>{const correct=option===correctForm,selected=option===state.selected,classes=state.answered?(correct?'correct':selected?'wrong':''):'';return`<button class="${classes}" data-retrieve-answer="${escapeHtml(option)}" type="button" ${state.answered?'disabled':''} dir="${this.course.rtl?'rtl':'ltr'}">${escapeHtml(option)}</button>`}).join('')}</div><div class="practice-feedback">${feedback}${state.speakingMessage?`<br>${state.speakingMessage}`:''}</div>${state.answered?`<div class="retrieve-speak-v14"><div>${this.targetSupport(target)}</div><div class="actions"><button class="primary" data-flow-action="mic-target" type="button">🎙 Speak it</button><button class="secondary" data-flow-action="manual-target" type="button">I practised aloud</button><button class="secondary" data-flow-action="play-target" type="button">🔊 Hear model</button></div></div>`:''}${state.answered&&state.speakingDone?'<button class="primary full" data-flow-action="continue" type="button">Continue →</button>':''}</div>`;
  }
  renderReading(activity){
    const reading=activity.reading,state=this.lesson.state,hindi=hindiPronunciationLabel(this.course,reading.roman);
    return`<div class="flow-card-v14 reading"><span class="eyebrow">Connected reading</span><h2>Meet familiar language inside a longer message.</h2><p>Read once for the main idea before checking the translation.</p><div class="reading-native-v14" dir="${this.course.rtl?'rtl':'ltr'}">${escapeHtml(reading.kanjiForm||reading.native)}</div>${reading.kanjiForm?`<div class="reading-support-v14">${escapeHtml(reading.native)}</div>`:''}${reading.roman?`<small>${escapeHtml(reading.roman)}</small>`:''}${hindi?`<small lang="hi">${escapeHtml(hindi)}</small>`:''}${state.revealed?`<div class="reading-meaning-v14">${escapeHtml(reading.meaning)}</div>`:'<div class="reading-meaning-v14 blurred-answer">Translation hidden until you try.</div>'}<div class="actions"><button class="primary" data-flow-action="reading-play" type="button">🔊 Hear passage</button>${!state.revealed?'<button class="secondary" data-flow-action="reading-reveal" type="button">Reveal meaning</button>':'<button class="secondary" data-flow-action="continue" type="button">Use the language →</button>'}</div></div>`;
  }
  renderScenario(activity){
    const state=this.lesson.state,e=this.lesson.experience;
    return`<div class="flow-card-v14 scenario"><span class="eyebrow">Free-response scenario</span><h2>${escapeHtml(activity.production)}</h2><p>Respond in your own words. There is intentionally no single required sentence here.</p><div class="scenario-support-v14"><b>Useful language already introduced</b>${e.targets.slice(0,4).map(target=>`<span>${escapeHtml(target.kanjiForm||target.native)}${target.meaning?` — ${escapeHtml(target.meaning)}`:''}</span>`).join('')}</div><div class="actions"><button class="primary" data-flow-action="scenario-mic" type="button">🎙 Respond with microphone</button><button class="secondary" data-flow-action="scenario-manual" type="button">I responded aloud</button></div><div class="practice-feedback">${state.speakingMessage||'The browser can capture what it heard, but this open response is not forced against one model answer.'}</div>${state.attempted?'<button class="primary full" data-flow-action="continue" type="button">Continue →</button>':''}</div>`;
  }
  renderCheckpoint(activity){
    const c=activity.checkpoint,state=this.lesson.state,dialogue=c.sampleDialogue?.length?c.sampleDialogue:this.lesson.experience.dialogue;
    return`<div class="flow-card-v14 checkpoint"><span class="eyebrow">${escapeHtml(c.stageLabel||'Stage')} checkpoint</span><h2>${escapeHtml(c.title||'Can you use this stage?')}</h2><div class="checkpoint-list-v14">${(c.canDo||[]).map(item=>`<div><span>✓</span><b>${escapeHtml(item)}</b></div>`).join('')}</div>${dialogue?.length?`<div class="checkpoint-model-v14"><b>Connected model</b>${dialogue.slice(0,6).map(line=>`<p><strong>${escapeHtml(line.speaker)}:</strong> ${escapeHtml(lineText(line))} <small>${escapeHtml(line.meaning)}</small></p>`).join('')}</div>`:''}<div class="checkpoint-task-v14"><span class="eyebrow">Do this without reading a script</span><h3>${escapeHtml(c.task||this.lesson.experience.production)}</h3></div><div class="actions"><button class="secondary" data-checkpoint-choice="practice" type="button">Needs more practice</button><button class="primary" data-checkpoint-choice="confident" type="button">I can do this</button></div>${state.checkpointChoice?'<button class="primary full" data-flow-action="continue" type="button">Finish stage check →</button>':''}</div>`;
  }
  renderComplete(){
    const e=this.lesson.experience,path=this.path(),next=path[this.lesson.unitIndex+1],metric=this.unitMetric(e.unit);
    return`<div class="flow-card-v14 complete"><span class="complete-icon-v14">✓</span><span class="eyebrow">Integrated session complete</span><h2>${escapeHtml(e.canDo)}</h2><p>You met the language in context, retrieved target forms, used connected input and produced a response. Weak targets can return in future sessions.</p><div class="guided-result-v14"><div><small>Target coverage</small><strong>${metric.coverage}%</strong></div><div><small>Active mastery</small><strong>${metric.activeMastery}%</strong></div><div><small>Connected inputs</small><strong>${(e.dialogue.length?1:0)+(e.reading?.native?1:0)}</strong></div></div><div class="actions">${next?`<button class="primary" data-flow-action="next-unit" data-next-unit="${next.index}" type="button">Start Unit ${next.index+1} →</button>`:''}<button class="secondary" data-flow-action="back-path" type="button">Back to path</button></div></div>`;
  }

  handleJourneyClick(event){
    const start=event.target.closest('[data-journey-start],[data-journey-unit]');if(start){this.startLesson(Number(start.dataset.journeyStart??start.dataset.journeyUnit)||0);return}
    if(event.target.closest('[data-v14-resume]')){if(!this.restore())this.startLesson(this.recommendedIndex());else this.renderLesson();return}
    if(event.target.closest('[data-journey-practice]')){this.courseController.switchTab('practice');this.practiceController.render();return}
    const line=event.target.closest('[data-dialogue-line]');if(line){const activity=this.currentActivity(),item=activity?.dialogue?.[Number(line.dataset.dialogueLine)||0];if(item)speak(lineText(item),this.course,{rate:.76});return}
    const answer=event.target.closest('[data-retrieve-answer]');if(answer){this.answerRetrieve(answer);return}
    const choice=event.target.closest('[data-checkpoint-choice]');if(choice){this.answerCheckpoint(choice.dataset.checkpointChoice);return}
    const action=event.target.closest('[data-flow-action]')?.dataset.flowAction;if(!action)return;
    if(action==='continue'){this.advance();return}
    if(action==='back-path'){this.lesson=null;this.clearSaved();this.renderJourney();return}
    if(action==='next-unit'){this.startLesson(Number(event.target.closest('[data-next-unit]')?.dataset.nextUnit)||0);return}
    if(action==='play-dialogue'){this.playDialogue();return}
    if(action==='play-target'){const target=this.currentActivity()?.target;if(target)speak(target.kanjiForm||target.native,this.course,{rate:.76});return}
    if(action==='slow-target'){const target=this.currentActivity()?.target;if(target)speak(target.kanjiForm||target.native,this.course,{rate:.56});return}
    if(action==='mic-target'){this.recognizeTarget();return}
    if(action==='manual-target'){this.manualTarget();return}
    if(action==='reading-play'){const reading=this.currentActivity()?.reading;if(reading)speak(reading.kanjiForm||reading.native,this.course,{rate:.72});return}
    if(action==='reading-reveal'){this.lesson.state.revealed=true;this.recordReading();this.persist();this.renderLesson();return}
    if(action==='scenario-mic'){this.recognizeScenario();return}
    if(action==='scenario-manual'){this.manualScenario();return}
  }
  playDialogue(){
    const lines=this.currentActivity()?.dialogue||[];if(!lines.length)return;
    speak(lines.map(line=>lineText(line)).join('。'),this.course,{rate:.72});
  }
  answerRetrieve(button){
    if(this.lesson.state.answered)return;const activity=this.currentActivity(),target=activity.target,selected=button.dataset.retrieveAnswer,correctForm=target.kanjiForm||target.native,correct=selected===correctForm;
    Object.assign(this.lesson.state,{answered:true,selected,correct});
    recordPractice({languageCode:this.course.id,targetId:target.id,skill:'recall',score:correct?100:25,xp:correct?4:1,metadata:{mode:'v14-retrieval',correct,selectedAnswer:selected,correctAnswer:correctForm}});
    this.persist();this.renderLesson();
  }
  manualTarget(){
    const target=this.currentActivity()?.target;if(!target||this.lesson.state.speakingDone)return;
    recordPractice({languageCode:this.course.id,targetId:target.id,skill:'speaking',score:null,xp:1,metadata:{mode:'v14-target-manual',assessed:false}});
    this.lesson.state.speakingDone=true;this.lesson.state.speakingMessage='Speaking practice recorded. No pronunciation score was invented.';this.persist();this.renderLesson();
  }
  recognizeTarget(){
    const target=this.currentActivity()?.target;if(!target)return;
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Recognition){this.lesson.state.speakingMessage='Speech recognition is unavailable in this browser. Use the manual practice option.';this.renderLesson();return}
    if(this.recognizer){try{this.recognizer.abort()}catch{}}
    const recognizer=new Recognition();this.recognizer=recognizer;recognizer.lang=this.course.locale;recognizer.interimResults=false;recognizer.maxAlternatives=5;
    recognizer.onerror=event=>{this.lesson.state.speakingMessage=`Speech recognition: ${event.error}`;this.renderLesson()};
    recognizer.onresult=event=>{
      const transcripts=[...event.results[0]].map(result=>result.transcript),best=bestSpeechMatch(transcripts,target.speechForms?.length?target.speechForms:[target.native],this.course.locale),score=Math.round(best.score*100);
      recordPractice({languageCode:this.course.id,targetId:target.id,skill:'speaking',score,xp:score>=85?8:score>=60?4:1,metadata:{mode:'v14-target-speech',heard:best.transcript,matchedForm:best.expected}});
      this.lesson.state.speakingDone=true;this.lesson.state.heard=best.transcript;this.lesson.state.speakingMessage=`Browser heard: <b>${escapeHtml(best.transcript)}</b><br>Accepted-form text match: <b>${score}%</b>. This is recognition evidence, not accent or tone grading.`;this.persist();this.renderLesson();
    };
    recognizer.start();
  }
  recordReading(){
    if(this.lesson.state.attempted)return;const target=this.lesson.experience.targets[0];if(!target)return;
    recordPractice({languageCode:this.course.id,targetId:target.id,skill:'recognition',score:null,xp:1,metadata:{mode:'v14-connected-reading',assessed:false,unitId:this.lesson.experience.unit.id}});this.lesson.state.attempted=true;
  }
  manualScenario(){
    if(this.lesson.state.attempted)return;const target=this.lesson.experience.targets[0];if(!target)return;
    recordPractice({languageCode:this.course.id,targetId:target.id,skill:'speaking',score:null,xp:2,metadata:{mode:'v14-free-response',assessed:false,task:this.lesson.experience.production}});
    this.lesson.state.attempted=true;this.lesson.state.speakingMessage='Free response recorded as production practice. There is no forced model-answer score.';this.persist();this.renderLesson();
  }
  recognizeScenario(){
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Recognition){this.lesson.state.speakingMessage='Speech recognition is unavailable here. You can still respond aloud and use the manual option.';this.renderLesson();return}
    if(this.recognizer){try{this.recognizer.abort()}catch{}}
    const recognizer=new Recognition();this.recognizer=recognizer;recognizer.lang=this.course.locale;recognizer.interimResults=false;recognizer.maxAlternatives=3;
    recognizer.onerror=event=>{this.lesson.state.speakingMessage=`Speech recognition: ${event.error}`;this.renderLesson()};
    recognizer.onresult=event=>{
      const heard=event.results[0][0].transcript,target=this.lesson.experience.targets[0];if(target)recordPractice({languageCode:this.course.id,targetId:target.id,skill:'speaking',score:null,xp:2,metadata:{mode:'v14-free-response',assessed:false,heard,task:this.lesson.experience.production}});
      this.lesson.state.attempted=true;this.lesson.state.heard=heard;this.lesson.state.speakingMessage=`Browser heard: <b>${escapeHtml(heard)}</b><br>No percentage is assigned because many different natural answers can satisfy this scenario.`;this.persist();this.renderLesson();
    };
    recognizer.start();
  }
  answerCheckpoint(choice){
    if(this.lesson.state.checkpointChoice)return;this.lesson.state.checkpointChoice=choice;const target=this.lesson.experience.targets[0];if(target)recordPractice({languageCode:this.course.id,targetId:target.id,skill:'speaking',score:null,xp:0,metadata:{mode:'v14-stage-checkpoint',assessed:false,selfAssessment:choice,stageId:this.lesson.experience.stage?.id}});this.persist();this.renderLesson();
  }

  renderReview(){
    this.syncCourse();const position=getPosition(this.course.id),stage=stageForUnit(this.course,position.unitIndex),due=reviewsDue(this.course.id),listening=weakestTarget(this.course.id,'listening',stage?.id),recall=weakestTarget(this.course.id,'recall',stage?.id),weakMatch=listening?findItem(this.course,listening.id):null;
    $('reviewTab').innerHTML=`<section class="hub-hero-v14"><div><span class="eyebrow light">Review</span><h2>Bring weak language back inside meaning.</h2><p>Review is not a separate finish line. Weak targets return in Journey and can also be trained directly here.</p></div><div class="hub-number-v14"><strong>${due}</strong><span>reviews due</span></div></section><div class="hub-grid-v14"><button data-v14-tool="practice" class="hub-card-v14" type="button"><span>🎧</span><h3>Listening & speaking</h3><p>${listening?`Weak target: ${escapeHtml(listening.meaning||listening.native)}`:'Train the weakest communication skill.'}</p><b>Open practice →</b></button><button data-v14-tool="cards" class="hub-card-v14" type="button"><span>🧠</span><h3>Recall cards</h3><p>${recall?`Bring back: ${escapeHtml(recall.meaning||recall.native)}`:'Retrieve vocabulary without seeing the answer.'}</p><b>Review cards →</b></button><button data-v14-tool="quiz" class="hub-card-v14" type="button"><span>✓</span><h3>Recognition check</h3><p>Check whether forms still survive without hints.</p><b>Start check →</b></button>${weakMatch?`<button data-v14-guided-unit="${weakMatch.unitIndex}" class="hub-card-v14" type="button"><span>🧭</span><h3>Rebuild in context</h3><p>Return to Unit ${weakMatch.unitIndex+1}: ${escapeHtml(weakMatch.unit.title)}</p><b>Open integrated session →</b></button>`:''}</div>`;
  }
  renderExplore(){
    this.syncCourse();$('exploreTab').innerHTML=`<section class="hub-hero-v14 explore"><div><span class="eyebrow light">Explore</span><h2>Inspect the language without losing the guided path.</h2><p>Journey is the default learning sequence. Explore is where you inspect grammar, vocabulary, writing and language notes in more depth.</p></div><span class="large-flag">${this.course.flag}</span></section><div class="hub-grid-v14"><button data-v14-tool="learn" class="hub-card-v14" type="button"><span>📖</span><h3>Lesson notes</h3><p>Grammar, examples, integrated reading and unit details.</p><b>Open notes →</b></button><button data-v14-tool="guide" class="hub-card-v14" type="button"><span>🗺️</span><h3>Language guide</h3><p>Script, pronunciation, culture and language facts.</p><b>Open guide →</b></button><button data-v14-tool="words" class="hub-card-v14" type="button"><span>🔤</span><h3>Vocabulary</h3><p>Search, hear and save useful forms.</p><b>Open words →</b></button><button data-v14-tool="write" class="hub-card-v14" type="button"><span>✍️</span><h3>Writing</h3><p>Practise written forms when script production matters.</p><b>Open writing →</b></button></div>`;
  }
  handleHubClick(event,origin){
    const guided=event.target.closest('[data-v14-guided-unit]');if(guided){this.courseController.switchTab('journey');this.startLesson(Number(guided.dataset.v14GuidedUnit)||0);return}
    const tool=event.target.closest('[data-v14-tool]')?.dataset.v14Tool;if(!tool)return;
    if(tool==='practice'){this.courseController.switchTab('practice');this.practiceController.render();return}
    this.returnTab=origin;this.courseController.switchTab(tool);
  }
}
