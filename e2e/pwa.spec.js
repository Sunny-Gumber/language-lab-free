import{test,expect}from'@playwright/test';

const PINNED_SUPABASE='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.3/dist/umd/supabase.min.js';

test('PWA caches pinned runtime and V14 integrated learning assets for offline start',async({page,context})=>{
  await page.route('https://ykaluwgryohxcsccdacf.supabase.co/**',route=>route.abort());
  await page.goto('/');
  await expect.poll(()=>page.evaluate(()=>window.LanguageLab?.version||0)).toBe('14.0.1');
  await expect.poll(()=>page.evaluate(()=>typeof window.supabase?.createClient)).toBe('function');
  await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));

  const cached=await page.evaluate(async url=>{
    const cache=await caches.open('language-lab-free-v14-0-1');
    return{
      runtime:Boolean(await cache.match(url)),
      homeCss:Boolean(await cache.match('./home-v12.css')),
      journeyCss:Boolean(await cache.match('./journey-v14.css')),
      journeyJs:Boolean(await cache.match('./src/journey-v14.js')),
      flowJs:Boolean(await cache.match('./src/learning-flow.js')),
      sessionJs:Boolean(await cache.match('./src/session.js'))
    };
  },PINNED_SUPABASE);
  for(const value of Object.values(cached))expect(value).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect.poll(()=>page.evaluate(()=>window.LanguageLab?.version||0)).toBe('14.0.1');
  await expect.poll(()=>page.evaluate(()=>typeof window.supabase?.createClient)).toBe('function');
  await expect(page.locator('body')).toHaveClass(/visitor-mode/);
  await expect(page.locator('#languageGrid [data-language]')).toHaveCount(10);
  await expect(page.locator('.visitor-hero')).toContainText('Start using it');
  await context.setOffline(false);
});