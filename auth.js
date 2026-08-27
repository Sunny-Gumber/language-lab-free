// Language Lab Free — V5.2 authentication layer
(function(){
  const cloud=window.LANGUAGE_LAB_SUPABASE||{};
  const client=cloud.client||null;
  const COOLDOWN_MS=60000;
  const RATE_LIMIT_MS=300000;
  const COOLDOWN_KEY='languageLabMagicLinkCooldownUntil';
  let session=null;
  let cooldownTimer=null;

  function addStyles(){if(document.querySelector('link[data-language-lab-auth]'))return;const link=document.createElement('link');link.rel='stylesheet';link.href='./auth.css';link.dataset.languageLabAuth='1';document.head.appendChild(link)}
  function esc(value){return String(value??'').replace(/[&<>'\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}
  function displayName(user){if(!user)return'Guest';const meta=user.user_metadata||{};return meta.full_name||meta.name||(user.email?user.email.split('@')[0]:'Learner')}
  function currentRedirectUrl(){const u=new URL(window.location.href);u.hash='';u.search='';return u.toString()}
  function getCooldownUntil(){return Number(localStorage.getItem(COOLDOWN_KEY)||0)}
  function setCooldown(ms=COOLDOWN_MS){const until=Date.now()+ms;localStorage.setItem(COOLDOWN_KEY,String(until));startCooldown();return until}
  function cooldownSeconds(){return Math.max(0,Math.ceil((getCooldownUntil()-Date.now())/1000))}
  function startCooldown(){clearInterval(cooldownTimer);updateCooldownUI();if(cooldownSeconds()<=0)return;cooldownTimer=setInterval(()=>{updateCooldownUI();if(cooldownSeconds()<=0){clearInterval(cooldownTimer);cooldownTimer=null}},1000)}
  function updateCooldownUI(){const btn=document.getElementById('magicLinkBtn');if(!btn)return;const remaining=cooldownSeconds();if(remaining>0){btn.disabled=true;btn.textContent=`Resend in ${remaining}s`}else{btn.disabled=false;btn.textContent='Send sign-in link';localStorage.removeItem(COOLDOWN_KEY)}}
  function friendlyAuthError(error){const code=error?.code||'';const status=error?.status||0;const msg=String(error?.message||'').toLowerCase();if(code==='over_email_send_rate_limit'||code==='over_request_rate_limit'||status===429||msg.includes('rate limit')||msg.includes('too many'))return'Too many sign-in requests were made. Please wait a few minutes before trying again.';return error?.message||'Could not send the sign-in link. Try again.'}

  function injectUI(){
    const top=document.querySelector('.top-actions');
    if(top&&!document.getElementById('authAccountBtn')){const btn=document.createElement('button');btn.id='authAccountBtn';btn.type='button';btn.className='auth-account-btn';btn.textContent='👤 Sign in';top.appendChild(btn);btn.addEventListener('click',openModal)}
    if(document.getElementById('authOverlay'))return;
    const wrap=document.createElement('div');wrap.id='authOverlay';wrap.className='auth-overlay hidden';wrap.innerHTML=`<section class="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="authTitle"><div class="auth-dialog-head"><div><span class="eyebrow">Language Lab account</span><h2 id="authTitle">Save your progress everywhere</h2><p id="authSubtitle">Sign in without a password. We will email you a secure one-time link.</p></div><button id="authClose" class="auth-close" type="button" aria-label="Close">×</button></div><div id="authBody" class="auth-body"></div></section>`;document.body.appendChild(wrap);document.getElementById('authClose').addEventListener('click',closeModal);wrap.addEventListener('click',e=>{if(e.target===wrap)closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()})
  }

  function renderButton(){const btn=document.getElementById('authAccountBtn');if(!btn)return;if(session?.user){btn.classList.add('signed-in');btn.textContent=`👤 ${displayName(session.user)}`;btn.title=session.user.email||'Signed in'}else{btn.classList.remove('signed-in');btn.textContent='👤 Sign in';btn.title='Sign in or continue as guest'}}

  function renderModal(){
    const body=document.getElementById('authBody'),title=document.getElementById('authTitle'),subtitle=document.getElementById('authSubtitle');if(!body||!title||!subtitle)return;
    if(session?.user){title.textContent='Your account';subtitle.textContent='Your login is active on this device. Cloud progress sync will arrive in V5.3.';body.innerHTML=`<div class="auth-profile"><div class="auth-profile-card"><strong>${esc(displayName(session.user))}</strong><span>${esc(session.user.email||'Signed-in learner')}</span><div class="auth-sync-state">☁ Signed in</div></div><div class="auth-note">Authentication is active. Your existing learning progress is still stored locally until V5.3 cloud sync is enabled.</div><button id="authSignOut" class="danger full" type="button">Sign out</button></div>`;document.getElementById('authSignOut').addEventListener('click',signOut);return}
    title.textContent='Save your progress everywhere';subtitle.textContent='Sign in without a password. We will email you a secure one-time link.';const cloudReady=Boolean(client&&cloud.ready);body.innerHTML=`<form id="magicLinkForm"><div class="auth-field"><label for="authEmail">Email address</label><input id="authEmail" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com" required ${cloudReady?'':'disabled'} /></div><div class="auth-actions"><button id="magicLinkBtn" class="primary" type="submit" ${cloudReady?'':'disabled'}>Send sign-in link</button></div><p id="authStatus" class="auth-status" aria-live="polite"></p></form><div class="auth-divider">or</div><button id="continueGuestBtn" class="secondary full" type="button">Continue as Guest</button><div class="auth-note" style="margin-top:12px">Guest progress stays on this browser. Signing in creates an account identity; cloud progress transfer is the next V5.3 step.</div>`;
    document.getElementById('magicLinkForm').addEventListener('submit',sendMagicLink);document.getElementById('continueGuestBtn').addEventListener('click',()=>{localStorage.setItem('languageLabAuthMode','guest');closeModal()});
    if(!cloudReady)setStatus('Cloud sign-in is temporarily unavailable. You can continue as Guest.','error');else startCooldown()
  }

  function setStatus(message,type=''){const el=document.getElementById('authStatus');if(!el)return;el.textContent=message;el.className=`auth-status ${type}`.trim()}

  async function sendMagicLink(event){
    event.preventDefault();if(!client)return setStatus('Cloud sign-in is unavailable.','error');
    const input=document.getElementById('authEmail'),button=document.getElementById('magicLinkBtn'),email=(input?.value||'').trim();if(!email)return setStatus('Enter your email address.','error');
    const remaining=cooldownSeconds();if(remaining>0){setStatus(`Please wait ${remaining} seconds before requesting another sign-in link.`,'error');startCooldown();return}
    button.disabled=true;button.textContent='Sending…';setStatus('');
    try{
      const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:currentRedirectUrl(),shouldCreateUser:true}});if(error)throw error;
      localStorage.setItem('languageLabLastLoginEmail',email);setCooldown(COOLDOWN_MS);setStatus('Sign-in link sent. Check your inbox. You can request another link after the countdown finishes.','success');
    }catch(error){
      console.warn('[Language Lab Free] Magic link error:',error);const isRateLimited=error?.code==='over_email_send_rate_limit'||error?.code==='over_request_rate_limit'||error?.status===429||String(error?.message||'').toLowerCase().includes('rate limit')||String(error?.message||'').toLowerCase().includes('too many');if(isRateLimited)setCooldown(RATE_LIMIT_MS);setStatus(friendlyAuthError(error),'error');if(!isRateLimited){button.disabled=false;button.textContent='Send sign-in link'}
    }
  }

  async function ensureProfile(user){if(!client||!user)return;const meta=user.user_metadata||{},timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC',payload={id:user.id,display_name:meta.full_name||meta.name||null,avatar_url:meta.avatar_url||null,timezone};const {error}=await client.from('profiles').upsert(payload,{onConflict:'id'});if(error)console.warn('[Language Lab Free] Profile bootstrap skipped:',error.message||error)}
  async function signOut(){if(client){const {error}=await client.auth.signOut();if(error){alert(error.message||'Could not sign out.');return}}session=null;localStorage.setItem('languageLabAuthMode','guest');renderButton();renderModal();closeModal();dispatchAuthEvent()}
  function openModal(){renderModal();document.getElementById('authOverlay')?.classList.remove('hidden');setTimeout(()=>document.getElementById(session?.user?'authSignOut':'authEmail')?.focus(),0)}
  function closeModal(){document.getElementById('authOverlay')?.classList.add('hidden')}
  function dispatchAuthEvent(){window.dispatchEvent(new CustomEvent('language-lab-auth-changed',{detail:{session,user:session?.user||null}}))}

  async function initAuth(){
    addStyles();injectUI();if(!client){renderButton();return}
    try{const {data,error}=await client.auth.getSession();if(error)throw error;session=data.session||null;if(session?.user){await ensureProfile(session.user);localStorage.setItem('languageLabAuthMode','account')}renderButton();client.auth.onAuthStateChange(async(event,newSession)=>{session=newSession||null;if(session?.user){localStorage.setItem('languageLabAuthMode','account');setTimeout(()=>ensureProfile(session.user),0)}renderButton();if(!document.getElementById('authOverlay')?.classList.contains('hidden'))renderModal();dispatchAuthEvent()});const hash=new URLSearchParams(window.location.hash.replace(/^#/,''));if(hash.get('error_description')){openModal();setStatus(decodeURIComponent(hash.get('error_description')),'error')}}catch(error){console.warn('[Language Lab Free] Auth initialization error:',error);renderButton()}
  }

  window.LanguageLabAuth={open:openModal,close:closeModal,getSession:()=>session,getUser:()=>session?.user||null,isSignedIn:()=>Boolean(session?.user),signOut};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initAuth,{once:true});else initAuth();
})();
