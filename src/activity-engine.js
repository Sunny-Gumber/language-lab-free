import{ACTIVITY_TYPES}from'./course-pack.js';

const CANONICAL_TYPES=new Set(ACTIVITY_TYPES);
const RENDERER_TYPE=Object.freeze({
  mission:'mission',
  'model-dialogue':'dialogue',
  'concept-intro':'learn',
  'fixed-retrieval':'retrieve',
  reading:'reading',
  'free-speaking':'scenario',
  checkpoint:'checkpoint',
  complete:'complete'
});

function makeActivity(activityType,key,payload={}){
  if(!CANONICAL_TYPES.has(activityType))throw new Error(`Unsupported canonical activity type: ${activityType}`);
  const type=RENDERER_TYPE[activityType];
  if(!type)throw new Error(`No Journey renderer mapping for activity type: ${activityType}`);
  return{activityType,type,key,...payload};
}

function targetKey(target){return`${target.id}:${target.kind||'review'}`}

export function buildInterleavedActivityPlan({unitId,targets=[],dialogue=[],reading=null,production='',checkpoint=null}){
  const activities=[];
  activities.push(makeActivity('mission',`mission:${unitId}`));
  if(dialogue.length)activities.push(makeActivity('model-dialogue',`dialogue:${unitId}`,{dialogue}));

  const pendingNew=[];
  const retrieve=target=>activities.push(makeActivity('fixed-retrieval',`retrieve:${targetKey(target)}`,{target}));
  const introduce=target=>{
    activities.push(makeActivity('concept-intro',`learn:${targetKey(target)}`,{target}));
    pendingNew.push(target);
  };
  const flushOldestNew=()=>{const target=pendingNew.shift();if(target)retrieve(target)};

  for(const target of targets){
    if(target.kind==='new'){
      introduce(target);
      if(pendingNew.length>=2)flushOldestNew();
      continue;
    }
    retrieve(target);
    if(pendingNew.length)flushOldestNew();
  }

  if(reading?.native||reading?.kanjiForm)activities.push(makeActivity('reading',`reading:${unitId}`,{reading}));
  while(pendingNew.length)flushOldestNew();

  activities.push(makeActivity('free-speaking',`scenario:${unitId}`,{production}));
  if(checkpoint)activities.push(makeActivity('checkpoint',`checkpoint:${checkpoint.stageId}`,{checkpoint}));
  activities.push(makeActivity('complete',`complete:${unitId}`));
  return activities;
}

export function canonicalActivityType(activity){return activity?.activityType||({mission:'mission',dialogue:'model-dialogue',learn:'concept-intro',retrieve:'fixed-retrieval',reading:'reading',scenario:'free-speaking',checkpoint:'checkpoint',complete:'complete'})[activity?.type]||null}

export function assertInterleavedActivityPlan(activities=[]){
  const errors=[],introducedAt=new Map();
  activities.forEach((activity,index)=>{
    const canonical=canonicalActivityType(activity);
    if(!canonical||!CANONICAL_TYPES.has(canonical))errors.push(`Unknown activity type at ${index}: ${activity?.type||activity?.activityType||'missing'}`);
    const targetId=activity?.target?.id;
    if(canonical==='concept-intro'&&targetId)introducedAt.set(targetId,index);
    if(canonical==='fixed-retrieval'&&targetId&&introducedAt.has(targetId)){
      const introIndex=introducedAt.get(targetId);
      if(index-introIndex<2)errors.push(`New target ${targetId} is retrieved immediately after introduction.`);
    }
  });
  if(errors.length)throw new Error(`Invalid interleaved activity plan:\n- ${errors.join('\n- ')}`);
  return activities;
}
