# LMS vNext — Database-first parity master plan

**Initiated:** 2026-10-09  
**Work branch:** `db-parity-2026` (branched from `42Students/lms-vnext@5ca60b0f39a25c7b8dc1d0e26f4bbdfe8e5ec15a`)  
**Legacy backend oracle:** `42Students/lms@prod-2026` observed at `21bad59d4dfaf2fa11fdeaf9353327ce105697d5` (2026-10-07)  
**Frontend reference:** `42Students/lms2-fe@prod-2026` for producer/consumer behavior  
**State:** INVENTORY STARTED — DO NOT CLAIM DB PARITY  
**Machine-readable baseline:** `docs/planning/database-parity-source-inventory.json`

## Decision and non-negotiable intent

Change implementation order: **database/domain completeness first; then services and workflows; then UI clone parity.** A beautiful/functional-looking page must not stand in for missing persisted concepts.

"Exactly match the schema" is interpreted as **100% coverage of active legacy data concepts, fields needed for product behavior, relationships, constraints, state machines and observable user outcomes**. The physical schema does not need the same SQL, naming or number of tables. Keep documented improvements (canonical user+membership, UUID keys, normalized data, PostgreSQL checks/FKs, safe enum representation, isolated tenants). Each changed/combined/retired legacy concept MUST have an explicit mapping and proof. No silently dropped concept.

vNext is greenfield: **no historical record migration**. Do not rebuild legacy extractors/backfills, connect to the legacy production DB, or copy sensitive data. Read legacy SQL and code as specifications. Prototype and validate against disposable Postgres.

## Initial source census (NOT parity claims)

| Evidence | Count | Interpretation |
| --- | ---: | --- |
| Legacy `model/*.java` and `model/{groups,electives,tpo}/*.java` | 118 files | Candidate model/type files, **not** 118 actual tables; includes non-entity and superclass types |
| Legacy `src/main/resources/db/migration` | 167 SQL files | Versioned changes, **not** 167 tables; inspect DROP/RENAME/ALTER and initial schema too |
| vNext `drizzle/meta/0036_snapshot.json` | 84 tables | Committed PostgreSQL Drizzle schema **snapshot**, not proof of live DB |
| vNext PostgreSQL enum definitions in the snapshot | 27 | Source-side enums |
| vNext committed `drizzle/0000` through `0036` | 37 migrations | Migration files present, **not** proof they apply successfully |

Source scope is incomplete until scanning **all** legacy models/entities outside the obvious model directories, the whole historic Flyway chain, Hibernate mappings and the actual live legacy schema if read-only introspection is explicitly authorized. Until then, missing-table detection is provisional. The source-inventory JSON records the currently enumerated files and snapshot tables with no fabricated mappings.

## Evidence hierarchy / how to audit a domain

1. **Source of truth for current legacy DB:** preferably a read-only `information_schema` dump from the actual legacy schema, with secrets/data omitted; otherwise reconstruct using baseline DDL + every Flyway migration in order, including dropped/renamed objects.
2. Legacy `@Entity`, embedded/value objects, converters, enum mappings, repositories, specifications and service writes validate the intended meaning, not merely physical DDL.
3. Read the connected UI/API workflows to identify missing persistence not obvious from a table list.
4. Extract vNext schema from **latest Drizzle snapshot + TypeScript schema**, inspect migrations and service reads/writes.
5. Map **every active legacy concept/field** to vNext table.column, constrained JSONB path, calculated value, external managed service, or **explicit reviewed retirement**. Do not count an implied UI component as persistence.
6. Verify database constraints on real disposable PostgreSQL, negative tenant/role and concurrent-write tests, and prove producers/consumers can read/write the full life cycle.
7. Re-diff both legacy and vNext heads before marking a domain `VERIFIED`. Store frozen SHAs and run evidence.

### Required row-level field mapping

Each active field receives: `legacy table.column (or Java persistent field)`, `semantic definition`, `vNext table.column / JSON path / calculated source`, `type + range/precision/timezone`, `nullable`, `default`, `uniqueness/index`, `FK + deletion behavior`, `tenant ownership`, `read/write producer`, `audit/state/history`, `status`, `test evidence`.

Required statuses: `UNMAPPED` -> `MAPPED` -> `IMPLEMENTED` -> `DB_TESTED` -> `WORKFLOW_VERIFIED`; or `REDESIGNED`/`RETIRED` with explicit sign-off. `BLOCKED` denotes infrastructure and is never treated as success.

### What **cannot** be assumed

- Similar table names mean semantic equivalence.
- JSONB absorbs missing relational constraints without proof.
- A migration existing means the live database has the expected structure.
- Soft delete is interchangeable with hard delete.
- A history table can be removed because the current UI only shows status.
- A service test mocks a real FK, race condition or isolation boundary.
- Migration count, table count or model-class count measures completion.
- Auth/Storage/Cloud configuration is ready merely because TypeScript compiled.
- Current legacy `prod-2026` remained unchanged after the pinned SHA.

## Phase execution queue — schema/domain-first

Each numbered domain must produce: (a) exhaustive legacy inventory, (b) explicit field/relationship/state crosswalk, (c) decisions log, (d) vNext schema+migrations if needed, (e) real PostgreSQL constraints/migration test evidence, (f) API/workflow producer-consumer coverage and (g) updated status, all in the same implementing commit.

| ID | Domain to reconcile | Minimum scope, including easily missed tables | Status |
| --- | --- | --- | --- |
| DB00 | Physical inventory and tooling | Legacy baseline/full Flyway DDL, non-model tables, JPA entities/converters, DB constraints/indexes/views/triggers; vNext snapshot and live-vs-committed drift | **IN_PROGRESS — source census only** |
| DB01 | Tenant/identity/security | Organization, college, branding, domains, user, learner/faculty/recruiter membership, roles, suspensions, sessions, account switching, policy decisions | NOT_AUDITED |
| DB02 | Academic structure | Departments, programs/structures, semesters, batches/cohorts, classes/sections, enrollments, faculty assignments, lecture halls, timetable, promotion, historical records | NOT_AUDITED |
| DB03 | Groups and electives | Group kernel, rules, members, waitlists, events/undo/lock/capacity, elective slots and offerings, group-backed class roster | **GAP SUSPECTED — dedicated vNext tables absent** |
| DB04 | Profiles and verification | Learner/faculty attributes, contact/address/education/skills/coding profiles, files, verified snapshots, submit/sent-back/reverify history and permissions | **GAP SUSPECTED — verification history absent** |
| DB05 | Courses/content/discussions | Course catalog, offerings, mappings, lessons, items, class targeting, assets, ordered content, progress, announcement/discussion lifecycle | NOT_AUDITED |
| DB06 | Assessments/attendance | Quiz/question/option/attempt/answer; assignment/submission/upload receipt/grades; schedule/session/attendance correction, publication, audit/history | NOT_AUDITED |
| DB07 | Projects | Templates, versions, assignments, teams/groups, workspaces, releases, sprints, tasks, submissions, resources, meetings, readiness, delivery, audit/event history | NOT_AUDITED |
| DB08 | Placement eligibility/outcomes | Eligibility scopes and action undo, placement batches, registration, debarment, academic evidence/grades, rules, job type, offer/acceptance, joining/outside placements | **GAP SUSPECTED — batch + eligibility-event structures** |
| DB09 | TPO/HR operational workflows | Companies, recruiters/grants, leads, follow-ups, settings, drive proposals, shared drives, share links, rounds/slots/panels, messages, requests, notifications | **GAP SUSPECTED — multiple dedicated legacy workflows** |
| DB10 | Platform/shared/operations | Notifications/outbox/delivery, global/admin audit, SMS, app settings, upload metadata, bug tracker, alerts, saved views, retention/consent | NOT_AUDITED |
| DB11 | DB correctness, performance and security | Cross-tenant negative tests, FK/cascade, partial uniques, null/defaults, check constraints, concurrency, timezones, lock ordering, indexes/query plans, read/write smoke, migration replay | BLOCKED UNTIL DOMAIN SCHEMAS ARE COMPLETE |
| DB12 | Final reconciliation freeze | Re-extract fresh legacy schema, repeat mappings, zero unmapped active fields, zero invalid retirements, all smoke/test evidence, zero source-to-live drift | BLOCKED |

## Source-confirmed focus points — verify before implementation

These are **not** an exhaustive gap list; they are findings from initial migration/source comparison.

1. **Groups / electives:** legacy migrations `V166__groups_kernel.sql`, `V167__electives.sql`, `V168__electives_offering_unique.sql` and `V191__project_workspace_team_group.sql` establish group membership, event history, rules, electives and project team/group linkage. The vNext 84-table snapshot contains no `lms_group*` or `elective_*` tables. Determine whether equivalence exists in different persisted structures; if not, design this foundation before dependent pages.
2. **Profile verification:** legacy `V187__profile_verification.sql` creates `profile_verification` and `profile_verification_event` for Education/Identity submitted/verified/sent-back/update-pending states. vNext snapshot has `learner_profiles.profile_document` but no obvious verification/history tables. Confirm against services before designing.
3. **Placement eligibility history and batches:** legacy `V188__placement_batches_and_eligibility.sql` creates `placement_eligibility`, `placement_eligibility_event` (bulk action/undo), `placement_batch` (batch registration lifecycle). vNext has `placement_eligibility_decisions` but no clearly matching eligibility-event or batch-lifecycle table.
4. **TPO ops:** legacy `V161__tpo_v1_drives.sql`, `V162__tpo_v1_settings.sql` and `V165__tpo_v1_complete.sql` add company rules/visibility, leads, follow-ups, messages, sharing, slot assignment, team, settings, saved views, audit and bells. vNext has many placement tables but no one-to-one persisted equivalents for every workflow yet. Audit field-by-field; do not infer all are missing.
5. **Academic grade evidence:** legacy `V192__academic_marks_as_earned.sql` stores marks in native scale plus derived comparable percentage and college-specific CGPA conversion policy. Check whether vNext's `placement_candidate_academic_evidence` fully models the scale, grade, provenance, conversion and verification.
6. **Operational tooling:** legacy `V151__bug_tracker_phase1.sql` and subsequent migrations add tracker state and evidence. Explicitly classify whether this is a required product/ops feature, a redesigned external system or a documented retirement; don't silently omit.

## Design decision rules

- Keep PostgreSQL and Drizzle; **do not** replicate legacy MySQL AUTO_INCREMENT/int IDs, MySQL column types or Java/Hibernate structure merely for naming parity.
- Prefer typed normalized tables when the data is queried, independently edited, filtered, authorized, audited or relational. A constrained JSONB document is acceptable for true snapshot/config values when schema versioning, validation and query needs are addressed.
- Status history, reversibility, original actor, timestamps and privacy policy must be preserved when required by user workflows, even if the legacy DB enforces them weakly.
- Add strong FKs/indexes/checks, scoped uniqueness, immutable event history and optimistic concurrency where necessary; record deviations.
- No orphan cross-tenant references: test mismatched college/membership/object combinations including forged IDs, in addition to happy paths.
- Decide precision/timezone explicitly for marks, CGPA, salaries, percentages, academic periods, meeting slots and all deadlines.
- Avoid `legacy_id_map` as a product dependency (fresh installation; no data migration).
- Tests that have only been written but have not run are not green. GitHub Actions has recently failed before job steps, so obtain independent execution evidence.

## Completion / release gates

**Database parity is not DONE until:**

- [ ] every active legacy **table and persisted field** is accounted for (or approved REDESIGNED/RETIRED with a reason);
- [ ] every relation, status/enum, default, nullable rule, historical record, index and required trigger/side effect is mapped;
- [ ] each owned domain's new migrations are immutable, replayable from empty Postgres and match current schema declarations;
- [ ] field-level and domain workflow tests prove equivalent data behavior, including negative authorization and concurrent writes;
- [ ] a fresh legacy head is reviewed and old-to-new drift rechecked;
- [ ] the actual vNext database is introspected and matches committed Drizzle state;
- [ ] critical queries have indexes and acceptable EXPLAIN plans on production-like datasets;
- [ ] schema owner records `VERIFIED` with exact SHAs, command results and evidence;
- [ ] there are **zero** `UNMAPPED`, `NOT_AUDITED`, unapproved `REDESIGNED/RETIRED`, or `BLOCKED` mandatory rows.

### Practical execution

1. Stop broad UI parity expansion while DB00–DB10 are inventoried (urgent production bugfixes and already independent work excepted).
2. Run domains in coherent batches, recording the field-level mapping before touching migrations.
3. After a domain is schema-verified, that domain can return to service and UI parity. Different chats may own different DB domains, but never modify the same schema/migration simultaneously; rebase/review HEAD before each batch.
4. Use disposable local PostgreSQL: `npm run db:test:prepare`, `npm run test:db`, `npm run db:generate`/snapshot verification, lint, typecheck and build. No user data copied.
5. Finish the DB release gate before claiming the vNext app can replace the original product.

## Next executable tasks

- [ ] DB00.1 classify all 118 Java model/type files as active JPA entity, embedded/value object, enum/DTO/helper, or retired; discover entities outside these packages.
- [ ] DB00.2 enumerate legacy baseline schema and **all** 167 Flyway migrations in chronological applied order (not filename lexical order); produce live logical tables/columns/FKs/indexes/checks after DROP/RENAME.
- [x] DB00.3 capture the 84 vNext snapshot tables and available column/index/FK evidence in machine-readable source inventory.
- [ ] DB00.4 write a deterministic comparison script and domain-level explicit field crosswalk; avoid fuzzy name-only closure.
- [ ] DB00.5 verify deployed vNext schema by running committed migrations on disposable PostgreSQL and diffing `information_schema` against snapshot; do not claim this has been run yet.
- [ ] DB03.1 open complete group/elective legacy entities and UI behavior; establish relational parity contract.
- [ ] DB04.1 open profile-verification state machine, submit/review/rollback rules, identity privacy/storage producer contracts.
- [ ] DB08.1 map placement batch, eligibility inheritance, override and undo audit workflow.
- [ ] DB09.1 decompose TPO settings/CRM/messaging/round scheduling fields and access into separate ledger rows.

### Handoff for future chats

Read this file, `AGENTS.md`, `docs/database-workflow.md`, `docs/planning/database-parity-source-inventory.json`; refresh all branch SHAs; continue the first unresolved DB00 action, then DB01–DB12. Update audit evidence *with* corresponding implementation commits. Never mark complete based on a table name match, existing UI or an unexecuted test.
