import{courses,getCourse}from'./data.js';
import{dailyMission,dailyMissionProgress,dailyXp,overallMastery,reviewsDue,startedLanguages,streak,totalXp}from'./learning.js';
import{getState,updatePrefs}from'./store.js';
import{isSignedIn}from'./cloud.js';
import{escapeHtml}from'./utils.js';

const $=id=>document.getElementById(id);
const taskMeta={listening:['👂','Listen'],speaking:['🎙️','Speak'],recognition:['👁️','Recognize'],recall:['🧠','Recall'],writing:['✍️','Write']};

export class HomeController{
  constructor({openCourse,openPractice}){
    this.openCourse=openCourse;
    this.openPractice=openPractice;
    this.bind();
  }

  bind(){
    $('resumeBtn').addEventListener('click',()=>this.openCourse(getState().ui.currentLanguage||getState().prefs.primaryLanguage));
    $('dailyBtn').addEventListener('click',()=>this.openPractice(getState().prefs.primaryLanguage));
    $('dailyStartBtn').addEventListener('click',()=>this.openPractice(getState().prefs.primaryLanguage));
    document.querySelector('.goal-buttons').addEventListener('click',event=>{
      const button=event.target.closest('[data-goal]');
      if(!button)return;
      updatePrefs({dailyGoalXp:Number(button.dataset.goal)});
    });
    $('languageGrid').addEventListener('click',event=>{
      const button=event.target.closest('[data-language]');
      if(button)this.openCourse(button.dataset.language);
    });
  }

  visibleCourses(){
    if(!isSignedIn())return courses;
    const enabled=new Set(getState().prefs.enabledLanguages);
    return courses.filter(course=>enabled.has(course.id));
  }

  render(){
    const state=getState();
    const primary=getCourse(state.prefs.primaryLanguage);
    const xp=totalXp();
    const activeStreak=streak();
    $('topXp').textContent=xp;
    $('topStreak').textContent=activeStreak;
    $('homeXp').textContent=xp;
    $('homeStreak').textContent=activeStreak;
    $('homeStarted').textContent=startedLanguages();
    $('homeDue').textContent=reviewsDue();

    this.renderDaily(primary);
    this.renderLanguages();
    this.renderGoal();
  }

  renderDaily(primary){
    const mission=dailyMission(primary.id);
    const progress=dailyMissionProgress(primary.id);
    $('dailyLanguage').textContent=primary.flag;
    $('dailyTitle').textContent=`${primary.name} · Listen & speak`;
    const completed=mission.filter(task=>Number(progress[task.skill]||0)>0).length;
    $('dailyProgressText').textContent=mission.length?`${completed}/${mission.length} focus activities represented today. Practice weak skills first.`:'Practice your current course.';
    $('dailyTasks').innerHTML=mission.map(task=>{
      const [icon,label]=taskMeta[task.skill]||['•',task.skill];
      const done=Number(progress[task.skill]||0)>0;
      return`<div class="daily-task ${done?'done':''}"><span>${done?'✓':icon}</span><div><b>${label}</b><small>${escapeHtml(task.target?.meaning||task.target?.native||'Practice')}</small></div></div>`;
    }).join('')||'<p class="muted">Open the course to begin practice.</p>';
  }

  renderGoal(){
    const goal=getState().prefs.dailyGoalXp;
    const earned=dailyXp();
    $('dailyXp').textContent=earned;
    $('dailyGoal').textContent=goal;
    $('dailyGoalBar').style.width=`${Math.min(100,earned/goal*100)}%`;
    document.querySelectorAll('[data-goal]').forEach(button=>button.classList.toggle('active',Number(button.dataset.goal)===goal));
  }

  renderLanguages(){
    const signedIn=isSignedIn();
    $('languagesHeading').textContent=signedIn?'My languages':'Choose a language';
    $('languagesDescription').textContent=signedIn?'Only courses you add appear here. Your primary language drives today’s practice.':'Guest mode shows all available courses.';
    $('addLanguageBtn').classList.toggle('hidden',!signedIn);
    $('manageLanguagesBtn').classList.toggle('hidden',!signedIn);

    const primary=getState().prefs.primaryLanguage;
    $('languageGrid').innerHTML=this.visibleCourses().map(course=>{
      const mastery=overallMastery(course.id);
      return`<button class="language-card" data-language="${course.id}" type="button">
        <div class="lang-top"><span class="lang-flag">${course.flag}</span>${signedIn&&course.id===primary?'<span class="primary-label">Primary</span>':`<span class="badge">${escapeHtml(course.level)}</span>`}</div>
        <h3>${escapeHtml(course.name)}</h3>
        <p>${escapeHtml(course.description)}</p>
        <div class="progressbar"><span style="width:${mastery}%"></span></div>
        <div class="lang-bottom"><span>${mastery}% overall</span><span>${course.units.length} units</span></div>
      </button>`;
    }).join('');
  }
}
