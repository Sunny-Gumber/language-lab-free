// Language Lab Free — V7 content quality layer
// Expands course depth and corrects beginner teaching issues without changing the V6 engine.
(function(){
  if(typeof LANGUAGES==='undefined') return;
  const I=(native,roman,pron,guide,example,extra={})=>({
    native,roman,pron,guide,
    steps:extra.steps||['Study the model carefully','Trace or copy once','Hide the guide and reproduce from memory'],
    example:{native:example[0],roman:example[1],meaning:example[2]},
    ...extra
  });
  const W=(native,roman,meaning)=>({native,roman,meaning});
  const by=id=>LANGUAGES.find(l=>l.id===id);
  const mergeVocab=(lang,items)=>{const seen=new Set();lang.vocab=[...(lang.vocab||[]),...items].filter(v=>{const k=v.native.toLowerCase();if(seen.has(k))return false;seen.add(k);return true})};

  // Honest level naming until a full CEFR-aligned syllabus is complete.
  LANGUAGES.forEach(l=>{l.level='Starter · A1 Foundations'});

  // ───────────────────────── JAPANESE ─────────────────────────
  const ja=by('ja');
  if(ja){
    ja.level='A1 Foundations · Expanded';
    ja.description='Hiragana, Katakana, pronunciation, greetings and first sentence patterns.';
    ja.about='Japanese uses Hiragana, Katakana and Kanji. This foundation course first builds the sound system and kana, then immediately uses them in practical phrases and simple sentence patterns.';
    ja.pronTips=['Keep the five vowels short and pure: a, i, u, e, o.','Japanese rhythm is based on mora timing; avoid heavy English-style stress.','Long vowels, doubled consonants and small ゃ/ゅ/ょ can change meaning, so treat them as real sound differences.','Romanization is a temporary support—learn to recognize kana directly.'];
    ja.facts=[['Word order','A basic pattern is Topic–Object–Verb'],['Particles','Small words such as は, の, を and に show grammatical roles'],['Writing','Hiragana and Katakana are phonetic; Kanji adds meaning'],['Politeness','です / ます forms are useful safe beginner forms']];
    ja.units=[
      {title:'Japanese Sound System',goal:'Master the five clean Japanese vowels.',items:[
        I('あ','a','/a/ — like a short “ah”','Keep the vowel clean; do not glide toward “ay”.',['あさ','asa','morning'],{commonMistake:'Do not stretch it into an English diphthong.'}),
        I('い','i','/i/ — short “ee”','Keep the tongue high and the sound short.',['いぬ','inu','dog']),
        I('う','u','/ɯ/ — Japanese u','The lips are less rounded than English “oo”.',['うみ','umi','sea']),
        I('え','e','/e/ — clean “eh”','Avoid turning it into “ay”.',['えき','eki','station']),
        I('お','o','/o/ — short “oh”','Keep it a single vowel without an English glide.',['おと','oto','sound'])
      ]},
      {title:'Hiragana K Row',goal:'Read and pronounce か き く け こ.',items:[
        I('か','ka','/ka/','One mora: k + a.',['かお','kao','face']),I('き','ki','/ki/','One mora: k + i.',['きく','kiku','to listen / ask']),I('く','ku','/kɯ/','Keep Japanese u unrounded.',['くち','kuchi','mouth']),I('け','ke','/ke/','Clean e vowel.',['けさ','kesa','this morning']),I('こ','ko','/ko/','Short o vowel.',['ここ','koko','here'])
      ]},
      {title:'Hiragana S Row',goal:'Read さ し す せ そ and notice し.',items:[
        I('さ','sa','/sa/','s + a.',['さかな','sakana','fish']),I('し','shi','/ɕi/ — “shi”','This is not pronounced “si” in standard Japanese.',['しお','shio','salt']),I('す','su','/sɯ/','The u may sound light in natural speech.',['すし','sushi','sushi']),I('せ','se','/se/','s + e.',['せかい','sekai','world']),I('そ','so','/so/','s + o.',['そと','soto','outside'])
      ]},
      {title:'Hiragana T & N Rows',goal:'Learn the special sounds ち and つ plus the N row.',items:[
        I('た','ta','/ta/','t + a.',['たべる','taberu','to eat']),I('ち','chi','/tɕi/ — “chi”','Standard Japanese uses chi, not ti.',['ちず','chizu','map']),I('つ','tsu','/tsɯ/ — “tsu”','Start with ts, then the Japanese u.',['つき','tsuki','moon']),I('て','te','/te/','t + e.',['て','te','hand']),I('と','to','/to/','t + o.',['とき','toki','time']),I('な','na','/na/','n + a.',['なまえ','namae','name']),I('に','ni','/ni/','n + i.',['にく','niku','meat']),I('ぬ','nu','/nɯ/','n + Japanese u.',['いぬ','inu','dog']),I('ね','ne','/ne/','n + e.',['ねこ','neko','cat']),I('の','no','/no/','Also a very common possessive/linking particle.',['わたしの','watashi no','my / mine (before a noun)'])
      ]},
      {title:'Hiragana H & M Rows',goal:'Build another ten high-frequency kana.',items:[
        I('は','ha','/ha/; pronounced wa when used as the topic particle','As a kana it is ha; grammar can change the reading.',['はな','hana','flower / nose']),I('ひ','hi','/çi/','A softer h sound before i.',['ひと','hito','person']),I('ふ','fu','/ɸɯ/ — between English f and h','Blow gently through nearly closed lips.',['ふゆ','fuyu','winter']),I('へ','he','/he/; often e as a direction particle','Kana reading and particle reading can differ.',['へや','heya','room']),I('ほ','ho','/ho/','h + o.',['ほん','hon','book']),I('ま','ma','/ma/','m + a.',['まち','machi','town']),I('み','mi','/mi/','m + i.',['みず','mizu','water']),I('む','mu','/mɯ/','m + Japanese u.',['むし','mushi','insect']),I('め','me','/me/','m + e.',['め','me','eye']),I('も','mo','/mo/','Also means “also / too” as a particle.',['わたしも','watashi mo','me too'])
      ]},
      {title:'Complete Basic Hiragana',goal:'Finish Y, R, W and ん.',items:[
        I('や','ya','/ja/','y + a.',['やま','yama','mountain']),I('ゆ','yu','/jɯ/','y + Japanese u.',['ゆき','yuki','snow']),I('よ','yo','/jo/','y + o.',['よる','yoru','night']),I('ら','ra','Japanese r /ɾ/','Use a quick tongue tap; it is not English r.',['らいねん','rainen','next year']),I('り','ri','/ɾi/','Quick tapped r + i.',['りんご','ringo','apple']),I('る','ru','/ɾɯ/','Quick tap + Japanese u.',['くるま','kuruma','car']),I('れ','re','/ɾe/','Quick tap + e.',['れきし','rekishi','history']),I('ろ','ro','/ɾo/','Quick tap + o.',['ろく','roku','six']),I('わ','wa','/wa/','w + a.',['わたし','watashi','I / me']),I('ん','n','moraic n','Its exact sound adjusts slightly before the next consonant.',['ほん','hon','book'])
      ]},
      {title:'Voiced Sounds & Small っ',goal:'Recognize dakuten, handakuten and doubled consonants.',items:[
        I('が','ga','/ga/','か becomes が with dakuten.',['がくせい','gakusei','student']),I('ざ','za','/za/','さ becomes ざ with dakuten.',['ざっし','zasshi','magazine']),I('だ','da','/da/','た becomes だ with dakuten.',['だれ','dare','who']),I('ば','ba','/ba/','は becomes ば with dakuten.',['ばんごう','bangou','number']),I('ぱ','pa','/pa/','は becomes ぱ with handakuten.',['パン','pan','bread']),I('っ','small tsu','marks a doubled following consonant','Pause for one mora before the next consonant.',['きって','kitte','stamp'])
      ]},
      {title:'Contracted Sounds',goal:'Read small ゃ ゅ ょ combinations correctly.',items:[
        I('きゃ','kya','/kja/','き + small ゃ forms one combined sound.',['きゃく','kyaku','guest']),I('きゅ','kyu','/kjɯ/','One combined mora-like sound.',['きゅう','kyuu','nine']),I('きょ','kyo','/kjo/','Do not insert an extra i vowel.',['きょう','kyou','today']),I('しゃ','sha','/ɕa/','し + small ゃ.',['しゃしん','shashin','photo']),I('しゅ','shu','/ɕɯ/','し + small ゅ.',['しゅみ','shumi','hobby']),I('しょ','sho','/ɕo/','し + small ょ.',['しょくどう','shokudou','cafeteria'])
      ]},
      {title:'Katakana Foundations',goal:'Recognize the first Katakana used for foreign words.',items:[
        I('ア','a','/a/','Katakana version of the sound a.',['アジア','ajia','Asia']),I('イ','i','/i/','Katakana i.',['インド','indo','India']),I('ウ','u','/ɯ/','Katakana u.',['ウェブ','webu','web']),I('エ','e','/e/','Katakana e.',['エアコン','eakon','air conditioner']),I('オ','o','/o/','Katakana o.',['オレンジ','orenji','orange']),I('カ','ka','/ka/','Katakana ka.',['カメラ','kamera','camera']),I('コ','ko','/ko/','Katakana ko.',['コーヒー','koohii','coffee'])
      ]},
      {title:'Greetings & Polite Basics',goal:'Use five phrases you can say immediately.',items:[
        I('おはようございます','ohayou gozaimasu','Good morning — polite','Use in the morning; おはよう is more casual.',['おはようございます','ohayou gozaimasu','Good morning']),I('こんにちは','konnichiwa','Hello / good afternoon','The final は is written ha but pronounced wa here.',['こんにちは','konnichiwa','Hello']),I('こんばんは','konbanwa','Good evening','The final topic-particle は is pronounced wa.',['こんばんは','konbanwa','Good evening']),I('ありがとうございます','arigatou gozaimasu','Thank you — polite','A safe polite thank-you.',['ありがとうございます','arigatou gozaimasu','Thank you very much / politely']),I('すみません','sumimasen','Excuse me / sorry','Useful for getting attention, apologizing or politely interrupting.',['すみません、えきはどこですか','sumimasen, eki wa doko desu ka','Excuse me, where is the station?'])
      ]},
      {title:'Introduce Yourself',goal:'Say your name, nationality and a simple greeting.',items:[
        I('はじめまして','hajimemashite','Nice to meet you — first meeting','Use when meeting someone for the first time.',['はじめまして','hajimemashite','Nice to meet you']),I('わたしは ___ です','watashi wa ___ desu','I am ___','は marks the topic and is pronounced wa.',['わたしは サニー です','watashi wa Sanii desu','I am Sunny']),I('インドじんです','indo-jin desu','I am Indian','Country + じん expresses nationality.',['インドじんです','indo-jin desu','I am Indian']),I('よろしくおねがいします','yoroshiku onegaishimasu','A polite closing after an introduction','No single English translation; it expresses goodwill for the relationship.',['よろしくおねがいします','yoroshiku onegaishimasu','Pleased to meet you / I look forward to your kindness']),I('おなまえは？','onamae wa?','Your name?','A short conversational question; add なんですか for a fuller polite form.',['おなまえは なんですか','onamae wa nan desu ka','What is your name?'])
      ]},
      {title:'Numbers & Time Basics',goal:'Recognize useful numbers and ask the time.',items:[
        I('いち','ichi','one','Keep each mora clear.',['いち','ichi','one']),I('に','ni','two','Short ni.',['に','ni','two']),I('さん','san','three','Moraic ん closes the word.',['さん','san','three']),I('よん','yon','four','よん is a common standalone reading for four.',['よん','yon','four']),I('ご','go','five','Short go.',['ご','go','five']),I('なんじですか','nanji desu ka','What time is it?','なんじ = what time; ですか makes a polite question.',['いま なんじですか','ima nanji desu ka','What time is it now?'])
      ]},
      {title:'First Sentence Patterns',goal:'Understand は, の, を and に in simple sentences.',items:[
        I('は','wa (particle)','topic marker','Written は but normally pronounced wa when it marks the topic.',['わたしは がくせいです','watashi wa gakusei desu','I am a student']),I('の','no','links nouns / possession','Often works like “of” or possessive ’s.',['わたしの ほん','watashi no hon','my book']),I('を','o (particle)','direct-object marker','Written を and usually pronounced o in modern Japanese.',['みずを のみます','mizu o nomimasu','I drink water']),I('に','ni','time / destination / target marker','One common use is marking a destination or specific time.',['がっこうに いきます','gakkou ni ikimasu','I go to school']),I('です','desu','polite copula / sentence ending','Often used after nouns and な-adjectives in polite beginner sentences.',['これは ほんです','kore wa hon desu','This is a book'])
      ]}
    ];
    ja.vocab=[
      W('おはようございます','ohayou gozaimasu','Good morning (polite)'),W('こんにちは','konnichiwa','Hello / good afternoon'),W('こんばんは','konbanwa','Good evening'),W('ありがとうございます','arigatou gozaimasu','Thank you (polite)'),W('すみません','sumimasen','Excuse me / Sorry'),W('はい','hai','Yes'),W('いいえ','iie','No'),W('わたし','watashi','I / me'),W('あなた','anata','you (use selectively; names/titles are often preferred)'),W('なまえ','namae','name'),W('ひと','hito','person'),W('ともだち','tomodachi','friend'),W('がくせい','gakusei','student'),W('せんせい','sensei','teacher'),W('みず','mizu','water'),W('ごはん','gohan','rice / meal'),W('パン','pan','bread'),W('コーヒー','koohii','coffee'),W('ほん','hon','book'),W('カメラ','kamera','camera'),W('でんわ','denwa','telephone'),W('いえ','ie','home / house'),W('えき','eki','station'),W('がっこう','gakkou','school'),W('みせ','mise','shop'),W('くるま','kuruma','car'),W('ねこ','neko','cat'),W('いぬ','inu','dog'),W('きょう','kyou','today'),W('あした','ashita','tomorrow'),W('いま','ima','now'),W('ここ','koko','here'),W('そこ','soko','there near you'),W('どこ','doko','where'),W('なに','nani','what'),W('だれ','dare','who'),W('いち','ichi','one'),W('に','ni','two'),W('さん','san','three'),W('よん','yon','four'),W('ご','go','five'),W('たべます','tabemasu','eat (polite)'),W('のみます','nomimasu','drink (polite)'),W('いきます','ikimasu','go (polite)'),W('みます','mimasu','see / watch (polite)'),W('ききます','kikimasu','listen / ask (polite)'),W('おねがいします','onegaishimasu','please / request phrase'),W('わかりません','wakarimasen','I do not understand'),W('もういちど おねがいします','mou ichido onegaishimasu','One more time, please')
    ];
  }

  // ───────────────────────── MANDARIN ─────────────────────────
  const zh=by('zh');
  if(zh){
    zh.description='Pinyin, four tones, tone combinations, high-frequency characters and first conversations.';
    zh.pronTips=['Learn the tone together with every syllable, not as an optional extra.','Third tone often changes in connected speech; before another third tone it is commonly realized like a rising second tone.','Practice initials and finals in Pinyin rather than reading Pinyin with English spelling rules.','Neutral tone is short and light but still meaningful in natural speech.'];
    const chars=zh.units[0];
    chars.items.find(x=>x.native==='是').example={native:'我是学生',roman:'wǒ shì xuésheng',meaning:'I am a student'};
    const shi=chars.items.find(x=>x.native==='是');if(shi){shi.pron='shì — 4th tone';shi.guide='A strong falling tone. 是 is mainly the copula “to be” in beginner sentences; it is not a universal replacement for English “yes”.'}
    zh.units=[
      {title:'Pinyin & Four Tones',goal:'Hear and produce the four main tones before relying on characters.',items:[
        I('mā','mā','1st tone — high and level','Hold a steady high pitch.',['妈','mā','mother']),I('má','má','2nd tone — rising','Rise from mid toward high, similar to a questioning rise.',['麻','má','hemp']),I('mǎ','mǎ','3rd tone — low/dipping','In isolation it dips low; in connected speech it often stays low or changes by tone context.',['马','mǎ','horse']),I('mà','mà','4th tone — sharp falling','Start relatively high and fall firmly.',['骂','mà','to scold']),I('ma','ma','neutral tone — light','Say it briefly and lightly after the stressed syllable.',['好吗？','hǎo ma?','Is it okay? / How about it?'])
      ]},chars,
      {title:'Greetings & Basic Questions',goal:'Use high-frequency HSK-style beginner phrases.',items:[
        I('你好','nǐ hǎo','hello','In natural speech, the first third tone commonly changes toward a rising tone before the second third tone.',['你好！','nǐ hǎo','Hello!']),I('谢谢','xièxie','thank you','First syllable has 4th tone; the second is commonly neutral/light.',['谢谢你','xièxie nǐ','Thank you']),I('再见','zàijiàn','goodbye','Both syllables carry clear lexical tones.',['明天见','míngtiān jiàn','See you tomorrow']),I('你叫什么名字？','nǐ jiào shénme míngzi?','What is your name?','叫什么名字 asks what someone is called.',['我叫 Sunny','wǒ jiào Sunny','My name is Sunny']),I('你好吗？','nǐ hǎo ma?','How are you?','吗 turns a statement into a yes/no question.',['我很好','wǒ hěn hǎo','I am very well'])
      ]}
    ];
    mergeVocab(zh,[W('我叫…','wǒ jiào…','My name is…'),W('学生','xuésheng','student'),W('老师','lǎoshī','teacher'),W('今天','jīntiān','today'),W('明天','míngtiān','tomorrow'),W('现在','xiànzài','now'),W('哪里','nǎlǐ','where'),W('什么','shénme','what'),W('多少','duōshao','how many / how much'),W('请','qǐng','please'),W('对不起','duìbuqǐ','sorry'),W('没关系','méi guānxi','it is okay / no problem'),W('吃','chī','to eat'),W('喝','hē','to drink'),W('去','qù','to go'),W('看','kàn','to look / watch')]);
  }

  // ───────────────────────── KOREAN ─────────────────────────
  const ko=by('ko');
  if(ko){
    ko.description='Hangul building blocks, syllable formation, polite greetings and first Korean phrases.';
    const syllables=ko.units[0];
    ko.units=[
      {title:'Hangul Building Blocks',goal:'Understand how consonants and vowels combine into syllable blocks.',items:[
        I('ㅏ','a','/a/','A vertical vowel; in 가 it combines with ㄱ.',['가','ga','syllable ga']),I('ㅓ','eo','/ʌ/ roughly “uh”','Do not read romanized eo as two separate vowels.',['너','neo','you (casual)']),I('ㄱ','g/k','between g and k depending on position','Korean stops change by position and context; avoid forcing one English equivalent.',['가','ga','go / syllable ga']),I('ㄴ','n','n','A stable n-like consonant.',['나','na','I / me (casual)']),I('ㅁ','m','m','A stable m-like consonant.',['마음','maeum','heart / mind'])
      ]},syllables,
      {title:'Polite Everyday Korean',goal:'Use safe beginner phrases with appropriate politeness.',items:[
        I('안녕하세요','annyeonghaseyo','Hello — polite','A standard polite greeting in many everyday situations.',['안녕하세요','annyeonghaseyo','Hello']),I('감사합니다','gamsahamnida','Thank you — formal/polite','Often pronounced with connected-speech changes; copy the audio rather than spelling each letter separately.',['감사합니다','gamsahamnida','Thank you']),I('저는 ___예요/이에요','jeoneun ___yeyo/ieyo','I am ___','Use 저는 for polite “as for me”; the copula form depends on whether the noun ends in a vowel or consonant.',['저는 학생이에요','jeoneun haksaeng-ieyo','I am a student']),I('이름이 뭐예요?','ireumi mwoyeyo?','What is your name?','Literally asks “What is the name?” in polite style.',['제 이름은 Sunny예요','je ireumeun Sunny-yeyo','My name is Sunny']),I('괜찮아요','gwaenchanayo','It is okay / I am okay','A very useful polite everyday response.',['네, 괜찮아요','ne, gwaenchanayo','Yes, I am okay'])
      ]}
    ];
    mergeVocab(ko,[W('저','jeo','I / me (polite)'),W('제','je','my (polite)'),W('이름','ireum','name'),W('학생','haksaeng','student'),W('선생님','seonsaengnim','teacher'),W('오늘','oneul','today'),W('내일','naeil','tomorrow'),W('지금','jigeum','now'),W('어디','eodi','where'),W('뭐','mwo','what'),W('먹어요','meogeoyo','eat (polite)'),W('마셔요','masyeoyo','drink (polite)'),W('가요','gayo','go (polite)'),W('봐요','bwayo','see / watch (polite)')]);
  }

  // ───────────────────────── ENGLISH ─────────────────────────
  const en=by('en');
  if(en){
    en.flag='🇺🇸';en.locale='en-US';
    en.description='International beginner English with US speech audio, useful sound contrasts and everyday conversation.';
    en.scriptName='Latin alphabet + English sound system';
    en.scriptText='English uses 26 letters, but letters and sounds do not match one-to-one. This course therefore teaches sounds through real words instead of pretending a letter has only one sound.';
    en.units=[
      {title:'High-Value Sound Contrasts',goal:'Notice English sounds that commonly change word meaning.',items:[
        I('cat','cat','/kæt/ — short a','Focus on /æ/, not the letter name A.',['cat','cat','a cat']),I('cut','cut','/kʌt/ — central vowel','Contrast it with cat.',['cut','cut','to cut']),I('sit','sit','/sɪt/ — short i','Keep it shorter and more relaxed than “seat”.',['sit','sit','to sit']),I('seat','seat','/siːt/ — long ee','Hold the vowel longer than in sit.',['seat','seat','a seat']),I('think','think','/θɪŋk/','Place the tongue lightly between the teeth for /θ/.',['I think so.','I think so','I believe so'])
      ]},
      {title:'Everyday Introductions',goal:'Introduce yourself and ask simple questions naturally.',items:[
        I('Hello','hello','HEL-lo','Stress the first syllable lightly.',['Hello, how are you?','hello, how are you','Greeting']),I('My name is ___','my name is','Natural introduction phrase','In conversation, “I’m ___” is also very common.',['My name is Sunny.','my name is Sunny','Introduce your name']),I('I am from ___','I am from','Say the country/place after from.',['I am from India.','I am from India','Say where you are from']),I('What is your name?','what is your name','Question intonation','In speech, “What’s your name?” is common.',['What is your name?','what is your name','Ask someone’s name']),I('Nice to meet you.','nice to meet you','Polite first-meeting phrase','Stress “nice” and “meet” naturally rather than every word equally.',['Nice to meet you, too.','nice to meet you too','Reply to an introduction'])
      ]}
    ];
    mergeVocab(en,[W('Sorry','sorry','Apology'),W('Excuse me','excuse me','Get attention / pass politely'),W('Where?','where','Ask about place'),W('What?','what','Ask about a thing'),W('Who?','who','Ask about a person'),W('Today','today','Current day'),W('Tomorrow','tomorrow','Next day'),W('Eat','eat','consume food'),W('Drink','drink','consume a beverage'),W('Go','go','move to another place'),W('Work','work','job / activity'),W('School','school','place of education')]);
  }

  // ───────────────────────── HINDI ─────────────────────────
  const hi=by('hi');
  if(hi){
    hi.description='Devanagari vowels, matras, consonant contrasts and practical Hindi sentences.';
    const vowels=hi.units[0];
    hi.units=[vowels,
      {title:'Matras in Real Syllables',goal:'See how vowel signs change a consonant such as क.',items:[
        I('क','ka','inherent a vowel','A bare consonant usually carries an inherent vowel unless suppressed.',['कम','kam','less']),I('का','kaa','long aa','ा adds long ā after the consonant.',['काम','kaam','work']),I('कि','ki','short i','The ि sign is written visually before the consonant but pronounced after it.',['किताब','kitaab','book']),I('की','kee','long ee','ी gives the long ī sound.',['कीमत','keemat','price']),I('कु','ku','short u','ु attaches below the consonant.',['कुर्सी','kursi','chair'])
      ]},
      {title:'Important Consonant Contrasts',goal:'Hear dental/retroflex and aspirated/unaspirated contrasts.',items:[
        I('त','ta (dental)','dental t','Touch the tongue near the upper teeth.',['तीन','teen','three']),I('ट','ṭa (retroflex)','retroflex t','Curl the tongue tip slightly back; this is distinct from त.',['टमाटर','tamaatar','tomato']),I('क','ka','unaspirated k','Use little air after the release.',['कल','kal','yesterday / tomorrow by context']),I('ख','kha','aspirated kh','Release a noticeable puff of air.',['खाना','khaana','food / to eat']),I('ग','ga','g','Voiced counterpart in the velar series.',['घर','ghar','house'])
      ]},
      {title:'Everyday Introductions',goal:'Use polite Hindi for greetings and introductions.',items:[
        I('नमस्ते','namaste','Hello / respectful greeting','Widely understood across formal and informal contexts.',['नमस्ते','namaste','Hello']),I('मेरा नाम ___ है','mera naam ___ hai','My name is ___','मेरा agrees with the masculine noun नाम.',['मेरा नाम सनी है','mera naam Sunny hai','My name is Sunny']),I('आप कैसे हैं?','aap kaise hain?','How are you? — polite','For a woman, कैसी हैं is common; agreement depends on the person addressed.',['आप कैसे हैं?','aap kaise hain','How are you?']),I('मैं ठीक हूँ','main theek hoon','I am fine','हूँ is the first-person singular form of होना in this present construction.',['मैं ठीक हूँ','main theek hoon','I am fine']),I('धन्यवाद','dhanyavaad','Thank you','A standard formal thank-you; शुक्रिया is also common.',['बहुत धन्यवाद','bahut dhanyavaad','Thank you very much'])
      ]}
    ];
    mergeVocab(hi,[W('मैं','main','I'),W('आप','aap','you (polite)'),W('नाम','naam','name'),W('काम','kaam','work'),W('किताब','kitaab','book'),W('स्कूल','school','school'),W('आज','aaj','today'),W('कल','kal','yesterday / tomorrow depending on context'),W('अभी','abhi','now / right now'),W('कहाँ','kahaan','where'),W('क्या','kya','what'),W('कौन','kaun','who'),W('खाना','khaana','food / to eat'),W('पीना','peena','to drink'),W('जाना','jaana','to go')]);
  }

  // ───────────────────────── SPANISH ─────────────────────────
  const es=by('es');
  if(es){
    es.description='Stable vowels, greetings, introductions and first practical Spanish questions.';
    es.units=[es.units[0],
      {title:'Greetings & Introductions',goal:'Handle a first conversation in simple Spanish.',items:[
        I('Hola','hola','OH-la','The h is silent.',['Hola, ¿cómo estás?','hola, cómo estás','Hello, how are you?']),I('Me llamo ___','me llamo','My name is ___','ll pronunciation varies by region; follow the selected audio model.',['Me llamo Sunny','me llamo Sunny','My name is Sunny']),I('¿Cómo te llamas?','cómo te llamas','What is your name?','Use with one person in an informal setting.',['¿Cómo te llamas?','cómo te llamas','What is your name?']),I('Soy de ___','soy de','I am from ___','soy is a form of ser used for identity/origin.',['Soy de India','soy de India','I am from India']),I('Mucho gusto','mucho gusto','Nice to meet you','A common first-meeting phrase.',['Mucho gusto','mucho gusto','Nice to meet you'])
      ]},
      {title:'Useful Questions',goal:'Ask for places, prices and clarification.',items:[
        I('¿Dónde está…?','dónde está','Where is…?','Dónde carries an accent in questions.',['¿Dónde está la estación?','dónde está la estación','Where is the station?']),I('¿Cuánto cuesta?','cuánto cuesta','How much does it cost?','Useful for shopping.',['¿Cuánto cuesta esto?','cuánto cuesta esto','How much does this cost?']),I('No entiendo','no entiendo','I do not understand','A useful survival phrase.',['Lo siento, no entiendo','lo siento, no entiendo','Sorry, I do not understand']),I('Más despacio, por favor','más despacio, por favor','More slowly, please','Useful when listening is difficult.',['Más despacio, por favor','más despacio, por favor','More slowly, please']),I('¿Puede repetir?','puede repetir','Can you repeat?','A polite request using usted-style verb form.',['¿Puede repetir, por favor?','puede repetir, por favor','Can you repeat, please?'])
      ]}
    ];
    mergeVocab(es,[W('estación','estación','station'),W('aquí','aquí','here'),W('allí','allí','there'),W('hoy','hoy','today'),W('mañana','mañana','tomorrow / morning by context'),W('ahora','ahora','now'),W('qué','qué','what'),W('dónde','dónde','where'),W('quién','quién','who'),W('comer','comer','to eat'),W('beber','beber','to drink'),W('ir','ir','to go'),W('entender','entender','to understand')]);
  }

  // ───────────────────────── FRENCH ─────────────────────────
  const fr=by('fr');
  if(fr){
    fr.description='French vowel awareness, polite greetings, liaison awareness and first conversations.';
    const core=fr.units[0];
    const eacute=core.items.find(x=>x.native==='É');if(eacute){eacute.pron='/e/ — a close front vowel';eacute.guide='Keep it a pure vowel; English “ay” is only a rough hint and adds an unwanted glide.'}
    fr.units=[core,
      {title:'Polite First Conversation',goal:'Greet, introduce yourself and ask a name.',items:[
        I('Bonjour','bonjour','/bɔ̃.ʒuʁ/ roughly bon-ZHOOR','The first vowel is nasal; avoid pronouncing every written letter separately.',['Bonjour !','bonjour','Hello / good day']),I('Je m’appelle ___','je m’appelle','My name is ___','A standard self-introduction.',['Je m’appelle Sunny','je m’appelle Sunny','My name is Sunny']),I('Comment vous appelez-vous ?','comment vous appelez-vous','What is your name? — polite','Use vous for polite/formal address or plural you.',['Comment vous appelez-vous ?','comment vous appelez-vous','What is your name?']),I('Je suis de ___','je suis de','I am from ___','Use de + place, with contractions/changes for some country names.',['Je suis d’Inde','je suis d’Inde','I am from India']),I('Enchanté','enchanté','Nice to meet you','Traditional written form may vary by speaker gender: enchanté / enchantée.',['Enchanté !','enchanté','Nice to meet you'])
      ]},
      {title:'Survival French',goal:'Ask for help and manage simple interactions.',items:[
        I('Où est… ?','où est','Where is…?','où means where; ou without accent means or.',['Où est la gare ?','où est la gare','Where is the station?']),I('Combien ça coûte ?','combien ça coûte','How much does it cost?','Useful in shops and markets.',['Combien ça coûte ?','combien ça coûte','How much is it?']),I('Je ne comprends pas','je ne comprends pas','I do not understand','In careful/formal speech the full negation is useful for learners.',['Désolé, je ne comprends pas','désolé, je ne comprends pas','Sorry, I do not understand']),I('Plus lentement, s’il vous plaît','plus lentement, s’il vous plaît','More slowly, please','A polite listening-repair phrase.',['Plus lentement, s’il vous plaît','plus lentement, s’il vous plaît','More slowly, please']),I('Vous pouvez répéter ?','vous pouvez répéter','Can you repeat?','A polite conversational request.',['Vous pouvez répéter ?','vous pouvez répéter','Can you repeat?'])
      ]}
    ];
    mergeVocab(fr,[W('gare','gare','station'),W('ici','ici','here'),W('là','là','there'),W('aujourd’hui','aujourd’hui','today'),W('demain','demain','tomorrow'),W('maintenant','maintenant','now'),W('où','où','where'),W('quoi','quoi','what'),W('qui','qui','who'),W('manger','manger','to eat'),W('boire','boire','to drink'),W('aller','aller','to go'),W('comprendre','comprendre','to understand')]);
  }

  // ───────────────────────── GERMAN ─────────────────────────
  const de=by('de');
  if(de){
    de.description='German sound contrasts, umlauts, greetings and first useful sentence patterns.';
    de.units=[de.units[0],
      {title:'Greetings & Introductions',goal:'Handle a polite first meeting.',items:[
        I('Guten Tag','guten Tag','Good day','A safe polite daytime greeting.',['Guten Tag!','guten Tag','Good day / Hello']),I('Ich heiße ___','ich heiße','My name is ___','heißen is commonly used to state a name.',['Ich heiße Sunny','ich heiße Sunny','My name is Sunny']),I('Wie heißen Sie?','wie heißen Sie','What is your name? — polite','Sie is the formal “you” and is capitalized.',['Wie heißen Sie?','wie heißen Sie','What is your name?']),I('Ich komme aus ___','ich komme aus','I come from ___','A natural way to state origin.',['Ich komme aus Indien','ich komme aus Indien','I am from India']),I('Freut mich','freut mich','Nice to meet you','Literally expresses “pleases me”; common in introductions.',['Freut mich!','freut mich','Nice to meet you'])
      ]},
      {title:'Survival German',goal:'Ask for location, price and repetition.',items:[
        I('Wo ist…?','wo ist','Where is…?','wo asks location.',['Wo ist der Bahnhof?','wo ist der Bahnhof','Where is the station?']),I('Wie viel kostet das?','wie viel kostet das','How much does that cost?','Useful for shopping.',['Wie viel kostet das?','wie viel kostet das','How much is that?']),I('Ich verstehe nicht','ich verstehe nicht','I do not understand','nicht negates the understanding statement.',['Entschuldigung, ich verstehe nicht','Entschuldigung, ich verstehe nicht','Sorry, I do not understand']),I('Langsamer, bitte','langsamer, bitte','More slowly, please','A concise useful request.',['Langsamer, bitte','langsamer, bitte','More slowly, please']),I('Können Sie das wiederholen?','können Sie das wiederholen','Can you repeat that?','Formal polite request with Sie.',['Können Sie das wiederholen?','können Sie das wiederholen','Can you repeat that?'])
      ]}
    ];
    mergeVocab(de,[W('Bahnhof','Bahnhof','station'),W('hier','hier','here'),W('dort','dort','there'),W('heute','heute','today'),W('morgen','morgen','tomorrow / morning by context'),W('jetzt','jetzt','now'),W('wo','wo','where'),W('was','was','what'),W('wer','wer','who'),W('essen','essen','to eat'),W('trinken','trinken','to drink'),W('gehen','gehen','to go'),W('verstehen','verstehen','to understand')]);
  }

  // ───────────────────────── ARABIC ─────────────────────────
  const ar=by('ar');
  if(ar){
    ar.description='Modern Standard Arabic foundations: right-to-left script, joining forms, greetings and essential phrases.';
    const letters=ar.units[0];
    ar.units=[letters,
      {title:'How Arabic Letters Join',goal:'Recognize that one letter may look different by position.',items:[
        I('ب / بـ / ـبـ / ـب','baa forms','b','These are isolated, initial, medial and final shapes of the same letter ب.',['باب','baab','door'],{steps:['Compare the four positional forms','Trace each form right-to-left','Write باب and identify both ب forms']}),I('ت / تـ / ـتـ / ـت','taa forms','t','Same base shape as ب but with two dots above.',['بيت','bayt','house'],{steps:['Compare isolated and connected forms','Keep the dots clearly above','Copy بيت right-to-left']}),I('م / مـ / ـمـ / ـم','miim forms','m','م changes noticeably when connected.',['ماء','maaʾ','water'],{steps:['Observe the head shape','Compare initial and final forms','Copy a short word containing م']}),I('ن / نـ / ـنـ / ـن','nuun forms','n','One dot remains above the shape.',['نعم','naʿam','yes'],{steps:['Locate the dot','Compare connected shapes','Copy نعم right-to-left']}),I('ا','alif connection rule','aa / carrier','ا does not connect to the following letter on its left; this affects word shape.',['أنا','anaa','I'],{steps:['Write the vertical form','Notice the break after ا when applicable','Copy أنا right-to-left']})
      ]},
      {title:'Greetings & Introductions',goal:'Use clear Modern Standard Arabic beginner phrases.',items:[
        I('السلام عليكم','as-salaamu ʿalaykum','Peace be upon you / hello','A widely used greeting; a common response is وعليكم السلام.',['وعليكم السلام','wa ʿalaykum as-salaam','And peace be upon you']),I('اسمي ___','ismii','My name is ___','اسمي literally means “my name”.',['اسمي سني','ismii Sunny','My name is Sunny']),I('ما اسمك؟','maa ismuka / ismuki?','What is your name?','The ending can vary with the gender of the person addressed.',['ما اسمك؟','maa ismuk?','What is your name?']),I('أنا من الهند','anaa min al-hind','I am from India','أنا = I, من = from.',['أنا من الهند','anaa min al-hind','I am from India']),I('تشرفت بمعرفتك','tasharraftu bimaʿrifatik','Pleased to meet you','A formal MSA-style expression; spoken dialects often use different everyday phrases.',['تشرفت بمعرفتك','tasharraftu bimaʿrifatik','Pleased to meet you'])
      ]}
    ];
    mergeVocab(ar,[W('أنا','anaa','I'),W('اسمي','ismii','my name'),W('الهند','al-hind','India'),W('اليوم','al-yawm','today'),W('غداً','ghadan','tomorrow'),W('الآن','al-aan','now'),W('أين','ayna','where'),W('ماذا','maadhaa','what'),W('من','man','who'),W('آكل','aakulu','I eat'),W('أشرب','ashrabu','I drink'),W('أذهب','adhhabu','I go'),W('لا أفهم','laa afham','I do not understand'),W('مرة أخرى من فضلك','marra ukhra min fadlik','One more time, please')]);
  }

  // ───────────────────────── PORTUGUESE ─────────────────────────
  const pt=by('pt');
  if(pt){
    pt.description='European Portuguese foundations: vowel reduction, nasal vowels, greetings and practical phrases.';
    pt.about='This course currently follows European Portuguese (Portugal) for speech audio and examples. Brazilian Portuguese is closely related but differs substantially in pronunciation and some everyday usage; it should be offered as a separate selectable variety rather than mixed silently.';
    pt.units=[pt.units[0],
      {title:'Greetings & Introductions',goal:'Start a simple conversation in European Portuguese.',items:[
        I('Olá','olá','Hello','Stress the final á.',['Olá, tudo bem?','olá, tudo bem','Hello, is everything well?']),I('Chamo-me ___','chamo-me','My name is ___','A natural European Portuguese self-introduction; “Eu chamo-me…” is also possible.',['Chamo-me Sunny','chamo-me Sunny','My name is Sunny']),I('Como se chama?','como se chama','What is your name? — polite','A polite/formal question.',['Como se chama?','como se chama','What is your name?']),I('Sou da Índia','sou da Índia','I am from India','da = de + a.',['Sou da Índia','sou da Índia','I am from India']),I('Muito prazer','muito prazer','Nice to meet you','A standard polite first-meeting phrase.',['Muito prazer','muito prazer','Nice to meet you'])
      ]},
      {title:'Survival Portuguese',goal:'Ask for location, price and repetition.',items:[
        I('Onde fica…?','onde fica','Where is…?','Useful for locations.',['Onde fica a estação?','onde fica a estação','Where is the station?']),I('Quanto custa?','quanto custa','How much does it cost?','Useful in shops.',['Quanto custa isto?','quanto custa isto','How much does this cost?']),I('Não percebo','não percebo','I do not understand','Very natural in European Portuguese; “não entendo” is also understood.',['Desculpe, não percebo','desculpe, não percebo','Sorry, I do not understand']),I('Mais devagar, por favor','mais devagar, por favor','More slowly, please','Useful when speech is too fast.',['Mais devagar, por favor','mais devagar, por favor','More slowly, please']),I('Pode repetir?','pode repetir','Can you repeat?','A polite concise request.',['Pode repetir, por favor?','pode repetir, por favor','Can you repeat, please?'])
      ]}
    ];
    mergeVocab(pt,[W('estação','estação','station'),W('aqui','aqui','here'),W('ali','ali','there'),W('hoje','hoje','today'),W('amanhã','amanhã','tomorrow'),W('agora','agora','now'),W('onde','onde','where'),W('o quê','o quê','what'),W('quem','quem','who'),W('comer','comer','to eat'),W('beber','beber','to drink'),W('ir','ir','to go'),W('perceber','perceber','to understand')]);
  }

  // Add a compact curriculum fact to each guide so learners know what this build represents.
  LANGUAGES.forEach(l=>{
    l.facts=l.facts||[];
    if(!l.facts.some(x=>x[0]==='Course stage')) l.facts.push(['Course stage','A1 foundations — designed to build pronunciation, literacy and first practical conversations before deeper grammar.']);
  });
})();