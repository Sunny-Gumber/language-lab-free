import{test,expect}from'@playwright/test';
import{blockExternal}from'./helpers.js';

async function waitForBoot(page){
  await expect.poll(()=>page.evaluate(()=>window.LanguageLab?.version||0)).toBe('13.1');
  await expect(page.locator('.fatal-error')).toHaveCount(0);
}

test.beforeEach(async({page})=>{
  await blockExternal(page);
  await page.addInitScript(()=>{
    class MockRecognition{
      constructor(){this.lang='';this.interimResults=false;this.maxAlternatives=1;this.onresult=null;this.onerror=null;this.onend=null}
      abort(){}
      start(){
        const alternatives=[{transcript:'朝',confidence:.99}];
        setTimeout(()=>{this.onresult?.({results:[alternatives]});this.onend?.()},0);
      }
    }
    window.SpeechRecognition=MockRecognition;
    window.webkitSpeechRecognition=MockRecognition;
  });
});

test('Journey accepts Kanji transcript for the taught Kana reading and labels the task clearly',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','Speech equivalence behavior is exercised once on Chromium.');
  await page.goto('/');await waitForBoot(page);
  await page.locator('[data-language="ja"]').click();
  await page.locator('[data-journey-start]').first().click();

  await page.locator('[data-lesson-action="continue"]').click();
  await page.locator('[data-lesson-action="continue"]').click();
  const meaning=(await page.locator('.guided-meaning-v13').textContent())?.trim();
  expect(meaning).toBe('morning');
  await page.locator('[data-lesson-action="continue"]').click();
  await page.locator('[data-lesson-answer]').filter({hasText:'morning'}).click();
  await page.locator('[data-lesson-action="continue"]').click();
  await page.locator('[data-recall-answer]').filter({hasText:'あさ'}).click();
  await page.locator('[data-lesson-action="continue"]').click();

  await expect(page.locator('.task-prompt-v13')).toContainText('Say in Japanese:');
  await expect(page.locator('.task-prompt-v13')).toContainText('morning');
  await page.locator('[data-lesson-action="mic"]').click();
  await expect(page.locator('#journeyTab .practice-feedback')).toContainText('Browser heard: 朝');
  await expect(page.locator('#journeyTab .practice-feedback')).toContainText('Text match: 100%');
  await expect(page.locator('#journeyTab .practice-feedback')).toContainText('Accepted equivalent Japanese spelling');
});
