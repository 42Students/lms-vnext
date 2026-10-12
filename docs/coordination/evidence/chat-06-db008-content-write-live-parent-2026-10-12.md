# Chat 6 / DB-008 — live lesson content parent authorization

Date: 2026-10-12 IST. Global phase: DATABASE, still ACTIVE. Worker task DB-008 remains IN_PROGRESS.
Legacy BE `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`, FE `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`.

## Implemented directly on main

- Extracted shared `src/modules/courses/lesson-write-ancestry.ts`: transactionally checks and SHARE-locks nonarchived learning path; active offering, course, college and org; cohort's active program/department; and offering academic period. Compares course, cohort, period and tenant to the originally authorized scope.
- Lesson create/update/archive reuse the same helper with a transactional lesson mutation.
- `src/modules/courses/lesson-content-service.ts`: create, update and PUBLISH/ARCHIVE now acquire the shared ancestor lock, unchanged ACTIVE lesson/path and live same-offering optional delivery SHARE lock in the same transaction as the mutation.
- Source-only regression files `tests/db05-lesson-write-ancestry.test.mjs` and `tests/db05-lesson-content-write-ancestry.test.mjs`; matrix `docs/planning/db05-lesson-content-parent-acceptance.json` has CW-01..12 unexecuted two-session PG cases.

## Source verification and limitations

17/17 staged exact GitHub source structural checks passed in JS V8, across helper blob `b8a44b52096210f5d5d4bd31b4fd9007fa67b67a`, lesson service blob `38ae2ef492cc2da0e652e64c2eee5f156fd778f0`, content service blob `554f192a6414d26b0d27178865dd21968f75f1b9`. No native Node, typecheck, lint, build, browser or disposable PostgreSQL two-session commands executed here.

The parent guards do NOT prove persisted FACULTY grant revocation race safety, historical tombstone/version CAS, direct-SQL upstream parent reparent or stage migration correctness. W01 owns integration of numbered migrations; seven principal DB05 drafts remain unregistered. No database field marked VERIFIED, DB-008 not completed and global DATABASE phase not certified.

Key commits: lesson write `f38be808`; extracted helper `fa1ae8ba`; lesson reuse `c4f23ba6`; lesson content write `e5524422`; content test `b8caa0ee`; content acceptance `efbb190c`.
