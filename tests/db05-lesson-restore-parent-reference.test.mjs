import test from 'node:test';
import assert from 'node:assert/strict';

// Pure source policy model, not PostgreSQL trigger or two-connection evidence.
const allowLessonWrite = ({ nextDeletedAt, parentExists = true, parentDeletedAt = null }) => {
  if (nextDeletedAt !== null) return true; // Deleted history is not revived.
  return parentExists && parentDeletedAt === null;
};

test('a new live lesson under active course can be created', () => {
  assert.equal(allowLessonWrite({ nextDeletedAt: null }), true);
});
test('a new live lesson under deleted course is refused', () => {
  assert.equal(allowLessonWrite({ nextDeletedAt: null, parentDeletedAt: '2026-10-10' }), false);
});
test('a historical tombstoned lesson can be inserted without reviving its parent', () => {
  assert.equal(allowLessonWrite({ nextDeletedAt: '2026-10-11', parentDeletedAt: '2026-10-10' }), true);
});
test('restoring a lesson in-place under deleted course is refused', () => {
  assert.equal(allowLessonWrite({ nextDeletedAt: null, parentDeletedAt: '2026-10-10' }), false);
});
test('restoring a lesson under live course is allowed', () => {
  assert.equal(allowLessonWrite({ nextDeletedAt: null, parentDeletedAt: null }), true);
});
test('moving a live lesson to a deleted course is refused', () => {
  assert.equal(allowLessonWrite({ nextDeletedAt: null, parentDeletedAt: '2026-10-10' }), false);
});
test('deleting a lesson under already-deleted course is allowed for cleanup', () => {
  assert.equal(allowLessonWrite({ nextDeletedAt: '2026-10-12', parentDeletedAt: '2026-10-10' }), true);
});
test('live lesson with missing owning course is refused', () => {
  assert.equal(allowLessonWrite({ nextDeletedAt: null, parentExists: false }), false);
});
test('tombstoned row with missing parent still needs FK acceptance, not this live guard', () => {
  assert.equal(allowLessonWrite({ nextDeletedAt: '2026-10-12', parentExists: false }), true);
});
test('no-op live state still requires an active owning course', () => {
  assert.equal(allowLessonWrite({ nextDeletedAt: null, parentDeletedAt: '2026-10-10' }), false);
});
