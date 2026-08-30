import test from'node:test';
import assert from'node:assert/strict';
import{clamp,daysBetween,deepEqual,escapeHtml,hashString,normalizeText,registerSpeechForms,similarity,todayLocal,unique}from'../src/utils.js';

test('todayLocal uses calendar fields without UTC conversion',()=>{
  assert.equal(todayLocal(new Date(2026,7,28,0,5,0)),'2026-08-28');
});

test('daysBetween handles date-only values deterministically',()=>{
  assert.equal(daysBetween('2026-08-27','2026-08-28'),1);
  assert.equal(daysBetween('2026-08-28','2026-08-27'),-1);
});

test('clamp protects score boundaries',()=>{
  assert.equal(clamp(130),100);
  assert.equal(clamp(-8),0);
  assert.equal(clamp(.75,0,1),.75);
});

test('normalizeText and similarity handle punctuation and spacing',()=>{
  assert.equal(normalizeText('你 好！'),'你好');
  assert.equal(similarity('Hello!',' hello '),1);
  assert.ok(similarity('konnichiwa','konichiwa')>.8);
});

test('Japanese speech transcript matching accepts equivalent writing systems',()=>{
  assert.equal(similarity('犬','いぬ'),1);
  assert.equal(similarity('イヌ','いぬ'),1);
  assert.equal(similarity('猫','ねこ'),1);
  assert.equal(similarity('水','みず'),1);
  assert.ok(similarity('犬','ねこ')<.5);
});

test('authored speech forms register future Kanji and alternate readings without engine edits',()=>{
  registerSpeechForms(['でんさんき','電算機'],'ja-JP');
  assert.equal(similarity('電算機','でんさんき'),1);
  registerSpeechForms(['せい','生'],'ja-JP');
  registerSpeechForms(['なま','生'],'ja-JP');
  assert.equal(similarity('生','せい'),1);
  assert.equal(similarity('生','なま'),1);
});

test('escapeHtml protects generated content',()=>{
  assert.equal(escapeHtml('<b>"x"</b>'),'&lt;b&gt;&quot;x&quot;&lt;/b&gt;');
});

test('hashString is stable and unique removes duplicates',()=>{
  assert.equal(hashString('Language Lab'),hashString('Language Lab'));
  assert.deepEqual(unique(['ja','zh','ja']),['ja','zh']);
});

test('deepEqual ignores object key order but not values',()=>{
  assert.equal(deepEqual({a:1,b:{x:2}},{b:{x:2},a:1}),true);
  assert.equal(deepEqual({a:1},{a:2}),false);
});
