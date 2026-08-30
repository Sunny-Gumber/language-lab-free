import{mastery,learningEvents,targetReview}from'./learning.js';

const targetOf=event=>event.targetId||event.target_id;
const occurredAt=event=>event.clientCreatedAt||event.client_created_at||event.createdAt||event.created_at||'';
const numericScore=event=>event?.score==null?null:Number.isFinite(Number(event.score))?Number(event.score):null;

export function sessionMixFromEvents(events=[]){
  const scored=events.filter(event=>event.activity==='practice'&&numericScore(event)!=null).sort((a,b)=>occurredAt(a).localeCompare(occurredAt(b))).slice(-12);
  if(!scored.length)return{review:0,newItems:3,size:3,label:'First steps',accuracy:null};
  const accuracy=Math.round(scored.reduce((sum,event)=>sum+numericScore(event),0)/scored.length);
  if(accuracy<60)return{review:4,newItems:1,size:5,label:'Rebuild confidence',accuracy};
  if(accuracy<80)return{review:3,newItems:2,size:5,label:'Review + grow',accuracy};
  return{review:2,newItems:3,size:5,label:'Ready to stretch',accuracy};
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
  return{queue,mix:{...mix,reviewCount:queue.filter(entry=>entry.kind==='review').length,newCount:queue.filter(entry=>entry.kind==='new').length}};
}

export function shouldShowRoman(course,targetId){
  if(!['ja','zh'].includes(course.id))return true;
  const score=Math.max(mastery(course.id,targetId,'recognition'),mastery(course.id,targetId,'listening'));
  return score<70;
}
