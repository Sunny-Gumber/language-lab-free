import{test,expect}from'@playwright/test';

const PINNED_SUPABASE='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.3/dist/umd/supabase.min.js';

test('PWA caches pinned Supabase runtime and reloads fully offline',async({page,context})=>{
  await page.route('https://ykaluwgryohxcsccdacf.supabase.co/**',route=>route.abort());
  await page.goto('/');
  await expect.poll(()=>page.evaluate(()=>window.LanguageLab?.version||0)).toBe('11.2');
  await expect.poll(()=>page.evaluate(()=>typeof window.supabase?.createClient)).toBe('function');
  await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));

  const cached=await page.evaluate(async url=>{
    const cache=await caches.open('language-lab-free-v11-2');
    return Boolean(await cache.match(url));
  },PINNED_SUPABASE);
  expect(cached).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect.poll(()=>page.evaluate(()=>window.LanguageLab?.version||0)).toBe('11.2');
  await expect.poll(()=>page.evaluate(()=>typeof window.supabase?.createClient)).toBe('function');
  await expect(page.locator('#languageGrid [data-language]')).toHaveCount(10);
  await expect(page.locator('#syncStatus')).toContainText('Guest');
  await context.setOffline(false);
});
