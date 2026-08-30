import{test,expect}from'@playwright/test';
import{blockExternal}from'./helpers.js';

async function waitForBoot(page){
  await expect.poll(()=>page.evaluate(()=>window.LanguageLab?.version||0)).toBe('14.0');
  await expect(page.locator('.fatal-error')).toHaveCount(0);
}
async function openFirstRetrieve(page){
  await page.locator('[data-journey-start]').first().click();
  await expect(page.locator('.flow-card-v14.mission')).toBeVisible();
  await page.locator('[data-flow-action="continue"]').click();
  if(await page.locator('.dialogue-v14').count())await page.locator('[data-flow-action="continue"]').click();
  await expect(page.locator('.flow-card-v14.target')).toBeVisible();
  const native=(await page.locator('.guided-native-v14').first().textContent())?.trim();
  await page.locator('[data-flow-action="continue"]').click();
  await expect(page.locator('.flow-card-v14.retrieve')).toBeVisible();
  return native;
}
async function completeCurrentRetrieve(page,native){
  const retrieve=page.locator('.flow-card-v14.retrieve');
  const correct=retrieve.locator('[data-retrieve-answer]').filter({hasText:native}).first();
  if(await correct.count())await correct.click();else await retrieve.locator('[data-retrieve-answer]').first().click();
  await retrieve.locator('[data-flow-action="manual-target"]').click();
  await expect(retrieve.locator('[data-flow-action="continue"]')).toBeVisible();
}

test.beforeEach(async({page})=>{await blockExternal(page)});

test('new guest sees an honest start experience instead of an empty dashboard',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');await waitForBoot(page);
  await expect(page.locator('body')).toHaveClass(/visitor-mode/);
  await expect(page.locator('.visitor-hero')).toContainText("Don't just study a language");
  await expect(page.locator('#languagesHeading')).toHaveText('What do you want to learn?');
  await expect(page.locator('#languageGrid [data-language]')).toHaveCount(10);
  await expect(page.locator('[data-language="ja"]')).toContainText('Structured path');
  await expect(page.locator('[data-language="es"]')).toContainText('Foundation');
  await expect(page.locator('.depth-grid')).toContainText('Japanese');
  await expect(page.locator('.depth-grid')).toContainText('8 more languages');
  const overflow=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  expect(overflow.scroll).toBeLessThanOrEqual(overflow.client+1);expect(errors).toEqual([]);
});

test('Japanese opens the V14 connected Journey and all units remain testable',async({page})=>{
  await page.goto('/');await waitForBoot(page);await page.locator('[data-language="ja"]').click();
  await expect(page.locator('#courseName')).toHaveText('Japanese');
  await expect(page.locator('#journeyTab')).toHaveClass(/active/);
  await expect(page.locator('.journey-hero-v14 h2')).toContainText('I can');
  await expect(page.locator('.learning-loop-v14')).toContainText('Hear connected language');
  await expect(page.locator('.session-preview-v14')).toContainText('new targets');
  await expect(page.locator('[data-journey-unit="0"]')).toBeEnabled();
  await expect(page.locator('[data-journey-unit="1"]')).toBeEnabled();
  await expect(page.locator('.v14-tabs [data-tab]')).toHaveCount(5);
});

test('integrated session moves from mission to dialogue, target learning, retrieval and speaking',async({page})=>{
  await page.goto('/');await waitForBoot(page);await page.locator('[data-language="ja"]').click();
  const native=await openFirstRetrieve(page);
  await completeCurrentRetrieve(page,native);
  await expect.poll(()=>page.evaluate(()=>window.LanguageLab.getState().events.filter(event=>event.activity==='practice').length)).toBeGreaterThanOrEqual(2);
  await expect(page.locator('.flow-card-v14.retrieve .practice-feedback')).toContainText('Speaking practice recorded');
  await page.locator('.flow-card-v14.retrieve [data-flow-action="continue"]').click();
  await expect(page.locator('.guided-lesson-v14')).toBeVisible();
});

test('retrieval mistakes are not treated as completion and can return later',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','Retry behavior is exercised once on desktop Chromium.');
  await page.goto('/');await waitForBoot(page);await page.locator('[data-language="ja"]').click();
  const native=await openFirstRetrieve(page),retrieve=page.locator('.flow-card-v14.retrieve'),options=retrieve.locator('[data-retrieve-answer]');let wrong=-1;
  for(let i=0;i<await options.count();i++){if((await options.nth(i).textContent())?.trim()!==native){wrong=i;break}}
  expect(wrong).toBeGreaterThanOrEqual(0);await options.nth(wrong).click();
  await expect(retrieve.locator('.practice-feedback')).toContainText('will return once more');
  await expect.poll(()=>page.evaluate(()=>window.LanguageLab.getState().events.some(event=>event.metadata?.mode==='v14-retrieval'&&event.metadata?.correct===false))).toBe(true);
  await retrieve.locator('[data-flow-action="manual-target"]').click();await retrieve.locator('[data-flow-action="continue"]').click();
  await expect(page.locator('.guided-lesson-v14')).toBeVisible();
});

test('first active V14 retrieval turns the start experience into the learner dashboard',async({page})=>{
  await page.goto('/');await waitForBoot(page);await page.locator('[data-language="ja"]').click();
  const native=await openFirstRetrieve(page);await completeCurrentRetrieve(page,native);
  await expect(page.locator('body')).not.toHaveClass(/visitor-mode/);
  await expect.poll(()=>page.evaluate(()=>Number(document.getElementById('topXp').textContent))).toBeGreaterThan(0);
  await page.locator('#backBtn').click();
  await expect(page.locator('.learner-hero')).toContainText('Keep your language');
  await expect(page.locator('.dashboard-grid')).toBeVisible();
});

test('V14 practice evidence persists in IndexedDB and course reset still works',async({page})=>{
  await page.goto('/');await waitForBoot(page);await page.locator('[data-language="ja"]').click();
  const native=await openFirstRetrieve(page);await completeCurrentRetrieve(page,native);
  const before=await page.evaluate(()=>window.LanguageLab.getState().events.filter(event=>event.activity==='practice').length);expect(before).toBeGreaterThanOrEqual(2);
  await page.reload();await waitForBoot(page);
  const restored=await page.evaluate(()=>window.LanguageLab.getState().events.filter(event=>event.activity==='practice').length);expect(restored).toBe(before);
  await expect(page.locator('body')).not.toHaveClass(/visitor-mode/);
  await page.locator('[data-language="ja"]').click();await page.locator('[data-tab="progress"]').click();page.once('dialog',dialog=>dialog.accept());await page.locator('#resetCourseBtn').click();
  await expect(page.locator('#topXp')).toHaveText('0');
  const resetState=await page.evaluate(()=>window.LanguageLab.getState());expect(resetState.events.some(event=>event.activity==='reset')).toBe(true);
});