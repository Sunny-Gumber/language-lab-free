(()=>{
  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=src;
      s.onload=resolve;
      s.onerror=reject;
      document.head.appendChild(s);
    });
  }

  async function boot(){
    // Supabase remains optional. Guest/offline learning must still work.
    try{
      await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
      await loadScript('./supabase-client.js');
    }catch(error){
      console.warn('[Language Lab Free] Cloud layer unavailable; continuing in guest mode.',error);
    }

    // Authentication UI also supports guest mode when Supabase is unavailable.
    try{
      await loadScript('./auth.js');
    }catch(error){
      console.warn('[Language Lab Free] Account UI unavailable:',error);
    }

    await loadScript('./languages.js');
    await loadScript('./app-core.js');

    // V5.3: local-first cloud progress synchronization for signed-in learners.
    try{
      await loadScript('./cloud-sync.js');
    }catch(error){
      console.warn('[Language Lab Free] Cloud progress sync unavailable; progress remains safely stored on this device.',error);
    }

    // V6.1: guided daily lesson, review shortcuts and continue-position experience.
    try{
      await loadScript('./v6-learning.js');
    }catch(error){
      console.warn('[Language Lab Free] Guided learning layer unavailable; core learning remains available.',error);
    }
  }

  boot().catch(()=>{
    document.body.insertAdjacentHTML('beforeend','<p style="padding:16px;text-align:center">Language Lab Free could not load. Please refresh the page.</p>');
  });
})();
