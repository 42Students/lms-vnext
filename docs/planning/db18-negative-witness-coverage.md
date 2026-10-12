# DB-018 negative PostgreSQL witness coverage

**Phase:** DATABASE  
**Task:** DB-018 — Negative DB integration witness suite  
**State:** implementation authored; runtime acceptance NOT RUN  
**Rule:** CI availability is not a blocker, but authored tests are not passing evidence.

## Current authored denominator

| Family | Authored | Runtime passed | Meaning |
| --- | ---: | ---: | --- |
| Read-only relational mismatch probes | 21 | 0 | Existing-row observation only; zero mismatches do not prove prevention |
| Direct negative SQL boundary tests | 13 | 0 | Real FK/check/trigger/unique violations against registered schema |
| Positive concurrency witnesses | 4 | 0 | Races whose current source has a locking/CAS strategy |
| Known-defect red concurrency witnesses | 0 | 0 | No currently known race is still source-unfixed |\n| Fix-authored race regression pending runtime | 2 | 0 | P5-R01 placement and P5-R02 academics fixes are authored; PostgreSQL execution still required |
| Draft/unregistered race families excluded | 3 | 0 | Lease, outbound and log-alert candidates are not registered runtime schema |

Machine-readable denominator: `tests/integration/db18-witness-index.json`.

## Direct registered-schema negatives

`tests/integration/db018-relational-and-boundary-witnesses.test.ts` contributes four foundational identity/tenant tests:

1. missing user FK on `college_memberships` → 23503;
2. missing membership FK on `membership_roles` → 23503;
3. unverified primary tenant domain → 23514;
4. duplicate user/college membership → 23505.

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

### Source-protected / expected green after execution

- **P5-R04:** simultaneous elective choices under `max_pick=1` — existing `groups-db03.test.ts`.
- **P5-R05:** concurrent final quiz attempt under `max_attempts=1` — existing `courses-c4b-quizzes.test.ts`.
- **P5-R07:** concurrent cohort `PLANNED → ACTIVE` compare-and-set — `db18-concurrency-witnesses.test.ts`.
- **P5-R06:** concurrent project task submission critical section — `db18-concurrency-witnesses.test.ts`.

### Race defects and fix state

**P5-R01 — placement application stale access snapshot — FIX AUTHORED, RUNTIME PENDING**

`tests/integration/db18-placement-race-gap.test.ts` creates an isolated tenant, learner, enrollment, paid Placements rule, eligibility decision and published job. It locks the access-rule and learner-membership rows, lets the fail-fast prechecks observe allowed state, then revokes paid module access while the submission waits. DB-054 now locks the live application gate inputs inside the application transaction, re-evaluates learner access/job eligibility after those locks, persists only that live result, serializes policy/override writers on the job row, and serializes academic-evidence writers on the membership row. The regression must reject and leave zero applications. It is authored but not runtime-verified.

**P5-R02 — learner enrollment stale cohort state**

`tests/integration/db18-known-race-gaps.test.ts` blocks the enrollment insert after source prechecks, changes the cohort to `COMPLETED`, releases the insert, and requires the operation to reject. Current source checks cohort mutability before its transaction and does not re-read/lock the cohort inside the insert transaction, so this is intentionally red until fixed.

These red tests are evidence of known defects, not failed infrastructure.

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

Both P5-R01 and P5-R02 fixes are authored. Their race tests must now execute green on disposable PostgreSQL before either is counted runtime-passed; they must not be suppressed or skipped.

## DB-018 completion interpretation

DB-018 may be marked **COMPLETED (implementation authored, unverified)** once this coverage/index is committed. It must **not** become `DONE_VERIFIED` until:

- the registered migration journal is replayed on disposable PostgreSQL;
- all 21 read-only probes execute with non-vacuous fixture coverage and zero mismatch rows;
- the 13 direct negative mutations reject with their expected SQLSTATE;
- the 4 positive concurrency witnesses pass;
- P5-R01 and P5-R02 are fixed and their red tests turn green;
- execution evidence is recorded against exact commits.
