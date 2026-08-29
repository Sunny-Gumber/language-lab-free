import{test,expect}from'@playwright/test';
import{blockExternal}from'./helpers.js';

async function waitForBoot(page){
  await expect.poll(()=>page.evaluate(()=>window.LanguageLab?.version||0)).toBe('13.1');
  await expect(page.locator('.fatal-error')).toHaveCount(0);
}

async function reachRecallWithRealProgress(page){
  await page.locator('[data-language="ja"]').click();
  await page.locator('[data-journey-start]').first().click();
  await page.locator('[data-lesson-action="continue"]').click();
  await page.locator('[data-lesson-action="continue"]').click();
  const meaning=(await page.locator('.guided-meaning-v13').textContent())?.trim();
  await page.locator('[data-lesson-action="continue"]').click();
  await page.locator('[data-lesson-answer]').filter({hasText:meaning}).first().click();
  await page.locator('[data-lesson-action="continue"]').click();
  await expect(page.locator('.guided-focus-v13.recall')).toBeVisible();
  return(await page.locator('.guided-focus-v13.recall h2').textContent())?.trim();
}

test.beforeEach(async({page})=>{await blockExternal(page)});

test('Home Continue restores the exact paused Journey item and step after reload',async({page})=>{
  await page.goto('/');await waitForBoot(page);
  const pausedMeaning=await reachRecallWithRealProgress(page);
  await expect.poll(()=>page.evaluate(()=>window.LanguageLab.getState().events.filter(event=>event.activity==='practice').length)).toBeGreaterThanOrEqual(2);
  await page.locator('#backBtn').click();
  await expect(page.locator('#resumeBtn')).toBeVisible();

  await page.reload();await waitForBoot(page);
  await expect(page.locator('#resumeBtn')).toBeVisible();
  await page.locator('#resumeBtn').click();

  await expect(page.locator('.guided-focus-v13.recall')).toBeVisible();
  await expect(page.locator('.guided-focus-v13.recall h2')).toHaveText(pausedMeaning);
  await expect(page.locator('.guided-top-v13 .badge')).toHaveText('5/7');
});

test('paused session is visible on the path and can be resumed without jumping units',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','Resume-path behavior is exercised once on desktop Chromium.');
  await page.goto('/');await waitForBoot(page);
  const pausedMeaning=await reachRecallWithRealProgress(page);
  await page.locator('.guided-top-v13 [data-lesson-action="back-path"]').click();
  await expect(page.locator('[data-journey-resume-saved]')).toBeVisible();
  await expect(page.locator('.journey-hero-v13')).toContainText('Paused session');
  await page.locator('[data-journey-resume-saved]').click();
  await expect(page.locator('.guided-focus-v13.recall h2')).toHaveText(pausedMeaning);
});
