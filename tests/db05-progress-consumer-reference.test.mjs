/**
 * DB-008 pure reference model for legacy learner-progress reader semantics.
 * No database or runtime app integration. This verifies the source contract,
 * NOT the vNext implementation or a PostgreSQL migration.
 */
import assert from "node:assert/strict";
import test from "node:test";

const key = (row) => row.membership + "/" + row.content;

function latestAttempts(rows) {
  const map = new Map();
  for (const row of rows) {
    const k = key(row);
    const previous = map.get(k);
    if (!previous || previous.attempt < row.attempt) map.set(k, row);
    else if (previous.attempt === row.attempt) {
      throw new Error("composite attempt uniqueness breached");
    }
  }
  return [...map.values()];
}

function adminCompletedCount(rows, membership) {
  return latestAttempts(rows)
    .filter((row) =>
      row.membership === membership &&
      row.completedAt !== null &&
      row.deletedAt === null
    ).length;
}

function learnerDetail(rows, membership, content) {
  return latestAttempts(rows).find(
    (row) => row.membership === membership && row.content === content
  ) ?? null;
}

function renderWorkspaceContentRows(contents, progressRows, membership) {
  const latest = latestAttempts(progressRows);
  return contents.map((content) => ({
    content,
    progress: latest.find((row) =>
      row.content === content && row.membership === membership
    ) ?? null,
  }));
}

function retake(rows, membership, content) {
  const previous = learnerDetail(rows, membership, content);
  if (!previous) throw new Error("cannot start a retake before attempt one");
  return [...rows, {
    ...previous,
    attempt: previous.attempt + 1,
    lastPositionSeconds: 0,
    completedAt: null,
    firstCompletedAt: null,
    deletedAt: null,
  }];
}

function scopedSave(rows, membership, content, expectedAttempt, seconds) {
  const current = learnerDetail(rows, membership, content);
  if (!current || current.attempt !== expectedAttempt) {
    throw new Error("STALE_ATTEMPT_CONFLICT");
  }
  return rows.map((row) =>
    row.membership === membership &&
    row.content === content &&
    row.attempt === expectedAttempt
      ? { ...row, lastPositionSeconds: seconds }
      : row
  );
}

const row = (attempt, opts = {}) => ({
  membership: "m1", content: "c1", attempt,
  durationSeconds: 200,
  lastPositionSeconds: 0,
  completedAt: null,
  firstCompletedAt: null,
  deletedAt: null,
  ...opts,
});

test("source aggregate counts latest attempt, never completed history", () => {
  const old = row(1, { completedAt: "2026-10-01", firstCompletedAt: "2026-10-01" });
  const newest = row(2);
  assert.equal(adminCompletedCount([old, newest], "m1"), 0);
  assert.equal(learnerDetail([old, newest], "m1", "c1")?.attempt, 2);
});

test("source count does not resurrect old attempt when latest is deleted", () => {
  const first = row(1, { completedAt: "2026-10-01" });
  const deleted = row(2, { completedAt: "2026-10-02", deletedAt: "2026-10-03" });
  assert.equal(adminCompletedCount([first, deleted], "m1"), 0);
  assert.equal(learnerDetail([first, deleted], "m1", "c1")?.attempt, 2);
  assert.notEqual(learnerDetail([first, deleted], "m1", "c1")?.deletedAt, null);
});

test("completed current attempt is counted exactly once", () => {
  const rows = [
    row(1, { completedAt: "2026-10-01" }),
    row(2, { completedAt: "2026-10-02" }),
  ];
  assert.equal(adminCompletedCount(rows, "m1"), 1);
});

test("learner workspace yields one content regardless of historical runs", () => {
  const rows = [row(1), row(2, { lastPositionSeconds: 51 })];
  const rendered = renderWorkspaceContentRows(["c1", "c2"], rows, "m1");
  assert.equal(rendered.length, 2);
  assert.equal(rendered[0].progress.attempt, 2);
  assert.equal(rendered[0].progress.lastPositionSeconds, 51);
  assert.equal(rendered[1].progress, null);
});

test("retake creates a fresh run and preserves historical first completion", () => {
  const first = row(1, {
    durationSeconds: 250,
    completedAt: null,
    firstCompletedAt: "2026-10-01",
    lastPositionSeconds: 249,
  });
  const next = retake([first], "m1", "c1");
  assert.equal(next.length, 2);
  assert.equal(next[0].firstCompletedAt, "2026-10-01");
  assert.equal(next[1].durationSeconds, 250);
  assert.equal(next[1].attempt, 2);
  assert.equal(next[1].completedAt, null);
  assert.equal(next[1].firstCompletedAt, null);
  assert.equal(next[1].lastPositionSeconds, 0);
});

test("old browser tab cannot mutate stale attempt after retake", () => {
  const rows = retake([row(1)], "m1", "c1");
  assert.throws(
    () => scopedSave(rows, "m1", "c1", 1, 150),
    /STALE_ATTEMPT_CONFLICT/
  );
  const after = scopedSave(rows, "m1", "c1", 2, 70);
  assert.equal(after[0].lastPositionSeconds, 0);
  assert.equal(after[1].lastPositionSeconds, 70);
});

test("distinct members or contents never share attempt state", () => {
  const rows = [
    row(1, { completedAt: "2026-10-01" }),
    row(1, { membership: "m2" }),
    row(1, { content: "c2" }),
  ];
  assert.equal(adminCompletedCount(rows, "m1"), 1);
  assert.equal(adminCompletedCount(rows, "m2"), 0);
  assert.equal(learnerDetail(rows, "m2", "c1")?.attempt, 1);
});

test("duplicate (membership, content, attempt) is forbidden in reference", () => {
  assert.throws(() => latestAttempts([row(1), row(1)]), /composite attempt uniqueness breached/);
});
