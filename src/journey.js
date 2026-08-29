import{findItem,getCourse,stageForUnit}from'./data.js';
import{learningEvents,recordPractice,reviewsDue,unitMastery,weakestTarget}from'./learning.js';
import{getPosition,subscribe}from'./store.js';
import{speak}from'./audio.js';
import{escapeHtml,shuffle,similarity}from'./utils.js';
import{buildJourneySession,mistakeChoices,shouldShowRoman}from'./session.js';

const $=id=>document.getElementById(id);
const ASSESSED_SKILLS=new Set(['listening','speaking','recognition','recall']);
const targetOf=event=>event.targetId||event.target_id;
const meaningFor=item=>item?.example?.meaning||item?.guide||item?.pron||'Learn and use this form.';
const phraseFor=item=>item?.example?.native||item?.native||'';
const romanFor=item=>item?.example?.roman||item?.roman||'';

function ensureStyles(){
  if(document.querySelector('link[data-journey-v13]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='./journey-v13.css';link.dataset.journeyV13='true';document.head.append(link);
}
function freshItemState(){return{step:0,answered:false,answerCorrect:null,selectedAnswer:null,options:null,recallAnswered:false,recallCorrect:null,recallSelected:null,recallOptions:null,speakingDone:false,speakingMessage:'',showModel:false,needsRetry:false}}
function newLesson(unitIndex,plan){return{unitIndex,plan,queue:[...plan.queue],queueIndex:0,...freshItemState()}}

export class JourneyController{
  constructor(courseController,practiceController){
    this.courseController=courseController;this.practiceController=practiceController;this.course=getCourse('ja');this.lesson=null;this.returnTab='journey';this.recognizer=null;
    ensureStyles();this.installNavigation();this.installPanels();this.bind();
    subscribe((_,reason)=>{if(reason==='event'&&this.isVisible()&&!this.lesson)this.render()});
  }

  installNavigation(){
    const tabs=document.querySelector('#courseScreen .tabs');if(!tabs)return;
    tabs.classList.add('v13-tabs');
    tabs.innerHTML='<button class="tab active" data-tab="journey" type="button">🧭 Journey</button><button class="tab" data-tab="practice" type="button">👂 Practice</button><button class="tab" data-tab="review" type="button">🧠 Review</button><button class="tab" data-tab="explore" type="button">🧰 Explore</button><button class="tab" data-tab="progress" type="button">📈 Progress</button>';
    $('stageNav')?.classList.add('v13-stage-nav-hidden');
  }
  installPanels(){
    const practice=$('practiceTab');if(!practice)return;
    if(!$('journeyTab'))practice.insertAdjacentHTML('beforebegin','<section id="journeyTab" class="panel active"></section>');
    if(!$('reviewTab'))$('progressTab').insertAdjacentHTML('beforebegin','<section id="reviewTab" class="panel"></section>');
    if(!$('exploreTab'))$('progressTab').insertAdjacentHTML('beforebegin','<section id="exploreTab" class="panel"></section>');
    for(const id of['learnTab','guideTab','writeTab','wordsTab','cardsTab','quizTab']){
      const panel=$(id);if(!panel||panel.querySelector('.v13-tool-back'))continue;
      panel.insertAdjacentHTML('afterbegin','<div class="v13-tool-back"><button class="secondary small" data-v13-back type="button">← Back</button><span>Supporting activity</span></div>');
    }
  }
  bind(){
    document.querySelector('#courseScreen .tabs')?.addEventListener('click',event=>{const tab=event.target.closest('[data-tab]')?.dataset.tab;if(['journey','review','explore'].includes(tab))requestAnimationFrame(()=>this.render(tab))});
    $('journeyTab')?.addEventListener('click',event=>this.handleJourneyClick(event));
    $('reviewTab')?.addEventListener('click',event=>this.handleHubClick(event,'review'));
    $('exploreTab')?.addEventListener('click',event=>this.handleHubClick(event,'explore'));
    $('courseScreen')?.addEventListener('click',event=>{const back=event.target.closest('[data-v13-back]');if(!back)return;this.courseController.switchTab(this.returnTab||'journey');this.render(this.returnTab||'journey')});
  }

  isVisible(){return $('courseScreen')?.classList.contains('active')&&$('journeyTab')?.classList.contains('active')}
  syncCourse(){const active=this.courseController?.course;if(active?.id&&active.id!==this.course.id)this.course=active}
  open(languageCode){this.course=getCourse(languageCode);this.lesson=null;this.render('journey')}

  unitMetric(unit){
    const ids=new Set((unit.items||[]).map(item=>item.id)),events=learningEvents(this.course.id).filter(event=>ids.has(targetOf(event))),attempted=new Set(events.map(targetOf));
    const coverage=unit.items.length?Math.round(attempted.size/unit.items.length*100):0,activeMastery=unitMastery(this.course.id,unit),readiness=Math.round(coverage*.60+activeMastery*.40);
    return{coverage,activeMastery,readiness,complete:coverage>=80&&readiness>=60,allowNext:coverage>=60&&readiness>=45,activeEvidence:events.filter(event=>ASSESSED_SKILLS.has(event.skill)).length};
  }
  path(){
    this.syncCourse();let priorReady=true;
    return this.course.units.map((unit,index)=>{const metric=this.unitMetric(unit),unlocked=index===0||priorReady;priorReady=unlocked&&metric.allowNext;return{unit,index,metric,unlocked}});
  }
  recommendedIndex(path=this.path()){const first=path.find(entry=>entry.unlocked&&!entry.metric.complete);return first?.index??path.filter(entry=>entry.unlocked).at(-1)?.index??0}
  courseProgress(path=this.path()){return path.length?Math.round(path.reduce((sum,entry)=>sum+entry.metric.readiness,0)/path.length):0}

  render(targetTab=null){
    this.syncCourse();const active=targetTab||document.querySelector('#courseScreen .tab.active')?.dataset.tab;
    if(active==='review')this.renderReview();else if(active==='explore')this.renderExplore();else if(active==='journey')this.renderJourney();this.renderHeaderProgress();
  }
  renderHeaderProgress(){
    const head=document.querySelector('.course-head');if(!head)return;let summary=head.querySelector('.v13-course-progress');
    if(!summary){summary=document.createElement('div');summary.className='v13-course-progress';head.append(summary)}
    const path=this.path(),recommended=path[this.recommendedIndex(path)],progress=this.courseProgress(path);
    summary.innerHTML=`<span>${progress}% path</span><b>${recommended?.metric.complete?'Review & strengthen':`Unit ${(recommended?.index||0)+1}`}</b>`;
  }

  renderJourney(){
    if(this.lesson){this.renderLesson();return}
    const path=this.path(),recommended=path[this.recommendedIndex(path)]||path[0],unitIndex=recommended?.index||0,progress=this.courseProgress(path),stage=stageForUnit(this.course,unitIndex),events=learningEvents(this.course.id),firstTime=events.length===0,plan=buildJourneySession(this.course,unitIndex);
    $('journeyTab').innerHTML=`
      <section class="journey-hero-v13">
        <div><span class="eyebrow light">${firstTime?'Your first real-world goal':'Recommended next'}</span><h2>${escapeHtml(plan.canDo)}</h2><p>${firstTime?'Learn a small amount, retrieve it from memory, use it aloud, then meet it again later.':escapeHtml(recommended?.unit.goal||'Keep strengthening useful language in context.')}</p><div class="actions"><button class="primary" data-journey-start="${unitIndex}" type="button">${firstTime?'Start first session':`Start Unit ${unitIndex+1} session`}</button>${events.length?'<button class="secondary dark" data-journey-practice type="button">Practice weak skills</button>':''}</div></div>
        <div class="journey-meter"><strong>${progress}%</strong><span>course readiness</span><div class="progressbar"><span style="width:${progress}%"></span></div><small>${escapeHtml(stage?.label||'Foundation')} · ${escapeHtml(plan.scaffold.label)}</small></div>
      </section>
      <section class="session-preview-v13"><div><span class="eyebrow">This session</span><h3>${plan.mix.reviewCount} review · ${plan.mix.newCount} new</h3><p>${escapeHtml(plan.mix.label)}${plan.mix.accuracy==null?'':` · recent accuracy ${plan.mix.accuracy}%`}</p></div><div><span class="eyebrow">Learning strategy</span><h3>${escapeHtml(plan.scaffold.label)}</h3><p>${escapeHtml(plan.scaffold.hint)}</p></div></section>
      ${firstTime?'<section class="beginner-roadmap-v13"><div><span>1</span><b>Context</b><small>Know what you are trying to do.</small></div><div><span>2</span><b>Input</b><small>Hear and understand useful language.</small></div><div><span>3</span><b>Retrieve</b><small>Bring it back without being shown.</small></div><div><span>4</span><b>Use</b><small>Say it in a small real-world task.</small></div></section>':''}
      <section class="journey-section-v13"><div class="journey-section-head"><div><span class="eyebrow">Learning path</span><h2>Can-do goals, one unit at a time</h2><p>New material opens gradually, while older weak material keeps returning inside future sessions.</p></div><span class="badge">${path.filter(entry=>entry.unlocked).length}/${path.length} open</span></div><div class="unit-path-v13">${path.map(entry=>this.renderUnitNode(entry,unitIndex)).join('')}</div></section>`;
  }
  renderUnitNode(entry,recommendedIndex){
    const{unit,index,metric,unlocked}=entry,current=index===recommendedIndex,stage=stageForUnit(this.course,index),state=!unlocked?'Locked':metric.complete?'Ready':metric.readiness>0?'Building':'New';
    return`<button class="unit-node-v13 ${!unlocked?'locked':''} ${current?'current':''} ${metric.complete?'complete':''}" data-journey-unit="${index}" type="button" ${unlocked?'':'disabled'}><span class="unit-line-dot">${metric.complete?'✓':unlocked?index+1:'🔒'}</span><div class="unit-node-copy"><div><span class="eyebrow">${escapeHtml(stage?.label||'Course')} · Unit ${index+1}</span><span class="unit-state-v13">${state}</span></div><h3>${escapeHtml(unit.title)}</h3><p>${escapeHtml(unit.goal||'Build the next useful language ability.')}</p><div class="unit-metrics-v13"><span>${metric.coverage}% practised</span><span>${metric.activeMastery}% mastery</span><span>${metric.readiness}% ready</span></div><div class="progressbar"><span style="width:${metric.readiness}%"></span></div>${!unlocked?'<small>Recommended after you strengthen the previous unit.</small>':current?'<small>Recommended next can-do goal</small>':''}</div></button>`;
  }

  handleJourneyClick(event){
    const start=event.target.closest('[data-journey-start],[data-journey-unit]');if(start){this.startLesson(Number(start.dataset.journeyStart??start.dataset.journeyUnit)||0);return}
    if(event.target.closest('[data-journey-practice]')){this.courseController.switchTab('practice');this.practiceController.render();return}
    const answer=event.target.closest('[data-lesson-answer]');if(answer){this.answerLessonCheck(answer);return}
    const recall=event.target.closest('[data-recall-answer]');if(recall){this.answerRecall(recall);return}
    const action=event.target.closest('[data-lesson-action]')?.dataset.lessonAction;if(!action)return;
    if(action==='play'){speak(phraseFor(this.lessonItem()),this.course,{rate:.78});return}
    if(action==='slow'){speak(phraseFor(this.lessonItem()),this.course,{rate:.58});return}
    if(action==='continue'){this.lesson.step=Math.min(6,this.lesson.step+1);this.renderLesson();return}
    if(action==='back-path'){this.lesson=null;this.renderJourney();return}
    if(action==='show-model'){this.lesson.showModel=true;this.renderLesson();return}
    if(action==='manual-speak'){this.recordManualSpeaking();return}
    if(action==='mic'){this.recognizeLesson();return}
    if(action==='next-item'){this.nextLessonItem();return}
    if(action==='next-unit'){this.startLesson(Number(event.target.closest('[data-next-unit]')?.dataset.nextUnit)||0)}
  }

  startLesson(unitIndex){
    const path=this.path(),entry=path[unitIndex];if(!entry?.unlocked)return;
    const plan=buildJourneySession(this.course,unitIndex);if(!plan.queue.length)return;
    this.lesson=newLesson(unitIndex,plan);this.renderLesson();
  }
  currentQueueEntry(){return this.lesson?.queue?.[this.lesson.queueIndex]||null}
  lessonItem(){const entry=this.currentQueueEntry();return entry?this.course.units[entry.unitIndex]?.items[entry.itemIndex]:null}
  missionUnit(){return this.course.units[this.lesson?.unitIndex]}

  checkOptions(item){
    if(this.lesson.options?.length)return this.lesson.options;
    const unit=this.missionUnit(),correct=meaningFor(item),remembered=mistakeChoices(this.course.id,item.id,'meaning'),others=[...remembered,...unit.items.filter(candidate=>candidate.id!==item.id).map(meaningFor),...this.course.vocab.map(word=>word.meaning)].filter(value=>value&&value!==correct);
    this.lesson.options=shuffle([correct,...[...new Set(others)].slice(0,3)]);return this.lesson.options;
  }
  recallOptions(item){
    if(this.lesson.recallOptions?.length)return this.lesson.recallOptions;
    const correct=phraseFor(item),unit=this.missionUnit(),remembered=mistakeChoices(this.course.id,item.id,'recall'),others=[...remembered,...unit.items.filter(candidate=>candidate.id!==item.id).map(phraseFor)].filter(value=>value&&value!==correct);
    this.lesson.recallOptions=shuffle([correct,...[...new Set(others)].slice(0,3)]);return this.lesson.recallOptions;
  }

  renderLesson(){
    const item=this.lessonItem();if(!item){this.lesson=null;this.renderJourney();return}
    const entry=this.currentQueueEntry(),mission=this.missionUnit(),step=this.lesson.step,phrase=phraseFor(item),roman=romanFor(item),meaning=meaningFor(item),metric=this.unitMetric(mission),showRoman=roman&&shouldShowRoman(this.course,item.id),stepNames=['Context','Listen','Understand','Check','Recall','Use','Complete'],kindLabel=entry.kind==='new'?'New':entry.kind==='retry'?'Retry':'Review';
    let body='';
    if(step===0)body=`<div class="guided-focus-v13 context"><span class="eyebrow">${kindLabel} · real-world goal</span><h2>${escapeHtml(this.lesson.plan.canDo)}</h2><p>${entry.kind==='new'?'Meet one useful piece inside this goal. You will hear it first, retrieve it, then use it aloud.':'Bring this earlier item back from memory before adding more new language.'}</p><div class="context-chip-v13">${entry.kind==='new'?'➕ New material':'↻ Spaced review'}</div></div><button class="primary full" data-lesson-action="continue" type="button">Hear the language →</button>`;
    if(step===1)body=`<div class="guided-focus-v13 audio-only"><span class="lesson-big-icon">👂</span><h2>Listen before you read.</h2><p>Focus on the sound. Meaning and spelling come next.</p><div class="actions"><button class="primary" data-lesson-action="play" type="button">🔊 Hear it</button><button class="secondary" data-lesson-action="slow" type="button">🐢 Slower</button></div></div><button class="primary full" data-lesson-action="continue" type="button">I listened →</button>`;
    if(step===2)body=`<div class="guided-focus-v13"><span class="eyebrow">Connect sound to meaning</span><div class="guided-native-v13" dir="${this.course.rtl?'rtl':'ltr'}">${escapeHtml(phrase)}</div>${showRoman?`<b class="guided-roman-v13">${escapeHtml(roman)}</b>`:roman?'<span class="scaffold-faded-v13">Pronunciation support is fading as recognition improves.</span>':''}<p class="guided-meaning-v13">${escapeHtml(meaning)}</p>${item.guide?`<div class="guided-tip-v13"><b>Notice</b><span>${escapeHtml(item.guide)}</span></div>`:''}<button class="secondary" data-lesson-action="play" type="button">🔊 Hear with text</button></div><button class="primary full" data-lesson-action="continue" type="button">Check my understanding →</button>`;
    if(step===3){
      const options=this.checkOptions(item),feedback=!this.lesson.answered?'Listen and choose the meaning.':this.lesson.answerCorrect?'✅ Correct. Now retrieve the language in the other direction.':`Not yet. The answer is <b>${escapeHtml(meaning)}</b>. This confusion will return later.`;
      body=`<div class="guided-focus-v13"><span class="eyebrow">Interpretive check</span><button class="guided-play-round" data-lesson-action="play" type="button">🔊</button><p class="muted">Understand the sound without relying on the spelling.</p></div><div class="guided-options-v13">${options.map(option=>{const correct=option===meaning,selected=option===this.lesson.selectedAnswer,classes=this.lesson.answered?(correct?'correct':selected?'wrong':''):'';return`<button class="${classes}" data-lesson-answer="${escapeHtml(option)}" type="button" ${this.lesson.answered?'disabled':''}>${escapeHtml(option)}</button>`}).join('')}</div><div class="practice-feedback">${feedback}</div>${this.lesson.answered?'<button class="primary full" data-lesson-action="continue" type="button">Retrieve it from memory →</button>':''}`;
    }
    if(step===4){
      const options=this.recallOptions(item),feedback=!this.lesson.recallAnswered?'Do not look back. Choose the language form from memory.':this.lesson.recallCorrect?'✅ Retrieved. Now use it in the situation.':`The target was <b>${escapeHtml(phrase)}</b>. It will come back again.`;
      body=`<div class="guided-focus-v13 recall"><span class="eyebrow">Active recall</span><h2>${escapeHtml(meaning)}</h2><p>Which form expresses this meaning?</p></div><div class="guided-options-v13 recall-options">${options.map(option=>{const correct=option===phrase,selected=option===this.lesson.recallSelected,classes=this.lesson.recallAnswered?(correct?'correct':selected?'wrong':''):'';return`<button class="${classes}" data-recall-answer="${escapeHtml(option)}" type="button" ${this.lesson.recallAnswered?'disabled':''} dir="${this.course.rtl?'rtl':'ltr'}">${escapeHtml(option)}</button>`}).join('')}</div><div class="practice-feedback">${feedback}</div>${this.lesson.recallAnswered?'<button class="primary full" data-lesson-action="continue" type="button">Use it aloud →</button>':''}`;
    }
    if(step===5){
      const message=this.lesson.speakingMessage||'Try to produce the target from the situation and meaning. Reveal the model only if you need support.';
      body=`<div class="guided-focus-v13 task"><span class="eyebrow">Mini real-world task</span><h2>${escapeHtml(this.lesson.plan.canDo)}</h2><p class="task-prompt-v13">Say: <b>${escapeHtml(meaning)}</b></p>${this.lesson.showModel?`<div class="guided-native-v13 compact" dir="${this.course.rtl?'rtl':'ltr'}">${escapeHtml(phrase)}</div>${showRoman?`<b class="guided-roman-v13">${escapeHtml(roman)}</b>`:''}`:'<button class="secondary" data-lesson-action="show-model" type="button">Reveal model</button>'}<div class="actions"><button class="secondary" data-lesson-action="play" type="button">🔊 Hear model</button><button class="primary" data-lesson-action="mic" type="button">🎙 Check with microphone</button></div><button class="ghost" data-lesson-action="manual-speak" type="button">I practised it aloud without microphone</button><div class="practice-feedback">${message}</div></div>${this.lesson.speakingDone?'<button class="primary full" data-lesson-action="continue" type="button">Finish this item →</button>':''}`;
    }
    if(step===6){
      const more=this.lesson.queueIndex+1<this.lesson.queue.length,nextUnit=this.path()[this.lesson.unitIndex+1];
      body=`<div class="guided-complete-v13"><span class="complete-icon-v13">✓</span><span class="eyebrow">${more?'One item strengthened':'Session complete'}</span><h2>${more?'Keep the session mixed.':escapeHtml(this.lesson.plan.canDo)}</h2><p>${this.lesson.needsRetry?'This item was difficult, so it has been scheduled to return once more before the session ends.':'Old and new material are mixed so useful language keeps returning instead of disappearing after one unit.'}</p><div class="guided-result-v13"><div><small>Unit coverage</small><strong>${metric.coverage}%</strong></div><div><small>Unit mastery</small><strong>${metric.activeMastery}%</strong></div><div><small>Readiness</small><strong>${metric.readiness}%</strong></div></div><div class="actions">${more||this.lesson.needsRetry?'<button class="primary" data-lesson-action="next-item" type="button">Next activity →</button>':nextUnit?.unlocked?`<button class="primary" data-lesson-action="next-unit" data-next-unit="${this.lesson.unitIndex+1}" type="button">Start Unit ${this.lesson.unitIndex+2} →</button>`:''}<button class="secondary" data-lesson-action="back-path" type="button">Back to path</button></div></div>`;
    }
    const sessionPosition=`${Math.min(this.lesson.queueIndex+1,this.lesson.queue.length)}/${this.lesson.queue.length}`;
    $('journeyTab').innerHTML=`<section class="guided-lesson-v13"><div class="guided-top-v13"><button class="secondary small" data-lesson-action="back-path" type="button">← Path</button><div><span class="eyebrow">Unit ${this.lesson.unitIndex+1} · ${kindLabel} · Session ${sessionPosition}</span><h3>${escapeHtml(mission.title)}</h3></div><span class="badge">${step+1}/7</span></div><div class="guided-stepper-v13 seven">${stepNames.map((name,index)=>`<span class="${index<step?'done':index===step?'active':''}">${index<step?'✓':index+1}<small>${name}</small></span>`).join('')}</div>${body}</section>`;
  }

  answerLessonCheck(button){
    if(!this.lesson||this.lesson.answered)return;
    const item=this.lessonItem(),correctAnswer=meaningFor(item),selected=button.dataset.lessonAnswer,correct=selected===correctAnswer;
    this.lesson.answered=true;this.lesson.answerCorrect=correct;this.lesson.selectedAnswer=selected;if(!correct)this.lesson.needsRetry=true;
    const metadata={mode:'guided-journey',questionKind:'meaning',selectedAnswer:selected,correctAnswer,correct};
    recordPractice({languageCode:this.course.id,targetId:item.id,skill:'listening',score:correct?100:25,xp:correct?6:1,metadata});
    recordPractice({languageCode:this.course.id,targetId:item.id,skill:'recognition',score:correct?85:25,xp:0,metadata});this.renderLesson();
  }
  answerRecall(button){
    if(!this.lesson||this.lesson.recallAnswered)return;
    const item=this.lessonItem(),correctAnswer=phraseFor(item),selected=button.dataset.recallAnswer,correct=selected===correctAnswer;
    this.lesson.recallAnswered=true;this.lesson.recallCorrect=correct;this.lesson.recallSelected=selected;if(!correct)this.lesson.needsRetry=true;
    recordPractice({languageCode:this.course.id,targetId:item.id,skill:'recall',score:correct?100:25,xp:correct?4:1,metadata:{mode:'guided-journey',questionKind:'recall',selectedAnswer:selected,correctAnswer,correct}});this.renderLesson();
  }
  recordManualSpeaking(){
    if(!this.lesson||this.lesson.speakingDone)return;const item=this.lessonItem();
    recordPractice({languageCode:this.course.id,targetId:item.id,skill:'speaking',score:null,xp:1,metadata:{mode:'guided-self-practice',assessed:false,task:this.lesson.plan.canDo}});
    this.lesson.speakingDone=true;this.lesson.speakingMessage='Speaking practice recorded as coverage. No pronunciation score was assigned.';this.renderLesson();
  }
  recognizeLesson(){
    const item=this.lessonItem(),Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Recognition){this.lesson.speakingMessage='Microphone speech recognition is unavailable here. Reveal the model, practise aloud, then use the manual option.';this.renderLesson();return}
    if(this.recognizer){try{this.recognizer.abort()}catch{}}
    const recognizer=new Recognition();this.recognizer=recognizer;recognizer.lang=this.course.locale;recognizer.interimResults=false;recognizer.maxAlternatives=5;
    const button=$('journeyTab').querySelector('[data-lesson-action="mic"]');if(button){button.disabled=true;button.textContent='🎙 Listening…'}
    recognizer.onerror=event=>{this.lesson.speakingMessage=`Speech recognition: ${event.error}`;this.renderLesson()};
    recognizer.onresult=event=>{
      const heard=event.results[0][0].transcript,transcripts=[...event.results[0]].map(result=>result.transcript),best=Math.max(...transcripts.map(text=>similarity(text,phraseFor(item)))),score=Math.round(best*100),xp=score>=85?8:score>=60?4:1;
      recordPractice({languageCode:this.course.id,targetId:item.id,skill:'speaking',score,xp,metadata:{mode:'guided-journey',heard,task:this.lesson.plan.canDo}});
      this.lesson.speakingDone=true;this.lesson.speakingMessage=`Browser heard: <b>${escapeHtml(heard)}</b><br>Text match: <b>${score}%</b>. This is a transcript signal, not pronunciation grading.`;this.renderLesson();
    };
    recognizer.start();
  }

  nextLessonItem(){
    const current=this.currentQueueEntry();
    if(this.lesson.needsRetry&&!this.lesson.queue.slice(this.lesson.queueIndex+1).some(entry=>entry.targetId===current.targetId&&entry.kind==='retry'))this.lesson.queue.push({...current,kind:'retry'});
    if(this.lesson.queueIndex+1>=this.lesson.queue.length){this.lesson=null;this.renderJourney();return}
    this.lesson.queueIndex++;Object.assign(this.lesson,freshItemState());this.renderLesson();
  }

  renderReview(){
    this.syncCourse();const position=getPosition(this.course.id),stage=stageForUnit(this.course,position.unitIndex),due=reviewsDue(this.course.id),listening=weakestTarget(this.course.id,'listening',stage?.id),recall=weakestTarget(this.course.id,'recall',stage?.id),weakMatch=listening?findItem(this.course,listening.id):null;
    $('reviewTab').innerHTML=`<section class="hub-hero-v13"><div><span class="eyebrow light">Review</span><h2>Strengthen what is starting to fade.</h2><p>Due and weak material returns before it disappears from memory. New content stays in Journey.</p></div><div class="hub-number-v13"><strong>${due}</strong><span>reviews due</span></div></section><div class="hub-grid-v13"><button data-v13-tool="practice" class="hub-card-v13" type="button"><span>👂</span><h3>Listening review</h3><p>${listening?`Weak target: ${escapeHtml(listening.meaning||listening.native)}`:'Practise listening from your current stage.'}</p><b>Open practice →</b></button><button data-v13-tool="cards" class="hub-card-v13" type="button"><span>🧠</span><h3>Recall cards</h3><p>${recall?`Bring back: ${escapeHtml(recall.meaning||recall.native)}`:'Retrieve useful vocabulary without seeing the answer.'}</p><b>Review cards →</b></button><button data-v13-tool="quiz" class="hub-card-v13" type="button"><span>✓</span><h3>Quick recognition check</h3><p>Use a short check to see what still survives without hints.</p><b>Start quiz →</b></button>${weakMatch?`<button data-v13-guided-unit="${weakMatch.unitIndex}" class="hub-card-v13" type="button"><span>🧭</span><h3>Revisit in context</h3><p>Return to Unit ${weakMatch.unitIndex+1}: ${escapeHtml(weakMatch.unit.title)}</p><b>Open guided session →</b></button>`:''}</div>`;
  }
  renderExplore(){
    this.syncCourse();$('exploreTab').innerHTML=`<section class="hub-hero-v13 explore"><div><span class="eyebrow light">Explore</span><h2>Use supporting tools when you need more context.</h2><p>The Journey decides the recommended learning order; these tools let you inspect the language more deeply.</p></div><span class="large-flag">${this.course.flag}</span></section><div class="hub-grid-v13"><button data-v13-tool="learn" class="hub-card-v13" type="button"><span>📖</span><h3>Full lesson notes</h3><p>Browse items, pronunciation notes, examples and integrated lesson details.</p><b>Open lesson notes →</b></button><button data-v13-tool="guide" class="hub-card-v13" type="button"><span>🗺️</span><h3>Language guide</h3><p>Writing system, pronunciation focus, language facts and cultural usage.</p><b>Open guide →</b></button><button data-v13-tool="words" class="hub-card-v13" type="button"><span>🔤</span><h3>Words & phrases</h3><p>Search vocabulary, hear items and save useful forms.</p><b>Open vocabulary →</b></button><button data-v13-tool="write" class="hub-card-v13" type="button"><span>✍️</span><h3>Writing practice</h3><p>Practise written forms when writing matters for this language.</p><b>Open writing pad →</b></button></div>`;
  }
  handleHubClick(event,origin){
    const guided=event.target.closest('[data-v13-guided-unit]');if(guided){this.courseController.switchTab('journey');this.startLesson(Number(guided.dataset.v13GuidedUnit)||0);return}
    const tool=event.target.closest('[data-v13-tool]')?.dataset.v13Tool;if(!tool)return;
    if(tool==='practice'){this.courseController.switchTab('practice');this.practiceController.render();return}
    this.returnTab=origin;this.courseController.switchTab(tool);
  }
}
