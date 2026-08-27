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
    // Supabase is optional in V5.1. Guest/offline learning must still work.
    try{
      await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
      await loadScript('./supabase-client.js');
    }catch(error){
      console.warn('[Language Lab Free] Cloud layer unavailable; continuing in guest mode.',error);
    }

    await loadScript('./languages.js');
    await loadScript('./app-core.js');
  }

  boot().catch(()=>{
    document.body.insertAdjacentHTML('beforeend','<p style="padding:16px;text-align:center">Language Lab Free could not load. Please refresh the page.</p>');
  });
})();
