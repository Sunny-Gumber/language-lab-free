import{test,expect}from'@playwright/test';
import{blockExternal}from'./helpers.js';

async function waitForBoot(page){
  await expect.poll(()=>page.evaluate(()=>window.LanguageLab?.version||0)).toBe('13.1');
  await expect(page.locator('.fatal-error')).toHaveCount(0);
}
async function reachGuidedCheck(page){
  await page.locator('[data-lesson-action="continue"]').click();
  await page.locator('[data-lesson-action="continue"]').click();
  await page.locator('[data-lesson-action="continue"]').click();
}
async function completeFirstGuidedCheck(page){
  await page.locator('[data-journey-start]').first().click();
  await expect(page.locator('.guided-lesson-v13')).toBeVisible();
  await expect(page.locator('.guided-stepper-v13.seven')).toBeVisible();
  await reachGuidedCheck(page);
  await page.locator('[data-lesson-answer]').first().click();
  await expect.poll(()=>page.evaluate(()=>window.LanguageLab.getState().events.filter(event=>event.activity==='practice').length)).toBeGreaterThanOrEqual(2);
}
async function completeGuidedItemCorrectly(page,{moveNext=true}={}){
  await page.locator('[data-lesson-action="continue"]').click();
  await page.locator('[data-lesson-action="continue"]').click();
  const meaning=(await page.locator('.guided-meaning-v13').textContent())?.trim();
  const native=(await page.locator('.guided-native-v13').textContent())?.trim();
  await page.locator('[data-lesson-action="continue"]').click();
  await page.locator('[data-lesson-answer]').filter({hasText:meaning}).first().click();
  await page.locator('[data-lesson-action="continue"]').click();
  await page.locator('[data-recall-answer]').filter({hasText:native}).first().click();
  await page.locator('[data-lesson-action="continue"]').click();
  await page.locator('[data-lesson-action="manual-speak"]').click();
  await page.locator('[data-lesson-action="continue"]').click();
  if(moveNext)await page.locator('[data-lesson-action="next-item"]').click();
}

test.beforeEach(async({page})=>{await blockExternal(page)});

test('new guest sees a start experience instead of an empty dashboard',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');await waitForBoot(page);
  await expect(page.locator('body')).toHaveClass(/visitor-mode/);
  await expect(page.locator('.visitor-hero')).toContainText("Don't just study a language");
  await expect(page.locator('#languagesHeading')).toHaveText('What do you want to learn?');
  await expect(page.locator('#languageGrid [data-language]')).toHaveCount(10);
  await expect(page.locator('[data-language="ja"]')).toContainText('Start Japanese');
  await expect(page.locator('[data-language="ar"]')).toContainText('Arabic');
  await expect(page.locator('.dashboard-grid')).not.toBeVisible();
  await expect(page.locator('#visitorHow')).toBeVisible();
  const overflow=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  expect(overflow.scroll).toBeLessThanOrEqual(overflow.client+1);expect(errors).toEqual([]);
});

test('new language opens a can-do journey with an adaptive first session',async({page})=>{
  await page.goto('/');await waitForBoot(page);
  await page.locator('[data-language="ja"]').click();
  await expect(page.locator('#courseName')).toHaveText('Japanese');
  await expect(page.locator('#journeyTab')).toHaveClass(/active/);
  await expect(page.locator('.journey-hero-v13 h2')).toContainText('I can');
  await expect(page.locator('.session-preview-v13')).toContainText('0 review · 3 new');
  await expect(page.locator('.session-preview-v13')).toContainText('Japanese pathway');
  await expect(page.locator('[data-journey-unit="0"]')).toBeEnabled();
  await expect(page.locator('[data-journey-unit="1"]')).toBeDisabled();
  await expect(page.locator('.v13-tabs [data-tab]')).toHaveCount(5);
});

test('guided item moves from context through recall into a real-world speaking task',async({page})=>{
  await page.goto('/');await waitForBoot(page);await page.locator('[data-language="ja"]').click();await page.locator('[data-journey-start]').first().click();
  await expect(page.locator('.guided-focus-v13.context')).toBeVisible();
  await page.locator('[data-lesson-action="continue"]').click();await expect(page.locator('.audio-only')).toBeVisible();
  await page.locator('[data-lesson-action="continue"]').click();await expect(page.locator('.guided-meaning-v13')).toBeVisible();
  const meaning=(await page.locator('.guided-meaning-v13').textContent())?.trim(),native=(await page.locator('.guided-native-v13').textContent())?.trim();
  await page.locator('[data-lesson-action="continue"]').click();await page.locator('[data-lesson-answer]').filter({hasText:meaning}).first().click();
  await page.locator('[data-lesson-action="continue"]').click();await expect(page.locator('.guided-focus-v13.recall')).toBeVisible();await page.locator('[data-recall-answer]').filter({hasText:native}).first().click();
  await page.locator('[data-lesson-action="continue"]').click();await expect(page.locator('.guided-focus-v13.task')).toBeVisible();await expect(page.locator('.guided-focus-v13.task')).toContainText('Say:');
});

test('wrong comprehension is remembered and schedules an in-session retry',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','Retry scheduling is exercised once on desktop Chromium.');
  await page.goto('/');await waitForBoot(page);await page.locator('[data-language="ja"]').click();await page.locator('[data-journey-start]').first().click();
  await page.locator('[data-lesson-action="continue"]').click();
  await page.locator('[data-lesson-action="continue"]').click();
  const correctMeaning=(await page.locator('.guided-meaning-v13').textContent())?.trim();
  await page.locator('[data-lesson-action="continue"]').click();
  const options=page.locator('[data-lesson-answer]');let wrongIndex=-1;
  for(let i=0;i<await options.count();i++){if((await options.nth(i).textContent())?.trim()!==correctMeaning){wrongIndex=i;break}}
  expect(wrongIndex).toBeGreaterThanOrEqual(0);await options.nth(wrongIndex).click();
  await page.locator('[data-lesson-action="continue"]').click();
  await page.locator('[data-recall-answer]').first().click();
  await page.locator('[data-lesson-action="continue"]').click();
  await page.locator('[data-lesson-action="manual-speak"]').click();
  await page.locator('[data-lesson-action="continue"]').click();
  await expect(page.locator('.guided-complete-v13')).toContainText('scheduled to return');
  await page.locator('[data-lesson-action="next-item"]').click();
  await expect(page.locator('.guided-top-v13')).toContainText('Session 2/4');
});

test('correct gradual practice unlocks the next unit only after enough coverage',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','Progression threshold is exercised once on desktop Chromium.');
  await page.goto('/');await waitForBoot(page);await page.locator('[data-language="ja"]').click();
  await page.locator('[data-journey-start]').first().click();
  await completeGuidedItemCorrectly(page);
  await completeGuidedItemCorrectly(page);
  await completeGuidedItemCorrectly(page,{moveNext:false});
  await page.locator('.guided-top-v13 [data-lesson-action="back-path"]').click();
  await expect(page.locator('[data-journey-unit="1"]')).toBeEnabled();
  await expect(page.locator('[data-journey-unit="0"]')).toContainText('Building');
});

test('first guided comprehension turns the start experience into the learner dashboard',async({page})=>{
  await page.goto('/');await waitForBoot(page);
  await page.locator('[data-language="ja"]').click();
  await completeFirstGuidedCheck(page);
  await expect(page.locator('body')).not.toHaveClass(/visitor-mode/);
  await expect.poll(()=>page.evaluate(()=>Number(document.getElementById('topXp').textContent))).toBeGreaterThan(0);
  await page.locator('#backBtn').click();
  await expect(page.locator('.learner-hero')).toContainText('Keep your language');
  await expect(page.locator('.dashboard-grid')).toBeVisible();
  await expect(page.locator('#languagesHeading')).toHaveText('Your languages');
});

test('guided progress persists in IndexedDB, survives reload and resets cleanly',async({page})=>{
  await page.goto('/');await waitForBoot(page);
  await page.locator('[data-language="ja"]').click();
  await completeFirstGuidedCheck(page);
  const before=await page.evaluate(()=>window.LanguageLab.getState().events.filter(event=>event.activity==='practice').length);expect(before).toBeGreaterThanOrEqual(2);
  await page.reload();await waitForBoot(page);
  const restored=await page.evaluate(()=>window.LanguageLab.getState().events.filter(event=>event.activity==='practice').length);expect(restored).toBe(before);
  await expect(page.locator('body')).not.toHaveClass(/visitor-mode/);
  await page.locator('[data-language="ja"]').click();await expect(page.locator('#journeyTab')).toHaveClass(/active/);
  await page.locator('[data-tab="progress"]').click();page.once('dialog',dialog=>dialog.accept());await page.locator('#resetCourseBtn').click();
  await expect(page.locator('#topXp')).toHaveText('0');
  const resetState=await page.evaluate(()=>window.LanguageLab.getState());expect(resetState.events.some(event=>event.activity==='reset')).toBe(true);
  await page.locator('#backBtn').click();await expect(page.locator('body')).not.toHaveClass(/visitor-mode/);
});
