// Language Lab Free — Supabase browser client
// The project URL and publishable key are intentionally public browser credentials.
// Never add service_role keys, database passwords, or private provider secrets here.
(function(){
  const SUPABASE_URL = 'https://ykaluwgryohxcsccdacf.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_gTQmkM5ljY6LT2oL4hP7rw_D_Ph0BHI';

  window.LANGUAGE_LAB_SUPABASE = {
    url: SUPABASE_URL,
    publishableKey: SUPABASE_PUBLISHABLE_KEY,
    client: null,
    ready: false,
    error: null
  };

  try {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      throw new Error('Supabase browser SDK did not load.');
    }

    window.LANGUAGE_LAB_SUPABASE.client = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );
    window.LANGUAGE_LAB_SUPABASE.ready = true;
  } catch (error) {
    console.warn('[Language Lab Free] Supabase initialization skipped:', error);
    window.LANGUAGE_LAB_SUPABASE.error = error;
  }
})();
