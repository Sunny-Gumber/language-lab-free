import test from'node:test';
import assert from'node:assert/strict';
import{hindiPronunciation,hindiPronunciationLabel}from'../src/pronunciation-hi.js';

test('Japanese Romaji keeps a readable Hindi pronunciation guide',()=>{
  assert.equal(hindiPronunciation('ja','konnichiwa'),'कोन्निचिवा');
  assert.equal(hindiPronunciation('ja','arigatou'),'अरिगातो');
  assert.equal(hindiPronunciation('ja','sumimasen'),'सुमिमासेन');
  assert.equal(hindiPronunciation('ja','matcha'),'माच्चा');
});

test('Mandarin Pinyin keeps tone information in the Hindi guide',()=>{
  assert.equal(hindiPronunciation('zh','nǐ hǎo'),'नी³ हाओ³');
  assert.equal(hindiPronunciation('zh','qǐng'),'छिंग³');
  assert.equal(hindiPronunciation('zh','Zhōngguó'),'चोंग¹ क्वो²');
  assert.equal(hindiPronunciationLabel('zh','nǐ hǎo'),'हिंदी उच्चारण (¹²³⁴ टोन): नी³ हाओ³');
});

test('Hindi pronunciation support is limited to Japanese and Mandarin',()=>{
  assert.equal(hindiPronunciation('en','hello'),'');
  assert.equal(hindiPronunciation('hi','namaste'),'');
  assert.equal(hindiPronunciation('ja',''),'');
});

test('Unknown names remain readable instead of being force-transliterated as Pinyin',()=>{
  assert.equal(hindiPronunciation('zh','wǒ jiào Alex'),'वो³ ज्याओ⁴ Alex');
});
