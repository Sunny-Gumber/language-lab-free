import{courses,getCourse}from'./data.js';
import{dailyMission,dailyMissionProgress,dailyXp,overallMastery,reviewsDue,startedLanguages,streak,totalXp}from'./learning.js';
import{getState,updatePrefs}from'./store.js';
import{isSignedIn}from'./cloud.js';
import{speak}from'./audio.js';
import{escapeHtml}from'./utils.js';

const $=id=>document.getElementById(id);
const taskMeta={listening:['👂','Listen'],speaking:['🎙️','Speak'],recognition:['👁️','Recognize'],recall:['🧠','Recall'],writing:['✍️','Write']};

function ensureHomeStyles(){
  if(document.querySelector('link[data-home-v12]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='./home-v12.css';link.dataset.homeV12='true';document.head.append(link);
}

function visitorSections(){return`
  <section id="visitorHow" class="visitor-section visitor-only">
    <div class="visitor-section-head"><span class="eyebrow">How Language Lab works</span><h2>From hearing it to actually using it.</h2><p>The learning flow is communication-first: train your ear, connect sound to meaning, speak early, then strengthen memory through recall.</p></div>
    <div class="how-v12-grid">
      <article class="how-step"><span class="how-number">01</span><span class="step-icon">👂</span><h3>Listen first</h3><p>Hear the target before the answer so your brain learns to process the sound, not just the spelling.</p></article>
      <article class="how-step"><span class="how-number">02</span><span class="step-icon">💡</span><h3>Understand it</h3><p>Connect what you heard with meaning through recognition and short comprehension checks.</p></article>
      <article class="how-step"><span class="how-number">03</span><span class="step-icon">🎙️</span><h3>Speak early</h3><p>Shadow phrases and use browser speech recognition as a practical text-match practice signal.</p></article>
      <article class="how-step"><span class="how-number">04</span><span class="step-icon">🧠</span><h3>Remember it</h3><p>Recall cards, quizzes and review timing bring weak material back instead of rewarding passive taps.</p></article>
    </div>
  </section>
  <section class="visitor-section visitor-only why-v12">
    <div class="visitor-section-head"><span class="eyebrow">Why Language Lab</span><h2>Built for practice, not screen time.</h2><p>No subscription wall is required to start. The browser itself becomes your listening, speaking and recall lab.</p></div>
    <div class="why-v12-grid">
      <article class="why-card"><span class="why-icon">🎧</span><h3>Listening-first</h3><p>Audio comes before the answer so comprehension develops from sound.</p></article>
      <article class="why-card"><span class="why-icon">🎙️</span><h3>Speaking from day one</h3><p>Practice producing useful phrases instead of waiting until you “finish grammar”.</p></article>
      <article class="why-card"><span class="why-icon">📈</span><h3>Weak skills return</h3><p>Your practice dashboard uses actual attempts, coverage and review timing to focus attention.</p></article>
      <article class="why-card"><span class="why-icon">📱</span><h3>Works on mobile</h3><p>Designed for phone, tablet and desktop with an installable offline-capable app shell.</p></article>
      <article class="why-card"><span class="why-icon">☁️</span><h3>Account is optional</h3><p>Start as Guest. Sign in later if you want progress synchronized across devices.</p></article>
      <article class="why-card"><span class="why-icon">🆓</span><h3>Start free</h3><p>No credit card and no forced registration before you can try the learning experience.</p></article>
    </div>
  </section>
  <section class="visitor-section visitor-only">
    <div class="visitor-section-head"><span class="eyebrow">Course depth</span><h2>Know what each course includes.</h2><p>We show the curriculum depth clearly instead of pretending every language currently has identical coverage.</p></div>
    <div class="depth-grid">
      <article class="depth-card featured"><span class="eyebrow light">Deeper structured paths</span><h3>🇯🇵 Japanese &nbsp; 🇨🇳 Mandarin</h3><p>Multi-stage paths with foundation material plus progressively more advanced grammar, vocabulary and communication topics.</p><div class="depth-badges"><span>Listening</span><span>Speaking</span><span>Grammar</span><span>Vocabulary</span><span>Writing practice</span></div></article>
      <article class="depth-card"><span class="eyebrow">Foundation courses</span><h3>8 more languages</h3><p>Korean, English, Hindi, Spanish, French, German, Arabic and Portuguese currently focus on practical foundations with the same core practice tools.</p><div class="depth-badges"><span>Core phrases</span><span>Vocabulary</span><span>Listening</span><span>Recall</span></div></article>
    </div>
  </section>
  <section class="final-cta-v12 visitor-only"><h2>Ready to use a language?</h2><p>Choose one above and start with a real listening activity. You do not need an account to begin.</p><button id="visitorFinalStart" class="primary" type="button">Choose a language</button><small>Free to start • No credit card • No account required</small></section>`}

function visitorHero(){return`
  <div class="visitor-hero-copy">
    <span class="eyebrow light">Listen first • speak early • 10 languages</span>
    <h1>Don't just study a language.<span>Start using it.</span></h1>
    <p>Listen to useful phrases, understand what they mean, speak them aloud and remember them through active practice — directly in your browser.</p>
    <div class="actions"><button id="visitorStartBtn" class="primary" type="button">Start learning free</button><button id="visitorDemoBtn" class="secondary dark" type="button">🔊 Try a 30-sec demo</button></div>
    <div class="visitor-trust"><span>✓ Free to start</span><span>✓ No credit card</span><span>✓ No account required</span><span>✓ Works on mobile</span></div>
  </div>
  <article id="visitorDemoCard" class="lesson-preview" aria-label="Language Lab lesson preview">
    <div class="preview-top"><span>Try Language Lab</span><span class="preview-live">30-sec demo</span></div>
    <div class="preview-audio"><div><div class="wave">▂ ▅ ▇ ▅ ▂</div><strong>こんにちは</strong><small>Listen before reading the answer</small><br><button id="demoPlayBtn" class="preview-play" type="button">▶ Play Japanese</button></div></div>
    <p class="preview-question">What does it mean?</p>
    <div class="preview-options"><button class="preview-option" data-demo-answer="morning" type="button">Good morning</button><button class="preview-option" data-demo-answer="hello" type="button">Hello</button><button class="preview-option" data-demo-answer="thanks" type="button">Thank you</button></div>
    <p id="demoFeedback" class="preview-feedback">Choose an answer after listening.</p>
    <button id="demoPracticeBtn" class="primary preview-next" type="button">🎙 Practice Japanese now</button>
  </article>`}

function learnerHero(primary){return`
  <div class="hero-copy"><span class="eyebrow light">${escapeHtml(primary.name)} • keep the habit moving</span><h1>Keep your language <span>moving.</span></h1><p>Continue where you stopped, practise the skills that need attention, and keep your progress active.</p><div class="actions"><button id="resumeBtn" class="primary" type="button">Continue ${escapeHtml(primary.name)}</button><button id="dailyBtn" class="secondary dark" type="button">Today's practice</button></div></div>
  <div class="hero-languages" aria-hidden="true"><span>${primary.flag}</span><span>👂</span><span>🎙️</span><span>🧠</span><span>📈</span><span>✓</span></div>`}

export class HomeController{
  constructor({openCourse,openPractice}){
    this.openCourse=openCourse;this.openPractice=openPractice;
    ensureHomeStyles();this.ensureScaffolding();this.bind();
  }
  ensureScaffolding(){
    const grid=$('languageGrid'),head=grid?.previousElementSibling,how=document.querySelector('#homeScreen > .how-grid'),topbar=document.querySelector('.topbar');
    if(head)head.id='languagesSection';
    if(how&&!document.getElementById('visitorHow'))how.insertAdjacentHTML('afterend',visitorSections());
    if(topbar&&!document.getElementById('visitorTopNav')){
      const nav=document.createElement('nav');nav.id='visitorTopNav';nav.className='visitor-top-nav';nav.setAttribute('aria-label','Home sections');nav.innerHTML='<button data-home-jump="languages" type="button">Languages</button><button data-home-jump="how" type="button">How it works</button>';
      topbar.insertBefore(nav,topbar.querySelector('.top-actions'));
    }
  }
  hasLearningHistory(){return getState().events.some(event=>event?.activity==='practice')}
  isStarter(){return!this.hasLearningHistory()}
  bind(){
    $('homeScreen').addEventListener('click',event=>{
      const button=event.target.closest('button');if(!button)return;
      if(button.id==='resumeBtn')return this.openCourse(getState().ui.currentLanguage||getState().prefs.primaryLanguage);
      if(button.id==='dailyBtn'||button.id==='dailyStartBtn')return this.openPractice(getState().prefs.primaryLanguage);
      if(button.id==='visitorStartBtn'||button.id==='visitorFinalStart')return this.scrollToLanguages();
      if(button.id==='visitorDemoBtn'){this.playDemo();document.getElementById('visitorDemoCard')?.scrollIntoView({behavior:'smooth',block:'center'});return}
      if(button.id==='demoPlayBtn')return this.playDemo();
      if(button.id==='demoPracticeBtn')return this.openPractice('ja');
      if(button.dataset.demoAnswer)return this.answerDemo(button);
      if(button.dataset.goal)return updatePrefs({dailyGoalXp:Number(button.dataset.goal)});
      if(button.dataset.language)return this.isStarter()?this.openPractice(button.dataset.language):this.openCourse(button.dataset.language);
    });
    document.getElementById('visitorTopNav')?.addEventListener('click',event=>{const button=event.target.closest('[data-home-jump]');if(!button)return;(button.dataset.homeJump==='how'?document.getElementById('visitorHow'):document.getElementById('languagesSection'))?.scrollIntoView({behavior:'smooth',block:'start'})});
  }
  scrollToLanguages(){document.getElementById('languagesSection')?.scrollIntoView({behavior:'smooth',block:'start'})}
  playDemo(){speak('こんにちは',getCourse('ja'),{rate:.78})}
  answerDemo(button){
    const correct=button.dataset.demoAnswer==='hello';
    document.querySelectorAll('.preview-option').forEach(option=>option.classList.remove('correct','wrong'));
    button.classList.add(correct?'correct':'wrong');
    const feedback=$('demoFeedback');if(!feedback)return;
    feedback.classList.toggle('success',correct);feedback.textContent=correct?'✓ Correct — now try saying it yourself.':'Not this one. Listen again and try once more.';
    $('demoPracticeBtn')?.classList.toggle('visible',correct);
  }
  visibleCourses(){if(!isSignedIn())return courses;const enabled=new Set(getState().prefs.enabledLanguages);return courses.filter(course=>enabled.has(course.id))}
  render(){
    const state=getState(),primary=getCourse(state.prefs.primaryLanguage),xp=totalXp(),activeStreak=streak(),starter=this.isStarter();
    document.body.classList.toggle('visitor-mode',starter);
    const hero=document.querySelector('#homeScreen > .hero');if(hero){hero.classList.toggle('visitor-hero',starter);hero.classList.toggle('learner-hero',!starter);hero.innerHTML=starter?visitorHero():learnerHero(primary)}
    $('topXp').textContent=xp;$('topStreak').textContent=activeStreak;$('homeXp').textContent=xp;$('homeStreak').textContent=activeStreak;$('homeStarted').textContent=startedLanguages();$('homeDue').textContent=reviewsDue();
    this.renderDaily(primary);this.renderLanguages(starter);this.renderGoal();
  }
  renderDaily(primary){
    const mission=dailyMission(primary.id),progress=dailyMissionProgress(primary.id),isDone=task=>Number(progress[task.skill]||0)>=Number(task.occurrence||1),completed=mission.filter(isDone).length;
    $('dailyLanguage').textContent=primary.flag;$('dailyTitle').textContent=`${primary.name} · Listen & speak`;
    $('dailyProgressText').textContent=mission.length?`${completed}/${mission.length} focus activities represented today. Practice weak skills first.`:'Practice your current course.';
    $('dailyTasks').innerHTML=mission.map(task=>{const[icon,label]=taskMeta[task.skill]||['•',task.skill],done=isDone(task);return`<div class="daily-task ${done?'done':''}"><span>${done?'✓':icon}</span><div><b>${label}</b><small>${escapeHtml(task.target?.meaning||task.target?.native||'Practice')}</small></div></div>`}).join('')||'<p class="muted">Open the course to begin practice.</p>';
  }
  renderGoal(){const goal=getState().prefs.dailyGoalXp,earned=dailyXp();$('dailyXp').textContent=earned;$('dailyGoal').textContent=goal;$('dailyGoalBar').style.width=`${Math.min(100,earned/goal*100)}%`;document.querySelectorAll('[data-goal]').forEach(button=>button.classList.toggle('active',Number(button.dataset.goal)===goal))}
  renderLanguages(starter=this.isStarter()){
    const signedIn=isSignedIn();
    $('languagesHeading').textContent=starter?'What do you want to learn?':signedIn?'My languages':'Your languages';
    $('languagesDescription').textContent=starter?(signedIn?'Start with your chosen course. You can add another language whenever you want.':'Choose a language and start immediately. No account required.'):signedIn?'Only courses you add appear here. Your primary language drives today’s practice.':'Continue a course or choose another language.';
    $('addLanguageBtn').classList.toggle('hidden',!signedIn);$('manageLanguagesBtn').classList.toggle('hidden',!signedIn);
    const primary=getState().prefs.primaryLanguage;
    $('languageGrid').innerHTML=this.visibleCourses().map(course=>{
      if(starter){
        const deep=course.id==='ja'||course.id==='zh',features=deep?['Listening','Speaking','Structured path']:['Listening','Vocabulary','Foundation'];
        return`<button class="language-card starter-language-card" data-language="${course.id}" type="button"><div class="lang-top"><span class="lang-flag">${course.flag}</span><span class="badge">${deep?'Structured path':'Foundation'}</span></div><h3>${escapeHtml(course.name)}</h3><span class="starter-course-type">${deep?'Foundation → advanced topics':'Practical foundation course'}</span><p>${escapeHtml(course.description)}</p><div class="starter-course-features">${features.map(feature=>`<span>${feature}</span>`).join('')}</div><div class="starter-course-cta"><span>Start ${escapeHtml(course.name)}</span><span>→</span></div></button>`;
      }
      const mastery=overallMastery(course.id);return`<button class="language-card" data-language="${course.id}" type="button"><div class="lang-top"><span class="lang-flag">${course.flag}</span>${signedIn&&course.id===primary?'<span class="primary-label">Primary</span>':`<span class="badge">${escapeHtml(course.level)}</span>`}</div><h3>${escapeHtml(course.name)}</h3><p>${escapeHtml(course.description)}</p><div class="progressbar"><span style="width:${mastery}%"></span></div><div class="lang-bottom"><span>${mastery}% overall</span><span>${course.units.length} units</span></div></button>`;
    }).join('');
  }
}
