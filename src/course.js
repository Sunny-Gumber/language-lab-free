import{availableStages,findItem,getCourse,getItem,getUnit,stageForUnit}from'./data.js';
import{syncNow}from'./cloud.js';
import{favoriteIds,learningEvents,recordPractice,SKILLS,skillStats,setFavorite,stageMastery,totalXp,unitMastery,weakestTarget}from'./learning.js';
import{getPosition,resetLearning,setPosition}from'./store.js';
import{speak}from'./audio.js';
import{escapeHtml,shuffle}from'./utils.js';
import{WritingPad}from'./writing.js';

const $=id=>document.getElementById(id);

export class CourseController{
  constructor(practice){
    this.practice=practice;
    this.course=getCourse('ja');
    this.unitIndex=0;
    this.itemIndex=0;
    this.favoriteOnly=false;
    this.cardOrder=[];
    this.cardIndex=0;
    this.quiz=[];
    this.quizIndex=0;
    this.quizAnswered=false;
    this.builderSelected=[];
    this.writingPad=new WritingPad($('drawCanvas'),$('canvasGuide'));
    this.deferredInstall=null;
    this.bind();
  }

  bind(){
    $('brandHome').addEventListener('click',()=>this.goHome());
    $('backBtn').addEventListener('click',()=>this.goHome());
    document.querySelector('.tabs').addEventListener('click',event=>{
      const tab=event.target.closest('[data-tab]');
      if(tab)this.switchTab(tab.dataset.tab);
    });
    $('stageNav').addEventListener('click',event=>{
      const button=event.target.closest('[data-stage]');
      if(!button)return;
      const stage=availableStages(this.course).find(candidate=>candidate.id===button.dataset.stage);
      if(!stage)return;
      this.unitIndex=stage.startUnit;
      this.itemIndex=0;
      this.savePosition();
      this.renderCourse();
      this.switchTab('learn');
    });
    $('unitSelect').addEventListener('change',event=>{
      this.unitIndex=Number(event.target.value)||0;
      this.itemIndex=0;
      this.savePosition();
      this.renderLearn();
    });
    $('lessonItems').addEventListener('click',event=>{
      const button=event.target.closest('[data-item-index]');
      if(!button)return;
      this.itemIndex=Number(button.dataset.itemIndex)||0;
      this.savePosition();
      this.renderLearn();
    });
    $('reviewBtn').addEventListener('click',()=>this.reviewWeakestItem());
    $('hearBtn').addEventListener('click',()=>speak(this.item.native,this.course,{rate:.82}));
    $('slowBtn').addEventListener('click',()=>speak(this.item.native,this.course,{rate:.58}));
    $('exampleBtn').addEventListener('click',()=>speak(this.item.example?.native,this.course,{rate:.76}));
    $('culturePhraseBtn').addEventListener('click',()=>speak(this.course.culturePhrase,this.course,{rate:.76}));

    $('writeSelect').addEventListener('change',event=>{
      const match=findItem(this.course,event.target.value);
      if(!match)return;
      this.unitIndex=match.unitIndex;
      this.itemIndex=match.itemIndex;
      this.savePosition();
      this.renderLearn();
      this.renderWriting();
    });
    $('guideToggle').addEventListener('change',event=>this.writingPad.setGuideVisible(event.target.checked));
    $('clearBtn').addEventListener('click',()=>{this.writingPad.clear();$('writeFeedback').textContent=''});
    $('writeDoneBtn').addEventListener('click',()=>this.recordWriting());

    $('wordSearch').addEventListener('input',()=>this.renderWords());
    $('allWordsBtn').addEventListener('click',()=>{this.favoriteOnly=false;this.renderWords()});
    $('favWordsBtn').addEventListener('click',()=>{this.favoriteOnly=true;this.renderWords()});
    $('wordGrid').addEventListener('click',event=>this.handleWordClick(event));
    $('builderTokens').addEventListener('click',event=>this.handleBuilderToken(event));
    $('builderReset').addEventListener('click',()=>this.renderBuilder());
    $('builderCheck').addEventListener('click',()=>this.checkBuilder());

    $('flashcard').addEventListener('click',()=>this.revealCard());
    $('flashcard').addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();this.revealCard()}});
    $('shuffleCardsBtn').addEventListener('click',()=>{this.cardOrder=shuffle(this.course.vocab.map((_,index)=>index));this.cardIndex=0;this.renderCard()});
    $('cardAgain').addEventListener('click',()=>this.gradeCard(false));
    $('cardGood').addEventListener('click',()=>this.gradeCard(true));

    $('quizOptions').addEventListener('click',event=>{const button=event.target.closest('[data-quiz-answer]');if(button)this.answerQuiz(button)});
    $('nextQuizBtn').addEventListener('click',()=>{this.quizIndex++;this.renderQuiz()});
    $('resetCourseBtn').addEventListener('click',()=>this.resetCourse());

    window.addEventListener('beforeinstallprompt',event=>{
      event.preventDefault();
      this.deferredInstall=event;
      $('installBtn').classList.remove('hidden');
    });
    $('installBtn').addEventListener('click',()=>this.install());
  }

  get unit(){return getUnit(this.course,this.unitIndex)}
  get item(){return getItem(this.course,this.unitIndex,this.itemIndex)}

  open(languageCode,{tab='practice',unitIndex=null,itemIndex=null}={}){
    this.course=getCourse(languageCode);
    const position=getPosition(this.course.id);
    this.unitIndex=unitIndex==null?position.unitIndex:Number(unitIndex)||0;
    this.itemIndex=itemIndex==null?position.itemIndex:Number(itemIndex)||0;
    this.unitIndex=Math.max(0,Math.min(this.unitIndex,this.course.units.length-1));
    this.itemIndex=Math.max(0,Math.min(this.itemIndex,this.unit.items.length-1));
    this.favoriteOnly=false;
    this.cardOrder=this.course.vocab.map((_,index)=>index);
    this.cardIndex=0;
    this.practice.setCourse(this.course);
    $('homeScreen').classList.remove('active');
    $('courseScreen').classList.add('active');
    this.renderCourse();
    this.switchTab(tab);
    this.savePosition();
  }

  openPractice(languageCode){this.open(languageCode,{tab:'practice'})}

  goHome(){
    $('courseScreen').classList.remove('active');
    $('homeScreen').classList.add('active');
    window.dispatchEvent(new CustomEvent('language-lab-home-requested'));
  }

  savePosition(){setPosition(this.course.id,this.unitIndex,this.itemIndex)}

  switchTab(name){
    document.querySelectorAll('.tab').forEach(tab=>tab.classList.toggle('active',tab.dataset.tab===name));
    document.querySelectorAll('#courseScreen>.panel').forEach(panel=>panel.classList.toggle('active',panel.id===`${name}Tab`));
    if(name==='practice')this.practice.render();
    if(name==='write'){this.renderWriting();requestAnimationFrame(()=>this.writingPad.resize())}
    if(name==='words')this.renderWords();
    if(name==='cards')this.renderCard();
    if(name==='quiz')this.buildQuiz();
    if(name==='progress')this.renderProgress();
  }

  renderCourse(){
    $('courseFlag').textContent=this.course.flag;
    $('courseName').textContent=this.course.name;
    $('courseLevel').textContent=this.course.level;
    this.renderStages();
    this.renderLearn();
    this.renderGuide();
    this.renderWriting();
    this.renderWords();
    this.renderCard();
    this.renderProgress();
    this.practice.setCourse(this.course);
  }

  renderStages(){
    const stages=availableStages(this.course);
    const current=stageForUnit(this.course,this.unitIndex);
    $('stageNav').innerHTML=stages.map(stage=>`<button class="stage-button ${stage.id===current.id?'active':''}" data-stage="${stage.id}" type="button"><b>${escapeHtml(stage.label)}</b><small>${escapeHtml(stage.description||'')}</small><span>${stageMastery(this.course.id,stage.id)}%</span></button>`).join('');
  }

  renderLearn(){
    const unit=this.unit;
    const item=this.item;
    $('unitIndexText').textContent=this.unitIndex+1;
    $('unitTitle').textContent=unit.title;
    $('unitGoal').textContent=unit.goal||'';
    $('unitMastery').textContent=`${unitMastery(this.course.id,unit)}%`;
    $('unitSelect').innerHTML=this.course.units.map((candidate,index)=>`<option value="${index}">Unit ${index+1}: ${escapeHtml(candidate.title)}</option>`).join('');
    $('unitSelect').value=String(this.unitIndex);
    $('lessonItems').innerHTML=unit.items.map((candidate,index)=>`<button class="item-btn ${index===this.itemIndex?'active':''}" data-item-index="${index}" type="button"><span class="native-sm">${escapeHtml(candidate.native)}</span><small>${escapeHtml(candidate.roman||'')}</small></button>`).join('');
    $('focusNative').textContent=item.native;
    $('focusNative').dir=this.course.rtl?'rtl':'ltr';
    $('focusRoman').textContent=item.roman||'';
    $('focusPron').textContent=item.pron||'';
    $('focusGuide').textContent=item.guide||'';
    $('exampleNative').textContent=item.example?.native||'';
    $('exampleRoman').textContent=item.example?.roman||'';
    $('exampleMeaning').textContent=item.example?.meaning||'';
    this.renderDeepLesson();
    this.renderStages();
  }

  reviewWeakestItem(){
    const stageId=stageForUnit(this.course,this.unitIndex)?.id;
    const target=weakestTarget(this.course.id,'listening',stageId)||weakestTarget(this.course.id,'writing',stageId);
    const match=target?findItem(this.course,target.id):null;
    if(!match)return;
    this.unitIndex=match.unitIndex;
    this.itemIndex=match.itemIndex;
    this.savePosition();
    this.renderLearn();
  }

  renderDeepLesson(){
    const pack=this.unit.v9;
    const root=$('deepLesson');
    if(!pack){root.innerHTML='';root.hidden=true;return}
    root.hidden=false;
    const stage=stageForUnit(this.course,this.unitIndex);
    const isStageEnd=this.unitIndex===stage.endUnit;
    const checkpoint=isStageEnd?this.course.stageCheckpoints?.[this.unit.stage]:null;
    root.innerHTML=`<div class="deep-head"><div><span class="eyebrow">Integrated lesson</span><h2>Use this unit in context</h2></div><span class="badge">${escapeHtml(stage.label)}</span></div><div class="deep-grid">
      <article class="card"><span class="eyebrow">Objectives</span><ul class="bullet-list">${(pack.objectives||[]).map(value=>`<li>${escapeHtml(value)}</li>`).join('')}</ul>${pack.note?`<p class="tiny muted">${escapeHtml(pack.note)}</p>`:''}</article>
      <article class="card"><span class="eyebrow">Dialogue</span><div class="dialogue">${(pack.dialogue||[]).map(line=>`<div class="dialogue-line"><b>${escapeHtml(line[0])}</b><div><strong>${escapeHtml(line[1])}</strong><small>${escapeHtml(line[2])}</small></div></div>`).join('')}</div><button class="secondary small" data-deep-action="dialogue" type="button">🔊 Hear dialogue</button></article>
      <article class="card"><span class="eyebrow">Reading</span><p class="reading-native">${escapeHtml(pack.reading?.native||'')}</p><small class="muted">${escapeHtml(pack.reading?.roman||'')}</small><p>${escapeHtml(pack.reading?.meaning||'')}</p><button class="secondary small" data-deep-action="reading" type="button">🔊 Hear reading</button></article>
      <article class="card"><span class="eyebrow">${this.course.id==='ja'?'Kanji':'Hanzi'} focus</span><div class="character-grid">${(pack.characterFocus||[]).map(character=>`<div><strong>${escapeHtml(character.char)}</strong><b>${escapeHtml(character.reading)}</b><small>${escapeHtml(character.meaning)}</small></div>`).join('')}</div><p class="task"><b>Production:</b> ${escapeHtml(pack.production||'')}</p></article>
      ${checkpoint?`<article class="card checkpoint"><span class="eyebrow">Stage checkpoint</span><h3>${escapeHtml(checkpoint.title)}</h3><div class="can-do">${checkpoint.canDo.map(value=>`<span>✓ ${escapeHtml(value)}</span>`).join('')}</div><p class="task">${escapeHtml(checkpoint.task)}</p></article>`:''}
    </div>`;
    root.querySelector('[data-deep-action="dialogue"]')?.addEventListener('click',()=>speak(pack.dialogue.map(line=>line[1]).join('。'),this.course,{rate:.76}));
    root.querySelector('[data-deep-action="reading"]')?.addEventListener('click',()=>speak(pack.reading.native,this.course,{rate:.72}));
  }

  renderGuide(){
    $('aboutName').textContent=this.course.name;
    $('aboutText').textContent=this.course.about||'';
    $('scriptName').textContent=this.course.scriptName||'';
    $('scriptText').textContent=this.course.scriptText||'';
    $('scriptSamples').innerHTML=(this.course.samples||[]).map(sample=>`<span dir="${this.course.rtl?'rtl':'ltr'}">${escapeHtml(sample)}</span>`).join('');
    $('factsList').innerHTML=(this.course.facts||[]).map(([title,text])=>`<div class="fact"><b>${escapeHtml(title)}</b><span>${escapeHtml(text)}</span></div>`).join('');
    $('pronTips').innerHTML=(this.course.pronTips||[]).map(tip=>`<li>${escapeHtml(tip)}</li>`).join('');
    $('cultureTip').textContent=this.course.culture||'';
  }

  renderWriting(){
    const all=this.course.units.flatMap(unit=>unit.items);
    $('writeTitle').textContent=this.course.scriptType==='script'?'Script writing practice':'Letter & spelling practice';
    $('writeSelect').innerHTML=all.map(item=>`<option value="${item.id}">${escapeHtml(item.native)} — ${escapeHtml(item.roman||'')}</option>`).join('');
    $('writeSelect').value=this.item.id;
    $('writeNative').textContent=this.item.native;
    $('stepList').innerHTML=(this.item.steps||[]).map(step=>`<li>${escapeHtml(step)}</li>`).join('');
    this.writingPad.setTarget(this.item.native,{rtl:this.course.rtl});
    this.writingPad.setGuideVisible($('guideToggle').checked);
    $('writeFeedback').textContent='';
  }

  recordWriting(){
    if(!this.writingPad.hasPractice()){$('writeFeedback').textContent='Practice the full form first.';return}
    recordPractice({languageCode:this.course.id,targetId:this.item.id,skill:'writing',score:null,xp:2,metadata:{measurement:'practice-effort',assessed:false}});
    $('writeFeedback').textContent='Practice recorded as effort/coverage. Handwriting accuracy is not scored.';
    this.writingPad.clear();
  }

  renderWords(){
    const query=$('wordSearch').value.trim().toLocaleLowerCase();
    const favorites=favoriteIds(this.course.id);
    let words=this.course.vocab.filter(word=>`${word.native} ${word.roman} ${word.meaning}`.toLocaleLowerCase().includes(query));
    if(this.favoriteOnly)words=words.filter(word=>favorites.has(word.id));
    $('allWordsBtn').classList.toggle('active',!this.favoriteOnly);
    $('favWordsBtn').classList.toggle('active',this.favoriteOnly);
    $('wordGrid').innerHTML=words.map(word=>`<article class="card word-card"><button class="star" data-word-action="favorite" data-word-id="${word.id}" type="button" aria-label="Favorite">${favorites.has(word.id)?'★':'☆'}</button><button class="listen-word" data-word-action="listen" data-word-id="${word.id}" type="button"><div class="native-lg" dir="${this.course.rtl?'rtl':'ltr'}">${escapeHtml(word.native)}</div><b>${escapeHtml(word.roman)}</b><p class="muted">${escapeHtml(word.meaning)}</p></button></article>`).join('')||'<p class="muted">No matching words.</p>';
    this.renderBuilder();
  }

  handleWordClick(event){
    const button=event.target.closest('[data-word-action]');
    if(!button)return;
    const word=this.course.vocab.find(candidate=>candidate.id===button.dataset.wordId);
    if(!word)return;
    if(button.dataset.wordAction==='listen'){speak(word.native,this.course,{rate:.78});return}
    const favorites=favoriteIds(this.course.id);
    setFavorite(this.course.id,word.id,!favorites.has(word.id));
    this.renderWords();
  }

  renderBuilder(){
    const multi=this.course.vocab.filter(word=>String(word.roman||word.native).trim().split(/\s+/).length>1);
    const word=multi[0]||this.course.vocab[Math.min(1,this.course.vocab.length-1)];
    this.builderWord=word;
    this.builderTarget=String(word?.roman||word?.native||'').trim().split(/\s+/).filter(Boolean);
    this.builderSelected=[];
    $('builderMeaning').textContent=word?.meaning||'';
    $('builderAnswer').textContent='';
    const distractors=this.course.vocab.slice(0,5).flatMap(candidate=>String(candidate.roman||candidate.native).split(/\s+/)).filter(token=>!this.builderTarget.includes(token)).slice(0,3);
    const tokens=shuffle([...this.builderTarget,...distractors]);
    $('builderTokens').innerHTML=tokens.map((token,index)=>`<button class="token" data-builder-token="${index}" data-token="${encodeURIComponent(token)}" type="button">${escapeHtml(token)}</button>`).join('');
    $('builderFeedback').textContent='';
  }

  handleBuilderToken(event){
    const button=event.target.closest('[data-builder-token]');
    if(!button||button.disabled)return;
    button.disabled=true;
    this.builderSelected.push(decodeURIComponent(button.dataset.token));
    $('builderAnswer').textContent=this.builderSelected.join(' ');
  }

  checkBuilder(){
    const correct=this.builderSelected.join(' ')===this.builderTarget.join(' ');
    $('builderFeedback').textContent=correct?'Correct.':'Not yet — reset and try again.';
    if(correct&&this.builderWord)recordPractice({languageCode:this.course.id,targetId:this.builderWord.id,skill:'recall',score:90,xp:4,metadata:{mode:'phrase-builder'}});
  }

  renderCard(){
    if(!this.course.vocab.length)return;
    if(!this.cardOrder.length)this.cardOrder=this.course.vocab.map((_,index)=>index);
    const word=this.course.vocab[this.cardOrder[this.cardIndex%this.cardOrder.length]];
    $('cardFront').textContent=word.native;
    $('cardFront').dir=this.course.rtl?'rtl':'ltr';
    $('cardRoman').textContent=word.roman;
    $('cardMeaning').textContent=word.meaning;
    $('cardBack').classList.add('hidden');
  }

  revealCard(){
    $('cardBack').classList.remove('hidden');
    const word=this.course.vocab[this.cardOrder[this.cardIndex%this.cardOrder.length]];
    if(word)speak(word.native,this.course,{rate:.78});
  }

  gradeCard(good){
    const word=this.course.vocab[this.cardOrder[this.cardIndex%this.cardOrder.length]];
    if(word)recordPractice({languageCode:this.course.id,targetId:word.id,skill:'recall',score:good?90:30,xp:good?4:1,metadata:{mode:'flashcard'}});
    this.cardIndex=(this.cardIndex+1)%this.cardOrder.length;
    this.renderCard();
  }

  buildQuiz(){
    this.quiz=shuffle(this.course.vocab).slice(0,Math.min(10,this.course.vocab.length));
    this.quizIndex=0;
    this.renderQuiz();
  }

  renderQuiz(){
    if(this.quizIndex>=this.quiz.length){
      $('quizQuestion').textContent='Quiz complete';
      $('quizPrompt').textContent='✓';
      $('quizCount').textContent=`${this.quiz.length} / ${this.quiz.length}`;
      $('quizOptions').innerHTML='';
      $('quizFeedback').textContent='Your active attempts are saved.';
      $('nextQuizBtn').classList.add('hidden');
      return;
    }
    this.quizAnswered=false;
    const question=this.quiz[this.quizIndex];
    const alternatives=shuffle(this.course.vocab.filter(word=>word.id!==question.id)).slice(0,3);
    const options=shuffle([question,...alternatives]);
    $('quizQuestion').textContent='Choose the correct meaning.';
    $('quizCount').textContent=`${this.quizIndex+1} / ${this.quiz.length}`;
    $('quizPrompt').textContent=question.native;
    $('quizPrompt').dir=this.course.rtl?'rtl':'ltr';
    $('quizOptions').innerHTML=options.map(word=>`<button class="quiz-option" data-quiz-answer="${word.id}" type="button">${escapeHtml(word.meaning)}</button>`).join('');
    $('quizFeedback').textContent='';
    $('nextQuizBtn').classList.add('hidden');
  }

  answerQuiz(button){
    if(this.quizAnswered)return;
    this.quizAnswered=true;
    const question=this.quiz[this.quizIndex];
    const correct=button.dataset.quizAnswer===question.id;
    $('quizOptions').querySelectorAll('[data-quiz-answer]').forEach(option=>{
      option.disabled=true;
      if(option.dataset.quizAnswer===question.id)option.classList.add('correct');
    });
    if(!correct)button.classList.add('wrong');
    recordPractice({languageCode:this.course.id,targetId:question.id,skill:'recognition',score:correct?100:20,xp:correct?8:1,metadata:{mode:'quiz',correct}});
    $('quizFeedback').textContent=correct?'Correct!':`Correct answer: ${question.meaning}`;
    speak(question.native,this.course,{rate:.76});
    $('nextQuizBtn').classList.remove('hidden');
  }

  renderProgress(){
    const events=learningEvents(this.course.id);
    const quizEvents=events.filter(event=>event.metadata?.mode==='quiz'&&event.skill==='recognition');
    const quizCorrect=quizEvents.filter(event=>event.metadata?.correct===true).length;
    $('langXp').textContent=totalXp(this.course.id);
    $('attemptsStat').textContent=events.length;
    $('quizStat').textContent=quizEvents.length?`${Math.round(quizCorrect/quizEvents.length*100)}%`:'0%';
    $('favStat').textContent=favoriteIds(this.course.id).size;
    const skillHtml=SKILLS.map(skill=>{
      const stats=skillStats(this.course.id,skill.id),bar=stats.assessed?stats.mastery:stats.coverage,label=stats.assessed?`${stats.mastery}%`:'Practice';
      return`<div class="skill-card"><span>${skill.icon} ${skill.label}</span><strong>${label}</strong><div class="progressbar"><span style="width:${bar}%"></span></div><small>${stats.attempted}/${stats.total} practiced · ${stats.coverage}% coverage${stats.assessed?'':' · not accuracy-scored'}</small></div>`;
    }).join('');
    $('progressSkillGrid').innerHTML=skillHtml;
    $('masteryList').innerHTML=this.course.units.map((unit,index)=>`<button class="mastery-row" data-progress-unit="${index}" type="button"><div><b>Unit ${index+1}</b><small>${escapeHtml(unit.title)}</small></div><div class="mastery-bar"><span style="width:${unitMastery(this.course.id,unit)}%"></span></div><strong>${unitMastery(this.course.id,unit)}%</strong></button>`).join('');
    $('masteryList').querySelectorAll('[data-progress-unit]').forEach(button=>button.addEventListener('click',()=>{
      this.unitIndex=Number(button.dataset.progressUnit)||0;
      this.itemIndex=0;
      this.savePosition();
      this.renderLearn();
      this.switchTab('learn');
    }));
  }

  async resetCourse(){
    if(!confirm(`Reset all ${this.course.name} learning progress?`))return;
    resetLearning(this.course.id);
    await syncNow('reset').catch(()=>{});
    this.renderCourse();
  }

  async install(){
    if(!this.deferredInstall)return;
    this.deferredInstall.prompt();
    await this.deferredInstall.userChoice;
    this.deferredInstall=null;
    $('installBtn').classList.add('hidden');
  }
}
