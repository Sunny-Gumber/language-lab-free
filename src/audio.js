import{getState,updateUi,updatePrefs}from'./store.js';

const FEMALE_HINTS=['female','samantha','victoria','karen','moira','tessa','fiona','kyoko','yuna','ting-ting','meijia','zira','aria','jenny','susan','hazel','helena','anna','monica','paulina','luciana'];
const MALE_HINTS=['male','daniel','alex','fred','tom','thomas','jorge','diego','mark','david','guy','ryan','aaron','rishi','xander','paul','bruce','ralph'];
const listeners=new Set();

export function supported(){return typeof speechSynthesis!=='undefined'&&typeof SpeechSynthesisUtterance!=='undefined'}

export function classifyVoice(voice){
  const name=String(voice?.name||'').toLowerCase();
  if(FEMALE_HINTS.some(hint=>name.includes(hint)))return'female';
  if(MALE_HINTS.some(hint=>name.includes(hint)))return'male';
  return'unknown';
}

export function voicesFor(course){
  if(!supported())return[];
  const language=String(course?.locale||'').split('-')[0].toLowerCase();
  return speechSynthesis.getVoices().filter(voice=>String(voice.lang||'').toLowerCase().startsWith(language));
}

export function exactVoiceName(course){return getState().ui.exactVoices?.[course.id]||''}

export function selectVoice(course,{gender=null,ignoreExact=false}={}){
  const voices=voicesFor(course);
  if(!voices.length)return null;
  const state=getState();
  const exact=ignoreExact?'':state.ui.exactVoices?.[course.id];
  if(exact){
    const match=voices.find(voice=>voice.name===exact);
    if(match)return match;
  }
  const preference=gender||state.prefs.audioPreference||'auto';
  if(preference==='female'||preference==='male'){
    const match=voices.find(voice=>classifyVoice(voice)===preference);
    if(match)return match;
  }
  return voices.find(voice=>voice.default)||voices[0];
}

export function speak(text,course,{rate=.82,gender=null,ignoreExact=false}={}){
  if(!supported()||!text)return false;
  speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(String(text));
  utterance.lang=course.locale;
  utterance.rate=rate;
  const voice=selectVoice(course,{gender,ignoreExact});
  if(voice)utterance.voice=voice;
  speechSynthesis.speak(utterance);
  return true;
}

export function setAudioPreference(preference){
  const value=['auto','female','male'].includes(preference)?preference:'auto';
  updatePrefs({audioPreference:value});
  return value;
}

export function setExactVoice(course,voiceName){
  const current={...(getState().ui.exactVoices||{})};
  if(voiceName)current[course.id]=voiceName;
  else delete current[course.id];
  updateUi({exactVoices:current},'voice');
}

export function subscribeVoices(listener){listeners.add(listener);return()=>listeners.delete(listener)}

function notify(){for(const listener of listeners){try{listener()}catch{}}}
if(supported()){
  if(typeof speechSynthesis.addEventListener==='function')speechSynthesis.addEventListener('voiceschanged',notify);
  else speechSynthesis.onvoiceschanged=notify;
}
