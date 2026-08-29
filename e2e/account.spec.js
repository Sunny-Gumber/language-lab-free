import{test,expect}from'@playwright/test';
import{blockExternal,installMockSupabase}from'./helpers.js';

async function waitForBoot(page){
  await expect.poll(()=>page.evaluate(()=>window.LanguageLab?.version||0)).toBe('13.1');
  await expect(page.locator('.fatal-error')).toHaveCount(0);
}
async function createGuidedGuestProgress(page){
  await page.locator('[data-language="ja"]').click();
  await expect(page.locator('#journeyTab')).toHaveClass(/active/);
  await page.locator('[data-journey-start]').first().click();
  await page.locator('[data-lesson-action="continue"]').click();
  await page.locator('[data-lesson-action="continue"]').click();
  await page.locator('[data-lesson-action="continue"]').click();
  await page.locator('[data-lesson-answer]').first().click();
  await expect.poll(()=>page.evaluate(()=>window.LanguageLab.getState().events.filter(event=>event.activity==='practice').length)).toBeGreaterThanOrEqual(2);
}

test('signed-in onboarding, language management and sign-out work end to end',async({page})=>{
  await blockExternal(page);await installMockSupabase(page);await page.goto('/');await waitForBoot(page);
  await expect(page.locator('#onboardingOverlay')).not.toHaveClass(/hidden/);
  await page.locator('[data-onboard-language="es"]').click();
  await page.locator('[data-onboard-audio="female"]').click();
  await page.locator('#onboardingSaveBtn').click();
  await expect(page.locator('#onboardingOverlay')).toHaveClass(/hidden/);
  await expect(page.locator('#accountBtn')).toContainText('E2E Learner');
  await expect(page.locator('body')).toHaveClass(/visitor-mode/);
  await expect(page.locator('#languageGrid [data-language]')).toHaveCount(1);
  await expect(page.locator('[data-language="es"]')).toBeVisible();

  const profile=await page.evaluate(()=>window.__mockBackend.profile);
  expect(profile.primary_language).toBe('es');expect(profile.enabled_languages).toEqual(['es']);expect(profile.audio_preference).toBe('female');expect(profile.onboarding_completed).toBe(true);

  await page.locator('#addLanguageBtn').click();
  const japanese=page.locator('.manager-language').filter({hasText:'Japanese'});
  await japanese.getByRole('button',{name:'Add'}).click();await japanese.getByRole('button',{name:'Make primary'}).click();
  await page.locator('[data-close="languagesOverlay"]').click();
  await expect(page.locator('#languageGrid [data-language]')).toHaveCount(2);

  await page.locator('#accountBtn').click();await page.locator('#signOutBtn').click();
  await expect(page.locator('#accountBtn')).toHaveText('👤 Sign in');
  await expect(page.locator('#languageGrid [data-language]')).toHaveCount(10);
  await expect(page.locator('#syncStatus')).toContainText('Guest');
});

test('guest guided progress can be imported into a newly signed-in account',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','Guest import contract is exercised once on desktop Chromium.');
  await blockExternal(page);await installMockSupabase(page,{signedIn:false});
  page.on('dialog',dialog=>dialog.accept());
  await page.goto('/');await waitForBoot(page);
  await expect(page.locator('#syncStatus')).toContainText('Guest');
  await createGuidedGuestProgress(page);
  const guestXp=await page.evaluate(()=>Number(document.getElementById('topXp').textContent));expect(guestXp).toBeGreaterThan(0);

  await page.evaluate(()=>window.__mockSupabaseClient.__emitAuth('SIGNED_IN',{user:window.__mockSupabaseClient.__user}));
  await expect(page.locator('#onboardingOverlay')).not.toHaveClass(/hidden/);
  await page.locator('#onboardingSaveBtn').click();
  await expect(page.locator('#onboardingOverlay')).toHaveClass(/hidden/);
  await expect(page.locator('#accountBtn')).toContainText('E2E Learner');
  await expect.poll(()=>page.evaluate(()=>Number(document.getElementById('topXp').textContent))).toBeGreaterThan(0);
  await expect(page.locator('body')).not.toHaveClass(/visitor-mode/);
  await expect.poll(()=>page.evaluate(()=>window.__mockBackend.events.some(event=>event.skill==='listening'&&event.metadata?.mode==='guided-journey'))).toBe(true);
});

test('event progress and exact detailed-lesson position restore on a fresh second device',async({page,browser},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','Cross-device contract is exercised once on desktop Chromium.');
  const accountProfile={onboarding_completed:true,primary_language:'ja',enabled_languages:['ja']};
  await blockExternal(page);await installMockSupabase(page,{profile:accountProfile});await page.goto('/');await waitForBoot(page);
  await expect(page.locator('#onboardingOverlay')).toHaveClass(/hidden/);

  await page.locator('[data-language="ja"]').click();await expect(page.locator('#journeyTab')).toHaveClass(/active/);
  await page.locator('[data-tab="explore"]').click();await page.locator('[data-v13-tool="learn"]').click();
  await expect(page.locator('#learnTab')).toHaveClass(/active/);await page.locator('#unitSelect').selectOption('2');await expect(page.locator('#unitSelect')).toHaveValue('2');
  await page.locator('#learnTab [data-v13-back]').click();await page.locator('[data-tab="review"]').click();await page.locator('[data-v13-tool="cards"]').click();
  await page.locator('#flashcard').click();await page.locator('#cardGood').click();await expect(page.locator('#topXp')).toHaveText('4');
  await page.evaluate(()=>window.LanguageLab.sync());

  await expect.poll(()=>page.evaluate(()=>window.__mockBackend.positions.find(row=>row.language_code==='ja')?.unit_index??-1)).toBe(2);
  await expect.poll(()=>page.evaluate(()=>window.__mockBackend.events.length)).toBeGreaterThan(0);
  const snapshot=await page.evaluate(()=>({profile:window.__mockBackend.profile,events:window.__mockBackend.events,positions:window.__mockBackend.positions}));

  const secondContext=await browser.newContext({baseURL:'http://127.0.0.1:4173',serviceWorkers:'block'});
  const secondPage=await secondContext.newPage();await blockExternal(secondPage);await installMockSupabase(secondPage,snapshot);await secondPage.goto('/');await waitForBoot(secondPage);
  await expect(secondPage.locator('#topXp')).toHaveText('4');await secondPage.locator('[data-language="ja"]').click();await expect(secondPage.locator('#journeyTab')).toHaveClass(/active/);
  await secondPage.locator('[data-tab="explore"]').click();await secondPage.locator('[data-v13-tool="learn"]').click();await expect(secondPage.locator('#unitSelect')).toHaveValue('2');
  const secondState=await secondPage.evaluate(()=>window.LanguageLab.getState());expect(secondState.events.some(event=>event.xpDelta===4&&event.skill==='recall')).toBe(true);await secondContext.close();

  await page.locator('#accountBtn').click();await page.locator('#signOutBtn').click();await expect(page.locator('#topXp')).toHaveText('0');
});
