import{courses,courseCodes}from'./data.js';
import{displayName,getUser,isSignedIn,signInWithGoogle,signOut,syncNow}from'./cloud.js';
import{getState,guestImportAvailable,importGuestLearning,markGuestImportDecided,updatePrefs}from'./store.js';
import{escapeHtml}from'./utils.js';

const $=id=>document.getElementById(id);
function openOverlay(id){$(id)?.classList.remove('hidden')}
function closeOverlay(id){$(id)?.classList.add('hidden')}

export class AccountUi{
  constructor(){
    this.onboardingLanguage='ja';
    this.onboardingAudio='auto';
    this.guestImportPrompting=false;
    this.bind();
  }

  bind(){
    $('accountBtn').addEventListener('click',()=>this.openAccount());
    document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>closeOverlay(button.dataset.close)));
    document.querySelectorAll('.overlay').forEach(overlay=>overlay.addEventListener('click',event=>{if(event.target===overlay)closeOverlay(overlay.id)}));
    document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.overlay:not(.hidden)').forEach(overlay=>closeOverlay(overlay.id))});

    $('onboardingSaveBtn').addEventListener('click',()=>this.saveOnboarding());
    $('onboardingAudio').addEventListener('click',event=>{
      const button=event.target.closest('[data-onboard-audio]');
      if(!button)return;
      this.onboardingAudio=button.dataset.onboardAudio;
      this.renderOnboardingAudio();
    });

    $('addLanguageBtn').addEventListener('click',()=>this.openLanguages('add'));
    $('manageLanguagesBtn').addEventListener('click',()=>this.openLanguages('manage'));
    $('languageManagerGrid').addEventListener('click',event=>this.handleLanguageManagerClick(event));
  }

  renderAccountButton(){
    const button=$('accountBtn');
    if(isSignedIn()){button.textContent=`👤 ${displayName()}`;button.classList.add('signed-in')}
    else{button.textContent='👤 Sign in';button.classList.remove('signed-in')}
  }

  openAccount(){
    const body=$('authBody');
    if(isSignedIn()){
      const user=getUser();
      body.innerHTML=`
        <div class="account-summary">
          <strong>${escapeHtml(displayName(user))}</strong>
          <span>${escapeHtml(user?.email||'Signed-in learner')}</span>
          <small>☁ Learning events sync to this account.</small>
        </div>
        <button id="accountLanguagesBtn" class="secondary full" type="button">Manage learning languages</button>
        <button id="signOutBtn" class="danger full" type="button">Sign out</button>`;
      $('accountLanguagesBtn').addEventListener('click',()=>{closeOverlay('authOverlay');this.openLanguages('manage')});
      $('signOutBtn').addEventListener('click',async()=>{
        const button=$('signOutBtn');button.disabled=true;button.textContent='Signing out…';
        try{await signOut();closeOverlay('authOverlay')}
        catch(error){button.disabled=false;button.textContent='Sign out';alert(error.message||'Could not sign out.')}
      });
    }else{
      body.innerHTML=`
        <p class="muted">Use Google to keep your learning events and preferences available on your other devices.</p>
        <button id="googleSignInBtn" class="primary full" type="button">G&nbsp;&nbsp;Continue with Google</button>
        <p id="authStatus" class="feedback" aria-live="polite"></p>
        <p class="tiny muted">You can also close this window and continue as Guest. Guest learning stays on this browser and can be imported after you sign in.</p>`;
      $('googleSignInBtn').addEventListener('click',async()=>{
        const button=$('googleSignInBtn');button.disabled=true;button.textContent='Opening Google…';
        try{await signInWithGoogle()}
        catch(error){button.disabled=false;button.textContent='G  Continue with Google';$('authStatus').textContent=error.message||'Could not start Google sign-in.'}
      });
    }
    openOverlay('authOverlay');
  }

  checkOnboarding(){
    this.renderAccountButton();
    if(!isSignedIn()){closeOverlay('onboardingOverlay');return}
    const prefs=getState().prefs;
    if(prefs.onboardingCompleted){closeOverlay('onboardingOverlay');return}
    this.onboardingLanguage=courseCodes.includes(prefs.primaryLanguage)?prefs.primaryLanguage:'ja';
    this.onboardingAudio=prefs.audioPreference||'auto';
    this.renderOnboardingLanguages();this.renderOnboardingAudio();$('onboardingStatus').textContent='';openOverlay('onboardingOverlay');
  }

  async offerGuestImport(){
    if(this.guestImportPrompting||!isSignedIn()||!getState().prefs.onboardingCompleted)return;
    const user=getUser();if(!user||!(await guestImportAvailable(user.id)))return;
    this.guestImportPrompting=true;
    try{
      const accepted=confirm('Guest learning exists on this device. Import that progress into your signed-in account?');
      if(!accepted){markGuestImportDecided(user.id);return}
      const count=await importGuestLearning(user.id);
      if(count){await syncNow('guest-import');alert(`Imported ${count} Guest learning event${count===1?'':'s'} into your account.`)}
    }catch(error){console.warn('[Language Lab] Guest import failed',error);alert('Guest progress could not be imported yet. You can sign out and continue using it as Guest.')}
    finally{this.guestImportPrompting=false}
  }

  renderOnboardingLanguages(){
    $('onboardingLanguages').innerHTML=courses.map(course=>`<button class="language-choice ${course.id===this.onboardingLanguage?'active':''}" data-onboard-language="${course.id}" type="button"><span>${course.flag}</span><b>${escapeHtml(course.name)}</b></button>`).join('');
    $('onboardingLanguages').querySelectorAll('[data-onboard-language]').forEach(button=>button.addEventListener('click',()=>{this.onboardingLanguage=button.dataset.onboardLanguage;this.renderOnboardingLanguages()}));
  }

  renderOnboardingAudio(){$('onboardingAudio').querySelectorAll('[data-onboard-audio]').forEach(button=>button.classList.toggle('active',button.dataset.onboardAudio===this.onboardingAudio))}

  async saveOnboarding(){
    if(!isSignedIn())return;
    const button=$('onboardingSaveBtn');button.disabled=true;button.textContent='Saving…';$('onboardingStatus').textContent='';
    try{
      updatePrefs({primaryLanguage:this.onboardingLanguage,enabledLanguages:[this.onboardingLanguage],audioPreference:this.onboardingAudio,onboardingCompleted:true});
      await syncNow('onboarding');closeOverlay('onboardingOverlay');await this.offerGuestImport();
    }catch(error){$('onboardingStatus').textContent=error.message||'Could not save yet. Please try again.'}
    finally{button.disabled=false;button.textContent='Start learning'}
  }

  openLanguages(mode='manage'){
    if(!isSignedIn())return;
    $('languagesModalTitle').textContent=mode==='add'?'Add another language':'Manage languages';this.renderLanguageManager();openOverlay('languagesOverlay');
  }

  renderLanguageManager(){
    const prefs=getState().prefs,enabled=new Set(prefs.enabledLanguages);
    $('languageManagerGrid').innerHTML=courses.map(course=>{
      const isEnabled=enabled.has(course.id),primary=prefs.primaryLanguage===course.id;
      return`<article class="manager-language ${isEnabled?'enabled':''}">
        <div><span class="manager-flag">${course.flag}</span><strong>${escapeHtml(course.name)}</strong>${primary?'<small class="primary-label">Primary</small>':''}</div>
        <div class="manager-actions">
          ${!isEnabled?`<button class="primary small" data-language-action="add" data-language="${course.id}" type="button">Add</button>`:''}
          ${isEnabled&&!primary?`<button class="secondary small" data-language-action="primary" data-language="${course.id}" type="button">Make primary</button><button class="danger small" data-language-action="remove" data-language="${course.id}" type="button">Remove</button>`:''}
          ${primary?'<span class="muted tiny">Current primary course</span>':''}
        </div>
      </article>`;
    }).join('');
  }

  handleLanguageManagerClick(event){
    const button=event.target.closest('[data-language-action]');if(!button)return;
    const action=button.dataset.languageAction,code=button.dataset.language,prefs=getState().prefs;let enabled=[...prefs.enabledLanguages];
    if(action==='add'&&!enabled.includes(code))enabled.push(code);
    if(action==='remove'&&code!==prefs.primaryLanguage)enabled=enabled.filter(item=>item!==code);
    if(action==='primary'){
      if(!enabled.includes(code))enabled.push(code);
      updatePrefs({primaryLanguage:code,enabledLanguages:enabled});this.renderLanguageManager();return;
    }
    updatePrefs({enabledLanguages:enabled});this.renderLanguageManager();
  }
}
