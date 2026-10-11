# Chat 6 / DB-008 — tombstone ancestor read-only preflight native source check

**Date:** 2026-10-12 IST · **Phase:** DATABASE ACTIVE · **Task:** DB-008 IN_PROGRESS.  
**Legacy BE:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`.  
**Artifacts:** `scripts/sql/db05-tombstone-ancestor-preflight.readonly.sql` (exact GitHub blob `62aaee7168e87d051320b29c2396cec9e36a4509`), `tests/db05-tombstone-ancestor-preflight.test.mjs` (exact blob `5207360638af7cf437f4c03e4db981917f4a8091`).

## Actual native Node test (source-only)

Command: `node --test /mnt/data/db008-check/tests/db05-tombstone-ancestor-preflight.test.mjs`  
Runtime: Node `v22.16.0`, exit `0`.  
Result: TAP `1..6`, `pass 6`, `fail 0`, `duration_ms 53.975009` (recorded execution).  
Exact source: `git hash-object scripts/sql/db05-tombstone-ancestor-preflight.readonly.sql tests/db05-tombstone-ancestor-preflight.test.mjs` produced `62aaee7168e87d051320b29c2396cec9e36a4509` and `5207360638af7cf437f4c03e4db981917f4a8091`. Both equal independently created GitHub blobs, so the native tests checked the exact committed preflight bytes.

The six tests prove *read-only query shape*, three aggregate counts, no PII projections and the expected ancestor joins/predicates. They do **not** query real PostgreSQL or assert that mismatch counts are zero.

## Real database follow-up — NOT RUN

Preflight requires W01 to have registered `courses.legacy_deleted_at`, `course_lessons.legacy_deleted_at`, and `lesson_contents.legacy_deleted_at`. It must return zero for all:
- `LIVE_LESSON_UNDER_DELETED_COURSE`
- `LIVE_CONTENT_UNDER_DELETED_LESSON`
- `LIVE_CONTENT_UNDER_DELETED_COURSE`

W01 must execute on **disposable PostgreSQL only** after safe migration replay. Zero counts are necessary but cannot prove concurrent restore/delete correctness; run LR/TB DG tests and two-session races independently. No DB table was changed by this addition, no app features activated, and no global phase/status promoted. The queue DB-008 remains IN_PROGRESS, formal DB05 runtime verified 0/92.
