// Language Lab Free — V9 integrated course quality layer
(function(){
  if(typeof LANGUAGES==='undefined') return;
  const by=id=>LANGUAGES.find(l=>l.id===id);
  const V=(native,roman,meaning)=>({native,roman,meaning});
  const C=(char,reading,meaning)=>({char,reading,meaning});

  function stageUnits(lang,stage){return lang.units.filter(u=>u.stage===stage)}
  function addPack(unit,pack){unit.v9={...(unit.v9||{}),...pack}}
  function assignStagePacks(lang,stage,templates,chars,tasks){
    const units=stageUnits(lang,stage);if(!units.length)return;
    units.forEach((u,i)=>{
      const t=templates[i%templates.length];
      const start=(i*3)%chars.length;
      const focus=[chars[start],chars[(start+1)%chars.length],chars[(start+2)%chars.length]];
      addPack(u,{
        objectives:[u.goal,t.objective,'Use at least one target without looking at the model.'],
        dialogue:t.dialogue,
        reading:t.reading,
        characterFocus:focus,
        production:tasks[i%tasks.length],
        note:t.note||''
      });
    });
  }

  const ja=by('ja');
  if(ja){
    ja.courseQuality={version:9,label:'Integrated Japanese Course',alignment:'Beginner to advanced practical progression; not an official JLPT course.',principles:['Kana and sound before heavy grammar','Grammar always paired with usable context','Reading and production from early stages','Register and politeness introduced gradually','Kanji focus grows with stage']};
    ja.level='Integrated Beginner → Advanced';
    ja.description='Japanese with pronunciation, kana, grammar, dialogues, reading, kanji focus and guided production from beginner to advanced.';
    ja.stageCheckpoints={
      'beginner-1':{title:'Beginner I checkpoint',canDo:['Read the core kana covered so far','Give a simple greeting and self-introduction','Understand basic particles in short sentences'],task:'Introduce yourself in 3–4 short Japanese sentences.'},
      'beginner-2':{title:'Beginner II checkpoint',canDo:['Handle numbers, time and common survival phrases','Recognize first sentence patterns','Read short mixed-kana phrases without relying fully on romanization'],task:'Create a short daily-life exchange using a greeting, time and one request.'},
      elementary:{title:'Elementary checkpoint',canDo:['Use て-form, past and ability patterns','Describe people/places with adjectives','Handle location, shopping and counters'],task:'Role-play buying something, asking permission and saying what you did yesterday.'},
      intermediate:{title:'Intermediate checkpoint',canDo:['Use plain forms and connected clauses','Compare options and give reasons','Understand relative clauses and common conditionals'],task:'Give a 5-sentence opinion comparing two choices and explaining your reason.'},
      upper:{title:'Upper-intermediate checkpoint',canDo:['Recognize passive, causative and potential forms','Use giving/receiving perspective','Follow inference and workplace-style exchanges'],task:'Explain a workplace situation, what happened and what should be done next.'},
      advanced:{title:'Advanced checkpoint',canDo:['Distinguish polite, honorific and humble register','Follow formal connectors and stance markers','Read and summarize a short structured argument'],task:'Write or say a short formal recommendation with reason, contrast and conclusion.'}
    };

    const jaChars={
      'beginner-1':[C('日','にち・ひ','day / sun'),C('月','げつ・つき','month / moon'),C('人','じん・ひと','person'),C('山','さん・やま','mountain'),C('川','せん・かわ','river'),C('大','だい・おお','big'),C('小','しょう・ちい','small'),C('中','ちゅう・なか','middle'),C('口','こう・くち','mouth'),C('手','しゅ・て','hand')],
      'beginner-2':[C('本','ほん','book / origin'),C('学','がく','study'),C('生','せい・い','life / student'),C('先','せん・さき','previous / ahead'),C('年','ねん・とし','year'),C('今','こん・いま','now'),C('時','じ・とき','time'),C('分','ふん・ぶん','minute / part'),C('上','じょう・うえ','up / above'),C('下','か・した','down / below')],
      elementary:[C('行','こう・い','go'),C('来','らい・く','come'),C('見','けん・み','see'),C('食','しょく・た','eat / food'),C('飲','いん・の','drink'),C('話','わ・はな','speak / story'),C('読','どく・よ','read'),C('書','しょ・か','write'),C('買','ばい・か','buy'),C('車','しゃ・くるま','vehicle / car')],
      intermediate:[C('会','かい・あ','meet / association'),C('社','しゃ','company'),C('事','じ・こと','matter'),C('新','しん・あたら','new'),C('古','こ・ふる','old'),C('高','こう・たか','high / expensive'),C('安','あん・やす','safe / cheap'),C('多','た・おお','many'),C('少','しょう・すく','few'),C('思','し・おも','think')],
      upper:[C('経','けい','pass through / manage'),C('験','けん','test / experience'),C('必','ひつ','certain'),C('要','よう','need / important'),C('問','もん・と','question'),C('題','だい','topic / problem'),C('意','い','idea / intention'),C('味','み','meaning / taste'),C('関','かん','relation / barrier'),C('対','たい','opposite / toward')],
      advanced:[C('報','ほう','report / information'),C('情','じょう','feeling / information'),C('管','かん','manage / pipe'),C('理','り','reason / logic'),C('責','せき','responsibility'),C('任','にん','duty / entrust'),C('提','てい','present / propose'),C('案','あん','plan / proposal'),C('改','かい','reform / change'),C('善','ぜん','good / improve')]
    };

    const jaTemplates={
      'beginner-1':[
        {objective:'Build sound-to-script recognition before depending on romanization.',dialogue:[['A','こんにちは。おなまえは なんですか。','Hello. What is your name?'],['B','サニーです。よろしくおねがいします。','I am Sunny. Nice to meet you.']],reading:{native:'わたしは サニーです。インドじんです。にほんごを べんきょうします。',roman:'Watashi wa Sanii desu. Indo-jin desu. Nihongo o benkyou shimasu.',meaning:'I am Sunny. I am Indian. I study Japanese.'},note:'Aim to read the kana first; use romanization only as support.'},
        {objective:'Connect individual sounds to whole words.',dialogue:[['A','これは ほんですか。','Is this a book?'],['B','はい、ほんです。','Yes, it is a book.']],reading:{native:'ここは がっこうです。せんせいと がくせいが います。',roman:'Koko wa gakkou desu. Sensei to gakusei ga imasu.',meaning:'This is a school. There are teachers and students.'},note:'Keep Japanese vowels clean and short.'}
      ],
      'beginner-2':[
        {objective:'Use basic phrases in a short real-life exchange.',dialogue:[['A','いま なんじですか。','What time is it now?'],['B','さんじ はんです。','It is 3:30.'],['A','ありがとうございます。','Thank you.']],reading:{native:'きょうは げつようびです。あさ はちじに かいしゃへ いきます。',roman:'Kyou wa getsuyoubi desu. Asa hachiji ni kaisha e ikimasu.',meaning:'Today is Monday. I go to the office at 8 in the morning.'}},
        {objective:'Build short topic-comment sentences with common particles.',dialogue:[['A','これは だれの かさですか。','Whose umbrella is this?'],['B','わたしの かさです。','It is my umbrella.']],reading:{native:'わたしの いえは えきの ちかくです。まいにち でんしゃで いきます。',roman:'Watashi no ie wa eki no chikaku desu. Mainichi densha de ikimasu.',meaning:'My home is near the station. I go by train every day.'}}
      ],
      elementary:[
        {objective:'Combine grammar with practical requests and daily actions.',dialogue:[['A','すみません、ここで しゃしんを とってもいいですか。','Excuse me, may I take a photo here?'],['B','はい、いいですよ。','Yes, that is fine.']],reading:{native:'きのう えきの ちかくで かいものを しました。ほんを にさつ かって、コーヒーを のみました。',roman:'Kinou eki no chikaku de kaimono o shimashita. Hon o nisatsu katte, koohii o nomimashita.',meaning:'Yesterday I shopped near the station. I bought two books and drank coffee.'}},
        {objective:'Describe what exists, where it is and what you did.',dialogue:[['A','コンビニは どこに ありますか。','Where is the convenience store?'],['B','えきの となりに あります。','It is next to the station.']],reading:{native:'へやに つくえと いすが あります。つくえの うえに パソコンが あります。',roman:'Heya ni tsukue to isu ga arimasu. Tsukue no ue ni pasokon ga arimasu.',meaning:'There is a desk and chair in the room. There is a computer on the desk.'}}
      ],
      intermediate:[
        {objective:'Connect multiple ideas naturally instead of producing isolated sentences.',dialogue:[['A','しゅうまつ、えいがを みに いかない？','Want to go see a movie this weekend?'],['B','いきたいけど、にちようびは しごとなんだ。','I want to, but I work on Sunday.'],['A','じゃ、どようびなら どう？','Then how about Saturday?']],reading:{native:'でんしゃのほうが バスより はやいので、いつも でんしゃを つかいます。でも、あめが ふっても えきまで あるかなければなりません。',roman:'Densha no hou ga basu yori hayai node, itsumo densha o tsukaimasu. Demo, ame ga futte mo eki made arukanakereba narimasen.',meaning:'Because trains are faster than buses, I usually take the train. But even if it rains, I have to walk to the station.'}},
        {objective:'Recognize how plain forms create more natural connected speech.',dialogue:[['A','きのう かった ほん、もう よんだ？','Did you already read the book you bought yesterday?'],['B','まだ。おもしろそうだから、こんや よむ。','Not yet. It looks interesting, so I will read it tonight.']],reading:{native:'わたしが すきな みせは えきの ちかくに あります。やすいし、しずかだし、しごともしやすいです。',roman:'Watashi ga suki na mise wa eki no chikaku ni arimasu. Yasui shi, shizuka da shi, shigoto mo shiyasui desu.',meaning:'The shop I like is near the station. It is inexpensive, quiet, and easy to work in.'}}
      ],
      upper:[
        {objective:'Follow viewpoint, affectedness and social perspective in longer sentences.',dialogue:[['A','かいぎの しりょうは もう できましたか。','Are the meeting materials ready?'],['B','はい。ぶちょうに かくにんしていただいてから おくります。','Yes. I will send them after having the department head check them.']],reading:{native:'この もんだいは すぐに かいけつできるとは かぎりません。げんいんを しらべてから、たいおうを きめる ひつようが あります。',roman:'Kono mondai wa sugu ni kaiketsu dekiru to wa kagirimasen. Genin o shirabete kara, taiou o kimeru hitsuyou ga arimasu.',meaning:'This problem may not be solvable immediately. We need to investigate the cause before deciding how to respond.'}},
        {objective:'Use inference and obligation in professional or complex contexts.',dialogue:[['A','この データなら、けっかは よくなるはずです。','With this data, the result should improve.'],['B','ただし、リスクも かんがえたほうがいいですね。','However, we should also consider the risk.']],reading:{native:'よていどおりに すすまない ばあいは、けいかくを みなおさなければなりません。',roman:'Yotei doori ni susumanai baai wa, keikaku o minaosanakereba narimasen.',meaning:'If things do not proceed as planned, we will have to review the plan.'}}
      ],
      advanced:[
        {objective:'Interpret formal stance, register and discourse structure.',dialogue:[['A','ほんけんについては、ひようめんだけでなく うんようじょうの リスクも こうりょすべきだと おもいます。','Regarding this matter, I think we should consider not only cost but also operational risk.'],['B','おっしゃるとおりです。したがって、だんかいてきに どうにゅうするのが だとうでしょう。','I agree. Therefore, a phased introduction would probably be appropriate.']],reading:{native:'ちょうさの けっか、げんこうの ほうほうには いっていの こうかが みとめられた。もっとも、すべての ばあいに おいて おなじ けっかが えられるとは かぎらない。',roman:'Chousa no kekka, genkou no houhou ni wa ittei no kouka ga mitomerareta. Mottomo, subete no baai ni oite onaji kekka ga erareru to wa kagiranai.',meaning:'The investigation found a certain degree of effectiveness in the current method. However, the same result cannot necessarily be obtained in every case.'}},
        {objective:'Produce concise formal recommendations with appropriate humility and evidence.',dialogue:[['A','ごていあんの ないようを はいけんしました。','I have reviewed the content of your proposal.'],['B','ありがとうございます。ごいけんを いただければ さいわいです。','Thank you. I would appreciate your feedback.']],reading:{native:'いじょうを ふまえると、たんきてきな ひようよりも ちょうきてきな あんていせいを じゅうしすべきだと かんがえられる。',roman:'Ijou o fumaeru to, tankiteki na hiyou yori mo choukiteki na anteisei o juushi subeki da to kangaerareru.',meaning:'Taking the above into account, it can be argued that long-term stability should be prioritized over short-term cost.'}}
      ]
    };

    const jaTasks={
      'beginner-1':['Say your name, nationality and one thing you study.','Read the focus items aloud without looking at romanization.'],
      'beginner-2':['Ask the time and answer with a complete sentence.','Describe where one object belongs using の and a location word.'],
      elementary:['Role-play a polite request and a permission question.','Describe yesterday using two past-tense actions.','Ask a price and buy a quantity of something.'],
      intermediate:['Compare two transport options and explain why you prefer one.','Give one plan using たら or なら.','Describe a person or object with a relative clause.'],
      upper:['Explain a problem using cause, response and obligation.','Describe an event using passive or causative perspective.','Give a cautious prediction using はず / かもしれない style meaning.'],
      advanced:['Give a two-sentence formal recommendation with a connector.','Summarize the reading in simpler Japanese.','Rewrite one casual idea in a polite/formal register.']
    };
    Object.keys(jaTemplates).forEach(stage=>assignStagePacks(ja,stage,jaTemplates[stage],jaChars[stage],jaTasks[stage]));

    ja.vocab=[...(ja.vocab||[]),
      V('週末','shuumatsu','weekend'),V('会議','kaigi','meeting'),V('資料','shiryou','materials / documents'),V('確認','kakunin','confirmation / checking'),V('提案','teian','proposal'),V('運用','unyou','operation / running a system'),V('費用','hiyou','cost / expense'),V('安定性','anteisei','stability'),V('段階的','dankaiteki','phased / step-by-step'),V('導入','dounyuu','introduction / deployment')
    ].filter((v,i,a)=>a.findIndex(x=>x.native===v.native)===i);
  }

  const zh=by('zh');
  if(zh){
    zh.courseQuality={version:9,label:'Integrated Mandarin Course',alignment:'Beginner to advanced practical progression; not an official HSK course.',principles:['Pinyin and tones before heavy character dependence','Characters learned in words and sentences','Grammar paired with spoken patterns','Reading grows from micro-texts to formal argument','Register and discourse markers introduced gradually']};
    zh.level='Integrated Beginner → Advanced';
    zh.description='Mandarin with tones, characters, grammar, dialogues, reading, hanzi focus and guided production from beginner to advanced.';
    zh.stageCheckpoints={
      'beginner-1':{title:'Beginner checkpoint',canDo:['Distinguish the four tones in practiced syllables','Introduce yourself and ask basic questions','Recognize high-frequency beginner characters'],task:'Give a 4-sentence self-introduction and ask one question.'},
      elementary:{title:'Elementary checkpoint',canDo:['Use time, measure words and 了','Choose 会/能/可以/想 appropriately in simple contexts','Handle shopping and daily routine exchanges'],task:'Describe what you did yesterday and buy two items using measure words.'},
      intermediate:{title:'Intermediate checkpoint',canDo:['Use aspect markers and comparisons','Understand result complements','Connect clauses and modify nouns with 的'],task:'Explain a past experience, compare two options and give a reason.'},
      upper:{title:'Upper-intermediate checkpoint',canDo:['Understand 把 and 被 structures','Use directional and potential complements','Express conditions, scope and emphasis'],task:'Explain how to handle a specific problem using 把 plus a result complement.'},
      advanced:{title:'Advanced checkpoint',canDo:['Follow formal connectors and stance markers','Understand reporting/evidence language','Summarize a short formal argument'],task:'Give a short structured recommendation using contrast, evidence and conclusion.'}
    };

    const zhChars={
      'beginner-1':[C('我','wǒ','I / me'),C('你','nǐ','you'),C('他','tā','he'),C('是','shì','to be'),C('不','bù','not'),C('有','yǒu','have / exist'),C('在','zài','at / be located'),C('人','rén','person'),C('好','hǎo','good'),C('学','xué','study / learn')],
      elementary:[C('生','shēng','life / student'),C('师','shī','teacher'),C('家','jiā','home / family'),C('国','guó','country'),C('天','tiān','day / sky'),C('年','nián','year'),C('月','yuè','month'),C('时','shí','time / hour'),C('钱','qián','money'),C('买','mǎi','buy')],
      intermediate:[C('工','gōng','work'),C('作','zuò','do / work'),C('会','huì','meeting / can'),C('问','wèn','ask'),C('题','tí','question / topic'),C('比','bǐ','compare'),C('更','gèng','more'),C('最','zuì','most'),C('完','wán','finish'),C('懂','dǒng','understand')],
      upper:[C('把','bǎ','disposal marker'),C('被','bèi','passive marker'),C('让','ràng','let / make'),C('关','guān','close / relation'),C('系','xì','relation / system'),C('结','jié','connect / result'),C('果','guǒ','result / fruit'),C('只','zhǐ','only'),C('才','cái','only then'),C('连','lián','even / connect')],
      advanced:[C('然','rán','so / thus'),C('而','ér','and / but'),C('此','cǐ','this'),C('据','jù','according to / evidence'),C('显','xiǎn','show / evident'),C('示','shì','show / indicate'),C('观','guān','view / observe'),C('点','diǎn','point'),C('综','zōng','combine / summarize'),C('合','hé','combine / fit')]
    };

    const zhTemplates={
      'beginner-1':[
        {objective:'Build tone, pinyin and character recognition together.',dialogue:[['A','你好！你叫什么名字？','Hello! What is your name?'],['B','我叫 Sunny。你呢？','My name is Sunny. And you?']],reading:{native:'我叫 Sunny。我是印度人。我学习中文。',roman:'Wǒ jiào Sunny. Wǒ shì Yìndù rén. Wǒ xuéxí Zhōngwén.',meaning:'My name is Sunny. I am Indian. I study Chinese.'},note:'Treat the tone as part of the syllable, not as an optional extra.'},
        {objective:'Turn core characters into useful complete sentences.',dialogue:[['A','你是老师吗？','Are you a teacher?'],['B','不是，我是学生。','No, I am a student.']],reading:{native:'这是我的书。书在桌子上。',roman:'Zhè shì wǒ de shū. Shū zài zhuōzi shàng.',meaning:'This is my book. The book is on the table.'}}
      ],
      elementary:[
        {objective:'Use time, quantity and everyday modal verbs in real exchanges.',dialogue:[['A','你几点下班？','What time do you finish work?'],['B','六点。我下班以后想去买东西。','Six. After work I want to go shopping.']],reading:{native:'昨天我去了商店，买了两本书和一杯咖啡。晚上八点才回家。',roman:'Zuótiān wǒ qù le shāngdiàn, mǎi le liǎng běn shū hé yì bēi kāfēi. Wǎnshang bā diǎn cái huí jiā.',meaning:'Yesterday I went to a shop, bought two books and a cup of coffee, and did not return home until 8 p.m.'}},
        {objective:'Choose modal meaning based on skill, permission, conditions or desire.',dialogue:[['A','这里可以拍照吗？','May I take photos here?'],['B','可以，但是不能用闪光灯。','Yes, but you cannot use flash.']],reading:{native:'我会说一点中文，但是今天不能参加中文课，因为我要开会。',roman:'Wǒ huì shuō yìdiǎn Zhōngwén, dànshì jīntiān bù néng cānjiā Zhōngwén kè, yīnwèi wǒ yào kāihuì.',meaning:'I can speak a little Chinese, but today I cannot attend Chinese class because I have a meeting.'}}
      ],
      intermediate:[
        {objective:'Connect aspect, comparison and result in longer speech.',dialogue:[['A','你去过上海吗？','Have you been to Shanghai?'],['B','去过。上海比我想的更大。','Yes. Shanghai was bigger than I expected.']],reading:{native:'我已经把这篇文章看完了，大部分都看懂了，不过有几个词我还没听清楚老师的解释。',roman:'Wǒ yǐjīng bǎ zhè piān wénzhāng kàn wán le, dàbùfen dōu kàn dǒng le, búguò yǒu jǐ ge cí wǒ hái méi tīng qīngchu lǎoshī de jiěshì.',meaning:'I have finished reading this article and understood most of it, but there are several words whose explanation I still did not hear clearly.'}},
        {objective:'Build connected arguments rather than isolated grammar examples.',dialogue:[['A','你觉得坐地铁还是坐公交车比较好？','Do you think the subway or bus is better?'],['B','地铁更快，而且没有那么堵，所以我一般坐地铁。','The subway is faster and not as congested, so I usually take it.']],reading:{native:'虽然这个办法比较简单，但是成本更高。因此，我们需要再比较一下不同的方案。',roman:'Suīrán zhège bànfǎ bǐjiào jiǎndān, dànshì chéngběn gèng gāo. Yīncǐ, wǒmen xūyào zài bǐjiào yíxià bùtóng de fāng'àn.',meaning:'Although this method is relatively simple, the cost is higher. Therefore, we need to compare the different options again.'}}
      ],
      upper:[
        {objective:'Track object handling, result and affected perspective.',dialogue:[['A','请把会议资料发给大家。','Please send the meeting materials to everyone.'],['B','好的。我先把最后一页改完再发。','Okay. I will finish revising the last page first, then send it.']],reading:{native:'文件昨天被系统自动删除了，不过备份没有被影响。我们已经把文件恢复到原来的位置。',roman:'Wénjiàn zuótiān bèi xìtǒng zìdòng shānchú le, búguò bèifèn méiyǒu bèi yǐngxiǎng. Wǒmen yǐjīng bǎ wénjiàn huīfù dào yuánlái de wèizhi.',meaning:'The file was automatically deleted by the system yesterday, but the backup was not affected. We have restored the file to its original location.'}},
        {objective:'Use complement structure to express whether results are achievable.',dialogue:[['A','这份报告今天做得完吗？','Can this report be finished today?'],['B','如果大家一起做，就来得及。','If everyone works together, we can make it in time.']],reading:{native:'只要条件允许，我们就可以继续。如果关键问题解决不了，就需要调整计划。',roman:'Zhǐyào tiáojiàn yǔnxǔ, wǒmen jiù kěyǐ jìxù. Rúguǒ guānjiàn wèntí jiějué bùliǎo, jiù xūyào tiáozhěng jìhuà.',meaning:'As long as conditions permit, we can continue. If the key problem cannot be solved, we need to adjust the plan.'}}
      ],
      advanced:[
        {objective:'Follow formal logical structure, evidence and stance.',dialogue:[['A','根据目前的数据，这个方案的风险是否可以接受？','Based on the current data, is the risk of this plan acceptable?'],['B','总体来看可以接受。然而，实施过程中仍然需要持续监控。','Overall it is acceptable. However, continuous monitoring is still needed during implementation.']],reading:{native:'调查结果显示，新方案能够提高效率。然而，从长期成本来看，其优势并不十分明显。因此，是否全面实施仍需进一步评估。',roman:'Diàochá jiéguǒ xiǎnshì, xīn fāng'àn nénggòu tígāo xiàolǜ. Rán'ér, cóng chángqī chéngběn lái kàn, qí yōushì bìng bù shífēn míngxiǎn. Yīncǐ, shìfǒu quánmiàn shíshī réng xū jìnyíbù pínggū.',meaning:'The investigation shows that the new plan can improve efficiency. However, from the perspective of long-term cost, its advantage is not very clear. Therefore, whether to implement it fully still requires further evaluation.'}},
        {objective:'Produce measured formal recommendations rather than overly absolute claims.',dialogue:[['A','你认为下一步应该怎么做？','What do you think we should do next?'],['B','我认为可以先进行小范围试点，在确认效果以后再扩大。','I think we can first run a small pilot and expand only after confirming the result.']],reading:{native:'综合以上因素，可以认为分阶段实施更为稳妥。一方面可以控制风险，另一方面也便于根据实际结果及时调整。',roman:'Zōnghé yǐshàng yīnsù, kěyǐ rènwéi fēn jiēduàn shíshī gèng wéi wěntuǒ. Yì fāngmiàn kěyǐ kòngzhì fēngxiǎn, lìng yì fāngmiàn yě biànyú gēnjù shíjì jiéguǒ jíshí tiáozhěng.',meaning:'Considering the above factors, phased implementation can be regarded as more prudent. On one hand it can control risk; on the other, it makes timely adjustment based on actual results easier.'}}
      ]
    };

    const zhTasks={
      'beginner-1':['Introduce yourself and ask the other person one question.','Read five characters aloud with the correct practiced tones.'],
      elementary:['Describe yesterday using 了 and one time expression.','Buy two items using correct measure words.','Ask for permission and explain one thing you cannot do.'],
      intermediate:['Compare two options and explain your reason.','Describe one experience using 过 and one completed result.','Turn two short statements into a connected cause/contrast paragraph.'],
      upper:['Explain how to handle an object using 把 and a result complement.','Describe an affected event using 被.','State a condition and whether the result can be achieved.'],
      advanced:['Give a short recommendation using 然而 / 因此 style logic.','Summarize the reading in two simpler Mandarin sentences.','State evidence, your position and one cautious conclusion.']
    };
    Object.keys(zhTemplates).forEach(stage=>assignStagePacks(zh,stage,zhTemplates[stage],zhChars[stage],zhTasks[stage]));

    zh.vocab=[...(zh.vocab||[]),
      V('实施','shíshī','implement'),V('评估','pínggū','evaluate'),V('效率','xiàolǜ','efficiency'),V('长期','chángqī','long-term'),V('优势','yōushì','advantage'),V('试点','shìdiǎn','pilot / trial'),V('阶段','jiēduàn','stage / phase'),V('稳妥','wěntuǒ','prudent / reliable'),V('监控','jiānkòng','monitor'),V('调整','tiáozhěng','adjust')
    ].filter((v,i,a)=>a.findIndex(x=>x.native===v.native)===i);
  }
})();