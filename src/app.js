import{initializeStore,getState,subscribe}from'./store.js';
import{initializeCloud,subscribeAuth,subscribeStatus,getUser,isSignedIn,syncNow}from'./cloud.js';
import{AccountUi}from'./auth-ui.js';
import{HomeController}from'./home.js';
import{PracticeController}from'./practice.js';
import{CourseController}from'./course.js';

const $=id=>document.getElementById(id);
let renderQueued=false;

function scheduleRender(home,account,course,practice){
  if(renderQueued)return;
  renderQueued=true;
  requestAnimationFrame(()=>{
    renderQueued=false;
    home.render();
    account.renderAccountButton();
    if($('courseScreen').classList.contains('active')){
      practice.renderSkills();
      course.renderProgress();
    }
  });
}

async function registerServiceWorker(){
  if(!('serviceWorker'in navigator))return;
  try{await navigator.serviceWorker.register('./sw.js',{scope:'./'})}
  catch(error){console.warn('[Language Lab] service worker registration failed',error)}
}

async function boot(){
  await initializeStore();

  const practice=new PracticeController();
  const course=new CourseController(practice);
  const account=new AccountUi();
  const home=new HomeController({openCourse:code=>course.open(code,{tab:'learn'}),openPractice:code=>course.openPractice(code)});

  subscribe(()=>scheduleRender(home,account,course,practice));
  subscribeStatus(status=>{$('syncStatus').textContent=status});
  subscribeAuth(()=>{
    account.checkOnboarding();
    account.offerGuestImport().catch(error=>console.warn('[Language Lab] Guest import check failed',error));
    scheduleRender(home,account,course,practice);
  });
  window.addEventListener('language-lab-home-requested',()=>home.render());
  window.addEventListener('language-lab-cloud-synced',()=>scheduleRender(home,account,course,practice));

  home.render();account.renderAccountButton();
  await initializeCloud();
  account.checkOnboarding();
  await account.offerGuestImport();
  home.render();

  if(isSignedIn()&&getState().prefs.dirty)syncNow('boot').catch(()=>{});
  registerServiceWorker();

  window.LanguageLab={version:'12.0',getState:()=>structuredClone(getState()),user:()=>getUser(),sync:()=>syncNow('manual')};
}

boot().catch(error=>{
  console.error('[Language Lab] fatal boot failure',error);
  document.body.insertAdjacentHTML('beforeend','<div class="fatal-error"><b>Language Lab could not start.</b><span>Please refresh the page.</span></div>');
});
