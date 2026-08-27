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

    try{
      await loadScript('./auth.js');
    }catch(error){
      console.warn('[Language Lab Free] Account UI unavailable:',error);
    }

    await loadScript('./languages.js');

    // V7: course-quality layer enriches/corrects language content before the learning engine renders it.
    try{
      await loadScript('./v7-content.js');
    }catch(error){
      console.warn('[Language Lab Free] Enhanced V7 course content unavailable; base course data remains available.',error);
    }

    await loadScript('./app-core.js');

    try{
      await loadScript('./cloud-sync.js');
    }catch(error){
      console.warn('[Language Lab Free] Cloud progress sync unavailable; progress remains safely stored on this device.',error);
    }

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
