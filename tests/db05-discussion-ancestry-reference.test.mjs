import test from 'node:test';
import assert from 'node:assert/strict';

// Pure reference model for the UNREGISTERED DB05 discussion-ancestry SQL.
// These tests assert the intended graph policy, NOT PostgreSQL trigger behavior.
function wouldCycle(rows, { id, parentId, contentId }) {
  if (parentId === null) return false;
  if (parentId === id) return true;
  const visited = new Set();
  let at = parentId;
  while (at !== null) {
    if (at === id) return true;
    if (visited.has(at)) throw new Error('existing ancestor cycle');
    visited.add(at);
    const parent = rows.get(at);
    if (!parent) throw new Error('parent not found');
    if (parent.contentId !== contentId) throw new Error('parent belongs to other content');
    at = parent.parentId;
  }
  return false;
}
function mayMoveContent({ oldLesson, newLesson, oldDelivery, newDelivery, discussionCount }) {
  const changing = oldLesson !== newLesson || oldDelivery !== newDelivery;
  return !(changing && discussionCount > 0);
}
const row = (id, parentId = null, contentId = 'content-A') => ({ id, parentId, contentId });

test('root and ordinary same-content child are legal', () => {
  const rows = new Map([['a', row('a')], ['b', row('b', 'a')]]);
  assert.equal(wouldCycle(rows, { id: 'c', parentId: null, contentId: 'content-A' }), false);
  assert.equal(wouldCycle(rows, { id: 'c', parentId: 'b', contentId: 'content-A' }), false);
});
test('rejects self parent', () => {
  assert.equal(wouldCycle(new Map(), { id: 'a', parentId: 'a', contentId: 'content-A' }), true);
});
test('rejects a two-hop cycle', () => {
  const rows = new Map([['a', row('a')], ['b', row('b', 'a')]]);
  assert.equal(wouldCycle(rows, { id: 'a', parentId: 'b', contentId: 'content-A' }), true);
});
test('rejects three-hop and deep cycles', () => {
  const rows = new Map([['a', row('a')], ['b', row('b', 'a')], ['c', row('c', 'b')]]);
  assert.equal(wouldCycle(rows, { id: 'a', parentId: 'c', contentId: 'content-A' }), true);
});
test('fails closed if pre-existing chain is cyclic', () => {
  const rows = new Map([['a', row('a', 'b')], ['b', row('b', 'a')]]);
  assert.throws(() => wouldCycle(rows, { id: 'c', parentId: 'a', contentId: 'content-A' }), /existing ancestor cycle/);
});
test('same-content parent is required', () => {
  const rows = new Map([['a', row('a', null, 'content-B')]]);
  assert.throws(() => wouldCycle(rows, { id: 'c', parentId: 'a', contentId: 'content-A' }), /other content/);
});
test('missing parent is rejected', () => {
  assert.throws(() => wouldCycle(new Map(), { id: 'c', parentId: 'unknown', contentId: 'content-A' }), /not found/);
});
test('direct lesson move with a discussion is denied', () => {
  assert.equal(mayMoveContent({ oldLesson: 'a', newLesson: 'b', oldDelivery: null, newDelivery: null, discussionCount: 1 }), false);
});
test('direct delivery move with soft-deleted discussion history is denied', () => {
  assert.equal(mayMoveContent({ oldLesson: 'a', newLesson: 'a', oldDelivery: null, newDelivery: 'new', discussionCount: 1 }), false);
});
test('no-op content edit is permitted even with discussions', () => {
  assert.equal(mayMoveContent({ oldLesson: 'a', newLesson: 'a', oldDelivery: 'd', newDelivery: 'd', discussionCount: 100 }), true);
});
test('content with no discussions is movable subject to other tenant guards', () => {
  assert.equal(mayMoveContent({ oldLesson: 'a', newLesson: 'b', oldDelivery: null, newDelivery: null, discussionCount: 0 }), true);
});
