export const clamp=(value,min=0,max=100)=>Math.min(max,Math.max(min,Number(value)||0));

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

export function similarity(left,right){
  const a=normalizeText(left);
  const b=normalizeText(right);
  if(a===b)return 1;
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

export function hashString(value){
  let hash=2166136261;
  for(const char of String(value??'')){
    hash^=char.codePointAt(0);
    hash=Math.imul(hash,16777619);
  }
  return (hash>>>0).toString(36);
}

export function unique(values){return [...new Set(values||[])]}

export function debounce(fn,wait=250){
  let timer=null;
  return (...args)=>{
    clearTimeout(timer);
    timer=setTimeout(()=>fn(...args),wait);
  };
}

export function deepEqual(a,b){
  const stable=value=>{
    if(Array.isArray(value))return value.map(stable);
    if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])]));
    return value;
  };
  return JSON.stringify(stable(a))===JSON.stringify(stable(b));
}
