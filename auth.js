// Language Lab Free — Google OAuth + Guest authentication
(function(){
  const cloud=window.LANGUAGE_LAB_SUPABASE||{};
  const client=cloud.client||null;
  let session=null;

  function addStyles(){if(document.querySelector('link[data-language-lab-auth]'))return;const link=document.createElement('link');link.rel='stylesheet';link.href='./auth.css';link.dataset.languageLabAuth='1';document.head.appendChild(link)}
  function esc(value){return String(value??'').replace(/[&<>'\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt',"'":'&#39;','"':'&quot;'}[ch]))}
  function displayName(user){if(!user)return'Guest';const meta=user.user_metadata||{};return meta.full_name||meta.name||(user.email?user.email.split('@')[0]:'Learner')}
  function currentRedirectUrl(){const u=new URL(window.location.href);u.hash='';u.search='';return u.toString()}

  function injectUI(){
    const top=document.querySelector('.top-actions');
    if(top&&!document.getElementById('authAccountBtn')){const btn=document.createElement('button');btn.id='authAccountBtn';btn.type='button';btn.className='auth-account-btn';btn.textContent='👤 Sign in';top.appendChild(btn);btn.addEventListener('click',openModal)}
    if(document.getElementById('authOverlay'))return;
    const wrap=document.createElement('div');wrap.id='authOverlay';wrap.className='auth-overlay hidden';wrap.innerHTML=`<section class="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="authTitle"><div class="auth-dialog-head"><div><span class="eyebrow">Language Lab account</span><h2 id="authTitle">Save your progress everywhere</h2><p id="authSubtitle">Use your Google account to keep learning progress synced across devices.</p></div><button id="authClose" class="auth-close" type="button" aria-label="Close">×</button></div><div id="authBody" class="auth-body"></div></section>`;document.body.appendChild(wrap);document.getElementById('authClose').addEventListener('click',closeModal);wrap.addEventListener('click',e=>{if(e.target===wrap)closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()})
  }

  function renderButton(){const btn=document.getElementById('authAccountBtn');if(!btn)return;if(session?.user){btn.classList.add('signed-in');btn.textContent=`👤 ${displayName(session.user)}`;btn.title=session.user.email||'Signed in'}else{btn.classList.remove('signed-in');btn.textContent='👤 Sign in';btn.title='Sign in with Google or continue as Guest'}}

  function setStatus(message,type=''){const el=document.getElementById('authStatus');if(!el)return;el.textContent=message;el.className=`auth-status ${type}`.trim()}

  function renderModal(){
    const body=document.getElementById('authBody'),title=document.getElementById('authTitle'),subtitle=document.getElementById('authSubtitle');if(!body||!title||!subtitle)return;
    if(session?.user){title.textContent='Your account';subtitle.textContent='Your progress can sync across devices with this signed-in account.';body.innerHTML=`<div class="auth-profile"><div class="auth-profile-card"><strong>${esc(displayName(session.user))}</strong><span>${esc(session.user.email||'Signed-in learner')}</span><div class="auth-sync-state">☁ Cloud account</div></div><div class="auth-note">Learning progress is stored locally first and synchronized to your account when online.</div><button id="authSignOut" class="danger full" type="button">Sign out</button></div>`;document.getElementById('authSignOut').addEventListener('click',signOut);return}
    title.textContent='Save your progress everywhere';subtitle.textContent='Sign in with Google to use the same learning progress on phone, tablet, or desktop.';const cloudReady=Boolean(client&&cloud.ready);
    body.innerHTML=`<button id="googleSignInBtn" class="primary full" type="button" ${cloudReady?'':'disabled'}><span style="display:inline-block;margin-right:8px;background:white;color:#4285f4;border-radius:50%;width:22px;height:22px;line-height:22px;font-weight:900">G</span> Continue with Google</button><p id="authStatus" class="auth-status" aria-live="polite"></p><div class="auth-divider">or</div><button id="continueGuestBtn" class="secondary full" type="button">Continue as Guest</button><div class="auth-note" style="margin-top:12px">Guest progress stays on this browser. Google sign-in lets your progress sync across devices.</div>`;
    document.getElementById('googleSignInBtn').addEventListener('click',signInWithGoogle);document.getElementById('continueGuestBtn').addEventListener('click',()=>{localStorage.setItem('languageLabAuthMode','guest');closeModal()});if(!cloudReady)setStatus('Google sign-in is temporarily unavailable. You can continue as Guest.','error')
  }

  async function signInWithGoogle(){
    if(!client)return setStatus('Google sign-in is unavailable.','error');
    const button=document.getElementById('googleSignInBtn');if(button){button.disabled=true;button.textContent='Opening Google…'}setStatus('');
    try{
      const {data,error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:currentRedirectUrl()}});if(error)throw error;
      if(data?.url)window.location.assign(data.url);
    }catch(error){
      console.warn('[Language Lab Free] Google sign-in error:',error);
      const message=String(error?.message||'');
      if(message.toLowerCase().includes('provider')&&message.toLowerCase().includes('enabled'))setStatus('Google Sign-In is not enabled in Supabase yet. Complete the one-time Google provider setup first.','error');else setStatus(message||'Could not start Google Sign-In. Try again.','error');
      if(button){button.disabled=false;button.innerHTML='<span style="display:inline-block;margin-right:8px;background:white;color:#4285f4;border-radius:50%;width:22px;height:22px;line-height:22px;font-weight:900">G</span> Continue with Google'}
    }
  }

  async function ensureProfile(user){if(!client||!user)return;const meta=user.user_metadata||{},timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC',payload={id:user.id,display_name:meta.full_name||meta.name||null,avatar_url:meta.avatar_url||null,timezone};const {error}=await client.from('profiles').upsert(payload,{onConflict:'id'});if(error)console.warn('[Language Lab Free] Profile bootstrap skipped:',error.message||error)}
  async function signOut(){if(client){const {error}=await client.auth.signOut();if(error){alert(error.message||'Could not sign out.');return}}session=null;localStorage.setItem('languageLabAuthMode','guest');renderButton();renderModal();closeModal();dispatchAuthEvent()}
  function openModal(){renderModal();document.getElementById('authOverlay')?.classList.remove('hidden');setTimeout(()=>document.getElementById(session?.user?'authSignOut':'googleSignInBtn')?.focus(),0)}
  function closeModal(){document.getElementById('authOverlay')?.classList.add('hidden')}
  function dispatchAuthEvent(){window.dispatchEvent(new CustomEvent('language-lab-auth-changed',{detail:{session,user:session?.user||null}}))}

  async function initAuth(){
    addStyles();injectUI();if(!client){renderButton();return}
    try{const {data,error}=await client.auth.getSession();if(error)throw error;session=data.session||null;if(session?.user){await ensureProfile(session.user);localStorage.setItem('languageLabAuthMode','account')}renderButton();client.auth.onAuthStateChange(async(event,newSession)=>{session=newSession||null;if(session?.user){localStorage.setItem('languageLabAuthMode','account');setTimeout(()=>ensureProfile(session.user),0)}renderButton();if(!document.getElementById('authOverlay')?.classList.contains('hidden'))renderModal();dispatchAuthEvent()});const params=new URLSearchParams(window.location.hash.replace(/^#/,''));if(params.get('error_description')){openModal();setStatus(decodeURIComponent(params.get('error_description')),'error')}}catch(error){console.warn('[Language Lab Free] Auth initialization error:',error);renderButton()}
  }

  window.LanguageLabAuth={open:openModal,close:closeModal,getSession:()=>session,getUser:()=>session?.user||null,isSignedIn:()=>Boolean(session?.user),signOut,signInWithGoogle};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initAuth,{once:true});else initAuth();
})();
