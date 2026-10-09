# DB09 — TPO & Recruiter Operations: isolated parity contract and execution queue

**Owner/branch:** parallel DB09 chat · `db09-tpo-recruiter-2026` · claim issue [#6](https://github.com/42Students/lms-vnext/issues/6).  
**Initial upstream:** `db-parity-2026@c489b2569dd2d2742da2ee17ed313a26853dc4da`.  
**Frozen source evidence for this pass:** `42Students/lms@prod-2026 21bad59d4dfaf2fa11fdeaf9353327ce105697d5`; `42Students/lms2-fe@prod-2026 e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`; `lms-vnext/main@5ca60b0f39a25c7b8dc1d0e26f4bbdfe8e5ec15a`.  
**Snapshot status:** source evidence only; **NO live schema inspection, PostgreSQL execution or proven semantic parity**. Refresh these SHAs when the oracles move.

## Objective and separation

Preserve each currently active TPO/recruiter data concept, permission, lifecycle and producer→consumer action. Old MySQL table names are not prescribed. Canonical vNext design remains modular-monolith TypeScript + PostgreSQL/Drizzle, UUID identities and tenant authorization. There is **no legacy data migration** because vNext is greenfield.

This branch owns **DB09, not DB03/DB04**. The DB03 chat owns group/elective kernel, enrollment and group-backed course/timetable consumers, and project team mirroring; the DB04 chat owns private profile verification/academic marks. DB08 application/eligibility/offer outcomes is a cross-domain dependency: record DB09 scheduling, messaging, settings and recruiter visibility expectations here, but don't alter DB08's core status transitions on this branch without an explicit conflict-free handoff. Do not edit shared `drizzle/meta/*`, `drizzle/*.sql`, or `src/db/schema/placements.ts` concurrently with other database implementers. Stage new DB09-specific modules and negative tests first; serialize schema/journal integration later.

## Source artifacts inspected

- `docs/planning/db-pass4-columns-db09_tpo_and_recruiter_operations.json` at `db-parity-2026`: **31 table candidates, 279 field candidates, 22 same-name field candidates**, all preliminary; matching names are **not** confirmed mappings.
- Legacy migrations `V161__tpo_v1_drives.sql`, `V162__tpo_v1_settings.sql`, `V165__tpo_v1_complete.sql`, `V185__tpo_recruiter_settings.sql`, `V193__recruiter_naming.sql`; also trace `V159`, `V169`, `V170`, `V171`, `V176`–`V179`, `V183`–`V184`, `V194` before verified closure.
- vNext `src/db/schema/placements.ts` plus current `src/modules/placements/{company-service,recruiter-service,recruiter-workspace-service,tpo-operations-service,drive-day-service}.ts`. Existence of services/DDL does not establish full parity.
- Legacy UI coverage contracts: `docs/parity/tpo.md` and `docs/parity/hr.md`. Source-driven expectations should be checked against the actual legacy frontend routes/components at the pinned FE SHA.

## Provisional source table inventory and queue

**Interpretation:** “candidate” means an automated source-name suggestion, *not* a proven semantic mapping; “No same-name candidate” means *not yet traced*, not necessarily a missing vNext capability. All 31 remain UNVERIFIED until every field, relationship, lifecycle and consumer has direct evidence.

| # | Legacy source table | Field candidates | Possible vNext target (unverified) | Required user capability / invariant to trace | Status |
|---:|---|---:|---|---|---|
| 01 | `college_placement_rules` | 7 | No same-name candidate | Placement count threshold, held-offer cap, uplift, response SLA; optimistic version | UNVERIFIED |
| 02 | `college_what_companies_see` | 7 | No same-name candidate | Default recruiter-facing academic/profile disclosures | UNVERIFIED |
| 03 | `company` | 17 | `placement_companies` | Global company identity; align duplicate prevention and college relationship | UNVERIFIED |
| 04 | `drive_group` | 5 | No same-name candidate | Pooled/multi-college drive grouping and owner scope | UNVERIFIED |
| 05 | `email_suppression` | 3 | No same-name candidate | Opt-out, bounce/delivery suppression per recipient | UNVERIFIED |
| 06 | `follow_up` | 7 | No same-name candidate | Lead follow-up reminders, ownership and due dates | UNVERIFIED |
| 07 | `industry_company` | 12 | No same-name candidate | Company CRM enrichment, company-specific exports | UNVERIFIED |
| 08 | `job_round` | 18 | `placement_job_rounds` | Round definition ownership, order and recruiter/TPO attribution; DB08 dependency | UNVERIFIED |
| 09 | `notification_outbox` | 13 | No same-name candidate | Durable notification delivery, retries, dedupe and recipient privacy | UNVERIFIED |
| 10 | `prep_assignment` | 7 | No same-name candidate | Candidate preparation tasks and deadlines | UNVERIFIED |
| 11 | `recruiter_applicant_note` | 9 | No same-name candidate | Recruiter-private applicant notes; learner visibility prohibition | UNVERIFIED |
| 12 | `recruiter_lead` | 23 | No same-name candidate | Prospecting pipeline and recruiter invitation lifecycle | UNVERIFIED |
| 13 | `recruiter_lead_activity` | 8 | No same-name candidate | Append-only CRM changes/activity | UNVERIFIED |
| 14 | `recruiter_notification_read` | 3 | No same-name candidate | Recruiter-scoped notification acknowledgement | UNVERIFIED |
| 15 | `reschedule_request` | 9 | No same-name candidate | Interview reschedule state/approval and audit; DB08 round boundary | UNVERIFIED |
| 16 | `round_assignment` | 7 | No same-name candidate | Interviewer/round assignment; cross-college guard | UNVERIFIED |
| 17 | `round_slot` | 9 | No same-name candidate | Capacity/bookings and concurrent slot scheduling | UNVERIFIED |
| 18 | `student_request` | 13 | `placement_learner_requests` | Learner-to-TPO request intake; DB08 requests boundary | UNVERIFIED |
| 19 | `tpo_audit_log` | 9 | No same-name candidate | Actor/tenant audit and immutable change trail | UNVERIFIED |
| 20 | `tpo_bell` | 8 | No same-name candidate | In-app TPO notifications | UNVERIFIED |
| 21 | `tpo_bell_read` | 4 | No same-name candidate | Per-user TPO read receipts | UNVERIFIED |
| 22 | `tpo_college_settings` | 19 | No same-name candidate | Per-college TPO branding/workflow defaults and recruiter policies | UNVERIFIED |
| 23 | `tpo_coordinator_assignment` | 7 | No same-name candidate | Scoped faculty/coordinator delegation | UNVERIFIED |
| 24 | `tpo_message` | 7 | No same-name candidate | Message body, authorship, visibility, timestamps | UNVERIFIED |
| 25 | `tpo_message_thread` | 6 | No same-name candidate | TPO-recruiter conversation scoping | UNVERIFIED |
| 26 | `tpo_saved_view` | 7 | No same-name candidate | User-scoped column/filter/table/board selections | UNVERIFIED |
| 27 | `tpo_share_event` | 5 | No same-name candidate | Audit of access to company-shared candidate exports | UNVERIFIED |
| 28 | `tpo_share_link` | 15 | No same-name candidate | Tokenized share links, expiry, revoke, permissions | UNVERIFIED |
| 29 | `tpo_student_note` | 6 | No same-name candidate | TPO-private learner notes and college isolation | UNVERIFIED |
| 30 | `tpo_team_member` | 6 | No same-name candidate | TPO team access/role membership | UNVERIFIED |
| 31 | `tpo_user_prefs` | 3 | No same-name candidate | Personal notification/view preferences | UNVERIFIED |

### Verified from legacy source DDL (not yet verified in runtime)

1. `college_placement_rules` is one row per college in V162. Defaults include `counts_as_placed_at='OFFER_RELEASED'`, `max_held_offers=1`, `uplift_pct=40`, `min_response_hours=48` and a `version` field. Verify semantics with the actual service before encoding; model a concurrent admin-update case. These rules influence outcome counts/eligibility but do not make DB09 the owner of DB08 outcome rows.
2. `college_what_companies_see` V162 defaults: `show_cgpa_exact=false` (banded display), `show_tenth_twelfth=true`, `show_project_links=true`, `show_assessment_scores=false`, `show_attendance=false`. **Privacy is fail-closed:** an absent setting should not silently expose exact/assessment/attendance data. Confirm authorization at serialization and export, not only at UI display.
3. V185 added `hr_drive_needs_approval=true` and `hr_access_months=6` (zero means no expiry). V193 renamed these to recruiter terminology; audit expiry, access revocation and pending-vs-active recruiter visibility.
4. V161 includes pooled `drive_group`, draft/requested/approved/published/cancelled job lifecycle, external registration and recruiter-associated drives; round and offer consumers are shared boundaries with DB08. A single `placement_jobs` table name is not proof of complete request lifecycle.
5. V165 introduces TPO/recruiter message threads/messages, share links and events, round slots/assignments/reschedule, team delegation, audit/bell/read receipts, saved views and settings. Each has history/privacy/retention behavior to reconcile; don't declare a generic activity/notifications table equivalent by name.
6. V193 normalized HR → Recruiter names for columns, roles and message/audit actors. Do not duplicate pre-rename and post-rename concepts. Review `V194` foreign-key renaming separately before closure.

## Implementation batches (one at a time; no accidental shared edits)

| Batch | Non-overlapping owned unit | Schema/behavior acceptance evidence | Status |
|---|---|---|---|
| DB09-A | Canonical source crosswalk of all 31 tables / 279 fields, ACTIVE vs RETIRED, owner and target | Field-level rows with exact source and target, SQL/JPA and FE/BE producers, reviewable decisions | SOURCE_INVENTORIED |
| DB09-B | College rules + recruiter access/visibility settings | Defaults, version/CAS, two-college isolation, recruiter expiry, private response filtering | NOT_STARTED |
| DB09-C | CRM company relationships, recruiter leads and follow-ups | Tenant/company membership boundaries, activity journal, duplicate invite and reassign | NOT_STARTED |
| DB09-D | TPO team, coordinator delegation, user prefs, saved views | Revocation, minimum privilege, per-user persistence and cross-college denial | NOT_STARTED |
| DB09-E | Recruiter/TPO messages, notifications, outbox, read receipts | No hidden-message bleed, delivery idempotency, retry and suppression, unread counts | NOT_STARTED |
| DB09-F | Share links, events, recruiter-visible candidate exports | Expiring opaque tokens, revocation, per-field visibility, access/event history | NOT_STARTED |
| DB09-G | Round slots, assignments, reschedule and drive-day integration | Capacity/booking concurrency, timezone, actor authority, audit, DB08 boundary sign-off | NOT_STARTED |
| DB09-H | Cross-role integration + final field audit + PostgreSQL verification | Replay migrations, enforced FKs/checks/indexes, negative tests, API/UI contract, refreshed SHAs | NOT_STARTED |

## Required negative/adversarial tests

| ID | Scenario | Required outcome |
|---|---|---|
| DB09-T01 | Recruiter of Company A requests Company B's applicants | Deny; no PII or existence leak |
| DB09-T02 | Recruiter authorized at College A switches request's college to B | Deny; no cross-college messages, notes, slots or student records |
| DB09-T03 | TPO removes recruiter while an old browser tab is open | Every subsequent read/write enforces current grant/expiry |
| DB09-T04 | Two TPO admins update placement rules from same version | Stale write conflicts instead of silent overwrite |
| DB09-T05 | Company visibility says no exact CGPA, attendance, assessments | All API/export/share serializations redact these fields |
| DB09-T06 | Two actors concurrently allocate the final interview slot | Exactly one wins; slot capacity cannot be exceeded |
| DB09-T07 | Expired or revoked candidate share URL is replayed | Fail closed, no stale download or unaudited access |
| DB09-T08 | Outbox delivery retried after crash / duplicate webhook | Exactly-once user-visible effects or idempotent deduplicated behavior |
| DB09-T09 | Notification marked read by Recruiter A | Does not clear Recruiter B's receipt |
| DB09-T10 | Student tries to read internal recruiter applicant note / TPO note | Deny across page, API, export and search |
| DB09-T11 | Coordinator is unassigned mid-drive-day | Privileged actions fail immediately; legacy history preserved |
| DB09-T12 | Invite for existing recruiter repeats, or access expiry elapses | Idempotent invite and correctly scoped reauthorization |

Tests must be **executed**, including disposable PostgreSQL constraints/migration replay; authored tests are not evidence of execution. Also test responsive/UI states under `docs/parity/tpo.md` and `docs/parity/hr.md` only after the producer workflows exist.

## Mapping contract and definition of done

For each of the 279 fields: legacy DDL `table.column`, actual current meaning (including V193 rename), nullable/default/type/precision/timezone, uniqueness/FK/delete semantics, tenant ownership and actor, vNext target (column/JSON path/calculated/explicit retirement), write/read paths, state/audit history, test ID, evidence SHA, and status `UNMAPPED → MAPPED → IMPLEMENTED → DB_TESTED → WORKFLOW_VERIFIED` or signed-off `REDESIGNED/RETIRED`.

**Release gate:** 279/279 reconciled as active-mapped or approved-retired, real DB migration replay and relevant tests green, both role UIs verified against frozen legacy source, zero unauthorized cross-role/tenant access, refreshed upstream review. **Current closure: 0/279 verified**; no source-only row counts toward done. The master `docs/planning/database-parity-full-domain-queue.json` remains canonical shared queue and should be updated **only during conflict-free integration** with the DB03 owner.

## Next isolated step

Expand DB09-A into exact field-by-field producer/consumer mappings, first V162/V185 privacy and versioned settings then CRM/outbox, with code-path/file:line evidence. Keep this branch reviewable as a DB09-only PR. Ask DB03 owner to integrate only after it is stable; never rewrite the shared migration journal or force-push.
