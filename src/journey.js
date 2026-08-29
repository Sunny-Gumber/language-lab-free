import{availableStages,findItem,getCourse,stageForUnit}from'./data.js';
import{learningEvents,mastery,recordPractice,reviewsDue,unitMastery,weakestTarget}from'./learning.js';
import{getPosition,setPosition,subscribe}from'./store.js';
import{speak}from'./audio.js';
import{escapeHtml,shuffle,similarity}from'./utils.js';

const $=id=>document.getElementById(id);
const ASSESSED_SKILLS=new Set(['listening','speaking','recognition','recall']);

function ensureStyles(){
  if(document.querySelector('link[data-journey-v13]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='./journey-v13.css';link.dataset.journeyV13='true';document.head.append(link);
}
function languageOf(event){return event.languageCode||event.language_code}
function targetOf(event){return event.targetId||event.target_id}
function meaningFor(item){return item?.example?.meaning||item?.guide||item?.pron||'Learn and use this form.'}
function phraseFor(item){return item?.example?.native||item?.native||''}
function romanFor(item){return item?.example?.roman||item?.roman||''}
function scoreLabel(value){if(value>=80)return'Strong';if(value>=55)return'Building';if(value>0)return'Started';return'New'}

export class JourneyController{
  constructor(courseController,practiceController){
    this.courseController=courseController;
    this.practiceController=practiceController;
    this.course=getCourse('ja');
    this.lesson=null;
    this.returnTab='journey';
    this.recognizer=null;
    ensureStyles();
    this.installNavigation();
    this.installPanels();
    this.bind();
    subscribe((_,reason)=>{if(reason==='event'&&this.isVisible()&&!this.lesson)this.render()});
  }

  installNavigation(){
    const tabs=document.querySelector('#courseScreen .tabs');if(!tabs)return;
    tabs.classList.add('v13-tabs');
    tabs.innerHTML=`
      <button class="tab active" data-tab="journey" type="button">🧭 Journey</button>
      <button class="tab" data-tab="practice" type="button">👂 Practice</button>
      <button class="tab" data-tab="review" type="button">🧠 Review</button>
      <button class="tab" data-tab="explore" type="button">🧰 Explore</button>
      <button class="tab" data-tab="progress" type="button">📈 Progress</button>`;
    document.getElementById('stageNav')?.classList.add('v13-stage-nav-hidden');
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
    document.querySelector('#courseScreen .tabs')?.addEventListener('click',event=>{
      const tab=event.target.closest('[data-tab]')?.dataset.tab;
      if(['journey','review','explore'].includes(tab))requestAnimationFrame(()=>this.render(tab));
    });
    $('journeyTab')?.addEventListener('click',event=>this.handleJourneyClick(event));
    $('reviewTab')?.addEventListener('click',event=>this.handleHubClick(event,'review'));
    $('exploreTab')?.addEventListener('click',event=>this.handleHubClick(event,'explore'));
    document.querySelector('#courseScreen')?.addEventListener('click',event=>{
      const back=event.target.closest('[data-v13-back]');if(!back)return;
      this.courseController.switchTab(this.returnTab||'journey');this.render(this.returnTab||'journey');
    });
  }

  isVisible(){return $('courseScreen')?.classList.contains('active')&&$('journeyTab')?.classList.contains('active')}

  open(languageCode,unitIndex=null){
    this.course=getCourse(languageCode);
    const path=this.path();
    const requested=unitIndex==null?getPosition(this.course.id).unitIndex:Number(unitIndex)||0;
    const safe=path[requested]?.unlocked?requested:this.recommendedIndex(path);
    this.lesson=null;
    setPosition(this.course.id,safe,0);
    this.render('journey');
  }

  syncCourse(){const active=this.courseController?.course;if(active?.id&&active.id!==this.course.id)this.course=active}

  unitMetric(unit){
    const ids=new Set((unit.items||[]).map(item=>item.id));
    const events=learningEvents(this.course.id).filter(event=>ids.has(targetOf(event)));
    const attempted=new Set(events.map(targetOf));
    const coverage=unit.items.length?Math.round(attempted.size/unit.items.length*100):0;
    const activeEvidence=events.filter(event=>ASSESSED_SKILLS.has(event.skill)).length;
    const activeMastery=unitMastery(this.course.id,unit);
    const readiness=Math.round(coverage*.60+activeMastery*.40);
    const complete=coverage>=80&&readiness>=60;
    const allowNext=coverage>=60&&readiness>=45;
    return{coverage,activeMastery,readiness,complete,allowNext,activeEvidence};
  }

  path(){
    this.syncCourse();let priorReady=true;
    return this.course.units.map((unit,index)=>{
      const metric=this.unitMetric(unit),unlocked=index===0||priorReady;
      if(unlocked)priorReady=metric.allowNext;
      else priorReady=false;
      return{unit,index,metric,unlocked};
    });
  }

  recommendedIndex(path=this.path()){
    const first=path.find(entry=>entry.unlocked&&!entry.metric.complete);
    if(first)return first.index;
    const unlocked=path.filter(entry=>entry.unlocked);return unlocked.at(-1)?.index||0;
  }

  courseProgress(path=this.path()){
    if(!path.length)return 0;
    const sum=path.reduce((total,entry)=>total+entry.metric.readiness,0);return Math.round(sum/path.length);
  }

  render(targetTab=null){
    this.syncCourse();
    const active=targetTab||document.querySelector('#courseScreen .tab.active')?.dataset.tab;
    if(active==='review')this.renderReview();
    else if(active==='explore')this.renderExplore();
    else if(active==='journey')this.renderJourney();
    this.renderHeaderProgress();
  }

  renderHeaderProgress(){
    const head=document.querySelector('.course-head');if(!head)return;
    let summary=head.querySelector('.v13-course-progress');
    if(!summary){summary=document.createElement('div');summary.className='v13-course-progress';head.append(summary)}
    const path=this.path(),recommended=path[this.recommendedIndex(path)],progress=this.courseProgress(path);
    summary.innerHTML=`<span>${progress}% path</span><b>${recommended?.metric.complete?'Review & strengthen':`Unit ${(recommended?.index||0)+1}`}</b>`;
  }

  renderJourney(){
    if(this.lesson){this.renderLesson();return}
    const path=this.path(),recommended=path[this.recommendedIndex(path)]||path[0],progress=this.courseProgress(path),stage=stageForUnit(this.course,recommended?.index||0),languageEvents=learningEvents(this.course.id),firstTime=languageEvents.length===0;
    $('journeyTab').innerHTML=`
      <section class="journey-hero-v13">
        <div><span class="eyebrow light">${firstTime?'Your first step':'Recommended next'}</span><h2>${firstTime?`Start ${escapeHtml(this.course.name)} slowly.`:`Continue with Unit ${(recommended?.index||0)+1}.`}</h2><p>${firstTime?'You do not need to learn everything at once. Hear one item, understand it, check it, say it, then move forward.':escapeHtml(recommended?.unit.goal||'Keep building the next small piece of the course.')}</p><div class="actions"><button class="primary" data-journey-start="${recommended?.index||0}" type="button">${firstTime?'Start Unit 1':`Continue Unit ${(recommended?.index||0)+1}`}</button>${languageEvents.length?'<button class="secondary dark" data-journey-practice type="button">Practice weak skills</button>':''}</div></div>
        <div class="journey-meter"><strong>${progress}%</strong><span>course readiness</span><div class="progressbar"><span style="width:${progress}%"></span></div><small>${escapeHtml(stage?.label||'Foundation')} · gradual progression</small></div>
      </section>
      ${firstTime?`<section class="beginner-roadmap-v13"><div><span>1</span><b>Hear it</b><small>Train the sound first.</small></div><div><span>2</span><b>Understand</b><small>Connect sound to meaning.</small></div><div><span>3</span><b>Check</b><small>Actively recognize it.</small></div><div><span>4</span><b>Say it</b><small>Use it aloud early.</small></div></section>`:''}
      <section class="journey-section-v13"><div class="journey-section-head"><div><span class="eyebrow">Learning path</span><h2>One unit at a time</h2><p>Later units unlock after you practise enough of the current unit. This keeps the course gradual without blocking your supporting tools.</p></div><span class="badge">${path.filter(entry=>entry.unlocked).length}/${path.length} open</span></div>
      <div class="unit-path-v13">${path.map(entry=>this.renderUnitNode(entry,recommended?.index)).join('')}</div></section>`;
  }

  renderUnitNode(entry,recommendedIndex){
    const{unit,index,metric,unlocked}=entry,current=index===recommendedIndex,stage=stageForUnit(this.course,index);
    const state=!unlocked?'Locked':metric.complete?'Ready':metric.readiness>0?'Building':'New';
    return`<button class="unit-node-v13 ${!unlocked?'locked':''} ${current?'current':''} ${metric.complete?'complete':''}" data-journey-unit="${index}" type="button" ${unlocked?'':'disabled'}><span class="unit-line-dot">${metric.complete?'✓':unlocked?index+1:'🔒'}</span><div class="unit-node-copy"><div><span class="eyebrow">${escapeHtml(stage?.label||'Course')} · Unit ${index+1}</span><span class="unit-state-v13">${state}</span></div><h3>${escapeHtml(unit.title)}</h3><p>${escapeHtml(unit.goal||'Build the next language skill.')}</p><div class="unit-metrics-v13"><span>${metric.coverage}% practised</span><span>${metric.activeMastery}% mastery</span><span>${metric.readiness}% ready</span></div><div class="progressbar"><span style="width:${metric.readiness}%"></span></div>${!unlocked?'<small>Complete more of the previous unit to unlock.</small>':current?'<small>Recommended next step</small>':''}</div></button>`;
  }

  handleJourneyClick(event){
    const start=event.target.closest('[data-journey-start],[data-journey-unit]');
    if(start){const index=Number(start.dataset.journeyStart??start.dataset.journeyUnit)||0;this.startLesson(index);return}
    if(event.target.closest('[data-journey-practice]')){this.courseController.switchTab('practice');this.practiceController.render();return}
    const action=event.target.closest('[data-lesson-action]')?.dataset.lessonAction;if(!action)return;
    if(action==='play'){speak(phraseFor(this.lessonItem()),this.course,{rate:.78});return}
    if(action==='slow'){speak(phraseFor(this.lessonItem()),this.course,{rate:.58});return}
    if(action==='continue'){this.lesson.step=Math.min(4,this.lesson.step+1);this.renderLesson();return}
    if(action==='back-path'){this.lesson=null;this.renderJourney();return}
    if(action==='manual-speak'){this.recordManualSpeaking();return}
    if(action==='mic'){this.recognizeLesson();return}
    if(action==='next-item'){this.nextLessonItem();return}
    if(action==='next-unit'){this.startLesson(Number(event.target.closest('[data-next-unit]').dataset.nextUnit)||0);return}
    const answer=event.target.closest('[data-lesson-answer]');if(answer)this.answerLessonCheck(answer);
  }

  startLesson(unitIndex){
    const path=this.path(),entry=path[unitIndex];if(!entry?.unlocked)return;
    const attempted=new Set(learningEvents(this.course.id).map(targetOf));
    const firstNew=entry.unit.items.findIndex(item=>!attempted.has(item.id));
    this.lesson={unitIndex,itemIndex:firstNew>=0?firstNew:0,step:0,answered:false,answerCorrect:null,speakingDone:false};
    setPosition(this.course.id,unitIndex,this.lesson.itemIndex);this.renderLesson();
  }

  lessonItem(){return this.course.units[this.lesson.unitIndex]?.items[this.lesson.itemIndex]}

  checkOptions(item){
    const unit=this.course.units[this.lesson.unitIndex],correct=meaningFor(item),others=unit.items.filter(candidate=>candidate.id!==item.id).map(meaningFor);
    if(others.length<2)others.push(...this.course.vocab.map(word=>word.meaning).filter(value=>value&&value!==correct));
    return shuffle([correct,...[...new Set(others)].slice(0,3)]);
  }

  renderLesson(){
    const item=this.lessonItem();if(!item){this.lesson=null;this.renderJourney();return}
    const unit=this.course.units[this.lesson.unitIndex],step=this.lesson.step,phrase=phraseFor(item),roman=romanFor(item),meaning=meaningFor(item),metric=this.unitMetric(unit),stepNames=['Listen','Understand','Check','Speak','Complete'];
    let body='';
    if(step===0)body=`<div class="guided-focus-v13 audio-only"><span class="lesson-big-icon">👂</span><h2>Listen before you read.</h2><p>Play it once or twice. Do not worry about remembering it yet.</p><div class="actions"><button class="primary" data-lesson-action="play" type="button">🔊 Hear it</button><button class="secondary" data-lesson-action="slow" type="button">🐢 Slower</button></div></div><button class="primary full" data-lesson-action="continue" type="button">I listened →</button>`;
    if(step===1)body=`<div class="guided-focus-v13"><span class="eyebrow">Now connect sound to meaning</span><div class="guided-native-v13" dir="${this.course.rtl?'rtl':'ltr'}">${escapeHtml(phrase)}</div>${roman?`<b class="guided-roman-v13">${escapeHtml(roman)}</b>`:''}<p class="guided-meaning-v13">${escapeHtml(meaning)}</p>${item.guide?`<div class="guided-tip-v13"><b>Notice</b><span>${escapeHtml(item.guide)}</span></div>`:''}<button class="secondary" data-lesson-action="play" type="button">🔊 Hear with text</button></div><button class="primary full" data-lesson-action="continue" type="button">Check my understanding →</button>`;
    if(step===2){const options=this.checkOptions(item);body=`<div class="guided-focus-v13"><span class="eyebrow">Listen and choose the meaning</span><button class="guided-play-round" data-lesson-action="play" type="button">🔊</button><p class="muted">Use the sound, not just the spelling.</p></div><div class="guided-options-v13">${options.map(option=>`<button data-lesson-answer="${escapeHtml(option)}" type="button">${escapeHtml(option)}</button>`).join('')}</div><div id="guidedFeedback" class="practice-feedback">Choose one answer.</div>${this.lesson.answered?'<button class="primary full" data-lesson-action="continue" type="button">Now say it →</button>':''}`}
    if(step===3)body=`<div class="guided-focus-v13"><span class="eyebrow">Use it aloud</span><div class="guided-native-v13" dir="${this.course.rtl?'rtl':'ltr'}">${escapeHtml(phrase)}</div>${roman?`<b class="guided-roman-v13">${escapeHtml(roman)}</b>`:''}<p>${escapeHtml(meaning)}</p><div class="actions"><button class="secondary" data-lesson-action="play" type="button">🔊 Hear again</button><button class="primary" data-lesson-action="mic" type="button">🎙 Check with microphone</button></div><button class="ghost" data-lesson-action="manual-speak" type="button">I practised it aloud without microphone</button><div id="guidedFeedback" class="practice-feedback">Speak after the model. Browser scoring is transcript matching, not accent or phoneme scoring.</div></div>${this.lesson.speakingDone?'<button class="primary full" data-lesson-action="continue" type="button">Finish this item →</button>':''}`;
    if(step===4){const nextIndex=this.lesson.itemIndex+1,nextExists=nextIndex<unit.items.length,path=this.path(),nextUnit=path[this.lesson.unitIndex+1];body=`<div class="guided-complete-v13"><span class="complete-icon-v13">✓</span><span class="eyebrow">Item practised</span><h2>Good. Keep it small and repeatable.</h2><p>You have heard, understood, checked and used this item. Repetition later will strengthen it.</p><div class="guided-result-v13"><div><small>Unit coverage</small><strong>${metric.coverage}%</strong></div><div><small>Unit mastery</small><strong>${metric.activeMastery}%</strong></div><div><small>Readiness</small><strong>${metric.readiness}%</strong></div></div><div class="actions">${nextExists?'<button class="primary" data-lesson-action="next-item" type="button">Next item →</button>':nextUnit?.unlocked?`<button class="primary" data-lesson-action="next-unit" data-next-unit="${this.lesson.unitIndex+1}" type="button">Start Unit ${this.lesson.unitIndex+2} →</button>`:''}<button class="secondary" data-lesson-action="back-path" type="button">Back to path</button></div></div>`}
    $('journeyTab').innerHTML=`<section class="guided-lesson-v13"><div class="guided-top-v13"><button class="secondary small" data-lesson-action="back-path" type="button">← Path</button><div><span class="eyebrow">Unit ${this.lesson.unitIndex+1} · Item ${this.lesson.itemIndex+1}/${unit.items.length}</span><h3>${escapeHtml(unit.title)}</h3></div><span class="badge">${step+1}/5</span></div><div class="guided-stepper-v13">${stepNames.map((name,index)=>`<span class="${index<step?'done':index===step?'active':''}">${index<step?'✓':index+1}<small>${name}</small></span>`).join('')}</div>${body}</section>`;
  }

  answerLessonCheck(button){
    if(this.lesson.answered)return;
    const item=this.lessonItem(),correctAnswer=meaningFor(item),correct=button.dataset.lessonAnswer===correctAnswer;
    this.lesson.answered=true;this.lesson.answerCorrect=correct;
    $('journeyTab').querySelectorAll('[data-lesson-answer]').forEach(option=>{option.disabled=true;if(option.dataset.lessonAnswer===correctAnswer)option.classList.add('correct')});if(!correct)button.classList.add('wrong');
    recordPractice({languageCode:this.course.id,targetId:item.id,skill:'listening',score:correct?100:25,xp:correct?6:1,metadata:{mode:'guided-journey'}});
    recordPractice({languageCode:this.course.id,targetId:item.id,skill:'recognition',score:correct?85:25,xp:0,metadata:{mode:'guided-journey'}});
    this.renderLesson();
    const feedback=$('guidedFeedback');if(feedback)feedback.innerHTML=correct?`✅ Correct — <b>${escapeHtml(phraseFor(item))}</b> means ${escapeHtml(correctAnswer)}.`:`Not yet. The answer is <b>${escapeHtml(correctAnswer)}</b>. Listen once more before moving on.`;
  }

  recordManualSpeaking(){
    if(this.lesson.speakingDone)return;const item=this.lessonItem();
    recordPractice({languageCode:this.course.id,targetId:item.id,skill:'speaking',score:null,xp:1,metadata:{mode:'guided-self-practice',assessed:false}});
    this.lesson.speakingDone=true;this.renderLesson();const feedback=$('guidedFeedback');if(feedback)feedback.textContent='Speaking practice recorded as coverage. No accuracy score was assigned.';
  }

  recognizeLesson(){
    const item=this.lessonItem(),Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Recognition){const feedback=$('guidedFeedback');if(feedback)feedback.textContent='Microphone speech recognition is unavailable here. Use the practice-aloud option instead.';return}
    if(this.recognizer){try{this.recognizer.abort()}catch{}}
    const recognizer=new Recognition();this.recognizer=recognizer;recognizer.lang=this.course.locale;recognizer.interimResults=false;recognizer.maxAlternatives=5;
    const button=$('journeyTab').querySelector('[data-lesson-action="mic"]');if(button){button.disabled=true;button.textContent='🎙 Listening…'}
    recognizer.onerror=event=>{const feedback=$('guidedFeedback');if(feedback)feedback.textContent=`Speech recognition: ${event.error}`};
    recognizer.onend=()=>{if(button){button.disabled=false;button.textContent='🎙 Check with microphone'}};
    recognizer.onresult=event=>{
      const transcripts=[...event.results[0]].map(result=>result.transcript),best=Math.max(...transcripts.map(text=>similarity(text,phraseFor(item)))),score=Math.round(best*100),xp=score>=85?8:score>=60?4:1;
      recordPractice({languageCode:this.course.id,targetId:item.id,skill:'speaking',score,xp,metadata:{mode:'guided-journey',heard:event.results[0][0].transcript}});
      this.lesson.speakingDone=true;this.renderLesson();const feedback=$('guidedFeedback');if(feedback)feedback.innerHTML=`Browser heard: <b>${escapeHtml(event.results[0][0].transcript)}</b><br>Text match: <b>${score}%</b>. This is a transcript signal, not pronunciation grading.`;
    };recognizer.start();
  }

  nextLessonItem(){
    const unit=this.course.units[this.lesson.unitIndex],next=Math.min(unit.items.length-1,this.lesson.itemIndex+1);
    this.lesson={unitIndex:this.lesson.unitIndex,itemIndex:next,step:0,answered:false,answerCorrect:null,speakingDone:false};setPosition(this.course.id,this.lesson.unitIndex,next);this.renderLesson();
  }

  renderReview(){
    this.syncCourse();const position=getPosition(this.course.id),stage=stageForUnit(this.course,position.unitIndex),due=reviewsDue(this.course.id),listening=weakestTarget(this.course.id,'listening',stage?.id),recall=weakestTarget(this.course.id,'recall',stage?.id),weakMatch=listening?findItem(this.course,listening.id):null;
    $('reviewTab').innerHTML=`<section class="hub-hero-v13"><div><span class="eyebrow light">Review</span><h2>Strengthen what is starting to fade.</h2><p>Review is for material you have already met. New content stays in Journey.</p></div><div class="hub-number-v13"><strong>${due}</strong><span>reviews due</span></div></section><div class="hub-grid-v13"><button data-v13-tool="practice" class="hub-card-v13" type="button"><span>👂</span><h3>Listening review</h3><p>${listening?`Weak target: ${escapeHtml(listening.meaning||listening.native)}`:'Practise listening from your current stage.'}</p><b>Open practice →</b></button><button data-v13-tool="cards" class="hub-card-v13" type="button"><span>🧠</span><h3>Recall cards</h3><p>${recall?`Bring back: ${escapeHtml(recall.meaning||recall.native)}`:'Recall useful vocabulary without seeing the answer.'}</p><b>Review cards →</b></button><button data-v13-tool="quiz" class="hub-card-v13" type="button"><span>✓</span><h3>Quick recognition check</h3><p>Use a short quiz to see what you still recognize reliably.</p><b>Start quiz →</b></button>${weakMatch?`<button data-v13-guided-unit="${weakMatch.unitIndex}" class="hub-card-v13" type="button"><span>🧭</span><h3>Revisit a lesson</h3><p>Return to Unit ${weakMatch.unitIndex+1}: ${escapeHtml(weakMatch.unit.title)}</p><b>Open guided unit →</b></button>`:''}</div>`;
  }

  renderExplore(){
    this.syncCourse();$('exploreTab').innerHTML=`<section class="hub-hero-v13 explore"><div><span class="eyebrow light">Explore</span><h2>Useful tools when you want more context.</h2><p>These support the Journey. You do not need to complete every tool before moving forward.</p></div><span class="large-flag">${this.course.flag}</span></section><div class="hub-grid-v13"><button data-v13-tool="learn" class="hub-card-v13" type="button"><span>📖</span><h3>Full lesson notes</h3><p>Browse every item, pronunciation note, example and integrated lesson for the current unit.</p><b>Open lesson notes →</b></button><button data-v13-tool="guide" class="hub-card-v13" type="button"><span>🗺️</span><h3>Language guide</h3><p>Writing system, pronunciation focus, language facts and cultural usage.</p><b>Open guide →</b></button><button data-v13-tool="words" class="hub-card-v13" type="button"><span>🔤</span><h3>Words & phrases</h3><p>Search vocabulary, hear items, save favourites and build phrases.</p><b>Open vocabulary →</b></button><button data-v13-tool="write" class="hub-card-v13" type="button"><span>✍️</span><h3>Writing practice</h3><p>Practise letter or character forms when writing matters for this language.</p><b>Open writing pad →</b></button></div>`;
  }

  handleHubClick(event,origin){
    const guided=event.target.closest('[data-v13-guided-unit]');if(guided){this.courseController.switchTab('journey');this.startLesson(Number(guided.dataset.v13GuidedUnit)||0);return}
    const tool=event.target.closest('[data-v13-tool]')?.dataset.v13Tool;if(!tool)return;
    if(tool==='practice'){this.courseController.switchTab('practice');this.practiceController.render();return}
    this.returnTab=origin;this.courseController.switchTab(tool);
  }
}
