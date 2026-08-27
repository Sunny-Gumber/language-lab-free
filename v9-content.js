// Language Lab Free — V9 integrated Japanese + Mandarin course quality
(function(){
  if(typeof LANGUAGES === "undefined") return;
  const by=id=>LANGUAGES.find(l=>l.id===id);
  const C=(char,reading,meaning)=>({char,reading,meaning});
  const V=(native,roman,meaning)=>({native,roman,meaning});

  function mergeVocab(lang,items){
    const seen=new Set();
    lang.vocab=[...(lang.vocab||[]),...items].filter(v=>{
      const k=String(v.native).toLowerCase();
      if(seen.has(k)) return false;
      seen.add(k);return true;
    });
  }

  function applyCourse(lang,config){
    lang.courseQuality={version:9,label:config.label,alignment:config.alignment,principles:config.principles};
    lang.level="Integrated Beginner → Advanced";
    lang.description=config.description;
    lang.stageCheckpoints=config.checkpoints;
    Object.entries(config.stages).forEach(([stage,profile])=>{
      const units=lang.units.filter(u=>u.stage===stage);
      units.forEach((u,i)=>{
        const ctx=profile.contexts[i%profile.contexts.length];
        const n=profile.characters.length;
        const start=(i*3)%n;
        u.v9={
          objectives:[u.goal,profile.objective,"Use at least one target without looking at the model."],
          dialogue:ctx.dialogue,
          reading:ctx.reading,
          characterFocus:[profile.characters[start],profile.characters[(start+1)%n],profile.characters[(start+2)%n]],
          production:profile.tasks[i%profile.tasks.length],
          note:profile.note||""
        };
      });
    });
    mergeVocab(lang,config.extraVocab||[]);
  }

  const ja=by("ja");
  if(ja){
    applyCourse(ja,{
      label:"Integrated Japanese Course",
      alignment:"Beginner-to-advanced practical progression; not an official JLPT course.",
      description:"Japanese with pronunciation, kana, grammar, dialogues, reading, kanji focus and guided production from beginner to advanced.",
      principles:["Kana and sound before heavy grammar","Grammar always paired with usable context","Reading and production from early stages","Register and politeness introduced gradually","Kanji focus grows with stage"],
      checkpoints:{
        "beginner-1":{title:"Beginner I checkpoint",canDo:["Read the core kana covered so far","Give a simple greeting and self-introduction","Understand basic particles in short sentences"],task:"Introduce yourself in 3–4 short Japanese sentences."},
        "beginner-2":{title:"Beginner II checkpoint",canDo:["Handle numbers, time and survival phrases","Recognize first sentence patterns","Read short mixed-kana phrases with less romanization"],task:"Create a short exchange using a greeting, time and one request."},
        elementary:{title:"Elementary checkpoint",canDo:["Use て-form, past and ability patterns","Describe people and places","Handle location, shopping and counters"],task:"Role-play buying something, asking permission and saying what you did yesterday."},
        intermediate:{title:"Intermediate checkpoint",canDo:["Use plain forms and connected clauses","Compare options and give reasons","Understand relative clauses and conditionals"],task:"Give a five-sentence opinion comparing two choices and explaining your reason."},
        upper:{title:"Upper-intermediate checkpoint",canDo:["Recognize passive, causative and potential forms","Use giving and receiving perspective","Follow workplace-style exchanges and inference"],task:"Explain a workplace situation, what happened and what should be done next."},
        advanced:{title:"Advanced checkpoint",canDo:["Distinguish polite, honorific and humble register","Follow formal connectors and stance markers","Summarize a short structured argument"],task:"Give a short formal recommendation with reason, contrast and conclusion."}
      },
      stages:{
        "beginner-1":{
          objective:"Build sound-to-script recognition before depending on romanization.",
          note:"Read kana first; use romanization only as support.",
          characters:[C("日","にち・ひ","day / sun"),C("月","げつ・つき","month / moon"),C("人","じん・ひと","person"),C("山","さん・やま","mountain"),C("川","せん・かわ","river"),C("大","だい・おお","big"),C("小","しょう・ちい","small"),C("中","ちゅう・なか","middle"),C("口","こう・くち","mouth"),C("手","しゅ・て","hand")],
          contexts:[
            {dialogue:[["A","こんにちは。おなまえは なんですか。","Hello. What is your name?"],["B","サニーです。よろしくおねがいします。","I am Sunny. Nice to meet you."]],reading:{native:"わたしは サニーです。インドじんです。にほんごを べんきょうします。",roman:"Watashi wa Sanii desu. Indo-jin desu. Nihongo o benkyou shimasu.",meaning:"I am Sunny. I am Indian. I study Japanese."}},
            {dialogue:[["A","これは ほんですか。","Is this a book?"],["B","はい、ほんです。","Yes, it is a book."]],reading:{native:"ここは がっこうです。せんせいと がくせいが います。",roman:"Koko wa gakkou desu. Sensei to gakusei ga imasu.",meaning:"This is a school. There are teachers and students."}}
          ],
          tasks:["Say your name, nationality and one thing you study.","Read the focus items aloud without looking at romanization."]
        },
        "beginner-2":{
          objective:"Turn beginner grammar into short daily-life exchanges.",
          characters:[C("本","ほん","book / origin"),C("学","がく","study"),C("生","せい・い","life / student"),C("先","せん・さき","previous / ahead"),C("年","ねん・とし","year"),C("今","こん・いま","now"),C("時","じ・とき","time"),C("分","ふん・ぶん","minute / part"),C("上","じょう・うえ","above"),C("下","か・した","below")],
          contexts:[
            {dialogue:[["A","いま なんじですか。","What time is it now?"],["B","さんじ はんです。","It is 3:30."]],reading:{native:"きょうは げつようびです。あさ はちじに かいしゃへ いきます。",roman:"Kyou wa getsuyoubi desu. Asa hachiji ni kaisha e ikimasu.",meaning:"Today is Monday. I go to the office at 8 a.m."}},
            {dialogue:[["A","これは だれの かさですか。","Whose umbrella is this?"],["B","わたしの かさです。","It is my umbrella."]],reading:{native:"わたしの いえは えきの ちかくです。まいにち でんしゃで いきます。",roman:"Watashi no ie wa eki no chikaku desu. Mainichi densha de ikimasu.",meaning:"My home is near the station. I go by train every day."}}
          ],
          tasks:["Ask the time and answer with a complete sentence.","Describe where one object belongs using の and a location word."]
        },
        elementary:{
          objective:"Combine grammar with requests, description, shopping and daily actions.",
          characters:[C("行","こう・い","go"),C("来","らい・く","come"),C("見","けん・み","see"),C("食","しょく・た","eat / food"),C("飲","いん・の","drink"),C("話","わ・はな","speak"),C("読","どく・よ","read"),C("書","しょ・か","write"),C("買","ばい・か","buy"),C("車","しゃ・くるま","vehicle")],
          contexts:[
            {dialogue:[["A","すみません、ここで しゃしんを とってもいいですか。","Excuse me, may I take a photo here?"],["B","はい、いいですよ。","Yes, that is fine."]],reading:{native:"きのう えきの ちかくで かいものを しました。ほんを にさつ かって、コーヒーを のみました。",roman:"Kinou eki no chikaku de kaimono o shimashita. Hon o nisatsu katte, koohii o nomimashita.",meaning:"Yesterday I shopped near the station. I bought two books and drank coffee."}},
            {dialogue:[["A","コンビニは どこに ありますか。","Where is the convenience store?"],["B","えきの となりに あります。","It is next to the station."]],reading:{native:"へやに つくえと いすが あります。つくえの うえに パソコンが あります。",roman:"Heya ni tsukue to isu ga arimasu. Tsukue no ue ni pasokon ga arimasu.",meaning:"There is a desk and chair in the room. There is a computer on the desk."}}
          ],
          tasks:["Role-play a polite request and permission question.","Describe yesterday using two past-tense actions.","Ask a price and buy a quantity of something."]
        },
        intermediate:{
          objective:"Connect ideas naturally instead of producing isolated sentences.",
          characters:[C("会","かい・あ","meet"),C("社","しゃ","company"),C("事","じ・こと","matter"),C("新","しん・あたら","new"),C("古","こ・ふる","old"),C("高","こう・たか","high / expensive"),C("安","あん・やす","safe / cheap"),C("多","た・おお","many"),C("少","しょう・すく","few"),C("思","し・おも","think")],
          contexts:[
            {dialogue:[["A","しゅうまつ、えいがを みに いかない？","Want to see a movie this weekend?"],["B","いきたいけど、にちようびは しごとなんだ。","I want to, but I work Sunday."],["A","じゃ、どようびなら どう？","Then how about Saturday?"]],reading:{native:"でんしゃのほうが バスより はやいので、いつも でんしゃを つかいます。でも、あめが ふっても えきまで あるかなければなりません。",roman:"Densha no hou ga basu yori hayai node, itsumo densha o tsukaimasu. Demo, ame ga futte mo eki made arukanakereba narimasen.",meaning:"Because trains are faster than buses, I usually take the train. But even if it rains, I have to walk to the station."}},
            {dialogue:[["A","きのう かった ほん、もう よんだ？","Did you read the book you bought yesterday?"],["B","まだ。おもしろそうだから、こんや よむ。","Not yet. It looks interesting, so I will read it tonight."]],reading:{native:"わたしが すきな みせは えきの ちかくに あります。やすいし、しずかだし、しごともしやすいです。",roman:"Watashi ga suki na mise wa eki no chikaku ni arimasu. Yasui shi, shizuka da shi, shigoto mo shiyasui desu.",meaning:"The shop I like is near the station. It is inexpensive, quiet, and easy to work in."}}
          ],
          tasks:["Compare two transport options and explain why you prefer one.","Give one plan using たら or なら.","Describe a person or object with a relative clause."]
        },
        upper:{
          objective:"Follow viewpoint, inference and workplace-style Japanese in longer sentences.",
          characters:[C("経","けい","manage / pass"),C("験","けん","experience"),C("必","ひつ","certain"),C("要","よう","need"),C("問","もん・と","question"),C("題","だい","problem"),C("意","い","intention"),C("味","み","meaning"),C("関","かん","relation"),C("対","たい","toward / opposite")],
          contexts:[
            {dialogue:[["A","かいぎの しりょうは もう できましたか。","Are the meeting materials ready?"],["B","はい。ぶちょうに かくにんしていただいてから おくります。","Yes. I will send them after the department head checks them."]],reading:{native:"この もんだいは すぐに かいけつできるとは かぎりません。げんいんを しらべてから、たいおうを きめる ひつようが あります。",roman:"Kono mondai wa sugu ni kaiketsu dekiru to wa kagirimasen. Genin o shirabete kara, taiou o kimeru hitsuyou ga arimasu.",meaning:"This problem may not be solvable immediately. We need to investigate the cause before deciding how to respond."}},
            {dialogue:[["A","この データなら、けっかは よくなるはずです。","With this data, the result should improve."],["B","ただし、リスクも かんがえたほうがいいですね。","However, we should also consider the risk."]],reading:{native:"よていどおりに すすまない ばあいは、けいかくを みなおさなければなりません。",roman:"Yotei doori ni susumanai baai wa, keikaku o minaosanakereba narimasen.",meaning:"If things do not proceed as planned, we will have to review the plan."}}
          ],
          tasks:["Explain a problem using cause, response and obligation.","Describe an event using passive or causative perspective.","Give a cautious prediction rather than an absolute claim."]
        },
        advanced:{
          objective:"Interpret and produce formal stance, register and structured argument.",
          characters:[C("報","ほう","report"),C("情","じょう","information"),C("管","かん","manage"),C("理","り","logic"),C("責","せき","responsibility"),C("任","にん","duty"),C("提","てい","propose"),C("案","あん","plan"),C("改","かい","reform"),C("善","ぜん","improve")],
          contexts:[
            {dialogue:[["A","ほんけんについては、ひようめんだけでなく うんようじょうの リスクも こうりょすべきだと おもいます。","Regarding this matter, we should consider operational risk as well as cost."],["B","おっしゃるとおりです。したがって、だんかいてきに どうにゅうするのが だとうでしょう。","I agree. Therefore, phased introduction is probably appropriate."]],reading:{native:"ちょうさの けっか、げんこうの ほうほうには いっていの こうかが みとめられた。もっとも、すべての ばあいに おいて おなじ けっかが えられるとは かぎらない。",roman:"Chousa no kekka, genkou no houhou ni wa ittei no kouka ga mitomerareta. Mottomo, subete no baai ni oite onaji kekka ga erareru to wa kagiranai.",meaning:"The investigation found a certain degree of effectiveness in the current method. However, the same result cannot necessarily be obtained in every case."}},
            {dialogue:[["A","ごていあんの ないようを はいけんしました。","I have reviewed your proposal."],["B","ありがとうございます。ごいけんを いただければ さいわいです。","Thank you. I would appreciate your feedback."]],reading:{native:"いじょうを ふまえると、たんきてきな ひようよりも ちょうきてきな あんていせいを じゅうしすべきだと かんがえられる。",roman:"Ijou o fumaeru to, tankiteki na hiyou yori mo choukiteki na anteisei o juushi subeki da to kangaerareru.",meaning:"Taking the above into account, long-term stability should be prioritized over short-term cost."}}
          ],
          tasks:["Give a two-sentence formal recommendation with a connector.","Summarize the reading in simpler Japanese.","Rewrite one casual idea in a polite or formal register."]
        }
      },
      extraVocab:[V("週末","shuumatsu","weekend"),V("会議","kaigi","meeting"),V("資料","shiryou","materials / documents"),V("確認","kakunin","checking / confirmation"),V("提案","teian","proposal"),V("運用","unyou","operation"),V("費用","hiyou","cost"),V("安定性","anteisei","stability"),V("段階的","dankaiteki","phased"),V("導入","dounyuu","deployment / introduction")]
    });
  }

  const zh=by("zh");
  if(zh){
    applyCourse(zh,{
      label:"Integrated Mandarin Course",
      alignment:"Beginner-to-advanced practical progression; not an official HSK course.",
      description:"Mandarin with tones, characters, grammar, dialogues, reading, hanzi focus and guided production from beginner to advanced.",
      principles:["Pinyin and tones before heavy character dependence","Characters learned in words and sentences","Grammar paired with spoken patterns","Reading grows from micro-texts to formal argument","Register and discourse markers introduced gradually"],
      checkpoints:{
        "beginner-1":{title:"Beginner checkpoint",canDo:["Distinguish the four tones in practiced syllables","Introduce yourself and ask basic questions","Recognize high-frequency beginner characters"],task:"Give a four-sentence self-introduction and ask one question."},
        elementary:{title:"Elementary checkpoint",canDo:["Use time, measure words and 了","Choose common modal verbs appropriately","Handle shopping and daily routine exchanges"],task:"Describe what you did yesterday and buy two items using measure words."},
        intermediate:{title:"Intermediate checkpoint",canDo:["Use aspect markers and comparisons","Understand result complements","Connect clauses and modify nouns with 的"],task:"Explain a past experience, compare two options and give a reason."},
        upper:{title:"Upper-intermediate checkpoint",canDo:["Understand 把 and 被 structures","Use directional and potential complements","Express conditions, scope and emphasis"],task:"Explain how to handle a specific problem using 把 plus a result complement."},
        advanced:{title:"Advanced checkpoint",canDo:["Follow formal connectors and stance markers","Understand reporting and evidence language","Summarize a short formal argument"],task:"Give a structured recommendation using contrast, evidence and conclusion."}
      },
      stages:{
        "beginner-1":{
          objective:"Build tone, pinyin and character recognition together.",note:"Treat the tone as part of the syllable.",
          characters:[C("我","wǒ","I"),C("你","nǐ","you"),C("他","tā","he"),C("是","shì","to be"),C("不","bù","not"),C("有","yǒu","have"),C("在","zài","at"),C("人","rén","person"),C("好","hǎo","good"),C("学","xué","study")],
          contexts:[
            {dialogue:[["A","你好！你叫什么名字？","Hello! What is your name?"],["B","我叫 Sunny。你呢？","My name is Sunny. And you?"]],reading:{native:"我叫 Sunny。我是印度人。我学习中文。",roman:"Wǒ jiào Sunny. Wǒ shì Yìndù rén. Wǒ xuéxí Zhōngwén.",meaning:"My name is Sunny. I am Indian. I study Chinese."}},
            {dialogue:[["A","你是老师吗？","Are you a teacher?"],["B","不是，我是学生。","No, I am a student."]],reading:{native:"这是我的书。书在桌子上。",roman:"Zhè shì wǒ de shū. Shū zài zhuōzi shàng.",meaning:"This is my book. The book is on the table."}}
          ],tasks:["Introduce yourself and ask one question.","Read five practiced characters aloud with the correct tones."]
        },
        elementary:{
          objective:"Use time, quantity, completion and common modal verbs in real exchanges.",
          characters:[C("生","shēng","life / student"),C("师","shī","teacher"),C("家","jiā","home"),C("国","guó","country"),C("天","tiān","day"),C("年","nián","year"),C("月","yuè","month"),C("时","shí","time"),C("钱","qián","money"),C("买","mǎi","buy")],
          contexts:[
            {dialogue:[["A","你几点下班？","What time do you finish work?"],["B","六点。我下班以后想去买东西。","Six. After work I want to go shopping."]],reading:{native:"昨天我去了商店，买了两本书和一杯咖啡。晚上八点才回家。",roman:"Zuótiān wǒ qù le shāngdiàn, mǎi le liǎng běn shū hé yì bēi kāfēi. Wǎnshang bā diǎn cái huí jiā.",meaning:"Yesterday I went to a shop, bought two books and a cup of coffee, and returned home at 8 p.m."}},
            {dialogue:[["A","这里可以拍照吗？","May I take photos here?"],["B","可以，但是不能用闪光灯。","Yes, but you cannot use flash."]],reading:{native:"我会说一点中文，但是今天不能参加中文课，因为我要开会。",roman:"Wǒ huì shuō yìdiǎn Zhōngwén, dànshì jīntiān bù néng cānjiā Zhōngwén kè, yīnwèi wǒ yào kāihuì.",meaning:"I can speak a little Chinese, but I cannot attend Chinese class today because I have a meeting."}}
          ],tasks:["Describe yesterday using 了 and one time expression.","Buy two items using measure words.","Ask for permission and explain one thing you cannot do."]
        },
        intermediate:{
          objective:"Connect aspect, comparison, result and clause linking in longer speech.",
          characters:[C("工","gōng","work"),C("作","zuò","do / work"),C("会","huì","meeting / can"),C("问","wèn","ask"),C("题","tí","question"),C("比","bǐ","compare"),C("更","gèng","more"),C("最","zuì","most"),C("完","wán","finish"),C("懂","dǒng","understand")],
          contexts:[
            {dialogue:[["A","你去过上海吗？","Have you been to Shanghai?"],["B","去过。上海比我想的更大。","Yes. Shanghai was bigger than I expected."]],reading:{native:"我已经把这篇文章看完了，大部分都看懂了，不过有几个词我还没听清楚老师的解释。",roman:"Wǒ yǐjīng bǎ zhè piān wénzhāng kàn wán le, dàbùfen dōu kàn dǒng le, búguò yǒu jǐ ge cí wǒ hái méi tīng qīngchu lǎoshī de jiěshì.",meaning:"I finished the article and understood most of it, but I still did not hear the explanation of several words clearly."}},
            {dialogue:[["A","你觉得坐地铁还是坐公交车比较好？","Do you think the subway or bus is better?"],["B","地铁更快，而且没有那么堵，所以我一般坐地铁。","The subway is faster and less congested, so I usually take it."]],reading:{native:"虽然这个办法比较简单，但是成本更高。因此，我们需要再比较一下不同的方案。",roman:"Suīrán zhège bànfǎ bǐjiào jiǎndān, dànshì chéngběn gèng gāo. Yīncǐ, wǒmen xūyào zài bǐjiào yíxià bùtóng de fāng’àn.",meaning:"Although this method is simpler, the cost is higher. Therefore, we need to compare the different options again."}}
          ],tasks:["Compare two options and explain your reason.","Describe one experience using 过 and one completed result.","Connect two statements with cause or contrast."]
        },
        upper:{
          objective:"Track object handling, affected perspective, complements and conditional scope.",
          characters:[C("把","bǎ","disposal marker"),C("被","bèi","passive marker"),C("让","ràng","let / make"),C("关","guān","relation"),C("系","xì","system / relation"),C("结","jié","connect / result"),C("果","guǒ","result"),C("只","zhǐ","only"),C("才","cái","only then"),C("连","lián","even / connect")],
          contexts:[
            {dialogue:[["A","请把会议资料发给大家。","Please send the meeting materials to everyone."],["B","好的。我先把最后一页改完再发。","Okay. I will finish revising the last page first, then send it."]],reading:{native:"文件昨天被系统自动删除了，不过备份没有被影响。我们已经把文件恢复到原来的位置。",roman:"Wénjiàn zuótiān bèi xìtǒng zìdòng shānchú le, búguò bèifèn méiyǒu bèi yǐngxiǎng. Wǒmen yǐjīng bǎ wénjiàn huīfù dào yuánlái de wèizhi.",meaning:"The file was automatically deleted yesterday, but the backup was not affected. We restored the file to its original location."}},
            {dialogue:[["A","这份报告今天做得完吗？","Can this report be finished today?"],["B","如果大家一起做，就来得及。","If everyone works together, we can make it in time."]],reading:{native:"只要条件允许，我们就可以继续。如果关键问题解决不了，就需要调整计划。",roman:"Zhǐyào tiáojiàn yǔnxǔ, wǒmen jiù kěyǐ jìxù. Rúguǒ guānjiàn wèntí jiějué bùliǎo, jiù xūyào tiáozhěng jìhuà.",meaning:"As long as conditions permit, we can continue. If the key problem cannot be solved, we need to adjust the plan."}}
          ],tasks:["Explain how to handle an object using 把 and a result complement.","Describe an affected event using 被.","State a condition and whether the result can be achieved."]
        },
        advanced:{
          objective:"Follow formal logical structure, evidence, stance and cautious recommendation.",
          characters:[C("然","rán","thus"),C("而","ér","and / but"),C("此","cǐ","this"),C("据","jù","according to"),C("显","xiǎn","show"),C("示","shì","indicate"),C("观","guān","view"),C("点","diǎn","point"),C("综","zōng","combine"),C("合","hé","combine")],
          contexts:[
            {dialogue:[["A","根据目前的数据，这个方案的风险是否可以接受？","Based on current data, is the risk acceptable?"],["B","总体来看可以接受。然而，实施过程中仍然需要持续监控。","Overall yes, but continuous monitoring is still needed."]],reading:{native:"调查结果显示，新方案能够提高效率。然而，从长期成本来看，其优势并不十分明显。因此，是否全面实施仍需进一步评估。",roman:"Diàochá jiéguǒ xiǎnshì, xīn fāng’àn nénggòu tígāo xiàolǜ. Rán’ér, cóng chángqī chéngběn lái kàn, qí yōushì bìng bù shífēn míngxiǎn. Yīncǐ, shìfǒu quánmiàn shíshī réng xū jìnyíbù pínggū.",meaning:"The investigation shows the new plan can improve efficiency. However, its long-term cost advantage is unclear, so full implementation still requires evaluation."}},
            {dialogue:[["A","你认为下一步应该怎么做？","What should we do next?"],["B","我认为可以先进行小范围试点，在确认效果以后再扩大。","I think we should run a small pilot first and expand after confirming the result."]],reading:{native:"综合以上因素，可以认为分阶段实施更为稳妥。一方面可以控制风险，另一方面也便于根据实际结果及时调整。",roman:"Zōnghé yǐshàng yīnsù, kěyǐ rènwéi fēn jiēduàn shíshī gèng wéi wěntuǒ. Yì fāngmiàn kěyǐ kòngzhì fēngxiǎn, lìng yì fāngmiàn yě biànyú gēnjù shíjì jiéguǒ jíshí tiáozhěng.",meaning:"Considering the above factors, phased implementation is more prudent because it controls risk and allows timely adjustment."}}
          ],tasks:["Give a recommendation using contrast and conclusion.","Summarize the reading in two simpler Mandarin sentences.","State evidence, your position and one cautious conclusion."]
        }
      },
      extraVocab:[V("实施","shíshī","implement"),V("评估","pínggū","evaluate"),V("效率","xiàolǜ","efficiency"),V("长期","chángqī","long-term"),V("优势","yōushì","advantage"),V("试点","shìdiǎn","pilot"),V("阶段","jiēduàn","stage"),V("稳妥","wěntuǒ","prudent"),V("监控","jiānkòng","monitor"),V("调整","tiáozhěng","adjust")]
    });
  }
})();