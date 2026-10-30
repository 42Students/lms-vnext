# DB-018 negative PostgreSQL witness coverage

**Phase:** DATABASE  
**Task:** DB-018 — Negative DB integration witness suite  
**State:** focused disposable PostgreSQL 17 matrix PASSED; DB-018 global acceptance still OPEN  
**Rule:** Only exact-run PostgreSQL results count as executed evidence. Passing this witness corpus does not waive DB-001, DB-014, DB-020 or five separate race-gap obligations.

## Executed focused witness denominator

| Family | Authored | Runtime passed | Meaning |
| --- | ---: | ---: | --- |
| Read-only relational mismatch probes | 21 | 21 | Existing-row observation only; zero mismatches do not prove prevention |
| Direct negative SQL boundary tests | 21 | 21 | Real FK/check/trigger/unique violations against registered schema |
| Positive concurrency witnesses | 4 | 4 | Races whose current source has a locking/CAS strategy |
| Known-defect red concurrency witnesses | 0 | 0 | No currently known race is still source-unfixed |
| Fix-authored race regression verified | 2 | 2 | P5-R01 placement and P5-R02 academics regressions passed against disposable PG17 |
| Draft/unregistered race families excluded | 3 | 0 | Lease, outbound and log-alert candidates are not registered runtime schema |

Machine-readable denominator: `tests/integration/db18-witness-index.json`.

**Five newly verified checks:** [Full DB-018 PG17 acceptance run 41107736939](https://github.com/42Students/lms-vnext/actions/runs/41107736939) at commit `654cbc9d69759100ca3fd87a538c6e0cfb3bc2c3` passed **92/92 tests** across seven integration files. [Focused registered relational run 41107736976](https://github.com/42Students/lms-vnext/actions/runs/41107736976) passed **35/35** in the relational/direct SQL file, including all five new constraints. The named domain witness denominator increased from 43 to **48/48 verified**, with **21/21 direct SQL negatives**. No production SQL was changed and all fixture mutations rolled back.

**Evidence:** [GitHub Actions DB-018 PostgreSQL 17 run 41104567182](https://github.com/42Students/lms-vnext/actions/runs/41104567182) at exact commit `c78eb936db33489cbb3b57281793dfda5f10382d`: **45/45 focused Vitest cases PASS**, corresponding to **43/43 named domain witnesses** plus two fixture/inventory checks. All 21 joins were populated; no mismatches. The [repeat full matrix at 89a905a7](https://github.com/42Students/lms-vnext/actions/runs/41104843226) also passed after the denominator updates. This is a **partial task acceptance**, not overall DB-018 DONE.



## Direct registered-schema negatives

`tests/integration/db018-relational-and-boundary-witnesses.test.ts` contributes twelve foundational identity, academic, course and placement SQL boundary tests:

1. missing user FK on `college_memberships` → 23503;
2. missing membership FK on `membership_roles` → 23503;
3. unverified primary tenant domain → 23514;
4. duplicate user/college membership → 23505;
5. whitespace-only user given name → 23514;
6. invalid zero academic terms → 23514;
7. reversed academic period dates → 23514;
8. nonpositive user identity version (`users_version_ck`) → 23514;
9. zero section capacity (`sections_capacity_ck`) → 23514;
10. section minimum size greater than capacity (`sections_min_size_ck`) → 23514;
11. course offering credits above the maximum (`db02_course_offerings_credits_ck`) → 23514;
12. nonpositive placement-company version (`placement_companies_version_ck`) → 23514.

`tests/integration/db18-registered-negative-witnesses.test.ts` contributes nine additional DB03/DB06 tests:

1. cross-college group membership;
2. group member role/type mismatch;
3. immutable group ownership/college;
4. elective slot/program college mismatch;
5. quiz lesson/delivery offering mismatch;
6. quiz attempt/quiz delivery mismatch;
7. quiz answer/question parent mismatch;
8. assignment grade above assignment max points;
9. missing group parent FK.

These are deliberately direct SQL so an API/service bypass cannot hide a database-boundary defect.

## Concurrency witnesses

### Source-protected / verified green in focused PG17 execution

- **P5-R04:** simultaneous elective choices under `max_pick=1` — existing `groups-db03.test.ts`.
- **P5-R05:** concurrent final quiz attempt under `max_attempts=1` — existing `courses-c4b-quizzes.test.ts`.
- **P5-R07:** concurrent cohort `PLANNED → ACTIVE` compare-and-set — `db18-concurrency-witnesses.test.ts`.
- **P5-R06:** concurrent project task submission critical section — `db18-concurrency-witnesses.test.ts`.

### Race defects and fix state

**P5-R01 — placement application stale access snapshot — FIXED, RUNTIME VERIFIED**

`tests/integration/db18-placement-race-gap.test.ts` creates an isolated tenant, learner, enrollment, paid Placements rule, eligibility decision and published job. It locks the access-rule and learner-membership rows, lets the fail-fast prechecks observe allowed state, then revokes paid module access while the submission waits. DB-054 now locks the live application gate inputs inside the application transaction, re-evaluates learner access/job eligibility after those locks, persists only that live result, serializes policy/override writers on the job row, and serializes academic-evidence writers on the membership row. The regression rejects and leaves zero applications in the passing disposable-PG17 witness run.

**P5-R02 — learner enrollment stale cohort state**

`tests/integration/db18-known-race-gaps.test.ts` blocks the enrollment insert after source prechecks, changes the cohort to `COMPLETED`, releases the insert, and requires the operation to reject. The source fix now re-reads and `FOR SHARE` locks the cohort within the enrollment transaction. The race test passed against isolated PostgreSQL 17; this is an executed fix-regression witness, not merely source inspection.

Both previously red regressions are green. Their successful execution does not settle unrelated race families.

## Runtime safety

The read-only Pass-5 runner requires `TEST_DATABASE_URL` and an explicit isolated-database flag. It never falls back to the normal application `DATABASE_URL`.

The newer DB-018 mutation/race tests require an explicit `TEST_DATABASE_URL` plus `DB018_ISOLATED_TEST_DATABASE=1` or `DB03_ISOLATED_TEST_DATABASE=1`; they do **not** fall back to the application `DATABASE_URL`. Service-backed P5-R01/P5-R02 additionally require `DATABASE_URL === TEST_DATABASE_URL`, ensuring Drizzle service calls and raw `pg` coordination target the same disposable database. Their mutations are either rollback-only or clean up isolated UUID fixtures. Any reset/provisioning must go through the DB-025 fail-closed test-database guard.

Recommended disposable-PostgreSQL execution once an environment is available:

```bash
DB018_ISOLATED_TEST_DATABASE=1 \
TEST_DATABASE_URL='postgresql://.../lms_vnext_test' \
DATABASE_URL='postgresql://.../lms_vnext_test' \
npx vitest run --config vitest.db.config.ts \
  tests/integration/db018-relational-and-boundary-witnesses.test.ts \
  tests/integration/db18-registered-negative-witnesses.test.ts \
  tests/integration/db18-concurrency-witnesses.test.ts \
  tests/integration/db18-known-race-gaps.test.ts \
  tests/integration/db18-placement-race-gap.test.ts
```

Both P5-R01 and P5-R02 passed on disposable PostgreSQL. Preserve those actual race witnesses on every subsequent registered DB-018 acceptance, without suppression or skips.

## Expanded CI gate (2026-10-30)

The dedicated `.github/workflows/db018-relational-witness-acceptance.yml` now invokes the registered direct DB03/DB06 negative suite, both DB18 concurrency tests, both fixed-race regressions (P5-R01/P5-R02), and the original DB03 elective and C4b quiz max-attempt two-session witnesses. These run against the workflow's isolated PostgreSQL 17 database with `TEST_DATABASE_URL` and `DATABASE_URL` pointing to the same disposable target.

**Execution is verified on exact commits:** the denominator is **21 observational probes + 21 direct negatives + 4 positive concurrency witnesses + 2 fixed-race regressions**. The results of the 21 joins (including populated fixtures) alone cannot certify prevention.

## DB-018 completion interpretation

DB-018 is **not** globally DONE, although its full registered witness matrix has passed. It must **not** become `DONE_VERIFIED` until independent global gates are accepted. Global DB-018 acceptance still depends on DB-001 independent verification, DB-014 tenant/FK sweep, DB-020 schema drift/phase-gate certification and outstanding source race-gap dispositions. The focused matrix established that:

- the registered migration journal is replayed on disposable PostgreSQL;
- all 21 read-only probes execute with non-vacuous fixture coverage and zero mismatch rows;
- the 21 direct negative mutations reject with their expected SQLSTATE;
- the 4 positive concurrency witnesses pass;
- P5-R01 and P5-R02 are fixed and their red tests turn green;
- execution evidence is recorded against exact commits.
