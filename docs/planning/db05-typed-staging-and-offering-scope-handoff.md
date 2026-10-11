# DB-008 W06 → W01 migration integration handoff: typed lesson content + offering/delivery scope

**Phase:** DATABASE (global) · **Task:** DB-008 IN_PROGRESS · **Scope:** source-backed staging only.  
**Integrator:** Chat 1 alone may edit the numbered Drizzle migration journal and shared `src/db/schema/index.ts`.  
**Legacy backend oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`.  
**Greenfield:** no legacy learner database import, but historical capabilities and tenant invariants require explicit treatment.

## New typed schema artifacts (NOT runtime-enabled)

| Staged Drizzle file | SQL draft | SQL fields | Critical invariants |
|---|---|---:|---|
| `src/db/schema/db05-lesson-discussions.staged.ts` | `scripts/sql/db05-lesson-content-discussions.draft.sql` | 17 | Distinct lesson-content vs classroom messages; self-referential `(parent_discussion_id, lesson_content_id)` FK and `(id, lesson_content_id)` unique; author/college/lesson FK; deleted history |
| `src/db/schema/db05-lesson-settings.staged.ts` | `scripts/sql/db05-lesson-content-settings.draft.sql` | 14 | One row per lesson content; original three schedule/discussion boolean flags, HTML/text, raw legacy due-date, calendar event/timezone, thumbnail, optimistic bigint version |

The Drizzle files are *not* exported from `src/db/schema/index.ts`, and no production API imports them. `bigint` for the settings version uses `mode: "bigint"` rather than lossy JS `number`. A version field **alone** never implements compare-and-swap or audit history. Both tables are still unregistered in PostgreSQL.

**Lesson discussions require the strengthened** `scripts/sql/db05-lesson-discussions-same-college.draft.sql` replacement tenant trigger **once**. The original isolated SQL checks fewer scope edges and cannot be treated as complete. Neither proposal automatically enforces a parent-reply DAG beyond self-replies, historical extension producer semantics or object attachment privacy.

## New source-backed offering/delivery hardening companion

`scripts/sql/db05-offering-delivery-scope.draft.sql` is a **non-numbered companion**, not an eighth independent DB05 migration and not a second base DDL table.

It adds two proposed `BEFORE INSERT OR UPDATE` guards:

1. **`course_offerings`** — course department college, cohort program department college, offering academic period college and cohort start/end period colleges must agree; the offering period must fall within the cohort's authored start/end date range. This mirrors the current `src/modules/courses/offering-service.ts#validateOfferingStructure` pre-insert source checks, but enforces them against direct privileged/seed SQL.
2. **`course_section_deliveries`** — offering's cohort ID and academic period ID must exactly match the section's IDs; course/period/section-program college IDs also agree. Same college but different cohort or term is **not valid**. This mirrors `src/modules/courses/delivery-service.ts#createCourseSectionDelivery`.

Both guards request the shared DB05 child/order advisory key `605008003` and refuse unproven non-READ-COMMITTED writes (`25001`). Neither guard executes now. No FK/trigger can stop **later ancestor reparenting** unless the ancestor itself is guarded. Separate DB02 work may already own related course/cohort/period invariants; W01 must merge once and reject duplicated names or conflicting advisory locks.

### Critical failure/race acceptance (NOT EXECUTED)

| Test | Expected | Integration owner |
|---|---|---|
| Same college course, program, cohort and offering term | ACCEPT | W01 + DB02 |
| Course department college != cohort program department college | REJECT 23514 | W01 + DB02 |
| Cohort start academic period belongs to another college | REJECT 23514 | W01 + DB02 |
| Cohort optional expected end period belongs to another college | REJECT 23514 | W01 + DB02 |
| Offering period starts before cohort start | REJECT 23514 | W01 |
| Offering period ends after expected cohort end | REJECT 23514 | W01 |
| No expected end period | ACCEPT if lower bound & tenant match | W01 |
| Same college and term but wrong section cohort | REJECT 23514 | W01 |
| Same college/cohort but wrong section academic period | REJECT 23514 | W01 |
| Section academic period belongs to another college | REJECT 23514 | W01 |
| Section program department belongs to another college | REJECT 23514 | W01 + DB02 |
| Wrong direct course/period/cohort/section UPDATE | REJECT 23514 | W01 |
| Direct UPDATE courses.department_id after offering established | No descendant scope corruption | W01 + DB02 |
| Direct UPDATE programs.department_id / cohorts.program_id | No descendant scope corruption | W01 + DB02 |
| Direct UPDATE academic_periods.college_id or date bounds | No descendant scope corruption | W01 + DB02 |
| Direct UPDATE sections.cohort_id or academic_period_id | No descendant scope corruption | W01 + DB02 |
| Two-session offering INSERT vs course/cohort/period reparent | Both cannot commit an invalid cross-college state | W01 + DB02 |
| Two-session delivery INSERT vs section/cohort/period reparent | Both cannot commit an invalid section/offering state | W01 + DB02 |
| Cross-domain advisory lock ordering between `605008001` parent graph and `605008003` course delivery/order | Deadlock/retry policy demonstrated on PostgreSQL | W01 + DB02 |
| Status policy for closed period/inactive cohort, and historical archive behavior | Explicit product decision and negative tests; SQL currently enforces only structural scope | API handoff |

No exact database run or PostgreSQL SQLSTATE output is claimed here.

## Read-only seeded-row preflight (NOT EXECUTED)

Run `scripts/sql/db05-offering-delivery-preflight.readonly.sql` in a **read-only transaction on disposable PostgreSQL** before registering/enabling the new offering/delivery row-write triggers. It returns aggregate counts of existing cross-college offering mismatches, cohort start/end date violations, same-college wrong delivery cohort/term and delivery college mismatch. It returns **no personal identifiers**.

```bash
# Only on disposable PostgreSQL, with the baseline journal + seed installed
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -c 'BEGIN TRANSACTION READ ONLY' \
  -f scripts/sql/db05-offering-delivery-preflight.readonly.sql \
  -c 'COMMIT'
```

If any mismatch count is nonzero, W01 should inspect the seeded data and rectify source/validation coherently. Installing a trigger does NOT repair historical bad rows, and a zero row-count is NOT proof of race safety or a passing two-session negative suite. The source preflight and its Node regression guards are **authored, not executed** in this GitHub-connected environment.

**Separately executed source reference model:** `tests/db05-offering-delivery-reference.test.mjs` was executed on Node 22.16.0 with **19/19 PASS**, exact local/git blob `c73011e74df7dfd738c69445cf0ce88e11e4c6ac`. Execution log `docs/coordination/evidence/chat-06-db008-offering-delivery-reference-node-2026-10-11.md`. This proves only the pure modeled acceptance rules, not SQL triggers or actual API behavior.

## How W01 can validate *after* migration integration

The read-only opt-in checker `scripts/db05-staged-schema-db-audit.mjs` introspects 2 lesson-content tables, column types/presence, composite FK, indexes, constraints, and the strengthened live discussion tenant function. It refuses missing explicit nonproduction opt-in:

```bash
DB05_DISPOSABLE_DATABASE_URL='postgresql://.../lms_vnext_test' \
DB05_ALLOW_READONLY_PROBE=YES_ON_NONPROD \
node scripts/db05-staged-schema-db-audit.mjs --json
```

This **does not mutate any data**; `BEGIN ... READ ONLY` plus rollback/finalization. It cannot prove initial migration replay, wrong-college insert blocking or actual concurrency behavior. Do not treat its PASS as a substitute for the 61 global DB05 manifest acceptance gates (count may change under parallel workers). The repository's comprehensive CI-independent verifier remains `npm run db:verify:independent` once a disposable PostgreSQL provider is available.

## Merge discipline and current blockers

- First register/seed base `course_offerings`, `course_section_deliveries`, `lesson_contents`, `college_memberships`, `users`, `academic_periods`, `cohorts`, `programs`, `departments`, then staged table and guard DDL in W01-approved journal order.
- Integrate only a **single** canonical discussion table, one strengthened tenant function, one trigger, and one typed settings table; avoid duplicate `CREATE TRIGGER`, independent migrations for companion guards, or incorrect exports before services are ready.
- Align authenticated API writers/readers, especially `lesson_content_settings.version` bigint compare-and-swap, discussion author server snapshots and resolver role, private attachments and all resource receipt scopes.
- Reject retroactive wrong-college ancestor reparenting before enabling API writes; child-write triggers alone are not enough. Explicit 2-connection PostgreSQL tests must witness lock scheduling and commit order.
- Preserve ongoing other-chat edits to the queue/checkpoint. Do not mark DB-008 COMPLETED or phase DONE_VERIFIED based on source assertions.

**Actual verification as of handoff:** connected GitHub source assertions for these artifacts passed; **Node suite for these new tests not executed, TypeScript typecheck not executed, PostgreSQL not executed, CI intentionally unused (billing)**. The separately recorded 8/8 executed pure progress reference tests remain valid only for that self-contained source model.
