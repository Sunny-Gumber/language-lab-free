import{test,expect}from'@playwright/test';
import{blockExternal}from'./helpers.js';

async function waitForBoot(page){
  await expect.poll(()=>page.evaluate(()=>window.LanguageLab?.version||0)).toBe('13.1');
  await expect(page.locator('.fatal-error')).toHaveCount(0);
}
async function openGuidedPronunciation(page,languageCode){
  await page.locator(`[data-language="${languageCode}"]`).click();
  await page.locator('[data-journey-start]').first().click();
  await page.locator('[data-lesson-action="continue"]').click();
  await page.locator('[data-lesson-action="continue"]').click();
  await expect(page.locator('.guided-roman-v13')).toBeVisible();
  await expect(page.locator('.guided-roman-v13 [data-hindi-pronunciation]')).toBeVisible();
}

test.beforeEach(async({page})=>{await blockExternal(page)});

test('Japanese keeps Romaji and adds Hindi pronunciation support',async({page})=>{
  await page.goto('/');await waitForBoot(page);await openGuidedPronunciation(page,'ja');
  const roman=await page.locator('.guided-roman-v13').evaluate(node=>node.firstChild?.textContent?.trim()||'');
  expect(roman).toMatch(/[a-z]/i);
  await expect(page.locator('.guided-roman-v13 [data-hindi-pronunciation]')).toContainText('हिंदी उच्चारण:');
  await expect(page.locator('.guided-roman-v13 [data-hindi-pronunciation]')).toContainText(/[\u0900-\u097F]/);

  await page.locator('[data-lesson-action="back-path"]').click();
  await page.locator('[data-tab="explore"]').click();
  await page.locator('[data-v13-tool="words"]').click();
  await expect(page.locator('#wordGrid [data-hindi-pronunciation]').first()).toBeVisible();
});

test('Mandarin keeps Pinyin and adds Devanagari with tone guidance',async({page})=>{
  await page.goto('/');await waitForBoot(page);await openGuidedPronunciation(page,'zh');
  const roman=await page.locator('.guided-roman-v13').evaluate(node=>node.firstChild?.textContent?.trim()||'');
  expect(roman).toMatch(/[a-z]/i);
  await expect(page.locator('.guided-roman-v13 [data-hindi-pronunciation]')).toContainText('हिंदी उच्चारण (¹²³⁴ टोन):');
  await expect(page.locator('.guided-roman-v13 [data-hindi-pronunciation]')).toContainText(/[\u0900-\u097F]/);
});
