import{registerSpeechForms,unique}from'./utils.js';

const rawCourses=globalThis.LANGUAGE_LAB_COURSES;
if(!Array.isArray(rawCourses)||!rawCourses.length)throw new Error('Course data did not load.');

const safeKey=value=>String(value??'').trim().replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase();
const list=value=>Array.isArray(value)?value:value?[value]:[];

/*
 * Speech authoring contract:
 * - native: primary learner-facing form (for Japanese this can stay kana-first)
 * - kanjiForm: optional alternate written form for the same spoken target
 * - speechForms / speechAliases: optional additional browser-recognition forms
 *
 * All authored forms are registered as equivalent for transcript matching. This
 * lets future content add Kanji/Kana variants without editing the speech engine.
 */
function speechFormsFor(language,record,primary=''){
  const forms=unique([primary,record?.native,record?.kanjiForm,...list(record?.speechForms),...list(record?.speechAliases)].map(value=>String(value??'').trim()).filter(Boolean));
  registerSpeechForms(forms,language.locale||language.id);
  return forms;
}

/*
 * Stamp the positional fallback identity BEFORE any pedagogical reordering.
 * V11 used uN/iN/vN when authored keys were absent. Keeping that identity here
 * means we can change the visible curriculum order without changing existing
 * learning-event target IDs or accidentally deriving duplicate IDs from repeated
 * romanization/native text.
 */
function stampStableFallbackIds(language){
  (language.units||[]).forEach((unit,unitIndex)=>{
    if(!unit.key&&!unit.authorId)unit.authorId=`u${unitIndex+1}`;
    (unit.items||[]).forEach((item,itemIndex)=>{if(!item.key&&!item.authorId)item.authorId=`i${itemIndex+1}`});
  });
  (language.vocab||[]).forEach((word,index)=>{if(!word.key&&!word.authorId)word.authorId=`v${index+1}`});
}
rawCourses.forEach(stampStableFallbackIds);

function reorderByTitles(language,titles){
  const remaining=[...(language.units||[])],ordered=[];
  for(const title of titles){const index=remaining.findIndex(unit=>unit.title===title);if(index>=0)ordered.push(remaining.splice(index,1)[0])}
  language.units=[...ordered,...remaining];
}
function applyPedagogicalOrder(language){
  if(language.id==='ja'){
    const starter=[
      'Japanese Sound System','Greetings & Polite Basics','Introduce Yourself','Hiragana K Row','First Sentence Patterns','Hiragana S Row','Numbers & Time Basics',
      'Hiragana T & N Rows','Hiragana H & M Rows','Complete Basic Hiragana','Voiced Sounds & Small っ','Contracted Sounds','Katakana Foundations'
    ];
    reorderByTitles(language,starter);
    language.units.slice(0,starter.length).forEach((unit,index)=>{unit.stage=index<=6?'beginner-1':'beginner-2'});
    const stages=language.curriculum?.stages||[];
    const beginner1=stages.find(stage=>stage.id==='beginner-1'),beginner2=stages.find(stage=>stage.id==='beginner-2');
    if(beginner1)Object.assign(beginner1,{startUnit:0,endUnit:6,description:'Sound, greetings, self-introduction and first kana'});
    if(beginner2)Object.assign(beginner2,{startUnit:7,endUnit:starter.length-1,description:'More kana, numbers, sentence patterns and Katakana'});
  }
  if(language.id==='zh')reorderByTitles(language,['Pinyin & Four Tones','Greetings & Basic Questions','First Characters']);
}
rawCourses.forEach(applyPedagogicalOrder);

function rawStages(language){
  const stages=(language.curriculum?.stages||[]).filter(stage=>stage.available!==false);
  return stages.length?stages:[{id:'foundation',label:'Foundation',description:'Current course',startUnit:0,endUnit:Math.max(0,(language.units||[]).length-1),available:true}];
}
function rawStageForUnit(language,unit,index){
  const stages=rawStages(language);
  if(unit?.stage&&stages.some(stage=>stage.id===unit.stage))return unit.stage;
  return stages.find(stage=>index>=Math.max(0,Number(stage.startUnit)||0)&&index<=Number(stage.endUnit??language.units.length-1))?.id||stages[0]?.id||'foundation';
}
function structuralItemId(language,unit,item,unitIndex,itemIndex){
  const unitKey=safeKey(unit.key||unit.authorId)||`u${unitIndex+1}`;
  const itemKey=safeKey(item.key||item.authorId)||`i${itemIndex+1}`;
  return`item:${language.id}:${unitKey}:${itemKey}`;
}
function structuralVocabId(language,word,index){const key=safeKey(word.key||word.authorId)||`v${index+1}`;return`vocab:${language.id}:${key}`}

export const courses=rawCourses.map(language=>{
  language.units=(language.units||[]).map((unit,unitIndex)=>{
    unit.id=`unit:${language.id}:${safeKey(unit.key||unit.authorId)||`u${unitIndex+1}`}`;
    unit.index=unitIndex;
    unit.stageId=rawStageForUnit(language,unit,unitIndex);
    unit.items=(unit.items||[]).map((item,itemIndex)=>{
      item.id=structuralItemId(language,unit,item,unitIndex,itemIndex);
      item.index=itemIndex;item.unitIndex=unitIndex;item.stageId=unit.stageId;
      item.speechForms=speechFormsFor(language,item,item.native);
      if(item.example)item.example.speechForms=speechFormsFor(language,item.example,item.example.native);
      return item;
    });
    return unit;
  });
  language.vocab=(language.vocab||[]).map((word,index)=>{word.id=structuralVocabId(language,word,index);word.index=index;word.speechForms=speechFormsFor(language,word,word.native);return word});
  return language;
});

export const courseCodes=courses.map(course=>course.id);
export function getCourse(code){return courses.find(course=>course.id===code)||courses[0]}
export function getUnit(course,index){return course.units[Math.max(0,Math.min(Number(index)||0,course.units.length-1))]}
export function getItem(course,unitIndex,itemIndex){const unit=getUnit(course,unitIndex);return unit.items[Math.max(0,Math.min(Number(itemIndex)||0,unit.items.length-1))]}
export function findItem(course,targetId){for(const unit of course.units){const item=unit.items.find(candidate=>candidate.id===targetId);if(item)return{unit,item,unitIndex:unit.index,itemIndex:item.index}}return null}
export function availableStages(course){
  const stages=(course.curriculum?.stages||[]).filter(stage=>stage.available!==false);
  if(stages.length)return stages.map(stage=>({...stage,startUnit:Math.max(0,Number(stage.startUnit)||0),endUnit:Math.min(course.units.length-1,Number(stage.endUnit??course.units.length-1))}));
  return[{id:'foundation',label:'Foundation',description:'Current course',startUnit:0,endUnit:course.units.length-1,available:true}];
}
export function stageForUnit(course,unitIndex){return availableStages(course).find(stage=>unitIndex>=stage.startUnit&&unitIndex<=stage.endUnit)||availableStages(course)[0]}
export function unitsForStage(course,stageId){const stage=availableStages(course).find(candidate=>candidate.id===stageId);return stage?course.units.slice(stage.startUnit,stage.endUnit+1):course.units}

function inferVocabStage(course,word){
  const declared=word.stageId||word.stage;
  if(declared&&availableStages(course).some(stage=>stage.id===declared))return declared;
  const native=String(word.native||'').trim();
  if(native){
    for(const unit of course.units){
      const found=unit.items.some(item=>String(item.native||'').includes(native)||String(item.example?.native||'').includes(native));
      if(found)return unit.stageId||stageForUnit(course,unit.index)?.id;
    }
  }
  return availableStages(course)[0]?.id||'foundation';
}
for(const course of courses)for(const word of course.vocab)word.stageId=inferVocabStage(course,word);

function exampleTarget(item){if(!item.example?.native||!item.example?.meaning)return null;return{id:item.id,native:item.example.native,kanjiForm:item.example.kanjiForm||'',speechForms:item.example.speechForms||[item.example.native],roman:item.example.roman||item.roman||'',meaning:item.example.meaning,source:'item',stageId:item.stageId,item}}
function vocabTarget(word){return{id:word.id,native:word.native,kanjiForm:word.kanjiForm||'',speechForms:word.speechForms||[word.native],roman:word.roman||'',meaning:word.meaning,source:'vocab',stageId:word.stageId,word}}
export function practiceTargets(course,skill,stageId=null){
  const units=stageId?unitsForStage(course,stageId):course.units;
  const itemTargets=units.flatMap(unit=>unit.items.map(exampleTarget).filter(Boolean));
  const vocabTargets=course.vocab.filter(word=>!stageId||word.stageId===stageId).map(vocabTarget);
  let raw;
  if(skill==='writing')raw=units.flatMap(unit=>unit.items.map(item=>({id:item.id,native:item.native,kanjiForm:item.kanjiForm||'',speechForms:item.speechForms||[item.native],roman:item.roman||'',meaning:item.example?.meaning||item.guide||'',source:'item',stageId:item.stageId,item})));
  else if(skill==='recall')raw=vocabTargets;
  else raw=[...itemTargets,...vocabTargets];
  const seen=new Set();
  return raw.filter(target=>{const key=`${target.id}|${target.native}|${target.meaning}`;if(!target.native||seen.has(key))return false;seen.add(key);return true});
}
export function allTargetIds(course){return unique([...course.units.flatMap(unit=>unit.items.map(item=>item.id)),...course.vocab.map(word=>word.id)])}

function validateCourseIds(){
  for(const course of courses){
    const raw=[...course.units.flatMap(unit=>unit.items.map(item=>item.id)),...course.vocab.map(word=>word.id)],ids=unique(raw);
    if(ids.length!==raw.length){
      const seen=new Set(),duplicates=raw.filter(id=>seen.has(id)||!seen.add(id));
      throw new Error(`Duplicate learning target IDs in ${course.id}: ${[...new Set(duplicates)].join(', ')}`);
    }
  }
}
validateCourseIds();

export const conversations={
  ja:[
    {prompt:'こんにちは。おげんきですか。',meaning:'Hello. How are you?',answer:'はい、げんきです。',roman:'hai, genki desu',answerMeaning:'Yes, I am well.'},
    {prompt:'おなまえは なんですか。',meaning:'What is your name?',answer:'わたしは アレックスです。',roman:'watashi wa Arekkusu desu',answerMeaning:'I am Alex.'},
    {prompt:'すみません、えきは どこですか。',meaning:'Excuse me, where is the station?',answer:'あそこです。',roman:'asoko desu',answerMeaning:'It is over there.'},
    {prompt:'これは いくらですか。',meaning:'How much is this?',answer:'せんえんです。',roman:'sen en desu',answerMeaning:'It is 1,000 yen.'}
  ],
  zh:[
    {prompt:'你好，你好吗？',meaning:'Hello, how are you?',answer:'我很好，谢谢。',roman:'wǒ hěn hǎo, xièxie',answerMeaning:'I am very well, thank you.'},
    {prompt:'你叫什么名字？',meaning:'What is your name?',answer:'我叫 Alex。',roman:'wǒ jiào Alex',answerMeaning:'My name is Alex.'},
    {prompt:'请问，车站在哪儿？',meaning:'Excuse me, where is the station?',answer:'车站在那边。',roman:'chēzhàn zài nàbiān',answerMeaning:'The station is over there.'},
    {prompt:'这个多少钱？',meaning:'How much is this?',answer:'这个一百块。',roman:'zhège yìbǎi kuài',answerMeaning:'This is 100 yuan.'}
  ]
};
export function conversationItems(course,stageId=null){
  const list=conversations[course.id]||[];if(!list.length)return[];
  const firstStage=availableStages(course)[0]?.id;
  return list.filter(item=>item.stageId?(!stageId||item.stageId===stageId):(!stageId||stageId===firstStage)).map(item=>{
    const speechForms=speechFormsFor(course,{native:item.answer,kanjiForm:item.kanjiForm,speechForms:item.speechForms,speechAliases:item.speechAliases},item.answer);
    return{...item,speechForms};
  });
}
export function hasConversation(course,stageId=null){return conversationItems(course,stageId).length>0}
