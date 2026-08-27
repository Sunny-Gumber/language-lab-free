// Language Lab Free — V8 curriculum expansion
// Deepens Japanese and Mandarin from beginner foundations toward advanced usage,
// while giving every language a consistent staged roadmap.
(function(){
  if(typeof LANGUAGES==='undefined') return;

  const I=(native,roman,pron,guide,example,extra={})=>({
    native,roman,pron,guide,
    steps:extra.steps||['Read and listen carefully','Repeat or copy the model','Use it once without looking'],
    example:{native:example[0],roman:example[1],meaning:example[2]},
    ...extra
  });
  const W=(native,roman,meaning)=>({native,roman,meaning});
  const U=(title,goal,stage,items)=>({title,goal,stage,items});
  const by=id=>LANGUAGES.find(l=>l.id===id);
  const mergeVocab=(lang,items)=>{
    const seen=new Set();
    lang.vocab=[...(lang.vocab||[]),...items].filter(v=>{
      const k=String(v.native).toLowerCase();
      if(seen.has(k)) return false;
      seen.add(k);return true;
    });
  };
  const roadmap=(l,availableLabel='Foundation available')=>{
    l.curriculum={
      version:8,
      stages:[
        {id:'beginner',label:'Beginner',description:availableLabel,startUnit:0,endUnit:Math.max(0,l.units.length-1),available:true},
        {id:'elementary',label:'Elementary',description:'Next structured expansion',available:false},
        {id:'intermediate',label:'Intermediate',description:'Grammar, listening and connected speech',available:false},
        {id:'upper',label:'Upper Intermediate',description:'Longer conversations and authentic-style text',available:false},
        {id:'advanced',label:'Advanced',description:'Register, nuance and complex expression',available:false}
      ]
    };
  };

  // Give all ten languages the same visible long-term roadmap.
  LANGUAGES.forEach(l=>roadmap(l));

  // ───────────────────────── JAPANESE ─────────────────────────
  const ja=by('ja');
  if(ja){
    ja.level='Beginner → Advanced Path';
    ja.description='A staged Japanese path from kana and survival phrases to intermediate grammar, formal register and advanced nuance.';
    ja.units.forEach((u,i)=>u.stage=i<=8?'beginner-1':'beginner-2');
    const b2Start=ja.units.length;

    ja.units.push(
      U('て-form: Requests & Ongoing Actions','Use the て-form for requests, permission, prohibition and ongoing actions.','elementary',[
        I('〜てください','te kudasai','please do…','Attach ください to a verb in て-form for a polite request.',['ここに なまえを かいてください','koko ni namae o kaite kudasai','Please write your name here.']),
        I('〜てもいいです','te mo ii desu','it is okay to…','A common way to ask or give permission.',['ここで しゃしんを とってもいいですか','koko de shashin o totte mo ii desu ka','May I take a photo here?']),
        I('〜てはいけません','te wa ikemasen','must not…','A clear polite prohibition.',['ここで たばこを すってはいけません','koko de tabako o sutte wa ikemasen','You must not smoke here.']),
        I('〜ています','te imasu','be doing / ongoing state','Used for an action in progress and some continuing states.',['いま にほんごを べんきょうしています','ima nihongo o benkyou shite imasu','I am studying Japanese now.'])
      ]),
      U('Past, Experience & Ability','Talk about past events, experience and ability.','elementary',[
        I('〜ました','mashita','polite past','Change ます to ました for a polite affirmative past.',['きのう とうきょうへ いきました','kinou Toukyou e ikimashita','I went to Tokyo yesterday.']),
        I('〜ませんでした','masen deshita','polite negative past','Past negative form of ます-style verbs.',['あさごはんを たべませんでした','asagohan o tabemasen deshita','I did not eat breakfast.']),
        I('〜たことがあります','ta koto ga arimasu','have done before','Use a plain past verb + ことがあります for life experience.',['きょうとへ いったことがあります','Kyouto e itta koto ga arimasu','I have been to Kyoto.']),
        I('〜ことができます','koto ga dekimasu','can do…','A useful polite ability pattern.',['ひらがなを よむことができます','hiragana o yomu koto ga dekimasu','I can read hiragana.'])
      ]),
      U('Adjectives & Description','Describe people, places and things with い- and な-adjectives.','elementary',[
        I('おおきいです','ookii desu','is big','い-adjective + です is a polite beginner form.',['この えきは おおきいです','kono eki wa ookii desu','This station is big.']),
        I('おおきくないです','ookikunai desu','is not big','Replace final い with くない for a common negative form.',['この へやは おおきくないです','kono heya wa ookikunai desu','This room is not big.']),
        I('しずかです','shizuka desu','is quiet','な-adjective before です does not take な.',['この まちは しずかです','kono machi wa shizuka desu','This town is quiet.']),
        I('しずかな へや','shizuka na heya','a quiet room','Use な when a な-adjective directly modifies a noun.',['しずかな へやが すきです','shizuka na heya ga suki desu','I like quiet rooms.'])
      ]),
      U('Existence & Location','Say where people and things are.','elementary',[
        I('あります','arimasu','there is / exists (non-living)','Use mainly for things and plants.',['つくえの うえに ほんが あります','tsukue no ue ni hon ga arimasu','There is a book on the desk.']),
        I('います','imasu','there is / exists (living)','Use mainly for people and animals.',['こうえんに こどもが います','kouen ni kodomo ga imasu','There are children in the park.']),
        I('〜に あります','ni arimasu','is located at…','に marks the location where something exists.',['コンビニは えきの となりに あります','konbini wa eki no tonari ni arimasu','The convenience store is next to the station.']),
        I('〜に います','ni imasu','is at… (person/animal)','Use for the location of a person or animal.',['せんせいは きょうしつに います','sensei wa kyoushitsu ni imasu','The teacher is in the classroom.'])
      ]),
      U('Shopping, Counters & Requests','Buy simple things and handle quantities politely.','elementary',[
        I('これを ください','kore o kudasai','this, please','A direct useful buying phrase.',['これを ひとつ ください','kore o hitotsu kudasai','One of these, please.']),
        I('いくらですか','ikura desu ka','how much is it?','Use for price.',['これは いくらですか','kore wa ikura desu ka','How much is this?']),
        I('ひとつ / ふたつ','hitotsu / futatsu','one / two (general counters)','Traditional general counters are useful for many small objects.',['りんごを ふたつ ください','ringo o futatsu kudasai','Two apples, please.']),
        I('〜まい','mai','counter for flat objects','Use for paper, tickets and other flat thin items.',['きっぷを にまい ください','kippu o nimai kudasai','Two tickets, please.'])
      ])
    );

    const interStart=ja.units.length;
    ja.units.push(
      U('Plain Forms & Casual Speech','Recognize dictionary/plain forms and common casual endings.','intermediate',[
        I('たべる','taberu','eat — dictionary form','Dictionary/plain form is the base used in many grammar patterns.',['あとで たべる','ato de taberu','I will eat later.']),
        I('たべない','tabenai','do not eat — plain negative','Plain negative commonly ends in ない.',['にくは たべない','niku wa tabenai','I do not eat meat.']),
        I('たべた','tabeta','ate — plain past','Plain past is built from the た-form.',['もう たべた','mou tabeta','I already ate.']),
        I('〜んです','n desu','explanatory / contextual tone','Adds explanation, background or a request for explanation.',['どうしたんですか','doushitan desu ka','What happened? / What is the matter?'])
      ]),
      U('Reasons, Contrast & Connection','Connect ideas with natural reasons and contrasts.','intermediate',[
        I('〜から','kara','because…','A direct reason connector often used after a clause.',['あめですから、いきません','ame desu kara, ikimasen','Because it is raining, I will not go.']),
        I('〜ので','node','because / since…','Often sounds a little softer or more explanatory than から.',['いそがしいので、あとで れんらくします','isogashii node, ato de renraku shimasu','Since I am busy, I will contact you later.']),
        I('〜けど','kedo','but / though…','Very common conversational contrast or softener.',['いきたいけど、じかんが ありません','ikitai kedo, jikan ga arimasen','I want to go, but I do not have time.']),
        I('〜のに','noni','even though…','Expresses a stronger unexpected contrast.',['べんきょうしたのに、わすれました','benkyou shita noni, wasuremashita','Even though I studied, I forgot.'])
      ]),
      U('Comparisons & Preferences','Compare options and state preferences.','intermediate',[
        I('AよりBのほうが…','A yori B no hou ga','B is more… than A','A is the comparison baseline; B is the preferred/greater side.',['バスより でんしゃのほうが はやいです','basu yori densha no hou ga hayai desu','The train is faster than the bus.']),
        I('いちばん','ichiban','the most / number one','Use with a group/context for superlatives.',['はるが いちばん すきです','haru ga ichiban suki desu','I like spring the most.']),
        I('〜ほうがいい','hou ga ii','it is better to…','Common advice pattern.',['はやく ねたほうがいいです','hayaku neta hou ga ii desu','You should go to bed early.']),
        I('どちらのほうが…','dochira no hou ga','which is more…?','Polite comparison question.',['コーヒーと おちゃと、どちらのほうが すきですか','koohii to ocha to, dochira no hou ga suki desu ka','Which do you prefer, coffee or tea?'])
      ]),
      U('Conditionals & Decisions','Express if/when conditions and choices.','intermediate',[
        I('〜たら','tara','if / when…','A flexible conditional used for hypothetical and sequential situations.',['じかんが あったら、いきます','jikan ga attara, ikimasu','If I have time, I will go.']),
        I('〜なら','nara','if it is the case that…','Often responds to known/contextual information.',['にほんへ いくなら、きょうとも おすすめです','Nihon e iku nara, Kyouto mo osusume desu','If you are going to Japan, Kyoto is also recommended.']),
        I('〜と','to','whenever / if… then naturally','Useful for automatic or regular results; less suited to deliberate commands in the result.',['この ボタンを おすと、ドアが あきます','kono botan o osu to, doa ga akimasu','When you press this button, the door opens.']),
        I('〜ても','temo','even if / even though','Expresses a result that holds despite a condition.',['あめが ふっても、いきます','ame ga futte mo, ikimasu','Even if it rains, I will go.'])
      ]),
      U('Relative Clauses & Noun Modification','Build longer noun phrases without relative pronouns.','intermediate',[
        I('きのう かった ほん','kinou katta hon','the book I bought yesterday','A plain clause comes directly before the noun it modifies.',['きのう かった ほんを よんでいます','kinou katta hon o yonde imasu','I am reading the book I bought yesterday.']),
        I('にほんに すんでいる ひと','Nihon ni sunde iru hito','a person who lives in Japan','No equivalent of English “who” is required.',['にほんに すんでいる ともだちが います','Nihon ni sunde iru tomodachi ga imasu','I have a friend who lives in Japan.']),
        I('わたしが すきな えいが','watashi ga suki na eiga','a movie I like','が often marks the subject inside a modifying clause.',['これは わたしが すきな えいがです','kore wa watashi ga suki na eiga desu','This is a movie I like.']),
        I('えきに ちかい ホテル','eki ni chikai hoteru','a hotel near the station','Adjective phrases can directly modify nouns.',['えきに ちかい ホテルを よやくしました','eki ni chikai hoteru o yoyaku shimashita','I booked a hotel near the station.'])
      ])
    );

    const upperStart=ja.units.length;
    ja.units.push(
      U('Potential, Passive & Causative','Recognize three major verb transformations used in longer Japanese.','upper',[
        I('〜られる / 〜える','rareru / eru','can… — potential','Potential forms express ability or possibility.',['にほんごが はなせます','nihongo ga hanasemasu','I can speak Japanese.']),
        I('〜られる','rareru','be… — passive','Passive often marks the receiver of an action with は/が and the actor with に.',['わたしは せんせいに ほめられました','watashi wa sensei ni homeraremashita','I was praised by the teacher.']),
        I('〜させる','saseru','make / let someone do…','Causative can express causing, making or allowing depending on context.',['こどもに やさいを たべさせます','kodomo ni yasai o tabesasemasu','I make/let the child eat vegetables.']),
        I('〜させられる','saserareru','be made to do…','Causative-passive often expresses being compelled.',['ざんぎょうさせられました','zangyou saseraremashita','I was made to work overtime.'])
      ]),
      U('Giving, Receiving & Viewpoint','Choose あげる, くれる and もらう from the right viewpoint.','upper',[
        I('あげる','ageru','give (outward from me/us)','Used when the giver is the speaker/in-group or viewed outward.',['ともだちに ほんを あげました','tomodachi ni hon o agemashita','I gave my friend a book.']),
        I('くれる','kureru','give to me / my in-group','Highlights a benefit coming toward the speaker/in-group.',['ともだちが ほんを くれました','tomodachi ga hon o kuremashita','My friend gave me a book.']),
        I('もらう','morau','receive','The receiver is the grammatical subject/topic.',['ともだちに ほんを もらいました','tomodachi ni hon o moraimashita','I received a book from my friend.']),
        I('〜てくれる','te kureru','do something for me/us','Adds the sense that someone beneficially did an action for the speaker.',['てつだってくれて ありがとう','tetsudatte kurete arigatou','Thank you for helping me.'])
      ]),
      U('Appearance, Inference & Hearsay','Express what something looks like, seems like or is reported to be.','upper',[
        I('〜そうです','sou desu','looks like / seems','Attached to stems/adjectives for appearance based on direct observation.',['この ケーキは おいしそうです','kono keeki wa oishisou desu','This cake looks delicious.']),
        I('〜ようです','you desu','it appears / seems','A more general inference based on evidence.',['でんきが きえています。だれも いないようです','denki ga kiete imasu. dare mo inai you desu','The lights are off. It seems nobody is there.']),
        I('〜みたいです','mitai desu','seems / looks like — conversational','Common spoken equivalent with a casual feel.',['あめが ふるみたいです','ame ga furu mitai desu','It looks like it will rain.']),
        I('〜そうです (hearsay)','sou desu','I hear that…','After a plain clause, そうです can report information from another source.',['あしたは やすみだそうです','ashita wa yasumi da sou desu','I hear tomorrow is a day off.'])
      ]),
      U('Formal Communication & Workplace Japanese','Use polite structures common in work and service situations.','upper',[
        I('〜ていただけますか','te itadakemasu ka','could you please…?','A polite request that frames the action as something received from the listener.',['かくにんして いただけますか','kakunin shite itadakemasu ka','Could you please confirm?']),
        I('〜について','ni tsuite','about / regarding','Useful in meetings, email and explanations.',['この けんについて せつめいします','kono ken ni tsuite setsumei shimasu','I will explain this matter.']),
        I('〜ことになっています','koto ni natte imasu','it is arranged / the rule is…','Often describes rules, schedules or established arrangements.',['かいぎは 10じに はじまることになっています','kaigi wa juuji ni hajimaru koto ni natte imasu','The meeting is scheduled to start at 10.']),
        I('〜させていただきます','sasete itadakimasu','allow me to… — very polite','Common formal formula; use with awareness rather than attaching it everywhere.',['こちらから ごれんらくさせていただきます','kochira kara gorenraku sasete itadakimasu','We/I will contact you.'])
      ]),
      U('Nuance Particles & Spoken Stance','Understand common sentence-ending nuance beyond literal translation.','upper',[
        I('〜よ','yo','assert / provide information','Can mark information the speaker presents as relevant to the listener.',['この みせは おいしいですよ','kono mise wa oishii desu yo','This restaurant is good, you know.']),
        I('〜ね','ne','seek/share agreement','Often invites shared feeling or confirmation.',['きょうは さむいですね','kyou wa samui desu ne','It is cold today, isn’t it?']),
        I('〜かな','kana','I wonder…','Casual self-directed uncertainty.',['まにあうかな','maniau kana','I wonder if I will make it in time.']),
        I('〜わけ','wake','reason / logical circumstance','Appears in many intermediate-to-advanced explanatory patterns.',['そういう わけです','sou iu wake desu','That is the reason / That is how it is.'])
      ])
    );

    const advStart=ja.units.length;
    ja.units.push(
      U('Honorific Register: Respect & Humility','Recognize the logic of respectful and humble Japanese.','advanced',[
        I('いらっしゃる','irassharu','honorific: go / come / be','Respectful equivalent used for another person’s actions/state.',['せんせいは もう いらっしゃいます','sensei wa mou irasshaimasu','The teacher is already here.']),
        I('おっしゃる','ossharu','honorific: say','Respectful equivalent of いう.',['しゃちょうが そう おっしゃいました','shachou ga sou osshaimashita','The company president said so.']),
        I('まいる','mairu','humble: go / come','Used to lower the speaker/in-group action.',['あした うかがいに まいります','ashita ukagai ni mairimasu','I will come/visit tomorrow.']),
        I('もうしあげる','moushiageru','humble: say / express','Formal humble verb used in set expressions and business language.',['おれいを もうしあげます','orei o moushiagemasu','I would like to express my gratitude.'])
      ]),
      U('Written Connectors & Argument Flow','Follow formal written relationships between ideas.','advanced',[
        I('しかし','shikashi','however','Formal/written contrast connector.',['けっかは よかった。しかし、かだいも のこった','kekka wa yokatta. shikashi, kadai mo nokotta','The result was good. However, issues remained.']),
        I('そのため','sono tame','therefore / for that reason','Links a cause to its consequence.',['でんしゃが とまった。そのため、ちこくした','densha ga tomatta. sono tame, chikoku shita','The train stopped. Therefore, I was late.']),
        I('一方で','ippou de','on the other hand','Contrasts another side/aspect.',['べんりな 一方で、コストも たかい','benri na ippou de, kosuto mo takai','It is convenient; on the other hand, the cost is high.']),
        I('したがって','shitagatte','consequently / therefore','Formal logical consequence in writing or presentation.',['じょうけんが かわった。したがって、けいかくを みなおす','jouken ga kawatta. shitagatte, keikaku o minaosu','The conditions changed. Therefore, we will review the plan.'])
      ]),
      U('Advanced Stance & Qualification','Make claims more precise instead of sounding absolute.','advanced',[
        I('〜わけではない','wake de wa nai','it does not mean that…','Partially denies an inference rather than simply negating the whole statement.',['たかいものが ぜんぶ いいわけではない','takai mono ga zenbu ii wake de wa nai','It does not mean everything expensive is good.']),
        I('〜とは限らない','to wa kagiranai','not necessarily…','Qualifies a generalization.',['ゆうめいだから おいしいとは かぎらない','yuumei dakara oishii to wa kagiranai','Being famous does not necessarily mean it is delicious.']),
        I('〜に違いない','ni chigai nai','must surely…','Strong inference based on evidence/belief.',['あの ひとは せんせいに ちがいない','ano hito wa sensei ni chigai nai','That person must be a teacher.']),
        I('〜かねない','kanenai','might (undesirable outcome)','Used for a plausible negative/risky result.',['この ままでは もんだいに なりかねない','kono mama de wa mondai ni narikanenai','At this rate, it could become a problem.'])
      ]),
      U('Formal Reading Patterns','Read dense noun-based structures common in reports and articles.','advanced',[
        I('〜に対して','ni taishite','toward / in contrast to','Can indicate target or contrast depending on context.',['こきゃくに たいして せつめいを おこなう','kokyaku ni taishite setsumei o okonau','Provide an explanation to customers.']),
        I('〜において','ni oite','in / at / regarding — formal','Formal counterpart used for place, field or context.',['かいぎに おいて けっていされた','kaigi ni oite kettei sareta','It was decided at the meeting.']),
        I('〜を通じて','o tsuujite','through / throughout','Expresses a medium/process or an entire period.',['けんしゅうを つうじて まなびました','kenshuu o tsuujite manabimashita','I learned through the training.']),
        I('〜に基づいて','ni motozuite','based on…','Common in formal explanations and evidence-based claims.',['データに もとづいて はんだんします','deeta ni motozuite handan shimasu','We will decide based on the data.'])
      ]),
      U('High-Level Nuance & Fixed Patterns','Recognize advanced patterns used in formal discussion and writing.','advanced',[
        I('〜ざるを得ない','zaru o enai','have no choice but to…','Formal pattern expressing unavoidable necessity.',['けいかくを へんこうせざるを えない','keikaku o henkou sezaru o enai','We have no choice but to change the plan.']),
        I('〜に越したことはない','ni koshita koto wa nai','nothing is better than…','Expresses that an option is preferable if possible.',['じゅんびは はやいに こしたことはない','junbi wa hayai ni koshita koto wa nai','The earlier the preparation, the better.']),
        I('〜かと思いきや','ka to omoikiya','just when one thought…, unexpectedly…','Literary/formal surprise reversal.',['おわったかと おもいきや、また はじまった','owatta ka to omoikiya, mata hajimatta','Just when I thought it was over, it started again.']),
        I('〜ものの','mono no','although / even though','Written/formal concessive connector.',['りかいは したものの、まだ なっとくできない','rikai wa shita mono no, mada nattoku dekinai','Although I understand it, I am still not convinced.'])
      ])
    );

    ja.curriculum={version:8,stages:[
      {id:'beginner-1',label:'Beginner I',description:'Sound system, Hiragana and Katakana foundations',startUnit:0,endUnit:8,available:true},
      {id:'beginner-2',label:'Beginner II',description:'Greetings, self-introduction, numbers and first sentence patterns',startUnit:9,endUnit:b2Start-1,available:true},
      {id:'elementary',label:'Elementary',description:'て-form, past, adjectives, location and shopping',startUnit:b2Start,endUnit:interStart-1,available:true},
      {id:'intermediate',label:'Intermediate',description:'Plain forms, connected ideas, comparisons, conditionals and relative clauses',startUnit:interStart,endUnit:upperStart-1,available:true},
      {id:'upper',label:'Upper Intermediate',description:'Voice, viewpoint, inference, workplace language and nuance',startUnit:upperStart,endUnit:advStart-1,available:true},
      {id:'advanced',label:'Advanced',description:'Honorific register, formal writing, stance and high-level patterns',startUnit:advStart,endUnit:ja.units.length-1,available:true}
    ]};

    mergeVocab(ja,[
      W('かく','kaku','to write'),W('よむ','yomu','to read'),W('はなす','hanasu','to speak'),W('べんきょうする','benkyou suru','to study'),W('あめ','ame','rain'),W('じかん','jikan','time'),W('きっぷ','kippu','ticket'),W('しゃしん','shashin','photo'),W('よやく','yoyaku','reservation'),W('かいぎ','kaigi','meeting'),W('れんらく','renraku','contact / communication'),W('かくにん','kakunin','confirmation'),W('せつめい','setsumei','explanation'),W('けいかく','keikaku','plan'),W('けっか','kekka','result'),W('かだい','kadai','issue / task'),W('じょうけん','jouken','condition'),W('はんだん','handan','judgment / decision'),W('データ','deeta','data'),W('もんだい','mondai','problem'),W('ひつよう','hitsuyou','necessary / need'),W('かのう','kanou','possible'),W('たいせつ','taisetsu','important'),W('べんり','benri','convenient'),W('しずか','shizuka','quiet'),W('ゆうめい','yuumei','famous'),W('経験','keiken','experience'),W('意見','iken','opinion'),W('理由','riyuu','reason'),W('場合','baai','case / situation')
    ]);
  }

  // ───────────────────────── MANDARIN CHINESE ─────────────────────────
  const zh=by('zh');
  if(zh){
    zh.level='Beginner → Advanced Path';
    zh.description='A staged Mandarin path from Pinyin and tones to connected grammar, formal reading and advanced discourse.';
    zh.units.forEach(u=>u.stage='beginner-1');
    const elemStart=zh.units.length;

    zh.units.push(
      U('是、有、在: Core Sentence Frames','Distinguish identity, possession/existence and location.','elementary',[
        I('A 是 B','A shì B','A is B','Use 是 mainly to link noun-like identities/categories.',['我是老师','wǒ shì lǎoshī','I am a teacher.']),
        I('有','yǒu','have / there is','有 expresses possession or existence.',['我有两个朋友','wǒ yǒu liǎng ge péngyou','I have two friends.']),
        I('在','zài','be at / located at','在 before a place expresses location.',['我在公司','wǒ zài gōngsī','I am at the office.']),
        I('不在 / 没有','bú zài / méiyǒu','not at / do not have','Negation differs: 不在 for location; 没有 for possession/existence.',['他今天不在公司','tā jīntiān bú zài gōngsī','He is not at the office today.'])
      ]),
      U('Numbers, Dates & Time','Handle everyday quantities and schedules.','elementary',[
        I('几点？','jǐ diǎn','what time?','点 marks clock hours.',['现在几点？','xiànzài jǐ diǎn','What time is it now?']),
        I('几月几号？','jǐ yuè jǐ hào','what date?','月 is month; 号 is common for calendar date in speech.',['今天几月几号？','jīntiān jǐ yuè jǐ hào','What is today’s date?']),
        I('两点半','liǎng diǎn bàn','2:30','两 is common before classifiers/measure words; 半 means half.',['我们两点半见','wǒmen liǎng diǎn bàn jiàn','Let’s meet at 2:30.']),
        I('从…到…','cóng… dào…','from… to…','Useful for time and place ranges.',['我从九点工作到六点','wǒ cóng jiǔ diǎn gōngzuò dào liù diǎn','I work from 9 to 6.'])
      ]),
      U('Measure Words & Quantity','Use classifiers naturally with nouns.','elementary',[
        I('个','gè','general measure word','Very common classifier, but not universal.',['三个人','sān ge rén','three people']),
        I('本','běn','classifier for bound books','Used for books, magazines and similar bound volumes.',['两本书','liǎng běn shū','two books']),
        I('杯','bēi','cup/glass classifier','Useful for drinks.',['一杯茶','yì bēi chá','a cup of tea']),
        I('张','zhāng','classifier for flat/spread objects','Used for tickets, paper, tables and some flat objects.',['两张票','liǎng zhāng piào','two tickets'])
      ]),
      U('了: Completion & Change','Recognize two important beginner uses of 了.','elementary',[
        I('吃了','chī le','ate / completed eating','Verb + 了 often marks a bounded/completed event in context.',['我吃了早饭','wǒ chī le zǎofàn','I ate breakfast.']),
        I('下雨了','xiàyǔ le','it has started raining','Sentence-final 了 can signal a new/change-of-state situation.',['外面下雨了','wàimiàn xiàyǔ le','It is raining outside now.']),
        I('没(有)+V','méi(yǒu)+V','did not / have not','Completed-event negation commonly uses 没(有), usually without verb 了.',['我没吃早饭','wǒ méi chī zǎofàn','I did not eat breakfast.']),
        I('已经…了','yǐjīng… le','already…','A common frame for an already-realized situation.',['我已经到了','wǒ yǐjīng dào le','I have already arrived.'])
      ]),
      U('会、能、可以、想','Choose common modal verbs for skill, ability, permission and desire.','elementary',[
        I('会','huì','know how / will probably','Often learned first for acquired skill.',['我会说一点中文','wǒ huì shuō yìdiǎn Zhōngwén','I can speak a little Chinese.']),
        I('能','néng','be able to / conditions allow','Ability/possibility often depends on circumstances.',['今天我不能去','jīntiān wǒ bù néng qù','I cannot go today.']),
        I('可以','kěyǐ','may / can','Common for permission or acceptable possibility.',['这里可以拍照吗？','zhèlǐ kěyǐ pāizhào ma','May I take photos here?']),
        I('想','xiǎng','want to / think','Before a verb, often expresses desire/intention.',['我想喝咖啡','wǒ xiǎng hē kāfēi','I want to drink coffee.'])
      ])
    );

    const interStart=zh.units.length;
    zh.units.push(
      U('Aspect: 过、正在、着','Talk about experience, actions in progress and continuing states.','intermediate',[
        I('V过','V guo','have ever done','过 marks past experience relevant to the present.',['我去过北京','wǒ qùguo Běijīng','I have been to Beijing.']),
        I('正在…','zhèngzài','be in the middle of…','Marks an action currently in progress.',['我正在开会','wǒ zhèngzài kāihuì','I am in a meeting right now.']),
        I('V着','V zhe','continuing state','着 often marks a sustained state/result.',['门开着','mén kāizhe','The door is open.']),
        I('一边…一边…','yìbiān… yìbiān…','while doing…','Links two simultaneous activities.',['我一边走路一边听音乐','wǒ yìbiān zǒulù yìbiān tīng yīnyuè','I listen to music while walking.'])
      ]),
      U('Comparison: 比、没有、更、最','Compare people, objects and situations.','intermediate',[
        I('A 比 B + adjective','A bǐ B + adjective','A is more… than B','比 introduces the comparison standard B.',['今天比昨天冷','jīntiān bǐ zuótiān lěng','Today is colder than yesterday.']),
        I('A 没有 B + adjective','A méiyǒu B + adjective','A is not as… as B','Useful for negative comparison.',['这家店没有那家贵','zhè jiā diàn méiyǒu nà jiā guì','This shop is not as expensive as that one.']),
        I('更','gèng','even more / more','Adds comparative degree in context.',['这个办法更简单','zhège bànfǎ gèng jiǎndān','This method is simpler.']),
        I('最','zuì','most','Superlative marker.',['这是最重要的问题','zhè shì zuì zhòngyào de wèntí','This is the most important problem.'])
      ]),
      U('Result Complements','Show whether an action reaches a result.','intermediate',[
        I('看懂','kàn dǒng','read/watch and understand','懂 is the achieved result of understanding.',['这篇文章我看懂了','zhè piān wénzhāng wǒ kàn dǒng le','I understood this article.']),
        I('做完','zuò wán','finish doing','完 marks completion of the action.',['我做完作业了','wǒ zuò wán zuòyè le','I finished my homework.']),
        I('找到','zhǎo dào','find successfully','到 can mark reaching/obtaining the intended result.',['我终于找到钥匙了','wǒ zhōngyú zhǎo dào yàoshi le','I finally found the key.']),
        I('听清楚','tīng qīngchu','hear clearly','清楚 marks clarity as the result.',['我没听清楚','wǒ méi tīng qīngchu','I did not hear clearly.'])
      ]),
      U('Cause, Contrast & Concession','Connect clauses in longer speech.','intermediate',[
        I('因为…所以…','yīnwèi… suǒyǐ…','because… therefore…','A transparent cause-result pair; one side may be omitted in natural speech.',['因为下雨，所以我们没去','yīnwèi xiàyǔ, suǒyǐ wǒmen méi qù','Because it rained, we did not go.']),
        I('虽然…但是…','suīrán… dànshì…','although… but…','Common concession-contrast frame.',['虽然很忙，但是他还是来了','suīrán hěn máng, dànshì tā háishi lái le','Although he was busy, he still came.']),
        I('不但…而且…','búdàn… érqiě…','not only… but also…','Adds a second stronger or additional point.',['他不但会中文，而且会日文','tā búdàn huì Zhōngwén, érqiě huì Rìwén','He speaks not only Chinese but also Japanese.']),
        I('既然…就…','jìrán… jiù…','since… then…','Starts from an accepted condition/fact and draws a consequence.',['既然来了，就一起吃饭吧','jìrán lái le, jiù yìqǐ chīfàn ba','Since you are here, let’s eat together.'])
      ]),
      U('的-Clauses & Noun Modification','Build compact relative clauses before nouns.','intermediate',[
        I('我买的书','wǒ mǎi de shū','the book I bought','A modifying clause comes before 的 + noun.',['这是我昨天买的书','zhè shì wǒ zuótiān mǎi de shū','This is the book I bought yesterday.']),
        I('在北京工作的人','zài Běijīng gōngzuò de rén','people who work in Beijing','Longer clause + 的 modifies 人.',['在北京工作的人很多','zài Běijīng gōngzuò de rén hěn duō','There are many people who work in Beijing.']),
        I('我最喜欢的','wǒ zuì xǐhuan de','the one I like most','The head noun can be omitted when context makes it clear.',['这个是我最喜欢的','zhège shì wǒ zuì xǐhuan de','This is my favorite one.']),
        I('昨天说的事情','zuótiān shuō de shìqing','the matter discussed yesterday','的-phrases are central to Chinese noun modification.',['我们谈谈昨天说的事情','wǒmen tántan zuótiān shuō de shìqing','Let’s talk about the matter mentioned yesterday.'])
      ])
    );

    const upperStart=zh.units.length;
    zh.units.push(
      U('把 Sentences','Use 把 when the disposal/result of a specific object is important.','upper',[
        I('把 + object + V…','bǎ + object + V','dispose/handle a specific object','The object is normally specific/known, and the verb phrase usually contains a result, location, quantity or other complement.',['请把门关上','qǐng bǎ mén guānshàng','Please close the door.']),
        I('把…放在…','bǎ… fàng zài…','put… at…','Very common 把 pattern with a destination/location result.',['把书放在桌子上','bǎ shū fàng zài zhuōzi shàng','Put the book on the table.']),
        I('把…做完','bǎ… zuò wán','finish doing…','The result complement makes the disposal clear.',['我把报告做完了','wǒ bǎ bàogào zuò wán le','I finished the report.']),
        I('别把…','bié bǎ…','do not… (object)','Negative command with 把.',['别把手机忘在车上','bié bǎ shǒujī wàng zài chē shàng','Do not leave your phone in the car.'])
      ]),
      U('被 Passive & Affected Events','Recognize passive structure and affected viewpoint.','upper',[
        I('被','bèi','be… by…','被 introduces a passive agent or marks an affected event.',['我的自行车被人拿走了','wǒ de zìxíngchē bèi rén názǒu le','My bicycle was taken away.']),
        I('让 / 叫 + agent + V','ràng / jiào + agent + V','colloquial passive/causative patterns','In speech, 让 and 叫 can also introduce an agent in passive-like sentences.',['他让老板批评了','tā ràng lǎobǎn pīpíng le','He got criticized by the boss.']),
        I('被 + V + complement','bèi + V + complement','passive with result','Result complements remain important in the passive predicate.',['文件被删掉了','wénjiàn bèi shāndiào le','The file was deleted.']),
        I('没有被…','méiyǒu bèi','was not…','Passive event negation often uses 没有.',['问题还没有被解决','wèntí hái méiyǒu bèi jiějué','The problem has not yet been solved.'])
      ]),
      U('Directional Complements','Track movement and metaphorical direction with 来/去.','upper',[
        I('拿过来','ná guòlái','bring it over here','过来 indicates movement toward the speaker/deictic center.',['请把文件拿过来','qǐng bǎ wénjiàn ná guòlái','Please bring the document over here.']),
        I('走进去','zǒu jìnqù','walk in (away from speaker)','进去 combines inward movement + away from the speaker.',['他走进去了','tā zǒu jìnqù le','He walked inside.']),
        I('想起来','xiǎngqǐlái','remember / come to mind','Directional complements frequently develop figurative meanings.',['我突然想起来了','wǒ tūrán xiǎngqǐlái le','I suddenly remembered.']),
        I('说下去','shuō xiàqù','continue speaking','下去 can indicate continuation over time.',['请继续说下去','qǐng jìxù shuō xiàqù','Please continue speaking.'])
      ]),
      U('Potential Complements','Say whether a result can or cannot be achieved.','upper',[
        I('看得懂','kàn de dǒng','can understand by reading','Insert 得 before the result complement for successful potential.',['这本书我看得懂','zhè běn shū wǒ kàn de dǒng','I can understand this book.']),
        I('看不懂','kàn bu dǒng','cannot understand by reading','Use 不 between verb and result complement for inability.',['这段话我看不懂','zhè duàn huà wǒ kàn bu dǒng','I cannot understand this passage.']),
        I('吃得完','chī de wán','can finish eating','Potential complement focuses on ability to reach the result.',['这么多你吃得完吗？','zhème duō nǐ chī de wán ma','Can you finish this much food?']),
        I('来不及','lái bu jí','not have enough time / too late to…','A high-frequency lexicalized potential form.',['快点，不然来不及了','kuài diǎn, bùrán lái bu jí le','Hurry, otherwise we will be too late.'])
      ]),
      U('Condition, Scope & Emphasis','Build stronger logical relations and emphasis.','upper',[
        I('如果…就…','rúguǒ… jiù…','if… then…','General conditional frame.',['如果明天下雨，我们就不去了','rúguǒ míngtiān xiàyǔ, wǒmen jiù bú qù le','If it rains tomorrow, we will not go.']),
        I('只要…就…','zhǐyào… jiù…','as long as… then…','Marks a sufficient condition.',['只要努力，就会进步','zhǐyào nǔlì, jiù huì jìnbù','As long as you work hard, you will improve.']),
        I('只有…才…','zhǐyǒu… cái…','only if… then…','Marks a necessary/restrictive condition.',['只有练习，才会熟练','zhǐyǒu liànxí, cái huì shúliàn','Only through practice can you become proficient.']),
        I('连…都…','lián… dōu…','even…','Highlights an extreme/unexpected member of a set.',['他忙得连饭都没吃','tā máng de lián fàn dōu méi chī','He was so busy he did not even eat.'])
      ])
    );

    const advStart=zh.units.length;
    zh.units.push(
      U('Formal Connectors & Structured Argument','Follow more formal written and presentation-style Chinese.','advanced',[
        I('然而','rán’ér','however','Formal contrast connector common in writing.',['方案看起来简单，然而实施起来并不容易','fāng’àn kànqǐlái jiǎndān, rán’ér shíshī qǐlái bìng bù róngyì','The plan looks simple; however, implementation is not easy.']),
        I('因此','yīncǐ','therefore','Formal cause-result connector.',['成本上升，因此我们需要调整预算','chéngběn shàngshēng, yīncǐ wǒmen xūyào tiáozhěng yùsuàn','Costs rose; therefore, we need to adjust the budget.']),
        I('此外','cǐwài','in addition','Adds another formal point.',['此外，我们还需要考虑时间因素','cǐwài, wǒmen hái xūyào kǎolǜ shíjiān yīnsù','In addition, we also need to consider the time factor.']),
        I('尽管如此','jǐnguǎn rúcǐ','even so / nevertheless','Concedes the previous point while continuing a different conclusion.',['尽管如此，这个方法仍然值得尝试','jǐnguǎn rúcǐ, zhège fāngfǎ réngrán zhíde chángshì','Even so, this method is still worth trying.'])
      ]),
      U('Advanced Stance & Judgment','Express probability, inevitability and strategic preference.','advanced',[
        I('未必','wèibì','not necessarily','Softly challenges an assumed conclusion.',['贵的东西未必更好','guì de dōngxi wèibì gèng hǎo','Expensive things are not necessarily better.']),
        I('难免','nánmiǎn','hard to avoid / inevitably','Often used for understandable negative outcomes.',['第一次做难免会出错','dì-yī cì zuò nánmiǎn huì chūcuò','It is hard to avoid mistakes the first time.']),
        I('与其…不如…','yǔqí… bùrú…','rather than… better to…','Compares two courses of action and recommends the second.',['与其等，不如现在开始','yǔqí děng, bùrú xiànzài kāishǐ','Rather than wait, it is better to start now.']),
        I('毕竟','bìjìng','after all','Adds a reason viewed as fundamental or obvious in context.',['别太着急，毕竟这是第一次','bié tài zháojí, bìjìng zhè shì dì-yī cì','Do not worry too much; after all, this is the first time.'])
      ]),
      U('Formal Evidence & Reporting','Read and produce neutral evidence-based statements.','advanced',[
        I('据…显示','jù… xiǎnshì','according to… / data show…','Useful in reports when citing a source or dataset.',['据调查显示，用户满意度有所提高','jù diàochá xiǎnshì, yònghù mǎnyìdù yǒusuǒ tígāo','According to the survey, user satisfaction increased somewhat.']),
        I('从…来看','cóng… láikàn','viewed from…','Frames an assessment from a perspective or evidence source.',['从数据来看，趋势比较稳定','cóng shùjù láikàn, qūshì bǐjiào wěndìng','From the data, the trend is relatively stable.']),
        I('值得注意的是','zhíde zhùyì de shì','it is worth noting that…','Introduces an important observation in formal discourse.',['值得注意的是，风险仍然存在','zhíde zhùyì de shì, fēngxiǎn réngrán cúnzài','It is worth noting that the risk still exists.']),
        I('总的来说','zǒng de láishuō','generally speaking / overall','Summarizes a balanced conclusion.',['总的来说，这个项目达到了目标','zǒng de láishuō, zhège xiàngmù dádào le mùbiāo','Overall, the project achieved its goal.'])
      ]),
      U('Discourse Focus & Contrast','Handle nuanced focus across longer arguments.','advanced',[
        I('一方面…另一方面…','yì fāngmiàn… lìng yì fāngmiàn…','on one hand… on the other…','Balances two aspects rather than simply contradicting.',['一方面要控制成本，另一方面要保证质量','yì fāngmiàn yào kòngzhì chéngběn, lìng yì fāngmiàn yào bǎozhèng zhìliàng','On one hand we must control cost; on the other, ensure quality.']),
        I('反而','fǎn’ér','instead / contrary to expectation','Marks an outcome opposite to what might be expected.',['休息以后，他反而更累了','xiūxi yǐhòu, tā fǎn’ér gèng lèi le','After resting, he was instead even more tired.']),
        I('甚至','shènzhì','even / to the extent of','Adds an extreme item or escalation.',['有些人甚至不知道这个规定','yǒuxiē rén shènzhì bù zhīdào zhège guīdìng','Some people do not even know this rule.']),
        I('何况','hékuàng','let alone / moreover','Adds a stronger case following an already-valid one.',['这么简单的问题他都会，何况你呢','zhème jiǎndān de wèntí tā dōu huì, hékuàng nǐ ne','He can handle such a simple problem, let alone you.'])
      ]),
      U('High-Level Fixed Patterns','Recognize compact patterns common in educated speech and writing.','advanced',[
        I('既…又…','jì… yòu…','both… and…','Coordinates two qualities/actions.',['这个方案既安全又经济','zhège fāng’àn jì ānquán yòu jīngjì','This plan is both safe and economical.']),
        I('之所以…是因为…','zhī suǒyǐ… shì yīnwèi…','the reason… is because…','Formal explanatory frame that foregrounds the outcome.',['之所以成功，是因为准备充分','zhī suǒyǐ chénggōng, shì yīnwèi zhǔnbèi chōngfèn','The reason it succeeded is that the preparation was thorough.']),
        I('不仅仅是…','bù jǐnjǐn shì…','it is not merely…','Expands beyond an overly narrow characterization.',['这不仅仅是技术问题','zhè bù jǐnjǐn shì jìshù wèntí','This is not merely a technical problem.']),
        I('归根结底','guīgēn jiédǐ','ultimately / at root','Summarizes the underlying issue after discussion.',['归根结底，关键还是执行','guīgēn jiédǐ, guānjiàn háishi zhíxíng','Ultimately, the key is still execution.'])
      ])
    );

    zh.curriculum={version:8,stages:[
      {id:'beginner-1',label:'Beginner I',description:'Pinyin, tones, first characters and basic questions',startUnit:0,endUnit:elemStart-1,available:true},
      {id:'elementary',label:'Elementary',description:'Core sentence frames, time, measure words, 了 and modal verbs',startUnit:elemStart,endUnit:interStart-1,available:true},
      {id:'intermediate',label:'Intermediate',description:'Aspect, comparison, complements, clause connection and 的-modification',startUnit:interStart,endUnit:upperStart-1,available:true},
      {id:'upper',label:'Upper Intermediate',description:'把/被, directional and potential complements, logic and emphasis',startUnit:upperStart,endUnit:advStart-1,available:true},
      {id:'advanced',label:'Advanced',description:'Formal connectors, stance, reporting, discourse focus and fixed patterns',startUnit:advStart,endUnit:zh.units.length-1,available:true}
    ]};

    mergeVocab(zh,[
      W('公司','gōngsī','company / office'),W('工作','gōngzuò','work / to work'),W('报告','bàogào','report'),W('会议','huìyì','meeting'),W('计划','jìhuà','plan'),W('结果','jiéguǒ','result'),W('问题','wèntí','problem / question'),W('办法','bànfǎ','method / solution'),W('重要','zhòngyào','important'),W('简单','jiǎndān','simple'),W('复杂','fùzá','complex'),W('安全','ānquán','safe / safety'),W('质量','zhìliàng','quality'),W('成本','chéngběn','cost'),W('预算','yùsuàn','budget'),W('数据','shùjù','data'),W('趋势','qūshì','trend'),W('风险','fēngxiǎn','risk'),W('目标','mùbiāo','goal / target'),W('执行','zhíxíng','execute / implementation'),W('准备','zhǔnbèi','prepare / preparation'),W('解决','jiějué','solve'),W('调整','tiáozhěng','adjust'),W('考虑','kǎolǜ','consider'),W('尝试','chángshì','try / attempt'),W('经验','jīngyàn','experience'),W('意见','yìjiàn','opinion'),W('原因','yuányīn','reason'),W('机会','jīhuì','opportunity'),W('规定','guīdìng','rule / regulation')
    ]);
  }

  // Other languages retain their V7 beginner content but now expose a consistent staged roadmap.
  LANGUAGES.filter(l=>!['ja','zh'].includes(l.id)).forEach(l=>{
    l.curriculum={version:8,stages:[
      {id:'beginner',label:'Beginner',description:'Current V7 A1 foundations',startUnit:0,endUnit:l.units.length-1,available:true},
      {id:'elementary',label:'Elementary',description:'Planned: expanded everyday grammar and conversation',available:false},
      {id:'intermediate',label:'Intermediate',description:'Planned: connected speech, broader vocabulary and longer texts',available:false},
      {id:'upper',label:'Upper Intermediate',description:'Planned: authentic-style listening, reading and nuanced grammar',available:false},
      {id:'advanced',label:'Advanced',description:'Planned: register, precision, discourse and advanced expression',available:false}
    ]};
  });
})();
