import{hashString,unique}from'./utils.js';

const rawCourses=globalThis.LANGUAGE_LAB_COURSES;
if(!Array.isArray(rawCourses)||!rawCourses.length)throw new Error('Course data did not load.');

function itemId(language,item){return`item:${language.id}:${hashString(`${item.native}|${item.roman}`)}`}
function vocabId(language,word){return`vocab:${language.id}:${hashString(`${word.native}|${word.roman}|${word.meaning}`)}`}

export const courses=rawCourses.map(language=>{
  language.units=(language.units||[]).map((unit,unitIndex)=>{
    unit.id=`unit:${language.id}:${hashString(unit.title||String(unitIndex))}`;unit.index=unitIndex;
    unit.items=(unit.items||[]).map((item,itemIndex)=>{item.id=itemId(language,item);item.index=itemIndex;item.unitIndex=unitIndex;return item});return unit;
  });
  language.vocab=(language.vocab||[]).map((word,index)=>{word.id=vocabId(language,word);word.index=index;return word});return language;
});
export const courseCodes=courses.map(course=>course.id);
export function getCourse(code){return courses.find(course=>course.id===code)||courses[0]}
export function getUnit(course,index){return course.units[Math.max(0,Math.min(Number(index)||0,course.units.length-1))]}
export function getItem(course,unitIndex,itemIndex){const unit=getUnit(course,unitIndex);return unit.items[Math.max(0,Math.min(Number(itemIndex)||0,unit.items.length-1))]}
export function findItem(course,targetId){for(const unit of course.units){const item=unit.items.find(candidate=>candidate.id===targetId);if(item)return{unit,item,unitIndex:unit.index,itemIndex:item.index}}return null}
export function availableStages(course){const stages=(course.curriculum?.stages||[]).filter(stage=>stage.available!==false);if(stages.length)return stages.map(stage=>({...stage,startUnit:Math.max(0,Number(stage.startUnit)||0),endUnit:Math.min(course.units.length-1,Number(stage.endUnit??course.units.length-1))}));return[{id:'foundation',label:'Foundation',description:'Current course',startUnit:0,endUnit:course.units.length-1,available:true}]}
export function stageForUnit(course,unitIndex){return availableStages(course).find(stage=>unitIndex>=stage.startUnit&&unitIndex<=stage.endUnit)||availableStages(course)[0]}
export function unitsForStage(course,stageId){const stage=availableStages(course).find(candidate=>candidate.id===stageId);return stage?course.units.slice(stage.startUnit,stage.endUnit+1):course.units}
function exampleTarget(item){if(!item.example?.native||!item.example?.meaning)return null;return{id:item.id,native:item.example.native,roman:item.example.roman||item.roman||'',meaning:item.example.meaning,source:'item',item}}
function vocabTarget(word){return{id:word.id,native:word.native,roman:word.roman||'',meaning:word.meaning,source:'vocab',word}}
export function practiceTargets(course,skill,stageId=null){
  const units=stageId?unitsForStage(course,stageId):course.units,itemTargets=units.flatMap(unit=>unit.items.map(exampleTarget).filter(Boolean)),vocabTargets=course.vocab.map(vocabTarget);
  let raw;
  if(skill==='writing')raw=units.flatMap(unit=>unit.items.map(item=>({id:item.id,native:item.native,roman:item.roman||'',meaning:item.example?.meaning||item.guide||'',source:'item',item})));
  else if(skill==='recall')raw=vocabTargets;
  else raw=[...itemTargets,...vocabTargets];
  const seen=new Set();return raw.filter(target=>{const key=`${target.native}|${target.meaning}`;if(!target.native||seen.has(key))return false;seen.add(key);return true});
}
export function allTargetIds(course){return unique([...course.units.flatMap(unit=>unit.items.map(item=>item.id)),...course.vocab.map(word=>word.id)])}

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
export function hasConversation(course){return Boolean(conversations[course.id]?.length)}
