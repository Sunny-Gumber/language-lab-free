export const COURSE_PACK_SCHEMA_VERSION='15.0';

export const CONCEPT_TYPES=Object.freeze(['vocabulary','grammar','expression','script','pronunciation','culture','language']);
export const ACTIVITY_TYPES=Object.freeze([
  'mission','model-dialogue','concept-intro','multiple-choice','translation','cloze','matching','word-bank',
  'listening-choice','listening-dictation','fixed-speaking','fixed-retrieval','free-speaking','free-writing',
  'reading','reading-question','roleplay','script-writing','checkpoint','complete'
]);

const CONCEPT_TYPE_SET=new Set(CONCEPT_TYPES),ACTIVITY_TYPE_SET=new Set(ACTIVITY_TYPES);
const list=value=>Array.isArray(value)?value:value==null?[]:[value];
const text=value=>String(value??'').trim();
const unique=values=>[...new Set(values.map(text).filter(Boolean))];
const safeAscii=value=>text(value).toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'');
const stableKey=value=>safeAscii(value)||[...text(value)].map(char=>char.codePointAt(0).toString(16)).join('-')||'unknown';

function conceptTypeFor(course,item){
  const declared=text(item?.conceptType||item?.kind||item?.type).toLowerCase();
  if(CONCEPT_TYPE_SET.has(declared))return declared;
  if(item?.grammar||item?.pattern)return'grammar';
  const native=text(item?.example?.native||item?.native);
  if(course?.scriptType==='script'&&list(item?.steps).length&&[...native].length<=3)return'script';
  return'expression';
}

function itemConcept(course,unit,item){
  const example=item?.example||{};
  const native=text(example.native||item.native),written=text(example.kanjiForm||item.kanjiForm),roman=text(example.roman||item.roman);
  return{
    id:item.id,type:conceptTypeFor(course,item),
    forms:{native,written,roman},
    meaning:text(example.meaning||item.guide||item.pron),
    speechForms:unique([...(example.speechForms||[]),...(item.speechForms||[]),native,written]),
    guide:text(item.guide),pronunciation:text(item.pron),writingSteps:list(item.steps).map(text).filter(Boolean),
    tags:unique([unit.stageId,item.stageId,item.kind,item.type]),
    source:{kind:'legacy-item',unitId:unit.id,targetId:item.id}
  };
}

function vocabConcept(course,word){
  const native=text(word.native),written=text(word.kanjiForm),roman=text(word.roman);
  return{
    id:word.id,type:'vocabulary',forms:{native,written,roman},meaning:text(word.meaning),
    speechForms:unique([...(word.speechForms||[]),native,written]),tags:unique([word.stageId,'vocabulary']),
    source:{kind:'legacy-vocab',targetId:word.id}
  };
}

function characterConcept(course,entry){
  const native=text(entry?.char||entry?.native),reading=text(entry?.reading||entry?.roman),meaning=text(entry?.meaning);
  return{
    id:`concept:${course.id}:script:${stableKey(native)}`,type:'script',forms:{native,written:native,roman:reading},meaning,
    speechForms:unique([native]),guide:'',pronunciation:'',writingSteps:[],tags:['script'],
    source:{kind:'legacy-character-focus'}
  };
}

function dialogueLines(raw=[]){
  return list(raw).map((line,index)=>{
    if(Array.isArray(line))return{speaker:text(line[0])||String.fromCharCode(65+index),native:text(line[1]),meaning:text(line[2]),roman:text(line[3]),written:''};
    return{speaker:text(line?.speaker)||String.fromCharCode(65+index),native:text(line?.native),meaning:text(line?.meaning),roman:text(line?.roman),written:text(line?.kanjiForm)};
  }).filter(line=>line.native||line.written);
}

function readingBlock(raw){
  if(!raw)return null;
  const reading={native:text(raw.native),written:text(raw.kanjiForm),roman:text(raw.roman),meaning:text(raw.meaning),question:text(raw.question),answer:text(raw.answer)};
  return reading.native||reading.written?reading:null;
}

function unitCanDo(unit){
  const raw=text(unit?.canDo||unit?.goal||unit?.title||'Use this language in a useful situation').replace(/[.!]+$/,'');
  return/^i can\b/i.test(raw)?`${raw}.`:`I can ${raw?raw[0].toLowerCase()+raw.slice(1):'use this language in a useful situation'}.`;
}

function stageList(course){
  const raw=list(course?.curriculum?.stages).filter(stage=>stage?.available!==false);
  if(raw.length)return raw.map((stage,index)=>({
    id:text(stage.id)||`stage-${index+1}`,label:text(stage.label)||text(stage.id)||`Stage ${index+1}`,description:text(stage.description),
    startUnit:Math.max(0,Number(stage.startUnit)||0),endUnit:Math.min(course.units.length-1,Number(stage.endUnit??course.units.length-1)),available:true
  }));
  return[{id:'foundation',label:'Foundation',description:'Current course',startUnit:0,endUnit:Math.max(0,course.units.length-1),available:true}];
}

function checkpointFor(course,unit,stages){
  const stage=stages.find(candidate=>candidate.id===unit.stageId)||stages.find(candidate=>unit.index>=candidate.startUnit&&unit.index<=candidate.endUnit);
  if(!stage||unit.index!==stage.endUnit)return null;
  const raw=course.stageCheckpoints?.[stage.id]||course.stageCheckpoints?.[stage.label.toLowerCase()]||null;
  if(!raw)return null;
  return{stageId:stage.id,title:text(raw.title)||`${stage.label} checkpoint`,canDo:list(raw.canDo).map(text).filter(Boolean),task:text(raw.task),sampleDialogue:dialogueLines(raw.sampleDialogue)};
}

function activitiesFor(course,unit,conceptIds,stages){
  const authored=unit?.v14||unit?.v9||{};
  const activities=[{id:`${unit.id}:mission`,type:'mission',canDo:unitCanDo(unit),conceptIds:[...conceptIds]}];
  const dialogue=dialogueLines(authored.dialogue);
  if(dialogue.length)activities.push({id:`${unit.id}:dialogue`,type:'model-dialogue',lines:dialogue,conceptIds:[...conceptIds]});
  if(conceptIds.length){
    activities.push({id:`${unit.id}:concepts`,type:'concept-intro',conceptIds:[...conceptIds]});
    activities.push({id:`${unit.id}:retrieval`,type:'fixed-retrieval',conceptIds:[...conceptIds],selection:'adaptive'});
  }
  const reading=readingBlock(authored.reading);
  if(reading)activities.push({id:`${unit.id}:reading`,type:'reading',reading,conceptIds:[...conceptIds]});
  const production=text(authored.production||unit.production||`Use the unit goal without looking at the model: ${unitCanDo(unit)}`);
  activities.push({id:`${unit.id}:production`,type:'free-speaking',prompt:production,conceptIds:[...conceptIds]});
  const checkpoint=checkpointFor(course,unit,stages);
  if(checkpoint)activities.push({id:`${unit.id}:checkpoint`,type:'checkpoint',checkpoint,conceptIds:[...conceptIds]});
  activities.push({id:`${unit.id}:complete`,type:'complete',conceptIds:[]});
  return activities;
}

export function compileLegacyCoursePack(course){
  if(!course?.id||!Array.isArray(course.units))throw new Error('compileLegacyCoursePack requires a normalized course.');
  const concepts=new Map(),stages=stageList(course),units=[];
  const addConcept=concept=>{if(!concept?.id)return null;const previous=concepts.get(concept.id);if(previous){previous.speechForms=unique([...(previous.speechForms||[]),...(concept.speechForms||[])]);previous.tags=unique([...(previous.tags||[]),...(concept.tags||[])]);return previous.id}concepts.set(concept.id,concept);return concept.id};

  for(const word of course.vocab||[])addConcept(vocabConcept(course,word));
  for(const unit of course.units){
    const targetIds=(unit.items||[]).map(item=>addConcept(itemConcept(course,unit,item))).filter(Boolean);
    const characterIds=list(unit?.v14?.characterFocus||unit?.v9?.characterFocus).map(entry=>addConcept(characterConcept(course,entry))).filter(Boolean);
    const conceptIds=unique([...targetIds,...characterIds]);
    units.push({
      id:unit.id,index:unit.index,title:text(unit.title),goal:text(unit.goal),canDo:unitCanDo(unit),stageId:text(unit.stageId)||stages[0].id,
      prerequisites:list(unit.prerequisites).map(text).filter(Boolean),conceptIds,activities:activitiesFor(course,unit,conceptIds,stages),
      source:{kind:'legacy-unit',authorId:text(unit.authorId||unit.key)}
    });
  }

  const pack={
    schemaVersion:COURSE_PACK_SCHEMA_VERSION,
    source:{kind:'legacy-v14',courseQualityVersion:course.courseQuality?.version??null},
    course:{id:course.id,name:text(course.name),locale:text(course.locale),flag:text(course.flag),description:text(course.description),scriptType:text(course.scriptType),scriptName:text(course.scriptName),rtl:Boolean(course.rtl)},
    stages,concepts:[...concepts.values()],units
  };
  assertValidCoursePack(pack);
  return pack;
}

export function validateCoursePack(pack){
  const errors=[];
  if(!pack||typeof pack!=='object')return{valid:false,errors:['Course pack must be an object.']};
  if(pack.schemaVersion!==COURSE_PACK_SCHEMA_VERSION)errors.push(`Unsupported schemaVersion: ${pack.schemaVersion??'missing'}`);
  if(!text(pack.course?.id))errors.push('course.id is required.');
  if(!Array.isArray(pack.concepts))errors.push('concepts must be an array.');
  if(!Array.isArray(pack.units))errors.push('units must be an array.');
  if(!Array.isArray(pack.stages))errors.push('stages must be an array.');
  if(errors.length)return{valid:false,errors};

  const conceptIds=new Set(),unitIds=new Set(),activityIds=new Set(),stageIds=new Set(pack.stages.map(stage=>stage.id));
  for(const concept of pack.concepts){
    if(!text(concept.id))errors.push('Concept id is required.');
    else if(conceptIds.has(concept.id))errors.push(`Duplicate concept id: ${concept.id}`);else conceptIds.add(concept.id);
    if(!CONCEPT_TYPE_SET.has(concept.type))errors.push(`Unknown concept type for ${concept.id||'unknown'}: ${concept.type}`);
    if(!text(concept.forms?.native)&&!text(concept.forms?.written))errors.push(`Concept ${concept.id||'unknown'} needs a native or written form.`);
  }
  for(const unit of pack.units){
    if(!text(unit.id))errors.push('Unit id is required.');
    else if(unitIds.has(unit.id))errors.push(`Duplicate unit id: ${unit.id}`);else unitIds.add(unit.id);
    if(!stageIds.has(unit.stageId))errors.push(`Unit ${unit.id||'unknown'} references unknown stage ${unit.stageId}.`);
    for(const conceptId of unit.conceptIds||[])if(!conceptIds.has(conceptId))errors.push(`Unit ${unit.id||'unknown'} references unknown concept ${conceptId}.`);
    if(!Array.isArray(unit.activities)||!unit.activities.length)errors.push(`Unit ${unit.id||'unknown'} must contain activities.`);
    for(const activity of unit.activities||[]){
      if(!text(activity.id))errors.push(`Activity id is required in ${unit.id||'unknown'}.`);
      else if(activityIds.has(activity.id))errors.push(`Duplicate activity id: ${activity.id}`);else activityIds.add(activity.id);
      if(!ACTIVITY_TYPE_SET.has(activity.type))errors.push(`Unknown activity type ${activity.type} in ${activity.id||unit.id||'unknown'}.`);
      for(const conceptId of activity.conceptIds||[])if(!conceptIds.has(conceptId))errors.push(`Activity ${activity.id||'unknown'} references unknown concept ${conceptId}.`);
      if(activity.type==='model-dialogue'&&!list(activity.lines).some(line=>text(line?.native)||text(line?.written)))errors.push(`Dialogue activity ${activity.id||'unknown'} has no usable lines.`);
      if(activity.type==='reading'&&!text(activity.reading?.native)&&!text(activity.reading?.written))errors.push(`Reading activity ${activity.id||'unknown'} has no text.`);
      if(activity.type==='free-speaking'&&!text(activity.prompt))errors.push(`Free-speaking activity ${activity.id||'unknown'} has no prompt.`);
    }
  }
  return{valid:errors.length===0,errors};
}

export function assertValidCoursePack(pack){
  const result=validateCoursePack(pack);
  if(!result.valid)throw new Error(`Invalid course pack:\n- ${result.errors.join('\n- ')}`);
  return pack;
}

export function compileLegacyReferencePacks(courses,codes=['ja','zh']){
  const byId=new Map((courses||[]).map(course=>[course.id,course]));
  return codes.map(code=>{const course=byId.get(code);if(!course)throw new Error(`Missing reference course: ${code}`);return compileLegacyCoursePack(course)});
}
