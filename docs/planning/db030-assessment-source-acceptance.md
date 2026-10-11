# DB-030 assessment-integrity source acceptance

**Observed:** 2026-10-11 IST  
**Phase:** DATABASE · **Worker:** Chat 1  
**Runtime status:** BLOCKED on an approved executable checkout + disposable PostgreSQL. This document is **not** PostgreSQL verification.

## Registered migration chain

DB-030's source review is represented by two forward-only, registered trigger migrations:

- `0041_db06_assessment_parent_scope`
- `0042_db06_assessment_scope_hardening`

`0042_snapshot.json` follows `0041_snapshot.json` and is structurally identical apart from snapshot identity because 0042 changes only PostgreSQL functions/triggers.

The forward hardening adds the reviewed contracts that 0041 did not yet enforce:

- group-backed elective assessment access uses the exact active DB03 group roster and never host-section fallback;
- quiz attempt and assignment submission attribution is immutable history;
- assignment `max_points` cannot be reduced below an already awarded grade;
- newly persisted grading actors must currently be authorized as Super Admin, same-college College Admin, or exact-delivery Faculty;
- historical learner records may outlive active enrollment while structural/tenant parentage remains valid.

## Current-main source audit

A connector-side read-only audit checked **24/24 invariants true**:

1. journal contains exactly one 0041 registration;
2. journal contains exactly one 0042 registration;
3. 0042 snapshot follows 0041;
4. trigger-only 0042 preserves Drizzle table structure;
5. 0041 poison preflight exists;
6. 0042 hardening preflight exists;
7. 0042 performs no destructive history cleanup;
8. elective roster is authoritative;
9. attempt/submission historical attribution is immutable;
10. historical grade scale is protected;
11. grader authorization chain is represented;
12. grade-publication actor limitation remains explicit;
13. DB06 source contract is in `test:db:parity`;
14. 0041 migration contract is in `test:db:parity`;
15. 0042 migration contract is in `test:db:parity`;
16. PostgreSQL witness registry is in `test:db:parity`;
17. targeted `test:db06:pg` command exists;
18. independent verifier enables `DB06_ISOLATED_TEST_DATABASE=1`;
19. independent verifier runs the database integration suite;
20. PG01–PG16 witness markers are authored;
21. PG17–PG22 hardening markers are authored;
22. PG15B/PG16B/PG19B extra grader/preflight/race witnesses are authored;
23. positive Faculty grading fixture has an exact delivery teaching assignment;
24. elective integration fixture creates the persisted group/slot/offering/member graph.

This audit inspected committed source only. It did not execute Node, Vitest, PostgreSQL, or migration replay.

## Authored PostgreSQL acceptance

`tests/integration/db06-assessment-parent-scope.test.ts` now contains the original PG01–PG16 matrix plus 0042 hardening cases:

- cross-college persisted Faculty grader denial;
- 0042 hardening-preflight poison rejection;
- valid group-backed elective learner without host-section fallback;
- host-section-but-not-group denial;
- removed/archived elective denial;
- group-removal vs attempt-insert race;
- College Admin / exact-delivery Faculty / Super Admin grader positives;
- max-points undercut rejection;
- direct attempt/submission attribution retarget rejection.

Targeted command:

```bash
npm run test:db06:pg
```

The independent verifier also enables this suite through `npm run test:db`.

## Remaining gate

DB-030 must remain **BLOCKED**, not `COMPLETED` or `DONE_VERIFIED`, until an approved disposable PostgreSQL environment executes zero-to-head replay and the DB06 integration witnesses. No GitHub Actions result is required or assumed.

When DB02/DB05 parent-integrity migrations are promoted, re-audit overlap and lock ordering before final database-phase certification.
