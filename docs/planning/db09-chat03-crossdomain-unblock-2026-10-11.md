# DB-012 / Chat 3 — Cross-domain notification, prep and export contract pass

**Date:** 2026-10-11 IST · **Phase:** DATABASE · **Queue:** DB-012  
**Source oracles:** `42Students/lms@prod-2026 21bad59d4dfaf2fa11fdeaf9353327ce105697d5`, `42Students/lms2-fe@prod-2026 e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`.

This pass adds evidence to **15 already-blocked source fields** without pretending they are certified. The canonical DB09 ledger remains **279/279 source/disposition-reviewed; 0 PostgreSQL/semantic-verified; 0 approved retirements**. The cross-domain decision and migration registration still belong to the designated integrator/domain owners.

## 1. DB09/DB10 general notification outbox: 13 fields

Legacy `NotificationOutboxEntry`, `NotificationOutboxService`, and `NotificationOutboxRepository` prove an active queue carrying `id,event,recipient_type,recipient_id,channel,payload_json,send_after,status,undo_group_id,claimed_at,sent_at,failure_reason,created_at`.

Key behavior that must survive:
- APP/EMAIL/SMS; vNext invitation-only `outbound_messages` excludes APP and does not provide general TPO event vocabulary.
- 30-second hold for undoable actions, group cancellation of all still-pending rows, and immediate **non-undo** confirm-first actions for offers/close/cancel.
- Due claim using `FOR UPDATE SKIP LOCKED`; use a fenced lease for safe retries, avoiding concurrent workers or stale claim completion.
- Optional EMAIL digest at the next 8 AM with college setting toggles, and event-specific SMS cap logic.
- APP-channel legacy records are the notification themselves; vNext can instead publish a recipient-scoped `in_app_notifications` record, but must atomically keep the original event and independent recipient read states.
- Legacy `SENT` is insufficient for external delivery; separate APP published, provider accepted, and confirmed delivered. Never store raw email/phone/token/payload in general control rows.

**Staged only:** [SQL metadata contract](sql/db09-notification-undo-digest-candidate.sql) with strict company/college/event/undo composite scope, durable undo group, digest bucket, APP/external channel guards and lease fence metadata. Parent unique constraints and DB10 encrypted-envelope integration require Chat 1 review; **NOT** a migrated or executable sender. [Six static source-contract tests](../../tests/db09-notification-undo-digest-staging.test.mjs) are authored. Ten independently executed read-only GitHub-blob assertions passed; the committed Node test command, typecheck and PostgreSQL tests **were not executed** in this batch.

**Acceptance gate:** disposable PostgreSQL with two colleges and same recipient identity; cross-scope event/undo FK violations, race between Undo and 100 concurrent claims, exact 30-second deadline, digest grouping by tenant+college+recipient+day/timezone, negative forbidden APP/EMAIL payload storage, safe provider retry, suppression-at-send and distinct provider-accepted/delivered timestamps.

## 2. DB09/DB06 prep assessment reference: one field

Legacy `TpoStudentsReadService.bulkAssignPrep(collegeId, learnerIds, courseId, assessmentId, dueAt, actorId)` explicitly accepts `assessmentId`. It only requires **at least one** of course or assessment (the legacy API does not require exactly one); duplicate suppression compares the tuple of both nullable IDs. The current legacy TPO frontend `StudentActions.jsx` exposes **course-only** Assign Prep and sends `courseId`, not `assessmentId`.

This resolves a source-surface ambiguity, not the FK:
- The user-facing parity minimum is a course prep assignment.
- The wider legacy API can persist numeric `assessment_id` but does not prove it is a canonical `quiz` or `assignment` FK.
- The existing [placement prep candidate](sql/db09-prep-bell-read-state-candidate.sql) uses an explicitly **unresolved** `assessment_ref_id`. DB06 must identify its exact reusable assessment-resource domain before attaching a real FK or accepting retirement.
- Implement same-college learner FK, course FK, due-date validity and unique active tuple protection regardless of assessment disposition.

## 3. Company export column picker: one field

Legacy V162 adds `industry_company.export_columns_json` to a globally shared recruiter company table, but the inspected current UI does **not** consume that field as durable company policy:
- `ShareModal.js` posts chosen columns in each `createShare(job.id, ...)` request; share recipient, stage and column selections form the share-link snapshot.
- `shareMemory.js` stores the last company share contact/columns/maxStage in **browser localStorage**, keyed by normalized company name, not by a database `industry_company` ID.
- `gridExport.js` exports the visible/selected columns directly without demonstrating `export_columns_json` read/write.
- Thus global company-shared persistence is *not established*. Do not place a per-tenant preference on global `placement_companies` simply because V162 added a column. Product owner should choose whether (a) transient per-browser compatibility + per-link persisted snapshot is sufficient, or (b) a user+college+company scoped remembered share preference should become an intentional vNext improvement.

**Risk:** legacy browser preference keyed only by company name is not a safe tenant isolation boundary; if reproduced server-side, scope it to the actual college and actor and never allow the preference to override recruiter-view privacy rules.

## Unchanged gates and cross-chat handoff

- Chat 1 owns all numbered Drizzle migrations, `src/db/schema/index.ts` and actual PostgreSQL replay.
- DB10 owner should generalize invitation-only outbound messages or approve a separate APP/TPO event fanout with a sealed payload path. DB09 Chat 3 does not enable SMS/EMAIL dispatch or count external provider success.
- DB06 owns final resource-identity decision for `prep_assignment.assessment_id`; frontend-only evidence is *not* retirement approval.
- TPO/share product owner must determine `export_columns_json` audience, scope and persistence; no approval is assumed.
- GitHub Actions CI is intentionally unused due to billing and does **not** block independent engineering. Missing PostgreSQL verification remains an evidence gap, not a CI billing failure.
- **Do not promote DATABASE → API** or DB-012 to DONE_VERIFIED from these source findings.
