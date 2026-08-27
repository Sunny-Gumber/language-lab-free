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

export function learningEvents(languageCode=null){
  const events=getState().events.filter(event=>event.activity==='practice');
  return languageCode?events.filter(event=>languageOf(event)===languageCode):events;
}

export function recordPractice({languageCode,targetId,skill,score,xp=0,activity='practice',metadata={}}){
  const event={
    id:randomId(),
    languageCode,
    targetId,
    activity,
    skill:skill||null,
    score:score==null?null:Math.round(clamp(score)),
    xpDelta:Math.round(clamp(xp,0,100)),
    studyDate:todayLocal(),
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
    .filter(event=>(event.studyDate||event.study_date)===date)
    .reduce((sum,event)=>sum+xpOf(event),0);
}

export function streak(){
  const dates=[...new Set(learningEvents().map(event=>event.studyDate||event.study_date).filter(Boolean))].sort().reverse();
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

export function reviewsDue(languageCode=null){
  const languages=languageCode?[getCourse(languageCode)]:globalThis.LANGUAGE_LAB_COURSES;
  let due=0;
  for(const course of languages){
    for(const skill of SKILLS){
      for(const target of practiceTargets(course,skill.id)){
        const value=mastery(course.id,target.id,skill.id);
        if(value>0&&value<70)due++;
      }
    }
  }
  return due;
}

export function weakestTarget(languageCode,skill,stageId=null){
  const course=getCourse(languageCode);
  const targets=practiceTargets(course,skill,stageId);
  if(!targets.length)return null;
  const ranked=targets.map(target=>({...target,value:mastery(languageCode,target.id,skill)})).sort((a,b)=>a.value-b.value);
  const weakest=ranked.slice(0,Math.min(5,ranked.length));
  return weakest[Math.floor(Math.random()*weakest.length)]||ranked[0];
}

export function weakestSkill(languageCode){
  return SKILLS.map(skill=>({skill,...skillStats(languageCode,skill.id)}))
    .sort((a,b)=>a.mastery-b.mastery||a.coverage-b.coverage)[0];
}

export function dailyMission(languageCode){
  const order=['listening','speaking','listening','recall'];
  return order.map((skill,index)=>({
    id:`daily-${index}-${skill}`,
    skill,
    target:weakestTarget(languageCode,skill)
  })).filter(task=>task.target);
}

export function dailyMissionProgress(languageCode,date=todayLocal()){
  const events=learningEvents(languageCode).filter(event=>(event.studyDate||event.study_date)===date);
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
