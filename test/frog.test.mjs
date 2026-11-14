import assert from 'node:assert/strict';
import test from 'node:test';
import { FROG_EAT_ANIMATION, FROG_EAT_DURATION_MS, frogAnimationForMove } from '../src/frog.js';

test('frog uses the matching jump row for directional moves', () => {
  assert.equal(frogAnimationForMove('up'), 'jump-up');
  assert.equal(frogAnimationForMove('down'), 'jump-down');
  assert.equal(frogAnimationForMove('left'), 'jump-left');
  assert.equal(frogAnimationForMove('right'), 'jump-right');
});

test('touch movement uses the jump-up row at the destination', () => {
  assert.equal(frogAnimationForMove('left', { isTouch: true }), 'jump-up');
  assert.equal(frogAnimationForMove('down', { isTouch: true }), 'jump-up');
});

test('frog uses the eating animation for a munch', () => {
  assert.equal(FROG_EAT_ANIMATION, 'eating');
  assert.equal(FROG_EAT_DURATION_MS, 360);
});
