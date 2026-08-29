import{test,expect}from'@playwright/test';
import{blockExternal}from'./helpers.js';

async function waitForBoot(page){
  await expect.poll(()=>page.evaluate(()=>window.LanguageLab?.version||0)).toBe('12.0');
  await expect(page.locator('.fatal-error')).toHaveCount(0);
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

test('first active practice turns the start experience into the learner dashboard',async({page})=>{
  await page.goto('/');await waitForBoot(page);
  await page.locator('[data-language="ja"]').click();
  await expect(page.locator('#courseName')).toHaveText('Japanese');
  await expect(page.locator('#practiceTab')).toHaveClass(/active/);

  await page.locator('[data-tab="cards"]').click();await expect(page.locator('#cardsTab')).toHaveClass(/active/);await expect(page.locator('#cardFront')).not.toHaveText('');
  await page.locator('#flashcard').click();await expect(page.locator('#cardBack')).not.toHaveClass(/hidden/);await page.locator('#cardGood').click();
  await expect(page.locator('#topXp')).toHaveText('4');
  await expect(page.locator('body')).not.toHaveClass(/visitor-mode/);

  await page.locator('#backBtn').click();
  await expect(page.locator('.learner-hero')).toContainText('Keep your language');
  await expect(page.locator('.dashboard-grid')).toBeVisible();
  await expect(page.locator('#languagesHeading')).toHaveText('Your languages');
});

test('guest practice persists in IndexedDB, survives reload and resets cleanly',async({page})=>{
  await page.goto('/');await waitForBoot(page);
  await page.locator('[data-language="ja"]').click();await expect(page.locator('#courseName')).toHaveText('Japanese');

  await page.locator('[data-tab="cards"]').click();await expect(page.locator('#cardsTab')).toHaveClass(/active/);await expect(page.locator('#cardFront')).not.toHaveText('');
  await page.locator('#flashcard').click();await expect(page.locator('#cardBack')).not.toHaveClass(/hidden/);await page.locator('#cardGood').click();

  await expect(page.locator('#topXp')).toHaveText('4');
  const firstState=await page.evaluate(()=>window.LanguageLab.getState());expect(firstState.events).toHaveLength(1);expect(firstState.events[0].activity).toBe('practice');expect(firstState.events[0].skill).toBe('recall');expect(firstState.events[0].xpDelta).toBe(4);

  await page.reload();await waitForBoot(page);await expect(page.locator('#topXp')).toHaveText('4');

  await page.locator('[data-language="ja"]').click();await page.locator('[data-tab="progress"]').click();page.once('dialog',dialog=>dialog.accept());await page.locator('#resetCourseBtn').click();
  await expect(page.locator('#topXp')).toHaveText('0');
  const resetState=await page.evaluate(()=>window.LanguageLab.getState());expect(resetState.events.some(event=>event.activity==='reset')).toBe(true);
  await page.locator('#backBtn').click();await expect(page.locator('body')).not.toHaveClass(/visitor-mode/);
});
