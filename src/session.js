import{mastery,learningEvents,targetReview}from'./learning.js';

const targetOf=event=>event.targetId||event.target_id;
const occurredAt=event=>event.clientCreatedAt||event.client_created_at||event.createdAt||event.created_at||'';
const numericScore=event=>event?.score==null?null:Number.isFinite(Number(event.score))?Number(event.score):null;
const lowerFirst=value=>value?value[0].toLowerCase()+value.slice(1):value;

export function sessionMixFromEvents(events=[]){
  const scored=events.filter(event=>event.activity==='practice'&&numericScore(event)!=null).sort((a,b)=>occurredAt(a).localeCompare(occurredAt(b))).slice(-12);
  if(!scored.length)return{review:0,newItems:3,size:3,label:'First steps',accuracy:null};
  const accuracy=Math.round(scored.reduce((sum,event)=>sum+numericScore(event),0)/scored.length);
  if(accuracy<60)return{review:4,newItems:1,size:5,label:'Rebuild confidence',accuracy};
  if(accuracy<80)return{review:3,newItems:2,size:5,label:'Review + grow',accuracy};
  return{review:2,newItems:3,size:5,label:'Ready to stretch',accuracy};
}

function missionType(unit){
  const text=`${unit?.title||''} ${unit?.goal||''}`.toLowerCase();
  return/(hiragana|katakana|hangul|character|vowel|sound|script|letter|devanagari|alphabet|tone)/.test(text)?'foundation':'communication';
}
function canDoText(unit){
  let raw=String(unit?.canDo||unit?.goal||unit?.title||'Use this language in a useful situation').trim().replace(/[.!]+$/,'');
  if(/^i can\b/i.test(raw))return `${raw}.`;
  if(/^learn\s+/i.test(raw))raw=`work with ${raw.replace(/^learn\s+/i,'')}`;
  else if(/^practice\s+/i.test(raw))raw=`produce ${raw.replace(/^practice\s+/i,'')}`;
  else if(/^master\s+/i.test(raw))raw=`use ${raw.replace(/^master\s+/i,'')}`;
  else if(/^meet\s+/i.test(raw))raw=`recognize ${raw.replace(/^meet\s+/i,'')}`;
  else raw=lowerFirst(raw);
  return`I can ${raw}.`;
}

export function languageScaffold(course){
  if(course.id==='ja')return{label:'Japanese pathway',hint:'Sound first. Kana stays visible while romanization gradually fades as recognition improves.'};
  if(course.id==='zh')return{label:'Mandarin pathway',hint:'Listen carefully to the sound and tone. Pinyin supports early learning, then characters take more of the load.'};
  if(course.id==='ko')return{label:'Korean pathway',hint:'Use useful phrases early while Hangul recognition becomes more automatic.'};
  if(course.rtl)return{label:'Script + communication',hint:'Build useful spoken chunks while gradually becoming comfortable reading the script right-to-left.'};
  return{label:'Communication first',hint:'Move quickly from useful phrases into listening, recall and short real-life responses.'};
}

function itemSeen(events,id){return events.some(event=>targetOf(event)===id)}
function reviewPriority(languageCode,item){
  const skills=['listening','recognition','recall'];
  const reviews=skills.map(skill=>targetReview(languageCode,item.id,skill));
  const due=reviews.some(review=>review.due)?1:0;
  const knownScores=skills.map(skill=>mastery(languageCode,item.id,skill)).filter(score=>score>0);
  const weakest=knownScores.length?Math.min(...knownScores):0;
  return due*1000+(100-weakest)*5;
}
function ref(unitIndex,itemIndex,item,kind){return{unitIndex,itemIndex,targetId:item.id,kind}}

export function buildJourneySession(course,unitIndex){
  const events=learningEvents(course.id),mix=sessionMixFromEvents(events),current=course.units[unitIndex]||course.units[0];
  const newItems=(current?.items||[]).map((item,itemIndex)=>ref(unitIndex,itemIndex,item,'new')).filter(entry=>!itemSeen(events,entry.targetId));
  const reviewItems=[];
  for(let u=0;u<=unitIndex;u++)for(let i=0;i<(course.units[u]?.items||[]).length;i++){
    const item=course.units[u].items[i];if(itemSeen(events,item.id))reviewItems.push({...ref(u,i,item,'review'),priority:reviewPriority(course.id,item)});
  }
  reviewItems.sort((a,b)=>b.priority-a.priority);

  let reviews=reviewItems.slice(0,mix.review),fresh=newItems.slice(0,mix.newItems);
  const selectedIds=new Set([...reviews,...fresh].map(entry=>entry.targetId)),fallback=[];
  for(let i=0;i<(current?.items||[]).length;i++){
    const item=current.items[i];if(selectedIds.has(item.id))continue;fallback.push(ref(unitIndex,i,item,itemSeen(events,item.id)?'review':'new'));
  }
  while(reviews.length+fresh.length<mix.size&&fallback.length){const entry=fallback.shift();selectedIds.add(entry.targetId);if(entry.kind==='new')fresh.push(entry);else reviews.push(entry)}
  if(!reviews.length&&!fresh.length&&current?.items?.length)fresh=[ref(unitIndex,0,current.items[0],'new')];

  const queue=[];while(reviews.length||fresh.length){if(reviews.length)queue.push(reviews.shift());if(fresh.length)queue.push(fresh.shift())}
  return{
    queue,
    canDo:canDoText(current),
    missionType:missionType(current),
    scaffold:languageScaffold(course),
    mix:{...mix,reviewCount:queue.filter(entry=>entry.kind==='review').length,newCount:queue.filter(entry=>entry.kind==='new').length}
  };
}

export function mistakeChoices(languageCode,targetId,kind='meaning'){
  const counts=new Map();
  for(const event of learningEvents(languageCode)){
    if(targetOf(event)!==targetId)continue;
    const metadata=event.metadata||{};if(metadata.questionKind!==kind)continue;
    const selected=String(metadata.selectedAnswer||'').trim(),correct=String(metadata.correctAnswer||'').trim();
    if(!selected||selected===correct)continue;counts.set(selected,(counts.get(selected)||0)+1);
  }
  return[...counts.entries()].sort((a,b)=>b[1]-a[1]).map(([answer])=>answer);
}

export function shouldShowRoman(course,targetId){
  if(!['ja','zh'].includes(course.id))return true;
  const score=Math.max(mastery(course.id,targetId,'recognition'),mastery(course.id,targetId,'listening'));
  return score<70;
}
