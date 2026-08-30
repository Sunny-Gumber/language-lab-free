import{availableStages,courses,getCourse,practiceTargets}from'./data.js';
import{clamp,daysBetween,randomId,todayLocal}from'./utils.js';
import{getEventRevision,getState,recordEvent}from'./store.js';

export const SKILLS=[
  {id:'listening',icon:'👂',label:'Listening',weight:.40,assessed:true,hint:'Understand what you hear'},
  {id:'speaking',icon:'🎙️',label:'Speaking',weight:.30,assessed:true,hint:'Produce the target aloud'},
  {id:'recognition',icon:'👁️',label:'Recognition',weight:.15,assessed:true,hint:'Recognize form and meaning'},
  {id:'recall',icon:'🧠',label:'Recall',weight:.10,assessed:true,hint:'Retrieve without seeing the answer'},
  {id:'writing',icon:'✍️',label:'Writing practice',weight:.05,assessed:false,hint:'Practice producing the written form'}
];
const SKILL_MAP=new Map(SKILLS.map(skill=>[skill.id,skill]));
const ASSESSED_WEIGHT=SKILLS.filter(skill=>skill.assessed).reduce((sum,skill)=>sum+skill.weight,0);

const occurredAt=event=>event.clientCreatedAt||event.client_created_at||event.createdAt||event.created_at||'';
const languageOf=event=>event.languageCode||event.language_code;
const targetOf=event=>event.targetId||event.target_id;
const xpOf=event=>Number(event.xpDelta??event.xp_delta??0);
const studyDateOf=event=>event.studyDate||event.study_date||'';
const scoreOf=event=>event?.score==null?null:Number.isFinite(Number(event.score))?Number(event.score):null;
const activityKey=(languageCode,activity)=>`${languageCode}\u0000${activity}`;
const attemptKey=(languageCode,targetId,skill)=>`${languageCode}\u0000${targetId}\u0000${skill||''}`;
let cachedRevision=-1,cachedIndex=null;

function eventIndex(){
  const revision=getEventRevision();
  if(cachedIndex&&cachedRevision===revision)return cachedIndex;
  const events=getState().events,cutoffs=new Map();
  for(const event of events){
    if(event.activity!=='reset')continue;
    const code=languageOf(event),time=occurredAt(event);
    if(code&&time>(cutoffs.get(code)||''))cutoffs.set(code,time);
  }
  const byActivity=new Map(),practiceByTargetSkill=new Map(),scoredByTargetSkill=new Map(),allPractice=[];
  for(const event of events){
    const code=languageOf(event);if(!code||event.activity==='reset'||occurredAt(event)<=(cutoffs.get(code)||''))continue;
    const key=activityKey(code,event.activity),activityEvents=byActivity.get(key)||[];activityEvents.push(event);byActivity.set(key,activityEvents);
    if(event.activity!=='practice')continue;
    allPractice.push(event);
    const historyKey=attemptKey(code,targetOf(event),event.skill),history=practiceByTargetSkill.get(historyKey)||[];history.push(event);practiceByTargetSkill.set(historyKey,history);
    if(scoreOf(event)!=null){const scored=scoredByTargetSkill.get(historyKey)||[];scored.push(event);scoredByTargetSkill.set(historyKey,scored)}
  }
  const byTime=(a,b)=>occurredAt(a).localeCompare(occurredAt(b));
  allPractice.sort(byTime);
  for(const list of byActivity.values())list.sort(byTime);
  for(const list of practiceByTargetSkill.values())list.sort(byTime);
  for(const list of scoredByTargetSkill.values())list.sort(byTime);
  cachedRevision=revision;
  cachedIndex={cutoffs,byActivity,practiceByTargetSkill,scoredByTargetSkill,allPractice,mastery:new Map()};
  return cachedIndex;
}
function eventsAfterReset(languageCode,activity=null){
  const index=eventIndex();
  if(activity)return index.byActivity.get(activityKey(languageCode,activity))||[];
  return getState().events.filter(event=>languageOf(event)===languageCode&&event.activity!=='reset'&&occurredAt(event)>(index.cutoffs.get(languageCode)||''));
}
export function learningEvents(languageCode=null){return languageCode?eventsAfterReset(languageCode,'practice'):eventIndex().allPractice}
function practiceAttempts(languageCode,targetId,skill){return eventIndex().practiceByTargetSkill.get(attemptKey(languageCode,targetId,skill))||[]}
function scoredAttempts(languageCode,targetId,skill){return eventIndex().scoredByTargetSkill.get(attemptKey(languageCode,targetId,skill))||[]}
function previousBestToday(languageCode,targetId,skill,date){return scoredAttempts(languageCode,targetId,skill).reduce((best,event)=>studyDateOf(event)===date?Math.max(best,scoreOf(event)||0):best,0)}
function practicedToday(languageCode,targetId,skill,date){return practiceAttempts(languageCode,targetId,skill).some(event=>studyDateOf(event)===date)}

export function recordPractice({languageCode,targetId,skill,score,xp=0,activity='practice',metadata={}}){
  const date=todayLocal(),normalizedScore=score==null?null:Math.round(clamp(score));
  let xpDelta=0;
  if(activity==='practice'){
    if(normalizedScore==null)xpDelta=practicedToday(languageCode,targetId,skill,date)?0:Math.round(clamp(xp,0,100));
    else xpDelta=normalizedScore<=previousBestToday(languageCode,targetId,skill,date)?0:Math.round(clamp(xp,0,100));
  }
  const event={id:randomId(),languageCode,targetId,activity,skill:skill||null,score:normalizedScore,xpDelta,studyDate:date,clientCreatedAt:new Date().toISOString(),metadata,synced:false};
  recordEvent(event);return event;
}
export function attempts(languageCode,targetId,skill){return scoredAttempts(languageCode,targetId,skill)}
export function mastery(languageCode,targetId,skill){
  const index=eventIndex(),key=attemptKey(languageCode,targetId,skill);
  if(index.mastery.has(key))return index.mastery.get(key);
  const recent=scoredAttempts(languageCode,targetId,skill).slice(-5);if(!recent.length){index.mastery.set(key,0);return 0}
  let weighted=0,totalWeight=0;recent.forEach((event,position)=>{const weight=position+1;weighted+=(scoreOf(event)||0)*weight;totalWeight+=weight});
  const value=Math.round(weighted/totalWeight);index.mastery.set(key,value);return value;
}
export function skillStats(languageCode,skill,stageId=null){
  const definition=SKILL_MAP.get(skill)||{assessed:true};
  const targets=practiceTargets(getCourse(languageCode),skill,stageId);if(!targets.length)return{mastery:0,coverage:0,attempted:0,total:0,practiceAverage:0,assessed:definition.assessed!==false};
  const practiced=targets.filter(target=>practiceAttempts(languageCode,target.id,skill).length>0);
  if(definition.assessed===false)return{mastery:0,coverage:Math.round(practiced.length/targets.length*100),attempted:practiced.length,total:targets.length,practiceAverage:0,assessed:false};
  const scores=targets.map(target=>mastery(languageCode,target.id,skill)),attemptedScores=practiced.map(target=>mastery(languageCode,target.id,skill));
  return{mastery:Math.round(scores.reduce((sum,value)=>sum+value,0)/scores.length),coverage:Math.round(practiced.length/targets.length*100),attempted:practiced.length,total:targets.length,practiceAverage:attemptedScores.length?Math.round(attemptedScores.reduce((sum,value)=>sum+value,0)/attemptedScores.length):0,assessed:true};
}
export function overallMastery(languageCode){
  if(!ASSESSED_WEIGHT)return 0;
  return Math.round(SKILLS.filter(skill=>skill.assessed).reduce((sum,skill)=>sum+skillStats(languageCode,skill.id).mastery*skill.weight,0)/ASSESSED_WEIGHT);
}
export function unitMastery(languageCode,unit){
  if(!unit?.items?.length)return 0;
  const weightedSkills=[['listening',.40],['speaking',.30],['recognition',.15],['recall',.10]],total=.95;
  const values=unit.items.map(item=>Math.round(weightedSkills.reduce((sum,[skill,weight])=>sum+mastery(languageCode,item.id,skill)*weight,0)/total));
  return Math.round(values.reduce((sum,value)=>sum+value,0)/values.length);
}
export function stageMastery(languageCode,stageId){const course=getCourse(languageCode),stage=availableStages(course).find(candidate=>candidate.id===stageId);if(!stage)return overallMastery(languageCode);const units=course.units.slice(stage.startUnit,stage.endUnit+1);return units.length?Math.round(units.reduce((sum,unit)=>sum+unitMastery(languageCode,unit),0)/units.length):0}

function deduplicatedXp(events){
  const best=new Map();
  for(const event of events){const key=`${studyDateOf(event)}|${languageOf(event)}|${targetOf(event)}|${event.skill||''}`;best.set(key,Math.max(best.get(key)||0,xpOf(event)))}
  return[...best.values()].reduce((sum,value)=>sum+value,0);
}
export function totalXp(languageCode=null){return deduplicatedXp(learningEvents(languageCode))}
export function dailyXp(date=todayLocal(),languageCode=null){return deduplicatedXp(learningEvents(languageCode).filter(event=>studyDateOf(event)===date))}
export function streak(){
  const dates=[...new Set(learningEvents().map(studyDateOf).filter(Boolean))].sort().reverse();if(!dates.length)return 0;const today=todayLocal();if(daysBetween(dates[0],today)>1)return 0;
  let count=1;for(let index=1;index<dates.length;index++){if(daysBetween(dates[index],dates[index-1])!==1)break;count++}return count;
}
export function startedLanguages(){return new Set(learningEvents().map(languageOf).filter(Boolean)).size}

export function reviewIntervalDays(score,attemptCount=1){if(score<70)return 1;if(score<85)return Math.min(5,2+Math.floor(attemptCount/2));if(score<95)return Math.min(12,5+attemptCount);return Math.min(30,10+attemptCount*2)}
export function targetReview(languageCode,targetId,skill){
  const definition=SKILL_MAP.get(skill)||{assessed:true},history=practiceAttempts(languageCode,targetId,skill);
  if(!history.length)return{due:false,score:0,lastDate:null,interval:0};
  const lastDate=studyDateOf(history.at(-1));
  if(definition.assessed===false){const interval=Math.min(10,3+Math.floor(history.length/3));return{due:daysBetween(lastDate,todayLocal())>=interval,score:null,lastDate,interval}}
  const score=mastery(languageCode,targetId,skill),interval=reviewIntervalDays(score,history.length);return{due:daysBetween(lastDate,todayLocal())>=interval,score,lastDate,interval};
}
export function reviewsDue(languageCode=null){let due=0;for(const course of(languageCode?[getCourse(languageCode)]:courses))for(const skill of SKILLS)for(const target of practiceTargets(course,skill.id))if(targetReview(course.id,target.id,skill.id).due)due++;return due}
export function rankedTargets(languageCode,skill,stageId=null){return practiceTargets(getCourse(languageCode),skill,stageId).map(target=>{const review=targetReview(languageCode,target.id,skill);return{...target,value:review.score??0,due:review.due,lastDate:review.lastDate}}).sort((a,b)=>Number(b.due)-Number(a.due)||a.value-b.value||String(a.lastDate||'').localeCompare(String(b.lastDate||'')))}
export function weakestTarget(languageCode,skill,stageId=null){return rankedTargets(languageCode,skill,stageId)[0]||null}
export function weakestSkill(languageCode){return SKILLS.filter(skill=>skill.assessed).map(skill=>({skill,...skillStats(languageCode,skill.id)})).sort((a,b)=>a.mastery-b.mastery||a.coverage-b.coverage)[0]}
export function dailyMission(languageCode){const occurrence={},order=['listening','speaking','listening','recall'];return order.map((skill,index)=>{const rank=occurrence[skill]||0;occurrence[skill]=rank+1;const ranked=rankedTargets(languageCode,skill);return{id:`daily-${index}-${skill}`,skill,occurrence:rank+1,target:ranked[rank]||ranked[0]||null}}).filter(task=>task.target)}
export function dailyMissionProgress(languageCode,date=todayLocal()){const events=learningEvents(languageCode).filter(event=>studyDateOf(event)===date);return Object.fromEntries(SKILLS.map(skill=>[skill.id,events.filter(event=>event.skill===skill.id).length]))}

export function favoriteIds(languageCode){const latest=new Map();for(const event of eventsAfterReset(languageCode,'favorite'))latest.set(targetOf(event),Number(event.score)>0);return new Set([...latest].filter(([,enabled])=>enabled).map(([id])=>id))}
export function setFavorite(languageCode,targetId,enabled){return recordPractice({languageCode,targetId,skill:null,score:enabled?100:0,xp:0,activity:'favorite',metadata:{enabled:Boolean(enabled)}})}
export{resetLearning}from'./store.js';
