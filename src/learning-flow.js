import{availableStages,stageForUnit}from'./data.js';
import{learningEvents}from'./learning.js';
import{buildJourneySession}from'./session.js';
import{unique}from'./utils.js';

const targetOf=event=>event.targetId||event.target_id;
const lowerFirst=value=>value?value[0].toLowerCase()+value.slice(1):value;

export function unitCanDo(unit){
  let raw=String(unit?.canDo||unit?.goal||unit?.title||'use this language in a useful situation').trim().replace(/[.!]+$/,'');
  if(/^i can\b/i.test(raw))return`${raw}.`;
  if(/^learn\s+/i.test(raw))raw=`work with ${raw.replace(/^learn\s+/i,'')}`;
  else if(/^practice\s+/i.test(raw))raw=`produce ${raw.replace(/^practice\s+/i,'')}`;
  else if(/^master\s+/i.test(raw))raw=`use ${raw.replace(/^master\s+/i,'')}`;
  else if(/^meet\s+/i.test(raw))raw=`recognize ${raw.replace(/^meet\s+/i,'')}`;
  else raw=lowerFirst(raw);
  return`I can ${raw}.`;
}

function itemTarget(course,entry){
  const item=course.units[entry.unitIndex]?.items?.[entry.itemIndex];if(!item)return null;
  const example=item.example||{};
  const native=example.native||item.native||'';
  const kanjiForm=example.kanjiForm||item.kanjiForm||'';
  const roman=example.roman||item.roman||'';
  const meaning=example.meaning||item.guide||item.pron||'';
  const speechForms=unique([...(example.speechForms||[]),...(item.speechForms||[]),native,kanjiForm].filter(Boolean));
  return{
    id:item.id,unitIndex:entry.unitIndex,itemIndex:entry.itemIndex,kind:entry.kind||'review',native,kanjiForm,roman,meaning,speechForms,
    guide:item.guide||'',pron:item.pron||'',steps:item.steps||[],item
  };
}

function dialogueFor(unit){
  const raw=unit?.v14?.dialogue||unit?.v9?.dialogue||[];
  return(raw||[]).map((line,index)=>{
    if(Array.isArray(line))return{speaker:line[0]||String.fromCharCode(65+index),native:line[1]||'',meaning:line[2]||'',roman:line[3]||''};
    return{speaker:line?.speaker||String.fromCharCode(65+index),native:line?.native||'',meaning:line?.meaning||'',roman:line?.roman||'',kanjiForm:line?.kanjiForm||''};
  }).filter(line=>line.native);
}

function readingFor(unit){
  const raw=unit?.v14?.reading||unit?.v9?.reading||null;if(!raw)return null;
  return{native:raw.native||'',kanjiForm:raw.kanjiForm||'',roman:raw.roman||'',meaning:raw.meaning||'',question:raw.question||'',answer:raw.answer||''};
}

function stageCheckpointFor(course,unitIndex){
  const stage=stageForUnit(course,unitIndex);if(!stage||unitIndex!==stage.endUnit)return null;
  const checkpoint=course.stageCheckpoints?.[stage.id]||course.stageCheckpoints?.[stage.label?.toLowerCase?.()]||null;
  if(!checkpoint)return null;
  const dialogue=(checkpoint.sampleDialogue||[]).map((line,index)=>({
    speaker:line?.speaker||String.fromCharCode(65+index),native:line?.native||'',kanjiForm:line?.kanjiForm||'',roman:line?.roman||'',meaning:line?.meaning||''
  })).filter(line=>line.native);
  return{...checkpoint,stageId:stage.id,stageLabel:stage.label,sampleDialogue:dialogue};
}

function conceptSet(unit,targets){
  const characters=(unit?.v14?.characterFocus||unit?.v9?.characterFocus||[]).map(entry=>({
    type:'script',label:entry.char||entry.native||'',reading:entry.reading||entry.roman||'',meaning:entry.meaning||''
  })).filter(entry=>entry.label);
  const forms=targets.map(target=>({type:'language',label:target.kanjiForm||target.native,reading:target.kanjiForm?target.native:target.roman,meaning:target.meaning,targetId:target.id}));
  return[...characters,...forms].slice(0,12);
}

function fallbackDialogue(targets){
  return targets.slice(0,2).map((target,index)=>({speaker:String.fromCharCode(65+index),native:target.kanjiForm||target.native,roman:target.roman,meaning:target.meaning}));
}

export function buildIntegratedExperience(course,unitIndex){
  const unit=course.units[unitIndex]||course.units[0],plan=buildJourneySession(course,unitIndex),events=learningEvents(course.id);
  const targets=plan.queue.map(entry=>itemTarget(course,entry)).filter(Boolean);
  const dialogue=dialogueFor(unit);const reading=readingFor(unit);const checkpoint=stageCheckpointFor(course,unitIndex);
  const production=unit?.v14?.production||unit?.v9?.production||unit?.production||`Use the unit goal without looking at the model: ${unitCanDo(unit)}`;
  const activities=[];
  activities.push({type:'mission',key:`mission:${unit.id}`});
  const connectedDialogue=dialogue.length?dialogue:fallbackDialogue(targets);
  if(connectedDialogue.length)activities.push({type:'dialogue',key:`dialogue:${unit.id}`,dialogue:connectedDialogue});
  for(const target of targets){
    activities.push({type:'learn',key:`learn:${target.id}:${target.kind}`,target});
    activities.push({type:'retrieve',key:`retrieve:${target.id}:${target.kind}`,target});
  }
  if(reading?.native)activities.push({type:'reading',key:`reading:${unit.id}`,reading});
  activities.push({type:'scenario',key:`scenario:${unit.id}`,production});
  if(checkpoint)activities.push({type:'checkpoint',key:`checkpoint:${checkpoint.stageId}`,checkpoint});
  activities.push({type:'complete',key:`complete:${unit.id}`});
  const introduced=targets.filter(target=>target.kind==='new').length,review=targets.filter(target=>target.kind!=='new').length;
  const seen=new Set(events.map(targetOf));
  return{
    courseId:course.id,unitIndex,unit,stage:stageForUnit(course,unitIndex),canDo:unitCanDo(unit),plan,targets,dialogue:connectedDialogue,reading,production,checkpoint,
    concepts:conceptSet(unit,targets),activities,
    mix:{introduced,review,label:plan.mix.label,accuracy:plan.mix.accuracy},
    previouslySeen:targets.filter(target=>seen.has(target.id)).length
  };
}

export function courseDepth(course){
  if(['ja','zh'].includes(course.id))return{label:'Deepening path',detail:'Structured from foundations into advanced-topic grammar, connected input and production.'};
  return{label:'Foundation course',detail:'Core practical foundations today; deeper staged content will follow the Japanese/Mandarin model.'};
}

export function stageSummary(course){
  const stages=availableStages(course);return{count:stages.length,first:stages[0]?.label||'Foundation',last:stages.at(-1)?.label||'Foundation'};
}
