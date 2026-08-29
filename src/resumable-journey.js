import{findItem,getCourse}from'./data.js';
import{learningEvents}from'./learning.js';
import{hindiPronunciationLabel}from'./pronunciation-hi.js';
import{getState,updateUi}from'./store.js';
import{buildJourneySession}from'./session.js';
import{escapeHtml}from'./utils.js';
import{JourneyController as BaseJourneyController}from'./journey.js';

const SNAPSHOT_KEYS=['step','answered','answerCorrect','selectedAnswer','options','recallAnswered','recallCorrect','recallSelected','recallOptions','speakingDone','speakingMessage','showModel','needsRetry'];
const occurredAt=event=>event.clientCreatedAt||event.client_created_at||event.createdAt||event.created_at||'';

function savedSessions(){const value=getState().ui.journeySessions;return value&&typeof value==='object'?value:{}}
function lastResetAt(languageCode){
  return learningEvents(languageCode).filter(event=>event.activity==='reset').map(occurredAt).sort().at(-1)||'';
}
function itemMeaning(item){return item?.example?.meaning||item?.guide||item?.pron||''}
function itemPhrase(item){return item?.example?.native||item?.native||''}
function itemRoman(item){return item?.example?.roman||item?.roman||''}

export class JourneyController extends BaseJourneyController{
  snapshotCore(){
    if(!this.lesson)return null;
    const current=this.currentQueueEntry(),unit=this.course.units[this.lesson.unitIndex];
    const core={
      languageCode:this.course.id,
      unitId:unit?.id||null,
      unitIndex:this.lesson.unitIndex,
      queue:this.lesson.queue.map(entry=>({targetId:entry.targetId,kind:entry.kind||'review'})),
      queueIndex:this.lesson.queueIndex,
      currentTargetId:current?.targetId||null
    };
    for(const key of SNAPSHOT_KEYS)core[key]=this.lesson[key]??null;
    return core;
  }
  persistLesson(){
    const core=this.snapshotCore();if(!core)return;
    const signature=JSON.stringify(core),sessions=savedSessions(),existing=sessions[this.course.id];
    if(existing?.signature===signature)return;
    updateUi({journeySessions:{...sessions,[this.course.id]:{...core,signature,updatedAt:new Date().toISOString()}}},'journey-session');
  }
  clearSaved(languageCode=this.course.id){
    const sessions={...savedSessions()};if(!sessions[languageCode])return;delete sessions[languageCode];updateUi({journeySessions:sessions},'journey-session-clear');
  }
  saved(languageCode=this.course.id){
    const saved=savedSessions()[languageCode];if(!saved)return null;
    const resetAt=lastResetAt(languageCode);if(resetAt&&String(resetAt)>String(saved.updatedAt||'')){this.clearSaved(languageCode);return null}
    return saved;
  }
  restore(languageCode){
    const saved=this.saved(languageCode);if(!saved)return false;
    this.course=getCourse(languageCode);
    let unitIndex=this.course.units.findIndex(unit=>unit.id===saved.unitId);if(unitIndex<0)unitIndex=Math.max(0,Math.min(Number(saved.unitIndex)||0,this.course.units.length-1));
    const queue=(saved.queue||[]).map(entry=>{const match=findItem(this.course,entry.targetId);return match?{unitIndex:match.unitIndex,itemIndex:match.itemIndex,targetId:entry.targetId,kind:entry.kind||'review'}:null}).filter(Boolean);
    if(!queue.length){this.clearSaved(languageCode);return false}
    const plan=buildJourneySession(this.course,unitIndex),defaults={step:0,answered:false,answerCorrect:null,selectedAnswer:null,options:null,recallAnswered:false,recallCorrect:null,recallSelected:null,recallOptions:null,speakingDone:false,speakingMessage:'',showModel:false,needsRetry:false};
    this.lesson={unitIndex,plan,queue,queueIndex:Math.max(0,Math.min(Number(saved.queueIndex)||0,queue.length-1)),...defaults};
    for(const key of SNAPSHOT_KEYS)if(saved[key]!==undefined&&saved[key]!==null)this.lesson[key]=saved[key];
    this.lesson.step=Math.max(0,Math.min(Number(this.lesson.step)||0,6));
    return true;
  }
  open(languageCode,{resume=true}={}){
    const sameCourse=this.course?.id===languageCode;
    this.course=getCourse(languageCode);
    if(resume){
      if(sameCourse&&this.lesson){this.render('journey');return true}
      if(this.restore(languageCode)){this.render('journey');return true}
    }
    this.lesson=null;this.render('journey');return false;
  }
  renderFadedHindiPronunciation(){
    const faded=document.querySelector('#journeyTab .scaffold-faded-v13');
    if(!faded||!['ja','zh'].includes(this.course?.id))return;
    const roman=itemRoman(this.lessonItem()),label=hindiPronunciationLabel(this.course,roman);if(!label)return;
    const existing=document.querySelector('#journeyTab [data-hindi-pronunciation-faded]');if(existing)existing.remove();
    const line=document.createElement('b');line.dataset.hindiPronunciationFaded='true';line.lang='hi';line.className='guided-hindi-v13';line.textContent=label;
    if(this.course.id==='zh')line.title='Mandarin tone guide: ¹ high/level, ² rising, ³ dipping, ⁴ falling. Audio remains the pronunciation reference.';
    faded.insertAdjacentElement('afterend',line);
  }
  renderLesson(){
    super.renderLesson();
    if(!this.lesson)return;
    this.persistLesson();
    this.renderFadedHindiPronunciation();
    const entry=this.currentQueueEntry();if(!entry||entry.unitIndex===this.lesson.unitIndex||!['review','retry'].includes(entry.kind))return;
    const source=this.course.units[entry.unitIndex],item=this.lessonItem(),top=document.querySelector('#journeyTab .guided-top-v13');if(!source||!item||!top)return;
    const note=document.createElement('div');note.className='guided-tip-v13 review-source-v13';
    const reveal=Number(this.lesson.step)>=2;
    note.innerHTML=`<b>↻ Review from Unit ${entry.unitIndex+1} · ${escapeHtml(source.title)}</b><span>${reveal?`${escapeHtml(itemPhrase(item))}${itemRoman(item)?` · ${escapeHtml(itemRoman(item))}`:''}${itemMeaning(item)?` — ${escapeHtml(itemMeaning(item))}`:''}`:'This older item is returning on purpose before today’s new material.'}</span>`;
    top.insertAdjacentElement('afterend',note);
  }
  renderJourney(){
    super.renderJourney();if(this.lesson)return;
    const saved=this.saved();if(!saved)return;
    const missionIndex=this.course.units.findIndex(unit=>unit.id===saved.unitId),unitIndex=missionIndex>=0?missionIndex:Math.max(0,Number(saved.unitIndex)||0),unit=this.course.units[unitIndex];
    const current=(saved.queue||[])[Math.max(0,Number(saved.queueIndex)||0)],match=current?findItem(this.course,current.targetId):null,actions=document.querySelector('#journeyTab .journey-hero-v13 .actions');if(!unit||!actions)return;
    const button=document.createElement('button');button.className='secondary dark';button.type='button';button.dataset.journeyResumeSaved='true';button.textContent=`Resume Unit ${unitIndex+1} session`;
    actions.prepend(button);
    const copy=document.querySelector('#journeyTab .journey-hero-v13 p');if(copy&&match)copy.innerHTML=`Paused session: <b>${escapeHtml(itemPhrase(match.item))}</b>${itemRoman(match.item)?` · ${escapeHtml(itemRoman(match.item))}`:''}. Resume this before moving to the recommended next unit.`;
  }
  handleJourneyClick(event){
    if(event.target.closest('[data-journey-resume-saved]')){if(this.restore(this.course.id))this.renderLesson();return}
    const action=event.target.closest('[data-lesson-action]')?.dataset.lessonAction;
    if(action==='back-path'&&this.lesson){
      const finished=this.lesson.step===6&&this.lesson.queueIndex+1>=this.lesson.queue.length&&!this.lesson.needsRetry;
      if(finished)this.clearSaved();else this.persistLesson();
    }
    super.handleJourneyClick(event);
  }
  nextLessonItem(){
    super.nextLessonItem();if(this.lesson)this.persistLesson();else this.clearSaved();
  }
}