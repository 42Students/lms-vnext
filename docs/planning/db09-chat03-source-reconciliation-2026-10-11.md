# Chat 3 / DB-012 — DB09 source and candidate-schema reconciliation (2026-10-11)

**Global phase:** DATABASE. **Task:** DB-012 IN_PROGRESS. **Worker issue:** [#23](https://github.com/42Students/lms-vnext/issues/23).  
**Frozen legacy BE:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Frozen legacy FE:** `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`  
**Canonical ledger:** `docs/planning/db-pass4-columns-db09_tpo_and_recruiter_operations.json`  
**Source bases:** migrations V159/V161/V162/V165/V176/V177/V184/V185/V187/V190/V192 and V193's HR→recruiter rename chain; historical schema snapshot.  
**vNext comparison:** `src/db/schema/{tpo-crm,tpo-collaboration,tpo-policy,placements,activity,drive-day,profile-verification}.ts`; DB10 outbound draft is a **dependency**, not proof of registered replacement.

## Source review results (not proof of parity)

| Bucket | Fields | What the evidence means |
| --- | ---: | --- |
| Legacy V162 policy/visibility DDL reviewed directly | 14 | Explicit defaults, lifecycle/tenant/privacy probes exist |
| Additional same-name declaration candidates | 139 | A vNext column with same spelling exists in an inspected schema module |
| Additional explicit renamed-column candidates | 45 | A proposed renamed column exists; semantics, FK and types unverified |
| Remaining no-declared-column-equivalent identified | 81 | Candidate may be a redesign, missing state, owned by DB08/DB10, or an approved retirement *after evidence* |
| **Source candidates with review entries** | **279/279** | Neither a semantic map nor an implemented field count |
| **Semantically / PostgreSQL-verified** | **0/279** | No executed disposable PG replay, mapping, consumer or concurrency evidence |

All original `reviewStatus` fields remain `UNVERIFIED_FIELD_SEMANTICS`. The source review adds `sourceReview` notes without fabricating verification. The automated column comparison does **not** establish whether declarations exist in the *registered migration journal* or physical PostgreSQL; unknowns require service, SQL, privacy and role review.

### Major missing/relocated concept clusters

- **Round scheduling (25 fields):** `round_slot` 9, `round_assignment` 7 and `reschedule_request` 9 have no demonstrated dedicated vNext relational equivalents. Existing `placement_application_round_exceptions` is not proof of slot capacity, panel, confirmation, notification, and reschedule decision parity. [Candidate relational SQL](sql/db09-round-scheduling-candidate.sql) preserves these concepts with cross-job FKs; DB08 must confirm ownership before integration.
- **Drive/group sharing (5 fields):** `drive_group` pooled-drive/industry-company linkage and serialized shared form lack declared target columns. Verify grouped multi-college sharing and source grants; never infer company relationship equals drive group.
- **Preparation assignments (7 fields):** `prep_assignment` maps learner–course/assessment deadline and assigner, which a generic notification does not replace. Coordinate assessment and preparation modules.
- **TPO bell read receipts (4 fields):** legacy V184 independently records per-reader acknowledgements; simple `in_app_notifications.read_at` applies to a notification's target user only. Prove actor-specific read semantics and historical common-team `tpo_bell.read_at` fallback.
- **Recruiter/college configuration (4 unmatched fields):** `job_types_json`, `outcome_labels_json`, `recruiter_access_months`, `recruiter_drive_needs_approval`. These are active product/authorization policy concepts unless current behavior proves retirement. Missing from the inspected `placement_tpo_college_settings` declaration.
- **Company and industry-company attributes (15 unmatched fields across two legacy types):** distinguish canonical company, college-scoped relationship and recruiter pipeline identity. Record disposition for notes, contact person, industry, delete/dedupe active history, actor-type provenance and per-company export columns; do not merge by similar names.
- **Notification outbox (8 unmatched) and email suppression (renamed hashed target):** DB10 owns durable delivery, consent, suppression, undo grouping and retries. A `outbound_messages` draft is **not** proof that `notification_outbox` semantics are live or that `email_norm`→`recipient_hash` has a working canonicalization/encryption design.
- **Audit/private note/read models:** legacy TPO audit actor type/ID, note visibility, bell college ID, employer private comments and share-export events need full tenant-scoped consumers even where table names match. Internal student requests and job-round status remain DB08-owned.

### Concrete defect repaired in the vNext DB09 source

The exported `src/db/schema/tpo-crm.ts` was structurally broken: seven table declarations instead of three, duplicated activity/followup blocks and unterminated template/SQL expressions for phone and invite-token checks. A narrow CAS-reserved correction at commit [62c5f1c](https://github.com/42Students/lms-vnext/commit/62c5f1ccc545200dd1b60c66e8250d1ce033a671) restores exactly one lead, activity and followup declaration and full SQL check predicates. The existing DB09 static test suite now includes a TypeScript AST parse/duplicate declaration regression test (authored **not executed** in this session). Do not count a file-level repair as PostgreSQL schema validation.

### Tenant and scheduling hardening staged, not integrated

- [CRM same-college FK candidate](sql/db09-crm-tenant-fk-candidate.sql): prevent lead company/owner and followup owner from belonging to a different college despite valid standalone UUIDs. Current company-relationship and membership parents require composite unique constraints before composite FKs.
- [Round-slot/assignment/reschedule candidate](sql/db09-round-scheduling-candidate.sql): preserve same-job round/application/slot provenance, positive capacity, time bounds, row version, and review decisions. A SQL CHECK cannot alone prevent overbooked capacity; use transactional slot locks plus exact concurrency tests.
- Prior [college rules/visibility review](db09-chat03-v162-policy-privacy-audit.md): source defaults match the declaration; recruiter projection, share/export boundaries and actual policy consumers not yet tested. A privacy checkbox alone is not a tested access rule.

### Do not advance until these real gates pass

1. Freeze current legacy Flyway chain and exact vNext main head; review source producer, consumer, same-college relationships, status history and privacy audience for all 279 fields, including 81 gaps.
2. Migration owner Chat 1 registers the necessary Drizzle schema/migrations, replays in disposable PostgreSQL, checks constraints and validates DB09 static/test runner outcome. No other worker changes numbered journal.
3. Execute wrong-college FK, reviewer/grant revocation, recruiter notes visibility, share-link expiry, messaging history, lead invitation dedupe/race, slot overcapacity and reschedule CAS negative tests.
4. Prove DB08-owned job-round/student-request and DB10-owned notification delivery/suppression semantics by test evidence, not by draft table definitions.
5. Mark each source field as `DB_TESTED`/`WORKFLOW_VERIFIED` only with executed evidence and independent review. Unknown historical fields cannot be retired implicitly.

**Current task status: IN_PROGRESS.** Source review 279/279; no formal completed/verified DB09 field claims; no production or disposable database writes in this authoring batch.
