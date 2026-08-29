import{test,expect}from'@playwright/test';

test('Hindi pronunciation module is cached and works offline',async({page,context})=>{
  await page.route('https://ykaluwgryohxcsccdacf.supabase.co/**',route=>route.abort());
  await page.goto('/');
  await expect.poll(()=>page.evaluate(()=>window.LanguageLab?.version||0)).toBe('13.1');
  await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
  await expect.poll(()=>page.evaluate(async()=>Boolean(await caches.open('language-lab-free-v13-1').then(cache=>cache.match('./src/pronunciation-hi.js'))))).toBe(true);

  await context.setOffline(true);await page.reload();
  await expect.poll(()=>page.evaluate(()=>window.LanguageLab?.version||0)).toBe('13.1');
  await page.locator('[data-language="ja"]').click();
  await page.locator('[data-journey-start]').first().click();
  await page.locator('[data-lesson-action="continue"]').click();
  await page.locator('[data-lesson-action="continue"]').click();
  await expect(page.locator('.guided-roman-v13 [data-hindi-pronunciation]')).toContainText('हिंदी उच्चारण:');
  await context.setOffline(false);
});
