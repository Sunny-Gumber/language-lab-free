import{PracticeController as BasePracticeController}from'./practice.js';
import{recordPractice}from'./learning.js';
import{escapeHtml}from'./utils.js';
import{speechMatchLabel,speechTranscriptMatch}from'./speech-match.js';

const $=id=>document.getElementById(id);

export class PracticeController extends BasePracticeController{
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
    const restoreButtons=()=>buttons.forEach(button=>{button.disabled=false;button.textContent=button.dataset.label||'🎙 Speak'});
    buttons.forEach(button=>{button.disabled=true;button.dataset.label=button.textContent;button.textContent='🎙 Listening…'});
    recognizer.onerror=event=>{$('practiceFeedback').textContent=`Speech recognition: ${event.error}`;restoreButtons()};
    recognizer.onend=restoreButtons;
    recognizer.onresult=event=>{
      const transcripts=[...event.results[0]].map(result=>result.transcript),heard=event.results[0][0].transcript;
      const match=speechTranscriptMatch(this.course,transcripts,this.target.native,{aliases:this.target.speechAliases||[]});
      const score=Math.round(match.score*100),xp=score>=85?10:score>=60?5:1,label=speechMatchLabel(match,this.target.native);
      recordPractice({languageCode:this.course.id,targetId:this.target.id,skill:'speaking',score,xp,metadata:{mode:this.mode,heard,matchedExpected:match.expected,equivalentSpelling:match.equivalent}});
      if(this.mode==='meaning'||this.mode==='conversation')recordPractice({languageCode:this.course.id,targetId:this.target.id,skill:'recall',score:Math.round(score*.8),xp:0,metadata:{mode:this.mode}});
      $('practiceFeedback').innerHTML=`Browser heard: <b>${escapeHtml(heard)}</b><br>Text match: <b>${score}%</b> · ${score>=85?'Excellent match':score>=60?'Good attempt':'Listen and retry'}${label?`<br><span class="tiny muted">${escapeHtml(label)}</span>`:''}<br><span class="tiny muted">This is transcript matching, not phoneme or Mandarin tone scoring.</span>`;
      this.renderSkills();
    };
    try{recognizer.start()}catch(error){restoreButtons();$('practiceFeedback').textContent=`Speech recognition could not start: ${error?.message||error}`}
  }
}
