const TONE_SUPERSCRIPT={1:'¹',2:'²',3:'³',4:'⁴',5:'⁰'};

const JP_SPECIAL={
  kya:'क्या',kyu:'क्यु',kyo:'क्यो',gya:'ग्या',gyu:'ग्यु',gyo:'ग्यो',
  sha:'शा',shu:'शु',sho:'शो',cha:'चा',chu:'चु',cho:'चो',
  nya:'न्या',nyu:'न्यु',nyo:'न्यो',hya:'ह्या',hyu:'ह्यु',hyo:'ह्यो',
  mya:'म्या',myu:'म्यु',myo:'म्यो',rya:'र्या',ryu:'र्यु',ryo:'र्यो',
  ja:'जा',ju:'जु',jo:'जो',bya:'ब्या',byu:'ब्यु',byo:'ब्यो',
  pya:'प्या',pyu:'प्यु',pyo:'प्यो',shi:'शि',chi:'चि',tsu:'त्सु',fu:'फु',ji:'जि',
  wa:'वा',wo:'ओ',ya:'या',yu:'यु',yo:'यो'
};
const JP_ONSETS={'':'',k:'क',g:'ग',s:'स',z:'ज़',t:'त',d:'द',n:'न',h:'ह',b:'ब',p:'प',m:'म',y:'य',r:'र',w:'व',f:'फ',v:'व',j:'ज'};
const JP_VOWELS={a:['अ','ा'],i:['इ','ि'],u:['उ','ु'],e:['ए','े'],o:['ओ','ो']};
const JP_SPECIAL_KEYS=Object.keys(JP_SPECIAL).sort((a,b)=>b.length-a.length);
const JP_ONSET_KEYS=Object.keys(JP_ONSETS).sort((a,b)=>b.length-a.length);

function normalizeJapaneseWord(word){
  return String(word||'').toLowerCase()
    .replace(/[āâ]/g,'a').replace(/[īî]/g,'i').replace(/[ūû]/g,'u').replace(/[ēê]/g,'e').replace(/[ōô]/g,'o')
    .replace(/ou/g,'o').replace(/oo/g,'o').replace(/ei/g,'e');
}

function japaneseWordToHindi(input){
  const word=normalizeJapaneseWord(input);let out='',i=0;
  while(i<word.length){
    const ch=word[i];
    if(!/[a-z]/.test(ch)){out+=ch;i++;continue}
    if(ch==='n'&&(i===word.length-1||!/[aeiouy]/.test(word[i+1]))){out+=i===word.length-1?'न':'न्';i++;continue}
    if(i+1<word.length&&ch===word[i+1]&&/[bcdfghjklmpqrstvwxyz]/.test(ch)&&ch!=='n'){
      const next=word.slice(i+1);
      if(next.startsWith('shi'))out+='श्';
      else if(next.startsWith('chi'))out+='च्';
      else if(JP_ONSETS[ch])out+=JP_ONSETS[ch]+'्';
      i++;continue;
    }
    if(word.slice(i).startsWith('tch')){out+='च्';i+=1;continue}
    const special=JP_SPECIAL_KEYS.find(key=>word.startsWith(key,i));
    if(special){out+=JP_SPECIAL[special];i+=special.length;continue}
    let matched=false;
    for(const onset of JP_ONSET_KEYS){
      if(onset&&!word.startsWith(onset,i))continue;
      const vowelIndex=i+onset.length,vowel=word[vowelIndex];
      if(!JP_VOWELS[vowel])continue;
      const[independent,matra]=JP_VOWELS[vowel];
      out+=onset?JP_ONSETS[onset]+matra:independent;i=vowelIndex+1;matched=true;break;
    }
    if(matched)continue;
    out+=ch;i++;
  }
  return out;
}

const PINYIN_SYLLABLES=new Set(`a ai an ang ao ba bai ban bang bao bei ben beng bi bian biao bie bin bing bo bu ca cai can cang cao ce cen ceng cha chai chan chang chao che chen cheng chi chong chou chu chua chuai chuan chuang chui chun chuo ci cong cou cu cuan cui cun cuo da dai dan dang dao de dei den deng di dia dian diao die ding diu dong dou du duan dui dun duo e ei en eng er fa fan fang fei fen feng fo fou fu ga gai gan gang gao ge gei gen geng gong gou gu gua guai guan guang gui gun guo ha hai han hang hao he hei hen heng hong hou hu hua huai huan huang hui hun huo ji jia jian jiang jiao jie jin jing jiong jiu ju juan jue jun ka kai kan kang kao ke ken keng kong kou ku kua kuai kuan kuang kui kun kuo la lai lan lang lao le lei leng li lia lian liang liao lie lin ling liu lo long lou lu luan lun luo lv lve ma mai man mang mao me mei men meng mi mian miao mie min ming miu mo mou mu na nai nan nang nao ne nei nen neng ni nian niang niao nie nin ning niu nong nou nu nuan nuo nv nve o ou pa pai pan pang pao pei pen peng pi pian piao pie pin ping po pou pu qi qia qian qiang qiao qie qin qing qiong qiu qu quan que qun ran rang rao re ren reng ri rong rou ru ruan rui run ruo sa sai san sang sao se sen seng sha shai shan shang shao she shei shen sheng shi shou shu shua shuai shuan shuang shui shun shuo si song sou su suan sui sun suo ta tai tan tang tao te teng ti tian tiao tie ting tong tou tu tuan tui tun tuo wa wai wan wang wei wen weng wo wu xi xia xian xiang xiao xie xin xing xiong xiu xu xuan xue xun ya yan yang yao ye yi yin ying yo yong you yu yuan yue yun za zai zan zang zao ze zei zen zeng zha zhai zhan zhang zhao zhe zhei zhen zheng zhi zhong zhou zhu zhua zhuai zhuan zhuang zhui zhun zhuo zi zong zou zu zuan zui zun zuo`.split(/\s+/));

function normalizePinyinToken(token){
  let value=String(token||'').toLowerCase(),trailingTone=null;
  const chars=[],special={ǖ:['v',1],ǘ:['v',2],ǚ:['v',3],ǜ:['v',4],ü:['v',0]};
  const digit=value.match(/([1-5])$/);if(digit){trailingTone=Number(digit[1]);value=value.slice(0,-1)}
  value=value.replace(/u:/g,'v');
  for(const raw of value){
    if(special[raw]){chars.push({c:special[raw][0],tone:special[raw][1]});continue}
    const decomposed=raw.normalize('NFD');let base='',tone=0,diaeresis=false;
    for(const part of decomposed){
      if(part==='\u0304')tone=1;else if(part==='\u0301')tone=2;else if(part==='\u030c')tone=3;else if(part==='\u0300')tone=4;else if(part==='\u0308')diaeresis=true;else if(/[a-z]/.test(part))base=part;
    }
    if(base)chars.push({c:diaeresis&&base==='u'?'v':base,tone});
  }
  return{chars,trailingTone};
}

function segmentPinyin(chars){
  const base=chars.map(part=>part.c).join(''),memo=new Map();
  function solve(index){
    if(index===base.length)return[];
    if(memo.has(index))return memo.get(index);
    let best=null;
    for(let end=Math.min(base.length,index+6);end>index;end--){
      const syllable=base.slice(index,end);if(!PINYIN_SYLLABLES.has(syllable))continue;
      const rest=solve(end);if(rest){best=[{base:syllable,start:index,end},...rest];break}
    }
    memo.set(index,best);return best;
  }
  return solve(0);
}

const INITIALS=['zh','ch','sh','b','p','m','f','d','t','n','l','g','k','h','j','q','x','r','z','c','s'];
const INITIAL_HI={b:'प',p:'फ',m:'म',f:'फ़',d:'त',t:'थ',n:'न',l:'ल',g:'क',k:'ख',h:'ह',j:'ज',q:'छ',x:'श',zh:'च',ch:'छ',sh:'श',r:'र',z:'त्स',c:'त्स्ह',s:'स'};
const FINAL_HI={
  a:['आ','ा'],o:['ओ','ो'],e:['अ',''],ai:['आइ','ाइ'],ei:['एइ','ेइ'],ao:['आओ','ाओ'],ou:['ओउ','ोउ'],
  an:['आन','ान'],en:['अन','न'],ang:['आंग','ांग'],eng:['अंग','ंग'],er:['अर','र'],
  i:['ई','ी'],ia:['या','्या'],ie:['ये','्ये'],iao:['याओ','्याओ'],iu:['योउ','्योउ'],ian:['येन','्येन'],in:['इन','िन'],iang:['यांग','्यांग'],ing:['इंग','िंग'],iong:['योंग','्योंग'],
  u:['ऊ','ू'],ua:['वा','्वा'],uo:['वो','्वो'],uai:['वाइ','्वाइ'],ui:['वेइ','्वेइ'],uan:['वान','्वान'],un:['वन','्वन'],uang:['वांग','्वांग'],ueng:['वंग','्वंग'],ong:['ओंग','ोंग'],
  v:['यु','्यु'],ve:['युए','्युए'],van:['युएन','्युएन'],vn:['युन','्युन']
};

function normalizePinyinBase(base){
  const y={yi:'i',yin:'in',ying:'ing',ya:'ia',yao:'iao',yan:'ian',yang:'iang',ye:'ie',yong:'iong',you:'iu',yu:'v',yue:'ve',yuan:'van',yun:'vn'};
  const w={wu:'u',wa:'ua',wai:'uai',wan:'uan',wang:'uang',wei:'ui',wen:'un',weng:'ueng',wo:'uo'};
  return y[base]||w[base]||base;
}

function pinyinSyllableToHindi(rawBase,tone){
  const apical={zhi:'चि',chi:'छि',shi:'शि',ri:'रि',zi:'त्सि',ci:'त्स्हि',si:'सि'};
  if(apical[rawBase])return apical[rawBase]+(tone?TONE_SUPERSCRIPT[tone]||'':'');
  let base=normalizePinyinBase(rawBase),initial='';
  for(const candidate of INITIALS){if(base.startsWith(candidate)){initial=candidate;base=base.slice(candidate.length);break}}
  if(['j','q','x'].includes(initial)&&base.startsWith('u'))base='v'+base.slice(1);
  const pair=FINAL_HI[base];if(!pair)return rawBase+(tone?TONE_SUPERSCRIPT[tone]||'':'');
  return(initial?(INITIAL_HI[initial]||initial)+pair[1]:pair[0])+(tone?TONE_SUPERSCRIPT[tone]||'':'');
}

function pinyinWordToHindi(token){
  const normalized=normalizePinyinToken(token),segments=segmentPinyin(normalized.chars);if(!segments)return token;
  return segments.map(segment=>{
    const tones=normalized.chars.slice(segment.start,segment.end).map(part=>part.tone).filter(Boolean),tone=tones[0]||(segments.length===1?normalized.trailingTone:0);
    return pinyinSyllableToHindi(segment.base,tone);
  }).join(' ');
}

function pinyinToHindi(text){
  return String(text||'').split(/(\p{L}+(?:[1-5])?)/gu).map((part,index)=>index%2?pinyinWordToHindi(part):part).join('').replace(/\s+([,.;!?，。！？])/g,'$1').replace(/\s{2,}/g,' ');
}

export function hindiPronunciation(courseOrCode,roman=''){
  const code=typeof courseOrCode==='string'?courseOrCode:courseOrCode?.id,value=String(roman||'').trim();
  if(!value||!['ja','zh'].includes(code))return'';
  if(code==='ja')return value.split(/(\p{L}+)/gu).map((part,index)=>index%2?japaneseWordToHindi(part):part).join('').replace(/\s{2,}/g,' ');
  return pinyinToHindi(value);
}

export function hindiPronunciationLabel(courseOrCode,roman=''){
  const code=typeof courseOrCode==='string'?courseOrCode:courseOrCode?.id,pron=hindiPronunciation(code,roman);if(!pron)return'';
  return`हिंदी उच्चारण${code==='zh'?' (¹²³⁴ टोन)':''}: ${pron}`;
}

function addHindiLine(element,course,roman){
  if(!element||!roman)return;
  const label=hindiPronunciationLabel(course,roman);if(!label)return;
  const br=document.createElement('br');br.dataset.hindiPronunciationBreak='true';
  const line=document.createElement('span');line.dataset.hindiPronunciation='true';line.lang='hi';line.className='tiny muted';line.textContent=label;
  if(course.id==='zh')line.title='Mandarin tone guide: ¹ high/level, ² rising, ³ dipping, ⁴ falling. Audio remains the pronunciation reference.';
  element.append(br,line);
}

export class HindiPronunciationController{
  constructor(courseController,practiceController){
    this.courseController=courseController;this.practiceController=practiceController;this.root=document.getElementById('courseScreen');this.observer=null;this.queued=false;
    if(!this.root)return;
    this.observer=new MutationObserver(()=>this.schedule());this.observe();this.schedule();
  }
  observe(){this.observer?.observe(this.root,{subtree:true,childList:true,characterData:true})}
  schedule(){if(this.queued)return;this.queued=true;requestAnimationFrame(()=>{this.queued=false;this.refresh()})}
  clean(){this.root?.querySelectorAll('[data-hindi-pronunciation],[data-hindi-pronunciation-break]').forEach(node=>node.remove())}
  refresh(){
    if(!this.root)return;
    this.observer?.disconnect();
    try{
      this.clean();
      const course=this.courseController?.course;if(!course||!['ja','zh'].includes(course.id))return;
      const item=this.courseController?.item;
      addHindiLine(document.getElementById('focusRoman'),course,item?.roman);
      addHindiLine(document.getElementById('exampleRoman'),course,item?.example?.roman);

      document.querySelectorAll('#lessonItems [data-item-index]').forEach(button=>{
        const candidate=this.courseController?.unit?.items?.[Number(button.dataset.itemIndex)||0];addHindiLine(button.querySelector('small'),course,candidate?.roman);
      });
      document.querySelectorAll('#wordGrid [data-word-id]').forEach(button=>{
        const word=course.vocab?.find(candidate=>candidate.id===button.dataset.wordId);addHindiLine(button.querySelector('b'),course,word?.roman);
      });

      const order=this.courseController?.cardOrder||[],cardIndex=this.courseController?.cardIndex||0,wordIndex=order.length?order[cardIndex%order.length]:null,cardWord=wordIndex==null?null:course.vocab?.[wordIndex];
      addHindiLine(document.getElementById('cardRoman'),course,cardWord?.roman);

      const readingRoman=this.courseController?.unit?.v9?.reading?.roman;
      addHindiLine(document.querySelector('#deepLesson .reading-native + small'),course,readingRoman);

      document.querySelectorAll('.guided-roman-v13').forEach(node=>addHindiLine(node,course,node.firstChild?.textContent||node.textContent));

      const target=this.practiceController?.target;
      addHindiLine(document.querySelector('#practiceBody .audio-prompt > b'),course,target?.roman);
      addHindiLine(document.getElementById('practiceReveal'),course,target?.roman);
      const listenAnswered=[...document.querySelectorAll('#practiceBody [data-listen-answer]')].some(button=>button.disabled);
      if(listenAnswered)addHindiLine(document.getElementById('practiceFeedback'),course,target?.roman);
    }finally{this.observe()}
  }
}
