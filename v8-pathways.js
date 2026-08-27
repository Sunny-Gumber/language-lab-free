// Language Lab Free — V8 pathway content
// Communication-first expansion for Japanese and Mandarin, plus stage roadmaps for all courses.
(function(){
  if(typeof LANGUAGES==='undefined') return;
  const I=(native,roman,pron,guide,example,extra={})=>({native,roman,pron,guide,steps:extra.steps||['Listen twice','Repeat aloud','Use it once without reading'],example:{native:example[0],roman:example[1],meaning:example[2]},...extra});
  const W=(native,roman,meaning)=>({native,roman,meaning});
  const by=id=>LANGUAGES.find(l=>l.id===id);
  const addUnits=(lang,units)=>{const existing=new Set(lang.units.map(u=>u.title));for(const u of units)if(!existing.has(u.title))lang.units.push(u)};
  const addVocab=(lang,items)=>{const seen=new Set((lang.vocab||[]).map(v=>v.native));for(const v of items)if(!seen.has(v.native)){lang.vocab.push(v);seen.add(v.native)}};

  const genericStages=[
    {id:'starter',label:'Starter',level:'A1 foundations',focus:'Sounds, script and survival phrases'},
    {id:'beginner',label:'Beginner',level:'A1–A2',focus:'Daily conversation and core grammar'},
    {id:'intermediate',label:'Intermediate',level:'B1',focus:'Longer listening, narration and practical fluency'},
    {id:'upper',label:'Upper Intermediate',level:'B2',focus:'Nuance, work/study and natural-speed speech'},
    {id:'advanced',label:'Advanced',level:'C1-oriented',focus:'Abstract topics, register and complex comprehension'}
  ];
  LANGUAGES.forEach(l=>{l.learningPath=l.learningPath||genericStages.map(x=>({...x}))});

  // Japanese: full staged pathway scaffold, from current foundations toward advanced communication.
  const ja=by('ja');
  if(ja){
    ja.level='Beginner → Advanced pathway';
    ja.learningPath=[
      {id:'starter',label:'Starter',level:'Pre-A1',focus:'Kana, sound system and first survival phrases'},
      {id:'n5',label:'Beginner',level:'N5 / A1-oriented',focus:'Core particles, polite verbs and daily needs'},
      {id:'n4',label:'Elementary',level:'N4 / A2-oriented',focus:'Past forms, requests, comparisons and everyday conversation'},
      {id:'n3',label:'Intermediate',level:'N3 / B1-oriented',focus:'Connected speech, reasons, experiences and narration'},
      {id:'n2',label:'Upper Intermediate',level:'N2 / B2-oriented',focus:'Work, news, nuance and formal interaction'},
      {id:'n1',label:'Advanced',level:'N1-oriented / C1+',focus:'Abstract discussion, register, implication and advanced listening'}
    ];
    ja.units.forEach((u,i)=>{u.stage=i<9?'starter':i<13?'n5':'n4'});
    addUnits(ja,[
      {stage:'n5',title:'Daily Actions with ます',goal:'Talk about common actions using safe polite verb forms.',items:[
        I('たべます','tabemasu','eat — polite','Use with food and を.',['パンを たべます','pan o tabemasu','I eat bread']),
        I('のみます','nomimasu','drink — polite','Use with drinks and を.',['みずを のみます','mizu o nomimasu','I drink water']),
        I('いきます','ikimasu','go — polite','Destination is often marked by に or へ.',['えきに いきます','eki ni ikimasu','I go to the station']),
        I('みます','mimasu','see / watch — polite','Use for television, films and things you look at.',['テレビを みます','terebi o mimasu','I watch TV']),
        I('ききます','kikimasu','listen / ask — polite','Meaning depends on context.',['おんがくを ききます','ongaku o kikimasu','I listen to music'])
      ]},
      {stage:'n5',title:'Questions You Need Every Day',goal:'Ask where, what, who and how much.',items:[
        I('どこですか','doko desu ka','Where is it?','Attach a topic before it when needed.',['トイレは どこですか','toire wa doko desu ka','Where is the toilet?']),
        I('なんですか','nan desu ka','What is it?','なん is a common form of なに before certain sounds.',['これは なんですか','kore wa nan desu ka','What is this?']),
        I('だれですか','dare desu ka','Who is it?','Use for people.',['あのひとは だれですか','ano hito wa dare desu ka','Who is that person?']),
        I('いくらですか','ikura desu ka','How much is it?','Useful for shopping.',['これは いくらですか','kore wa ikura desu ka','How much is this?']),
        I('だいじょうぶですか','daijoubu desu ka','Are you okay?','A very common welfare/checking phrase.',['だいじょうぶです','daijoubu desu','I am okay'])
      ]},
      {stage:'n4',title:'Past and Negative Polite Forms',goal:'Say what you did, did not do, and will not do.',items:[
        I('たべました','tabemashita','ate — polite past','ます changes to ました for polite past.',['あさごはんを たべました','asagohan o tabemashita','I ate breakfast']),
        I('たべません','tabemasen','do not eat — polite negative','Use ません for present/future polite negative.',['にくは たべません','niku wa tabemasen','I do not eat meat']),
        I('いきました','ikimashita','went — polite past','Past of いきます.',['きのう えきに いきました','kinou eki ni ikimashita','Yesterday I went to the station']),
        I('みませんでした','mimasen deshita','did not watch — polite past negative','ませんでした is the polite past negative pattern.',['テレビを みませんでした','terebi o mimasen deshita','I did not watch TV']),
        I('どうでしたか','dou deshita ka','How was it?','Useful after an event, trip or meal.',['りょこうは どうでしたか','ryokou wa dou deshita ka','How was the trip?'])
      ]},
      {stage:'n4',title:'Requests and Permission',goal:'Ask someone to do something and ask permission.',items:[
        I('〜てください','te kudasai','Please do…','Attach ください to the verb て-form.',['ゆっくり はなしてください','yukkuri hanashite kudasai','Please speak slowly']),
        I('〜てもいいですか','te mo ii desu ka','May I…?','A common permission question.',['ここに すわってもいいですか','koko ni suwatte mo ii desu ka','May I sit here?']),
        I('〜てはいけません','te wa ikemasen','must not…','A clear prohibition pattern.',['ここで たばこを すってはいけません','koko de tabako o sutte wa ikemasen','You must not smoke here']),
        I('もういちど おねがいします','mou ichido onegaishimasu','One more time, please','Excellent listening-repair phrase.',['もういちど おねがいします','mou ichido onegaishimasu','One more time, please']),
        I('ゆっくり おねがいします','yukkuri onegaishimasu','Slowly, please','Short natural request when speech is too fast.',['すみません、ゆっくり おねがいします','sumimasen, yukkuri onegaishimasu','Excuse me, slowly please'])
      ]},
      {stage:'n3',title:'Reasons, Opinions and Experience',goal:'Connect thoughts instead of speaking in isolated sentences.',items:[
        I('〜から','kara','because / since','Gives a reason in everyday speech.',['あめですから、いきません','ame desu kara, ikimasen','Because it is raining, I will not go']),
        I('〜とおもいます','to omoimasu','I think that…','A safe way to state an opinion.',['いいと おもいます','ii to omoimasu','I think it is good']),
        I('〜たことがあります','ta koto ga arimasu','have experienced doing…','Use for past experience.',['にほんに いったことがあります','nihon ni itta koto ga arimasu','I have been to Japan']),
        I('〜ながら','nagara','while doing…','Two simultaneous actions by the same subject.',['おんがくを ききながら べんきょうします','ongaku o kikinagara benkyou shimasu','I study while listening to music']),
        I('それで','sorede','so / therefore','Links a result to what was just said.',['でんしゃが おくれました。それで、ちこくしました','densha ga okuremashita. sorede, chikoku shimashita','The train was late, so I was late'])
      ]},
      {stage:'n3',title:'Natural Casual Conversation',goal:'Recognize common casual forms without abandoning polite speech.',items:[
        I('そうだね','sou da ne','Yeah / that is true','Casual agreement among familiar people.',['そうだね、いこう','sou da ne, ikou','Yeah, let’s go']),
        I('どうしよう','dou shiyou','What should I do?','Very common self-directed reaction.',['じかんがない。どうしよう','jikan ga nai. dou shiyou','There is no time. What should I do?']),
        I('〜んです','n desu','explanatory tone','Adds explanation/background in conversation.',['ちょっと いそがしいんです','chotto isogashii n desu','The thing is, I am a little busy']),
        I('〜みたい','mitai','seems / looks like','Common conversational comparison/inference.',['あめが ふるみたい','ame ga furu mitai','It looks like it will rain']),
        I('ほんとう？','hontou?','Really?','Casual surprise/checking response.',['ほんとう？しらなかった','hontou? shiranakatta','Really? I did not know'])
      ]},
      {stage:'n2',title:'Workplace and Formal Interaction',goal:'Handle respectful requests and common workplace language.',items:[
        I('おつかれさまです','otsukaresama desu','workplace acknowledgment','Used widely among colleagues; meaning depends on context.',['おつかれさまです','otsukaresama desu','Thanks for your work / hello among colleagues']),
        I('しょうしょう おまちください','shoushou omachi kudasai','Please wait a moment','Formal service/workplace phrase.',['しょうしょう おまちください','shoushou omachi kudasai','Please wait a moment']),
        I('かしこまりました','kashikomarimashita','Certainly / understood','Very polite service expression.',['かしこまりました','kashikomarimashita','Certainly']),
        I('〜させていただきます','sasete itadakimasu','I will humbly be allowed to…','Formal self-lowering business pattern; learn as a register marker first.',['ごせつめい させていただきます','gosetsumei sasete itadakimasu','Allow me to explain']),
        I('ごかくにんください','gokakunin kudasai','Please confirm/check','Common formal request.',['ないようを ごかくにんください','naiyou o gokakunin kudasai','Please confirm the contents'])
      ]},
      {stage:'n2',title:'News and Abstract Discussion',goal:'Follow common connectors in reports, explanations and news.',items:[
        I('〜によると','ni yoru to','according to…','Introduces a source.',['ニュースによると','nyuusu ni yoru to','According to the news']),
        I('〜ため','tame','because of / for the purpose of','Often more formal than から.',['あめのため、しあいは ちゅうしです','ame no tame, shiai wa chuushi desu','The match is cancelled because of rain']),
        I('いっぽうで','ippou de','on the other hand','Contrasts two sides of a topic.',['べんりです。いっぽうで、たかいです','benri desu. ippou de, takai desu','It is convenient; on the other hand, it is expensive']),
        I('〜にたいして','ni taishite','toward / in contrast to','Common in formal comparison and relation.',['このいけんに たいして','kono iken ni taishite','Regarding / in response to this opinion']),
        I('けっかとして','kekka to shite','as a result','Formal result connector.',['けっかとして、うりあげが ふえました','kekka to shite, uriage ga fuemashita','As a result, sales increased'])
      ]},
      {stage:'n1',title:'Advanced Nuance and Register',goal:'Notice implication, stance and formal nuance in complex Japanese.',items:[
        I('〜わけではない','wake de wa nai','it does not mean that…','Softens or corrects an overgeneralization.',['きらいな わけではない','kirai na wake de wa nai','It is not that I dislike it']),
        I('〜にほかならない','ni hoka naranai','nothing other than…','Formal emphatic identification.',['どりょくの けっかに ほかならない','doryoku no kekka ni hoka naranai','It is nothing other than the result of effort']),
        I('〜をふまえて','o fumaete','based on / taking into account','Common in reports and formal discussion.',['けっかを ふまえて けんとうします','kekka o fumaete kentou shimasu','We will consider it based on the results']),
        I('〜かねない','kanenai','there is a risk that…','Expresses an undesirable possibility.',['ごかいを まねきかねない','gokai o manekikanenai','It could lead to misunderstanding']),
        I('〜にかかわらず','ni kakawarazu','regardless of…','Formal broad-condition pattern.',['けいけんに かかわらず','keiken ni kakawarazu','Regardless of experience'])
      ]}
    ]);
    addVocab(ja,[W('いくら','ikura','how much'),W('だいじょうぶ','daijoubu','okay / all right'),W('ゆっくり','yukkuri','slowly'),W('けいけん','keiken','experience'),W('いけん','iken','opinion'),W('けっか','kekka','result'),W('かくにん','kakunin','confirmation / check'),W('せつめい','setsumei','explanation'),W('ニュース','nyuusu','news'),W('しゃかい','shakai','society')]);
  }

  // Mandarin: pronunciation-first pathway, then everyday fluency, discourse and advanced register.
  const zh=by('zh');
  if(zh){
    zh.level='Beginner → Advanced pathway';
    zh.learningPath=[
      {id:'starter',label:'Starter',level:'Pre-A1',focus:'Pinyin, tones and survival phrases'},
      {id:'beginner',label:'Beginner',level:'A1–A2 / HSK-oriented foundation',focus:'Core word order, questions and daily needs'},
      {id:'intermediate',label:'Intermediate',level:'B1-oriented',focus:'Aspect, complements, narration and connected listening'},
      {id:'upper',label:'Upper Intermediate',level:'B2-oriented',focus:'Opinions, work/study and natural-speed conversation'},
      {id:'advanced',label:'Advanced',level:'C1-oriented',focus:'Formal register, idiomatic discourse and abstract topics'}
    ];
    zh.units.forEach((u,i)=>{u.stage=i<2?'starter':'beginner'});
    addUnits(zh,[
      {stage:'beginner',title:'Core Sentence Patterns',goal:'Build useful statements and questions with natural Mandarin word order.',items:[
        I('我是…','wǒ shì…','I am…','Use 是 to link a subject with a noun identity.',['我是学生','wǒ shì xuésheng','I am a student']),
        I('我有…','wǒ yǒu…','I have…','有 expresses possession/existence.',['我有一个问题','wǒ yǒu yí ge wèntí','I have a question']),
        I('我想…','wǒ xiǎng…','I want / would like to…','Useful for intentions and polite wants.',['我想喝水','wǒ xiǎng hē shuǐ','I want to drink water']),
        I('你在哪儿？','nǐ zài nǎr?','Where are you?','在 marks location.',['我在车站','wǒ zài chēzhàn','I am at the station']),
        I('多少钱？','duōshao qián?','How much money?','Standard shopping question.',['这个多少钱？','zhège duōshao qián','How much is this?'])
      ]},
      {stage:'beginner',title:'Daily Needs and Requests',goal:'Order, ask for help and repair communication.',items:[
        I('请给我…','qǐng gěi wǒ…','Please give me…','请 makes the request polite.',['请给我一杯水','qǐng gěi wǒ yì bēi shuǐ','Please give me a glass of water']),
        I('我听不懂','wǒ tīng bu dǒng','I cannot understand what I hear','听懂 means understand by listening; 不 forms the potential complement here.',['对不起，我听不懂','duìbuqǐ, wǒ tīng bu dǒng','Sorry, I cannot understand']),
        I('请说慢一点','qǐng shuō màn yìdiǎn','Please speak a little slower','A key listening-repair phrase.',['请说慢一点','qǐng shuō màn yìdiǎn','Please speak a little slower']),
        I('请再说一遍','qǐng zài shuō yí biàn','Please say it again','遍 counts repetitions of an action from beginning to end.',['请再说一遍','qǐng zài shuō yí biàn','Please say it again']),
        I('可以吗？','kěyǐ ma?','Is it okay / may I?','可以 + 吗 asks permission/possibility.',['我可以坐这里吗？','wǒ kěyǐ zuò zhèlǐ ma','May I sit here?'])
      ]},
      {stage:'intermediate',title:'Aspect: 了, 过 and 着',goal:'Talk about completed events, experience and ongoing states.',items:[
        I('了','le','completion / change marker','Do not translate mechanically as English past tense.',['我吃饭了','wǒ chīfàn le','I ate / I have eaten']),
        I('过','guo','experiential aspect','Marks that an experience has happened before.',['我去过北京','wǒ qùguo Běijīng','I have been to Beijing']),
        I('着','zhe','durative state','Marks an ongoing state in many patterns.',['门开着','mén kāizhe','The door is open']),
        I('已经…了','yǐjīng…le','already…','Common completed/change frame.',['我已经到了','wǒ yǐjīng dào le','I have already arrived']),
        I('还没…','hái méi…','not yet…','Useful negative counterpart for unfinished actions.',['我还没吃饭','wǒ hái méi chīfàn','I have not eaten yet'])
      ]},
      {stage:'intermediate',title:'Complements and Result',goal:'Express whether an action succeeds, finishes or reaches a result.',items:[
        I('听懂','tīngdǒng','understand by listening','Result complement 懂 follows 听.',['我听懂了','wǒ tīngdǒng le','I understood it']),
        I('看见','kànjiàn','see / catch sight of','见 marks successful perception after 看.',['我看见他了','wǒ kànjiàn tā le','I saw him']),
        I('做完','zuòwán','finish doing','完 marks completion.',['我做完了','wǒ zuòwán le','I finished it']),
        I('找不到','zhǎo bu dào','cannot find','不 inserted in a potential complement expresses inability.',['我找不到车站','wǒ zhǎo bu dào chēzhàn','I cannot find the station']),
        I('说得很好','shuō de hěn hǎo','speak very well','得 introduces a degree complement.',['你中文说得很好','nǐ Zhōngwén shuō de hěn hǎo','You speak Chinese very well'])
      ]},
      {stage:'intermediate',title:'Tell a Story',goal:'Connect events with time, cause and result.',items:[
        I('后来','hòulái','later / afterwards','Moves a narrative forward.',['后来我回家了','hòulái wǒ huí jiā le','Later I went home']),
        I('因为…所以…','yīnwèi…suǒyǐ…','because… therefore…','A clear cause-result pair.',['因为下雨，所以我没去','yīnwèi xiàyǔ, suǒyǐ wǒ méi qù','Because it rained, I did not go']),
        I('先…然后…','xiān…ránhòu…','first… then…','Useful sequencing frame.',['先吃饭，然后工作','xiān chīfàn, ránhòu gōngzuò','First eat, then work']),
        I('一边…一边…','yìbiān…yìbiān…','while… at the same time…','Two simultaneous actions.',['我一边走一边听音乐','wǒ yìbiān zǒu yìbiān tīng yīnyuè','I listen to music while walking']),
        I('结果','jiéguǒ','as a result','Introduces the outcome, often unexpected.',['我没带伞，结果全身都湿了','wǒ méi dài sǎn, jiéguǒ quánshēn dōu shī le','I had no umbrella, so I got completely wet'])
      ]},
      {stage:'upper',title:'Opinions and Nuance',goal:'State, soften and contrast opinions in longer conversation.',items:[
        I('我觉得…','wǒ juéde…','I feel / I think…','Very common opinion frame.',['我觉得这个办法不错','wǒ juéde zhège bànfǎ búcuò','I think this method is pretty good']),
        I('对我来说','duì wǒ lái shuō','for me / as far as I am concerned','Sets a personal perspective.',['对我来说，这很重要','duì wǒ lái shuō, zhè hěn zhòngyào','For me, this is important']),
        I('虽然…但是…','suīrán…dànshì…','although… but…','Common concession contrast.',['虽然很贵，但是很好','suīrán hěn guì, dànshì hěn hǎo','Although it is expensive, it is very good']),
        I('不一定','bù yídìng','not necessarily','Useful for cautious disagreement.',['贵的不一定最好','guì de bù yídìng zuì hǎo','The expensive one is not necessarily the best']),
        I('换句话说','huàn jù huà shuō','in other words','Rephrases an idea.',['换句话说，我们需要更多时间','huàn jù huà shuō, wǒmen xūyào gèng duō shíjiān','In other words, we need more time'])
      ]},
      {stage:'upper',title:'Work and Formal Communication',goal:'Handle meetings, requests and professional discussion.',items:[
        I('麻烦您…','máfan nín…','Could I trouble you to…','Polite request with respectful 您.',['麻烦您确认一下','máfan nín quèrèn yíxià','Could you please confirm it']),
        I('根据…','gēnjù…','according to / based on…','Common formal source/basis marker.',['根据报告','gēnjù bàogào','According to the report']),
        I('我们需要进一步讨论','wǒmen xūyào jìnyíbù tǎolùn','We need further discussion','Professional meeting phrase.',['这个问题我们需要进一步讨论','zhège wèntí wǒmen xūyào jìnyíbù tǎolùn','We need to discuss this issue further']),
        I('请您确认','qǐng nín quèrèn','Please confirm','Formal polite request.',['请您确认时间','qǐng nín quèrèn shíjiān','Please confirm the time']),
        I('没有问题','méiyǒu wèntí','No problem','Common confirmation/acceptance phrase.',['好的，没有问题','hǎo de, méiyǒu wèntí','Okay, no problem'])
      ]},
      {stage:'advanced',title:'Advanced Discourse and Formal Register',goal:'Follow abstract reasoning and formal written/spoken connectors.',items:[
        I('从某种程度上说','cóng mǒu zhǒng chéngdù shàng shuō','to some extent','Frames a qualified claim.',['从某种程度上说，这是不可避免的','cóng mǒu zhǒng chéngdù shàng shuō, zhè shì bùkě bìmiǎn de','To some extent, this is unavoidable']),
        I('值得注意的是','zhíde zhùyì de shì','it is worth noting that…','Formal discourse marker.',['值得注意的是，情况正在变化','zhíde zhùyì de shì, qíngkuàng zhèngzài biànhuà','It is worth noting that the situation is changing']),
        I('与其…不如…','yǔqí…bùrú…','rather than… it is better to…','Advanced comparison of choices.',['与其等待，不如现在开始','yǔqí děngdài, bùrú xiànzài kāishǐ','Rather than wait, it is better to start now']),
        I('归根结底','guīgēn jiédǐ','ultimately / when all is said and done','Summarizes an underlying conclusion.',['归根结底，这是信任的问题','guīgēn jiédǐ, zhè shì xìnrèn de wèntí','Ultimately, this is a question of trust']),
        I('不言而喻','bù yán ér yù','self-evident / goes without saying','Formal idiomatic expression.',['安全的重要性不言而喻','ānquán de zhòngyàoxìng bù yán ér yù','The importance of safety goes without saying'])
      ]}
    ]);
    addVocab(zh,[W('问题','wèntí','question / problem'),W('办法','bànfǎ','method / way'),W('重要','zhòngyào','important'),W('报告','bàogào','report'),W('确认','quèrèn','confirm'),W('讨论','tǎolùn','discuss'),W('结果','jiéguǒ','result'),W('经验','jīngyàn','experience'),W('社会','shèhuì','society'),W('信任','xìnrèn','trust')]);
  }
})();