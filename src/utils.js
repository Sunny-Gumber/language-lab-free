export const clamp=(value,min=0,max=100)=>Math.min(max,Math.max(min,Number(value)||0));

const JAPANESE_RECOGNITION_EQUIVALENTS=[
  ['お早う','おはよう'],['有難う','ありがとう'],['済みません','すみません'],
  ['来年','らいねん'],['学生','がくせい'],['雑誌','ざっし'],['番号','ばんごう'],['切手','きって'],['写真','しゃしん'],['趣味','しゅみ'],['食堂','しょくどう'],
  ['食べる','たべる'],['聴く','きく'],['聞く','きく'],['今朝','けさ'],['世界','せかい'],['名前','なまえ'],['部屋','へや'],['歴史','れきし'],
  ['朝','あさ'],['青','あお'],['犬','いぬ'],['海','うみ'],['駅','えき'],['音','おと'],['顔','かお'],['口','くち'],['魚','さかな'],['塩','しお'],['外','そと'],
  ['地図','ちず'],['月','つき'],['手','て'],['時','とき'],['肉','にく'],['猫','ねこ'],['花','はな'],['鼻','はな'],['人','ひと'],['冬','ふゆ'],['本','ほん'],
  ['町','まち'],['街','まち'],['水','みず'],['虫','むし'],['目','め'],['山','やま'],['雪','ゆき'],['夜','よる'],['林檎','りんご'],['車','くるま'],['六','ろく'],
  ['私','わたし'],['誰','だれ'],['客','きゃく'],['九','きゅう'],['今日','きょう']
];
const JAPANESE_SCRIPT=/[\u3040-\u30ff]/;
const REGISTERED_SPEECH_EQUIVALENTS=new Set();

const speechPairKey=(left,right)=>left<=right?`${left}\u0000${right}`:`${right}\u0000${left}`;
const registeredSpeechEquivalent=(left,right)=>REGISTERED_SPEECH_EQUIVALENTS.has(speechPairKey(left,right));

function canonicalJapanese(value){
  let text=String(value??'');
  text=Array.from(text,char=>{
    const code=char.codePointAt(0);
    return code>=0x30A1&&code<=0x30F6?String.fromCodePoint(code-0x60):char;
  }).join('');
  for(const[from,to]of JAPANESE_RECOGNITION_EQUIVALENTS)text=text.split(from).join(to);
  return text;
}

export function todayLocal(date=new Date()){
  const year=date.getFullYear();
  const month=String(date.getMonth()+1).padStart(2,'0');
  const day=String(date.getDate()).padStart(2,'0');
  return `${year}-${month}-${day}`;
}

export function daysBetween(a,b){
  if(!a||!b)return 0;
  const parse=value=>{
    const [year,month,day]=String(value).split('-').map(Number);
    return Date.UTC(year,month-1,day);
  };
  return Math.round((parse(b)-parse(a))/86400000);
}

export function escapeHtml(value){
  return String(value??'').replace(/[&<>"']/g,char=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[char]));
}

export function safeJson(raw,fallback=null){
  try{return raw==null?fallback:JSON.parse(raw)}catch{return fallback}
}

export function randomId(){
  if(globalThis.crypto?.randomUUID)return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,char=>{
    const value=Math.random()*16|0;
    return (char==='x'?value:(value&0x3)|0x8).toString(16);
  });
}

export function shuffle(values){
  const copy=[...(values||[])];
  for(let i=copy.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}

export function normalizeText(value){
  return String(value??'')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/\s+/g,'')
    .replace(/[.,!?。、！？'’\-؟？：:，؛]/g,'');
}

export function normalizeSpeechText(value,locale=''){
  let text=normalizeText(value);
  if(String(locale||'').toLowerCase().startsWith('ja')||JAPANESE_SCRIPT.test(text))text=canonicalJapanese(text);
  return text;
}

export function registerSpeechForms(forms,locale=''){
  const authored=[...new Set([...(forms||[])].map(value=>String(value??'').trim()).filter(Boolean))];
  const raw=[...new Set(authored.map(normalizeText).filter(Boolean))];
  const normalized=[...new Set(authored.map(value=>normalizeSpeechText(value,locale)).filter(Boolean))];
  const register=list=>{
    for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++)REGISTERED_SPEECH_EQUIVALENTS.add(speechPairKey(list[i],list[j]));
  };
  register(raw);register(normalized);
  return authored;
}

export function similarity(left,right){
  let a=normalizeText(left);
  let b=normalizeText(right);
  if(a===b||registeredSpeechEquivalent(a,b))return 1;
  if(JAPANESE_SCRIPT.test(a)||JAPANESE_SCRIPT.test(b)){
    a=canonicalJapanese(a);
    b=canonicalJapanese(b);
    if(a===b||registeredSpeechEquivalent(a,b))return 1;
  }
  if(!a.length||!b.length)return 0;

  const [short,long]=a.length<=b.length?[a,b]:[b,a];
  let previous=Array.from({length:short.length+1},(_,index)=>index);

  for(let row=1;row<=long.length;row++){
    const current=[row];
    for(let column=1;column<=short.length;column++){
      const cost=long[row-1]===short[column-1]?0:1;
      current[column]=Math.min(
        current[column-1]+1,
        previous[column]+1,
        previous[column-1]+cost
      );
    }
    previous=current;
  }

  const distance=previous[short.length];
  return clamp(1-distance/Math.max(a.length,b.length),0,1);
}

export function speechSimilarity(left,right,locale=''){
  const a=normalizeSpeechText(left,locale),b=normalizeSpeechText(right,locale);
  if(a===b||registeredSpeechEquivalent(a,b))return 1;
  return similarity(a,b);
}

export function bestSpeechMatch(transcripts,forms,locale=''){
  const heard=[...(transcripts||[])].map(value=>String(value??'').trim()).filter(Boolean);
  const expected=[...(forms||[])].map(value=>String(value??'').trim()).filter(Boolean);
  let best={score:0,transcript:heard[0]||'',expected:expected[0]||''};
  for(const transcript of heard)for(const form of expected){
    const score=speechSimilarity(transcript,form,locale);
    if(score>best.score)best={score,transcript,expected:form};
    if(score===1)return{score,transcript,expected:form};
  }
  return best;
}

export function unique(values){return [...new Set(values||[])]}

export function debounce(fn,wait=250){
  let timer=null;
  return (...args)=>{
    clearTimeout(timer);
    timer=setTimeout(()=>fn(...args),wait);
  };
}
