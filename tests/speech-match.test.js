import test from'node:test';
import assert from'node:assert/strict';
import{speechTranscriptMatch}from'../src/speech-match.js';

test('Japanese recognizer Kanji is accepted for the taught Kana word',()=>{
  const match=speechTranscriptMatch('ja',['音'],'おと');
  assert.equal(match.score,1);
  assert.equal(match.expected,'音');
  assert.equal(match.equivalent,true);
});

test('Japanese common Kanji forms are accepted without weakening unrelated matches',()=>{
  assert.equal(speechTranscriptMatch('ja',['朝'],'あさ').score,1);
  assert.equal(speechTranscriptMatch('ja',['犬'],'いぬ').score,1);
  assert.ok(speechTranscriptMatch('ja',['猫'],'おと').score<.5);
});

test('Exact transcript matching still works for every language',()=>{
  assert.equal(speechTranscriptMatch('ja',['おと'],'おと').score,1);
  assert.equal(speechTranscriptMatch('zh',['你好'],'你好').score,1);
  assert.equal(speechTranscriptMatch('es',['hola'],'hola').score,1);
});
