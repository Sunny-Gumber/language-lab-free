import{test,expect}from'@playwright/test';
import{blockExternal}from'./helpers.js';

test('PWA shell installs and reloads offline',async({page,context})=>{
  await blockExternal(page);
  await page.goto('/');
  await expect.poll(()=>page.evaluate(()=>window.LanguageLab?.version||0)).toBe('11.2');
  await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
  await context.setOffline(true);
  await page.reload();
  await expect.poll(()=>page.evaluate(()=>window.LanguageLab?.version||0)).toBe('11.2');
  await expect(page.locator('#languageGrid [data-language]')).toHaveCount(10);
  await expect(page.locator('#syncStatus')).toContainText('Guest');
  await context.setOffline(false);
});
