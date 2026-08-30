import{test,expect}from'@playwright/test';
import{blockExternal}from'./helpers.js';

async function waitForBoot(page){
  await expect.poll(()=>page.evaluate(()=>window.LanguageLab?.version||0)).toBe('14.0');
  await expect(page.locator('.fatal-error')).toHaveCount(0);
}

async function reachRetrieve(page){
  await page.locator('[data-language="ja"]').click();
  await page.locator('[data-journey-start]').first().click();
  await page.locator('[data-flow-action="continue"]').click();
  if(await page.locator('.dialogue-v14').count())await page.locator('[data-flow-action="continue"]').click();
  await expect(page.locator('.flow-card-v14.target')).toBeVisible();
  await page.locator('[data-flow-action="continue"]').click();
  await expect(page.locator('.flow-card-v14.retrieve')).toBeVisible();
  return(await page.locator('.flow-card-v14.retrieve h2').textContent())?.trim();
}

test.beforeEach(async({page})=>{await blockExternal(page)});

test('Home Continue restores the paused V14 activity after reload',async({page})=>{
  await page.goto('/');await waitForBoot(page);
  const pausedMeaning=await reachRetrieve(page);
  await page.locator('[data-retrieve-answer]').first().click();
  await expect.poll(()=>page.evaluate(()=>window.LanguageLab.getState().events.filter(event=>event.activity==='practice').length)).toBeGreaterThanOrEqual(1);
  await page.locator('#backBtn').click();
  await expect(page.locator('#resumeBtn')).toBeVisible();

  await page.reload();await waitForBoot(page);
  await expect(page.locator('#resumeBtn')).toBeVisible();
  await page.locator('#resumeBtn').click();
  await expect(page.locator('.flow-card-v14.retrieve')).toBeVisible();
  await expect(page.locator('.flow-card-v14.retrieve h2')).toHaveText(pausedMeaning);
});

test('saved V14 session presents a resume action when course is reopened',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','Resume-path behavior is exercised once on desktop Chromium.');
  await page.goto('/');await waitForBoot(page);
  await reachRetrieve(page);
  await page.locator('#backBtn').click();
  await page.reload();await waitForBoot(page);
  await page.locator('[data-language="ja"]').click();
  await expect(page.locator('.flow-card-v14.retrieve')).toBeVisible();
});