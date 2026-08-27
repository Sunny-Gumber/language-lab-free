(()=>{
  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
    });
  }
  async function optional(src,message){try{await loadScript(src)}catch(error){console.warn(message,error)}}
  async function boot(){
    try{
      await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
      await loadScript('./supabase-client.js');
    }catch(error){console.warn('[Language Lab Free] Cloud layer unavailable; continuing in guest mode.',error)}
    await optional('./auth.js','[Language Lab Free] Account UI unavailable:');

    // V10 shared infrastructure is loaded before the learning engine.
    await loadScript('./core-logic.js');
    await loadScript('./storage-scope.js');

    await loadScript('./languages.js');
    await optional('./v7-content.js','[Language Lab Free] V7 content unavailable; base course data remains available.');
    await optional('./v8-content.js','[Language Lab Free] V8 curriculum unavailable; earlier content remains available.');
    await optional('./v9-content.js','[Language Lab Free] V9 Japanese/Mandarin content unavailable; earlier curriculum remains available.');

    await loadScript('./app-core.js');
    await optional('./skills-v10.js','[Language Lab Free] Skill profile unavailable; overall mastery still works.');
    await optional('./v9-course-ui.js','[Language Lab Free] Deep lesson UI unavailable; standard course view remains available.');
    await optional('./cloud-sync-v10.js','[Language Lab Free] Cloud progress sync unavailable; progress remains stored on this device.');
    await optional('./v6-learning.js','[Language Lab Free] Guided learning layer unavailable; core learning remains available.');
    await optional('./v8-listen-speak.js','[Language Lab Free] Listen & Speak practice unavailable; the full course remains available.');
    await optional('./v10-hardening.js','[Language Lab Free] Compatibility hardening unavailable; core learning remains available.');
    await optional('./onboarding-v10.js','[Language Lab Free] Learning-preference onboarding unavailable; the course remains usable.');
    await optional('./my-languages-v10.js','[Language Lab Free] My Languages manager unavailable; courses remain accessible.');
  }
  boot().catch(error=>{
    console.error('[Language Lab Free] fatal boot error',error);
    document.body.insertAdjacentHTML('beforeend','<p style="padding:16px;text-align:center">Language Lab Free could not load. Please refresh the page.</p>');
  });
})();
