# Chat 6 / DB-008 — lesson create/update/archive committed ancestry guard

Date 2026-10-12 (IST); owner DB-008; global DATABASE phase still ACTIVE.
Legacy backend oracle `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`; frontend `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`.

## Identified source defect and change

Previously, lesson create protected the `course_learning_paths` row with SHARE after an out-of-transaction permission read, but did **not** recheck locked offering→course→department→college→organization or cohort→program→department and academic period college. Lesson rename/update used a single statement without ancestor locks; archive locked the lesson but not its ancestor graph. Concurrent reparent, closure or archiving could invalidate the preauthorized college/scope.

Now in `src/modules/courses/lesson-service.ts`:
- `lockLiveLessonWriteAncestry` locks a nonarchived path with its unchanged offering ID and SHARE-locks ACTIVE offering, course, college and organization via inner join with department, validating unchanged course, cohort, term, college, organization IDs.
- Separately SHARE-locks cohort→ACTIVE program→nonarchived department and academic period, both with the same authorized college ID. Prevents a move of an unchanged cohort/period ID to an unrelated college from slipping through the permission snapshot.
- **CREATE**, **UPDATE**, **ARCHIVE** all call the ancestor lock within the same transaction as their lesson write. UPDATE/ARCHIVE also reject a new path tenant mismatch between their initial lesson read and parent read.
- Existing lesson-id/status/learning-path predicates and constraint-error mapping remain; no schema journal, root files, or global permission APIs touched.

## Authored verification

- `tests/db05-lesson-write-ancestry.test.mjs`: 7 source-level Node tests around parent JOINs, field comparisons, all three transaction/lock callsites, and nonarchived lesson predicates.
- `docs/planning/db05-lesson-authoring-ancestry-acceptance.json`: LA-01..LA-11 **unexecuted**, including parent archive/reparent, cohort/period rescope, concurrent lesson content insert, membership-revoke and deadlock-order witnesses.
- These are DATABASE integrity improvements, **not** certified closed DB05 field mappings. Any broader direct-SQL referential guard/migration remains W01 single-writer responsibility.

**Evidence boundaries:** exact GitHub source blob inspected; source structural comparisons only. `node --test`, TypeScript compiler, disposable PostgreSQL two-session witnesses, full 0000→head migration and browser testing were NOT executed in this checkpoint. Local git checkout still unavailable (DNS). Global DB-008 stays IN_PROGRESS with PostgreSQL acceptance OPEN.
