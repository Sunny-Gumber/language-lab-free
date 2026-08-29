import{availableStages,conversationItems,getCourse,hasConversation,practiceTargets}from'./data.js';
import{classifyVoice,exactVoiceName,setAudioPreference,setExactVoice,speak,subscribeVoices,voicesFor}from'./audio.js';
import{recordPractice,skillStats,weakestTarget}from'./learning.js';
import{getState,updateUi}from'./store.js';
import{escapeHtml,shuffle,similarity}from'./utils.js';

const $=id=>document.getElementById(id);
const TITLES={listen:'Listen first',shadow:'Shadow the audio',meaning:'Speak from meaning',conversation:'Conversation response'};

export class PracticeController{
  constructor(){
    this.course=getCourse('ja');
    this.mode=getState().ui.practiceMode||'listen';
    this.stageId=null;
    this.target=null;
    this.recognizer=null;
    this.conversationIndex=0;
    this.bind();
    subscribeVoices(()=>this.renderVoices());
  }

  bind(){
    $('audioPreference').addEventListener('change',event=>{
      setAudioPreference(event.target.value);
      this.renderVoices();
    });
    $('exactVoice').addEventListener('change',event=>setExactVoice(this.course,event.target.value));
    $('previewVoiceBtn').addEventListener('click',()=>speak(this.course.culturePhrase||this.course.vocab[0]?.native,this.course,{rate:.76}));
    $('previewFemaleBtn').addEventListener('click',()=>this.previewGender('female'));
    $('previewMaleBtn').addEventListener('click',()=>this.previewGender('male'));
    $('practiceModes').addEventListener('click',event=>{
      const button=event.target.closest('[data-mode]');
      if(!button||button.hidden)return;
      this.mode=button.dataset.mode;
      updateUi({practiceMode:this.mode},'practice-mode');
      this.renderModes();
      this.next();
    });
    $('practiceStageList').addEventListener('click',event=>{
      const button=event.target.closest('[data-practice-stage]');
      if(!button)return;
      this.stageId=button.dataset.practiceStage;
      this.conversationIndex=0;
      if(this.mode==='conversation'&&!hasConversation(this.course,this.stageId))this.mode='listen';
      const stages={...(getState().ui.activeStage||{}),[this.course.id]:this.stageId};
      updateUi({activeStage:stages,practiceMode:this.mode},'stage');
      this.renderStages();
      this.renderModes();
      this.renderSkills();
      this.next();
    });
    $('practiceBody').addEventListener('click',event=>this.handleBodyClick(event));
  }

  setCourse(course){
    this.course=course;
    const stages=availableStages(course);
    const saved=getState().ui.activeStage?.[course.id];
    this.stageId=stages.some(stage=>stage.id===saved)?saved:stages[0]?.id||null;
    this.mode=getState().ui.practiceMode||'listen';
    if(this.mode==='conversation'&&!hasConversation(course,this.stageId))this.mode='listen';
    this.conversationIndex=0;
    this.render();
  }

  render(){
    this.renderVoices();
    this.renderStages();
    this.renderModes();
    this.renderSkills();
    this.next();
  }

  renderVoices(){
    const preference=getState().prefs.audioPreference;
    $('audioPreference').value=preference;
    const voices=voicesFor(this.course);
    const exact=exactVoiceName(this.course);
    $('exactVoice').innerHTML='<option value="">Automatic best voice</option>'+voices.map(voice=>`<option value="${escapeHtml(voice.name)}">${escapeHtml(voice.name)} · ${escapeHtml(voice.lang)}${classifyVoice(voice)!=='unknown'?` · ${classifyVoice(voice)}`:''}</option>`).join('');
    $('exactVoice').value=voices.some(voice=>voice.name===exact)?exact:'';
    const identified=voices.filter(voice=>classifyVoice(voice)!=='unknown').length;
    $('voiceInfo').textContent=voices.length?`${voices.length} matching voice${voices.length===1?'':'s'} on this device${identified?` · ${identified} have identifiable gender hints`:''}.`:'No matching installed voice is exposed yet. Your browser may still provide a default voice.';
  }

  previewGender(gender){
    const voices=voicesFor(this.course);
    const match=voices.find(voice=>classifyVoice(voice)===gender);
    if(!match){$('voiceInfo').textContent=`No clearly identifiable ${gender} ${this.course.name} voice is exposed on this device. Try the exact voice list.`;return}
    const utterance=this.course.culturePhrase||this.course.vocab[0]?.native||this.course.name;
    if(typeof speechSynthesis==='undefined')return;
    speechSynthesis.cancel();
    const speech=new SpeechSynthesisUtterance(utterance);
    speech.lang=this.course.locale;
    speech.rate=.76;
    speech.voice=match;
    speechSynthesis.speak(speech);
    $('voiceInfo').textContent=`Previewing ${match.name}.`;
  }

  renderStages(){
    const stages=availableStages(this.course);
    $('practiceStageBadge').textContent=stages.find(stage=>stage.id===this.stageId)?.label||'Course';
    $('practiceStageList').innerHTML=stages.map(stage=>`<button class="stage-chip ${stage.id===this.stageId?'active':''}" data-practice-stage="${stage.id}" type="button"><b>${escapeHtml(stage.label)}</b><small>${escapeHtml(stage.description||'')}</small></button>`).join('');
  }

  renderModes(){
    $('practiceTitle').textContent=TITLES[this.mode]||TITLES.listen;
    $('practiceModes').querySelectorAll('[data-mode]').forEach(button=>{
      const unavailable=button.dataset.mode==='conversation'&&!hasConversation(this.course,this.stageId);
      button.hidden=unavailable;
      button.disabled=unavailable;
      button.classList.toggle('active',button.dataset.mode===this.mode);
    });
  }

  renderSkills(){
    const html=['listening','speaking','recognition','recall','writing'].map(skill=>{
      const stats=skillStats(this.course.id,skill,this.stageId);
      const icons={listening:'👂',speaking:'🎙️',recognition:'👁️',recall:'🧠',writing:'✍️'};
      const bar=stats.assessed?stats.mastery:stats.coverage;
      const headline=stats.assessed?`${stats.mastery}%`:'Practice';
      return`<div class="skill-card"><span>${icons[skill]} ${skill}</span><strong>${headline}</strong><div class="progressbar"><span style="width:${bar}%"></span></div><small>${stats.attempted}/${stats.total} practiced · ${stats.coverage}% coverage${stats.assessed?'':' · not accuracy-scored'}</small></div>`;
    }).join('');
    $('skillGrid').innerHTML=html;
    $('progressSkillGrid').innerHTML=html;
  }

  next(){
    if(!$('practiceBody'))return;
    if(this.mode==='conversation'&&hasConversation(this.course,this.stageId)){this.renderConversation();return}
    if(this.mode==='shadow'){this.renderShadow();return}
    if(this.mode==='meaning'){this.renderMeaning();return}
    this.renderListen();
  }

  targetFor(skill){return weakestTarget(this.course.id,skill,this.stageId)||practiceTargets(this.course,skill,this.stageId)[0]||null}

  renderListen(){
    this.target=this.targetFor('listening');
    if(!this.target){$('practiceBody').innerHTML='<p class="muted">No listening content is available for this stage yet.</p>';return}
    const pool=practiceTargets(this.course,'listening',this.stageId).filter(target=>target.id!==this.target.id);
    const options=shuffle([this.target,...shuffle(pool).slice(0,3)]);
    $('practiceBody').innerHTML=`
      <div class="audio-prompt"><span class="practice-icon">👂</span><h3>Listen without reading</h3><button class="primary" data-practice-action="play" type="button">🔊 Play audio</button></div>
      <div class="practice-options">${options.map(option=>`<button data-listen-answer data-target="${escapeHtml(option.id)}" type="button">${escapeHtml(option.meaning)}</button>`).join('')}</div>
      <div id="practiceFeedback" class="practice-feedback">Choose the meaning you heard.</div>
      <button class="secondary" data-practice-action="next" type="button">Next listening item</button>`;
  }

  renderShadow(){
    this.target=this.targetFor('speaking');
    if(!this.target){$('practiceBody').innerHTML='<p class="muted">No speaking content is available for this stage yet.</p>';return}
    $('practiceBody').innerHTML=`
      <div class="audio-prompt"><div class="native-lg">${escapeHtml(this.target.native)}</div><b>${escapeHtml(this.target.roman)}</b><p>${escapeHtml(this.target.meaning)}</p></div>
      <div class="actions"><button class="primary" data-practice-action="play" type="button">🔊 Listen</button><button class="secondary" data-practice-action="slow" type="button">🐢 Slow</button><button class="secondary" data-practice-action="speak" type="button">🎙 Repeat it</button></div>
      <div id="practiceFeedback" class="practice-feedback">Listen once, then repeat immediately. The score is transcript similarity, not phoneme or tone accuracy.</div>
      <button class="secondary" data-practice-action="next" type="button">Next phrase</button>`;
  }

  renderMeaning(){
    this.target=this.targetFor('speaking');
    if(!this.target){$('practiceBody').innerHTML='<p class="muted">No speaking content is available for this stage yet.</p>';return}
    $('practiceBody').innerHTML=`
      <div class="audio-prompt"><span class="eyebrow">Say this in ${escapeHtml(this.course.name)}</span><h2>${escapeHtml(this.target.meaning)}</h2><p id="practiceReveal" class="blurred-answer">${escapeHtml(this.target.native)} · ${escapeHtml(this.target.roman)}</p></div>
      <div class="actions"><button class="primary" data-practice-action="speak" type="button">🎙 Speak answer</button><button class="secondary" data-practice-action="reveal" type="button">Reveal</button><button class="secondary" data-practice-action="play" type="button">🔊 Hear answer</button></div>
      <div id="practiceFeedback" class="practice-feedback">Try to produce the answer before revealing it.</div>
      <button class="secondary" data-practice-action="next" type="button">Next prompt</button>`;
  }

  renderConversation(){
    const list=conversationItems(this.course,this.stageId);
    if(!list.length){this.mode='listen';this.renderModes();this.renderListen();return}
    const item=list[this.conversationIndex%list.length];
    this.target={id:`conversation:${this.course.id}:${this.stageId}:${this.conversationIndex%list.length}`,native:item.answer,roman:item.roman,meaning:item.answerMeaning};
    $('practiceBody').innerHTML=`
      <div class="audio-prompt"><span class="eyebrow">Other speaker</span><h3>${escapeHtml(item.meaning)}</h3><button class="primary" data-practice-action="conversation-play" type="button">🔊 Hear prompt</button></div>
      <div class="actions"><button class="primary" data-practice-action="speak" type="button">🎙 Respond</button><button class="secondary" data-practice-action="reveal" type="button">Show model answer</button></div>
      <div id="practiceReveal" class="practice-feedback blurred-answer"><b>${escapeHtml(item.answer)}</b><br>${escapeHtml(item.roman)} — ${escapeHtml(item.answerMeaning)}</div>
      <div id="practiceFeedback" class="practice-feedback">One model answer is scored. Other natural responses may also be valid.</div>
      <button class="secondary" data-practice-action="conversation-next" type="button">Next conversation</button>`;
  }

  handleBodyClick(event){
    const answer=event.target.closest('[data-listen-answer]');
    if(answer){this.answerListening(answer);return}
    const action=event.target.closest('[data-practice-action]')?.dataset.practiceAction;
    if(!action)return;
    if(action==='next'){this.next();return}
    if(action==='play'){speak(this.target?.native,this.course,{rate:.8});return}
    if(action==='slow'){speak(this.target?.native,this.course,{rate:.58});return}
    if(action==='speak'){this.recognizeCurrent();return}
    if(action==='reveal'){$('practiceReveal')?.classList.remove('blurred-answer');return}
    if(action==='conversation-next'){this.conversationIndex++;this.renderConversation();return}
    if(action==='conversation-play'){
      const list=conversationItems(this.course,this.stageId),item=list[this.conversationIndex%(list.length||1)];
      if(item)speak(item.prompt,this.course,{rate:.78});
    }
  }

  answerListening(button){
    if(!this.target)return;
    const correct=button.dataset.target===this.target.id;
    $('practiceBody').querySelectorAll('[data-listen-answer]').forEach(option=>{option.disabled=true;if(option.dataset.target===this.target.id)option.classList.add('correct')});
    if(!correct)button.classList.add('wrong');
    if(correct){
      recordPractice({languageCode:this.course.id,targetId:this.target.id,skill:'listening',score:100,xp:8,metadata:{mode:'listen'}});
      recordPractice({languageCode:this.course.id,targetId:this.target.id,skill:'recognition',score:80,xp:0,metadata:{mode:'listen-support'}});
    }else recordPractice({languageCode:this.course.id,targetId:this.target.id,skill:'listening',score:25,xp:1,metadata:{mode:'listen'}});
    $('practiceFeedback').innerHTML=`${correct?'✅ Correct':'❌ Not this one'}<br><b>${escapeHtml(this.target.native)}</b> · ${escapeHtml(this.target.roman)} — ${escapeHtml(this.target.meaning)}`;
    this.renderSkills();
  }

  recognizeCurrent(){
    if(!this.target)return;
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Recognition){$('practiceFeedback').textContent='Speech recognition is unavailable in this browser. You can still listen and shadow manually.';return}
    if(this.recognizer){try{this.recognizer.abort()}catch{}}
    const recognizer=new Recognition();
    this.recognizer=recognizer;
    recognizer.lang=this.course.locale;
    recognizer.interimResults=false;
    recognizer.maxAlternatives=5;
    const buttons=$('practiceBody').querySelectorAll('[data-practice-action="speak"]');
    buttons.forEach(button=>{button.disabled=true;button.dataset.label=button.textContent;button.textContent='🎙 Listening…'});
    recognizer.onerror=event=>{$('practiceFeedback').textContent=`Speech recognition: ${event.error}`};
    recognizer.onend=()=>buttons.forEach(button=>{button.disabled=false;button.textContent=button.dataset.label||'🎙 Speak'});
    recognizer.onresult=event=>{
      const transcripts=[...event.results[0]].map(result=>result.transcript);
      const best=Math.max(...transcripts.map(text=>similarity(text,this.target.native)));
      const score=Math.round(best*100);
      const xp=score>=85?10:score>=60?5:1;
      recordPractice({languageCode:this.course.id,targetId:this.target.id,skill:'speaking',score,xp,metadata:{mode:this.mode,heard:event.results[0][0].transcript}});
      if(this.mode==='meaning'||this.mode==='conversation')recordPractice({languageCode:this.course.id,targetId:this.target.id,skill:'recall',score:Math.round(score*.8),xp:0,metadata:{mode:this.mode}});
      $('practiceFeedback').innerHTML=`Browser heard: <b>${escapeHtml(event.results[0][0].transcript)}</b><br>Text match: <b>${score}%</b> · ${score>=85?'Excellent match':score>=60?'Good attempt':'Listen and retry'}<br><span class="tiny muted">This is transcript matching, not phoneme or Mandarin tone scoring.</span>`;
      this.renderSkills();
    };
    recognizer.start();
  }
}
