import{test,expect}from'@playwright/test';

test('Hindi pronunciation module is cached and works offline in V14',async({page,context})=>{
  await page.route('https://ykaluwgryohxcsccdacf.supabase.co/**',route=>route.abort());
  await page.goto('/');
  await expect.poll(()=>page.evaluate(()=>window.LanguageLab?.version||0)).toBe('14.0');
  await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
  await expect.poll(()=>page.evaluate(async()=>Boolean(await caches.open('language-lab-free-v14-0').then(cache=>cache.match('./src/pronunciation-hi.js'))))).toBe(true);

  await context.setOffline(true);await page.reload();
  await expect.poll(()=>page.evaluate(()=>window.LanguageLab?.version||0)).toBe('14.0');
  await page.locator('[data-language="ja"]').click();
  await page.locator('[data-journey-start]').first().click();
  await page.locator('[data-flow-action="continue"]').click();
  if(await page.locator('.dialogue-v14').count())await page.locator('[data-flow-action="continue"]').click();
  await expect(page.locator('.guided-hindi-v14')).toContainText('हिंदी उच्चारण:');
  await context.setOffline(false);
});