import assert from 'node:assert/strict';
import test from 'node:test';

import { shouldMunchOnTileTap } from '../src/tap-controls.js';

test('tapping the focused available square requests a munch', () => {
  assert.equal(shouldMunchOnTileTap({ focusedIndex: 7, tappedIndex: 7, isPending: false }), true);
});

test('tapping another square moves focus without munching', () => {
  assert.equal(shouldMunchOnTileTap({ focusedIndex: 7, tappedIndex: 8, isPending: false }), false);
});

test('tapping a pending square never requests a munch', () => {
  assert.equal(shouldMunchOnTileTap({ focusedIndex: 7, tappedIndex: 7, isPending: true }), false);
});
