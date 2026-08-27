import{getCourse,practiceTargets,availableStages}from'./data.js';
import{clamp,daysBetween,randomId,todayLocal}from'./utils.js';
import{getState,recordEvent}from'./store.js';

export const SKILLS=[
  {id:'listening',icon:'👂',label:'Listening',weight:.40,hint:'Understand what you hear'},
  {id:'speaking',icon:'🎙️',label:'Speaking',weight:.30,hint:'Produce the target aloud'},
  {id:'recognition',icon:'👁️',label:'Recognition',weight:.15,hint:'Recognize form and meaning'},
  {id:'recall',icon:'🧠',label:'Recall',weight:.10,hint:'Retrieve without seeing the answer'},
  {id:'writing',icon:'✍️',label:'Writing',weight:.05,hint:'Practice producing the written form'}
];

function occurredAt(event){return event.clientCreatedAt||event.client_created_at||event.createdAt||event.created_at||''}
function languageOf(event){return event.languageCode||event.language_code}
function targetOf(event){return event.targetId||event.target_id}
function xpOf(event){return Number(event.xpDelta??event.xp_delta??0)}
function studyDateOf(event){return event.studyDate||event.study_date||''}

export function learningEvents(languageCode=null){
  const events=getState().events.filter(event=>event.activity==='practice');
  return languageCode?events.filter(event=>languageOf(event)===languageCode):events;
}

function previousBestToday(languageCode,targetId,skill,date){
  return learningEvents(languageCode)
    .filter(event=>targetOf(event)===targetId&&event.skill===skill&&studyDateOf(event)===date)
    .reduce((best,event)=>Math.max(best,Number(event.score)||0),0);
}

export function recordPractice({languageCode,targetId,skill,score,xp=0,activity='practice',metadata={}}){
  const date=todayLocal();
  const normalizedScore=score==null?null:Math.round(clamp(score));
  const bestBefore=activity==='practice'&&skill?previousBestToday(languageCode,targetId,skill,date):0;
  const xpDelta=activity==='practice'&&normalizedScore!=null&&normalizedScore<=bestBefore?0:Math.round(clamp(xp,0,100));
  const event={
    id:randomId(),
    languageCode,
    targetId,
    activity,
    skill:skill||null,
    score:normalizedScore,
    xpDelta,
    studyDate:date,
    clientCreatedAt:new Date().toISOString(),
    metadata,
    synced:false
  };
  recordEvent(event);
  return event;
}

export function attempts(languageCode,targetId,skill){
  return learningEvents(languageCode)
    .filter(event=>targetOf(event)===targetId&&event.skill===skill&&Number.isFinite(Number(event.score)))
    .sort((a,b)=>occurredAt(a).localeCompare(occurredAt(b)));
}

export function mastery(languageCode,targetId,skill){
  const recent=attempts(languageCode,targetId,skill).slice(-5);
  if(!recent.length)return 0;
  let weighted=0,totalWeight=0;
  recent.forEach((event,index)=>{
    const weight=index+1;
    weighted+=Number(event.score)*weight;
    totalWeight+=weight;
  });
  return Math.round(weighted/totalWeight);
}

export function skillStats(languageCode,skill,stageId=null){
  const course=getCourse(languageCode);
  const targets=practiceTargets(course,skill,stageId);
  if(!targets.length)return{mastery:0,coverage:0,attempted:0,total:0,practiceAverage:0};
  const scores=targets.map(target=>mastery(languageCode,target.id,skill));
  const practiced=scores.filter(score=>score>0);
  return{
    mastery:Math.round(scores.reduce((sum,score)=>sum+score,0)/scores.length),
    coverage:Math.round(practiced.length/targets.length*100),
    attempted:practiced.length,
    total:targets.length,
    practiceAverage:practiced.length?Math.round(practiced.reduce((sum,score)=>sum+score,0)/practiced.length):0
  };
}

export function overallMastery(languageCode){
  return Math.round(SKILLS.reduce((sum,skill)=>sum+skillStats(languageCode,skill.id).mastery*skill.weight,0));
}

export function unitMastery(languageCode,unit){
  if(!unit?.items?.length)return 0;
  const values=unit.items.map(item=>{
    const listening=mastery(languageCode,item.id,'listening');
    const writing=mastery(languageCode,item.id,'writing');
    return Math.round(listening*.8+writing*.2);
  });
  return Math.round(values.reduce((sum,value)=>sum+value,0)/values.length);
}

export function stageMastery(languageCode,stageId){
  const course=getCourse(languageCode);
  const stage=availableStages(course).find(candidate=>candidate.id===stageId);
  if(!stage)return overallMastery(languageCode);
  const units=course.units.slice(stage.startUnit,stage.endUnit+1);
  if(!units.length)return 0;
  return Math.round(units.reduce((sum,unit)=>sum+unitMastery(languageCode,unit),0)/units.length);
}

export function totalXp(languageCode=null){
  return learningEvents(languageCode).reduce((sum,event)=>sum+xpOf(event),0);
}

export function dailyXp(date=todayLocal(),languageCode=null){
  return learningEvents(languageCode)
    .filter(event=>studyDateOf(event)===date)
    .reduce((sum,event)=>sum+xpOf(event),0);
}

export function streak(){
  const dates=[...new Set(learningEvents().map(studyDateOf).filter(Boolean))].sort().reverse();
  if(!dates.length)return 0;
  const today=todayLocal();
  if(daysBetween(dates[0],today)>1)return 0;
  let count=1;
  for(let index=1;index<dates.length;index++){
    if(daysBetween(dates[index],dates[index-1])!==1)break;
    count++;
  }
  return count;
}

export function startedLanguages(){
  return new Set(learningEvents().map(languageOf).filter(Boolean)).size;
}

export function reviewIntervalDays(score,attemptCount=1){
  if(score<50)return 0;
  if(score<70)return 1;
  if(score<85)return Math.min(5,2+Math.floor(attemptCount/2));
  if(score<95)return Math.min(12,5+attemptCount);
  return Math.min(30,10+attemptCount*2);
}

export function targetReview(languageCode,targetId,skill){
  const history=attempts(languageCode,targetId,skill);
  if(!history.length)return{due:false,score:0,lastDate:null,interval:0};
  const score=mastery(languageCode,targetId,skill);
  const last=history[history.length-1];
  const lastDate=studyDateOf(last);
  const interval=reviewIntervalDays(score,history.length);
  return{due:daysBetween(lastDate,todayLocal())>=interval,score,lastDate,interval};
}

export function reviewsDue(languageCode=null){
  const languages=languageCode?[getCourse(languageCode)]:globalThis.LANGUAGE_LAB_COURSES;
  let due=0;
  for(const course of languages){
    for(const skill of SKILLS){
      for(const target of practiceTargets(course,skill.id)){
        if(targetReview(course.id,target.id,skill.id).due)due++;
      }
    }
  }
  return due;
}

export function rankedTargets(languageCode,skill,stageId=null){
  const course=getCourse(languageCode);
  return practiceTargets(course,skill,stageId)
    .map(target=>{
      const review=targetReview(languageCode,target.id,skill);
      return{...target,value:review.score,due:review.due,lastDate:review.lastDate};
    })
    .sort((a,b)=>Number(b.due)-Number(a.due)||a.value-b.value||String(a.lastDate||'').localeCompare(String(b.lastDate||'')));
}

export function weakestTarget(languageCode,skill,stageId=null){return rankedTargets(languageCode,skill,stageId)[0]||null}

export function weakestSkill(languageCode){
  return SKILLS.map(skill=>({skill,...skillStats(languageCode,skill.id)}))
    .sort((a,b)=>a.mastery-b.mastery||a.coverage-b.coverage)[0];
}

export function dailyMission(languageCode){
  const occurrence={};
  const order=['listening','speaking','listening','recall'];
  return order.map((skill,index)=>{
    const rank=occurrence[skill]||0;
    occurrence[skill]=rank+1;
    return{
      id:`daily-${index}-${skill}`,
      skill,
      occurrence:rank+1,
      target:rankedTargets(languageCode,skill)[rank]||rankedTargets(languageCode,skill)[0]||null
    };
  }).filter(task=>task.target);
}

export function dailyMissionProgress(languageCode,date=todayLocal()){
  const events=learningEvents(languageCode).filter(event=>studyDateOf(event)===date);
  return{
    listening:events.filter(event=>event.skill==='listening').length,
    speaking:events.filter(event=>event.skill==='speaking').length,
    recognition:events.filter(event=>event.skill==='recognition').length,
    recall:events.filter(event=>event.skill==='recall').length,
    writing:events.filter(event=>event.skill==='writing').length
  };
}

export function favoriteIds(languageCode){
  const latest=new Map();
  getState().events
    .filter(event=>event.activity==='favorite'&&languageOf(event)===languageCode)
    .sort((a,b)=>occurredAt(a).localeCompare(occurredAt(b)))
    .forEach(event=>latest.set(targetOf(event),Number(event.score)>0));
  return new Set([...latest].filter(([,value])=>value).map(([id])=>id));
}

export function setFavorite(languageCode,targetId,enabled){
  return recordPractice({
    languageCode,
    targetId,
    skill:null,
    score:enabled?100:0,
    xp:0,
    activity:'favorite',
    metadata:{enabled:Boolean(enabled)}
  });
}

export{resetLearning}from'./store.js';
