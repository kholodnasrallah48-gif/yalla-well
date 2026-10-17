/// <reference types="node" />
// Run with: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MAX_BYTES, backupKey, backupSig, hasProfile, makeBackup } from './backup.ts';

test('keeps app data and leaves out the lookup cache and other apps', () => {
  assert.equal(backupKey('yallawell:profile'), true);
  assert.equal(backupKey('yallawell:day:2026-10-17'), true);
  assert.equal(backupKey('yallawell:c:photo:x'), false);
  assert.equal(backupKey('sb-auth-token'), false);
  const b = makeBackup([['yallawell:profile', '{}'], ['yallawell:c:x', '1'], ['yallawell:lang', null]], 't');
  assert.deepEqual(b, { v: 1, at: 't', items: { 'yallawell:profile': '{}' } });
  assert.equal(hasProfile(b), true);
  assert.equal(hasProfile(makeBackup([])), false);
});

test('drops lab photos when the copy is too big, keeps everything else', () => {
  const big = 'x'.repeat(MAX_BYTES);
  const b = makeBackup([['yallawell:labphoto:1', big], ['yallawell:profile', '{}']]);
  assert.deepEqual(Object.keys(b.items), ['yallawell:profile']);
});

test('signature ignores the time and key order', () => {
  const a = makeBackup([['yallawell:a', '1'], ['yallawell:b', '2']], 't1');
  const b = makeBackup([['yallawell:b', '2'], ['yallawell:a', '1']], 't2');
  assert.equal(backupSig(a), backupSig(b));
  assert.notEqual(backupSig(a), backupSig(makeBackup([['yallawell:a', '9']])));
});
