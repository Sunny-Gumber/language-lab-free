import{normalizeText,similarity}from'./utils.js';

// Browser Japanese speech recognition often returns the normal Kanji spelling
// even when the course deliberately teaches the same word in Kana. These are
// authored course equivalences, not a general-purpose Japanese dictionary.
const JA_ALIASES=new Map([
  ['あさ',['朝']],['いぬ',['犬']],['うみ',['海']],['えき',['駅']],['おと',['音']],
  ['かお',['顔']],['きく',['聞く','聴く']],['くち',['口']],['けさ',['今朝']],
  ['さかな',['魚']],['しお',['塩']],['すし',['寿司']],['せかい',['世界']],['そと',['外']],
  ['たべる',['食べる']],['ちず',['地図']],['つき',['月']],['て',['手']],['とき',['時']],
  ['なまえ',['名前']],['にく',['肉']],['ねこ',['猫']],['はな',['花','鼻']],['ひと',['人']],
  ['ふゆ',['冬']],['へや',['部屋']],['ほん',['本']],['まち',['町','街']],['みず',['水']],
  ['むし',['虫']],['め',['目']],['やま',['山']],['ゆき',['雪']],['よる',['夜']],
  ['らいねん',['来年']],['りんご',['林檎']],['くるま',['車']],['れきし',['歴史']],['ろく',['六']],
  ['わたし',['私']],['がくせい',['学生']],['ざっし',['雑誌']],['だれ',['誰']],['ばんごう',['番号']],
  ['パン',['ぱん']],['きって',['切手']],['きゃく',['客']],['きゅう',['九']],['きょう',['今日']],
  ['しゃしん',['写真']],['しゅみ',['趣味']],['しょくどう',['食堂']],
  ['こんにちは',['今日は']],['こんばんは',['今晩は']],['ありがとうございます',['有難うございます']],
  ['すみません',['済みません']],['はじめまして',['初めまして']],['おなまえは',['お名前は','御名前は']],
  ['いち',['一']],['に',['二']],['さん',['三']],['よん',['四']],['ご',['五']],['なんじですか',['何時ですか']],
  ['わたしは がくせいです',['私は学生です']],['わたしの ほん',['私の本']],
  ['みずを のみます',['水を飲みます']],['がっこうに いきます',['学校に行きます']],['これは ほんです',['これは本です']]
]);

function aliasesFor(courseOrCode,target,extra=[]){
  const code=typeof courseOrCode==='string'?courseOrCode:courseOrCode?.id;
  const aliases=[...(Array.isArray(extra)?extra:[])];
  if(code==='ja')aliases.push(...(JA_ALIASES.get(String(target||'').trim())||[]));
  return [...new Set([target,...aliases].filter(Boolean))];
}

export function speechTranscriptMatch(courseOrCode,transcripts,target,{aliases=[]}={}){
  const heard=(Array.isArray(transcripts)?transcripts:[transcripts]).filter(Boolean);
  const expected=aliasesFor(courseOrCode,target,aliases);
  let best={score:0,transcript:heard[0]||'',expected:target||'',equivalent:false};
  for(const transcript of heard){
    for(const candidate of expected){
      const score=similarity(transcript,candidate);
      if(score>best.score)best={score,transcript,expected:candidate,equivalent:normalizeText(candidate)!==normalizeText(target)};
    }
  }
  return best;
}

export function speechMatchLabel(match,target){
  if(match?.equivalent&&match.score>=.85)return`Accepted equivalent Japanese spelling for ${target}.`;
  return'';
}
