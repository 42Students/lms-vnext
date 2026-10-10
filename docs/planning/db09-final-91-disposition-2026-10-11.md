# DB-012 · Final 91-field disposition pass

**Date:** 2026-10-11 IST  
**Worker:** Chat 3  
**Global phase:** DATABASE  
**Legacy backend oracle:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Purpose:** close canonical DB09 field disposition, not runtime verification.

The raw DB09 source inventory already has 279/279 candidate/source comparison notes. The canonical field ledger previously had 188/279 explicit dispositions. This pass classifies the remaining 91 into normalized redesigns, staged DB09 targets, DB08/DB10 dependencies, or explicit blockers.

## 1. Company + industry-company — active, intentionally normalized

Legacy has two overlapping company concepts:

- `company`: college-facing company memory, including contact person, contact email/phone, internal notes, college/org scope, soft-delete and active-name dedupe.
- `industry_company`: shared recruiter company identity, including optimistic version, creator provenance and V162 `export_columns_json`.

vNext already separates a global `placement_companies` master from college-scoped `placement_company_relationships` and recruiter profiles/grants. That split is preferable, but it is not a one-column clone.

Disposition:
- global identity/public attributes -> `placement_companies`;
- college ownership/trust/owner and college-local memory -> `placement_company_relationships` plus staged relationship-memory fields;
- recruiter account -> canonical `placement_recruiter_profiles.company_id`;
- legacy soft delete -> archived/status lifecycle, not a copied `is_deleted` bit;
- generated dedup columns -> database unique-index behavior, not persisted compatibility columns;
- creator actor type -> canonical user + activity provenance, not a second polymorphic integer identity;
- `export_columns_json` remains a required product preference and is **blocked** until its audience/owner is agreed (company-global vs college-relationship vs per-user).

No legacy company table is retired.

## 2. Multi-college recruiter drive group — active

`RecruiterPlanDriveService` proves live `drive_group` use: one recruiter-owned group snapshot fans out independent jobs to multiple colleges; the saved form can later be reused to add another authorized college. A college-scoped view deliberately hides the other colleges.

Use the existing staged contract:
`docs/planning/sql/db09-multicollege-drive-group-candidate.sql`

Target:
- `placement_recruiter_drive_groups`
- `placement_jobs.recruiter_drive_group_id`

This preserves recruiter ownership, normalized company identity, shared-form snapshot and group creation time without granting cross-college visibility.

## 3. Prep assignment — active, missing registered target

Legacy `prep_assignment` is live placement-readiness persistence: learner + exactly one reusable LMS prep resource (course or assessment), optional due time, assigner and creation time. Completion is derived.

A generic notification is not equivalent. Stage a DB09 placement-prep relation, but its resource FK needs DB05/DB06 ownership confirmation because legacy `assessment_id` is broader than assuming a quiz or assignment table.

Until resource identity is signed off, these seven fields are **BLOCKED** rather than silently mapped.

## 4. Student request — DB08-owned redesign

`TpoRequestService` actively uses one request queue for withdrawal, offer extension, registration change, absence dispute, correction, external offer and PAP.

vNext `placement_learner_requests` is the canonical redesign, but parity is not yet 1:1:
- legacy allows requests without an application;
- vNext currently requires `application_id`;
- legacy carries direct learner/job identities, generic payload and `escalate_at`;
- vNext has typed scope/effect fields and richer round/offer references.

All 13 fields are classified as a DB08-owned **REDESIGNED** family. DB08 must prove non-application request support and escalation semantics before runtime verification.

## 5. Email suppression — DB10 privacy redesign

Legacy stores normalized plaintext email as the suppression primary key. vNext DB10 draft intentionally stores a secret-derived `recipient_hash`.

That is a privacy improvement, not a field-for-field match. All three fields are classified **REDESIGNED** to `outbound_suppressions`, with a required decision on suppression scope: legacy is effectively global-by-email while the draft is organization/channel scoped. The final behavior must prevent an unsubscribe from being bypassed merely by another tenant scope.

## 6. Notification outbox — active DB10 dependency, not equivalent yet

Legacy `notification_outbox` is a broad TPO delivery engine:
- APP/EMAIL/SMS;
- arbitrary placement event vocabulary;
- payload JSON;
- 30-second undo hold via `undo_group_id`;
- cancellation;
- SKIP LOCKED claiming;
- digest scheduling;
- sent/failure timestamps.

Current DB10 `outbound_messages` draft only supports external EMAIL/SMS/WHATSAPP invitation templates and has no undo-group contract; APP notifications live separately in `in_app_notifications`.

Therefore these 13 fields are reviewed as **BLOCKED cross-domain redesign**, not mapped. DB10 must explicitly cover event fanout, APP semantics, undo-group cancellation/idempotency, digest scheduling and delivery state before DB09 can call the source contract preserved.

## 7. TPO audit log — activity-event redesign

`TpoAuditService` actively writes college-scoped actor/action/entity/detail history. vNext `activity_events` is the intended normalized event model:
- college scope -> `college_id`
- actor identity -> canonical user/membership
- action -> `event_type`
- entity -> subject type/id
- detail -> summary/metadata
- created_at -> occurred_at

All nine fields are **REDESIGNED**. Final actor-role provenance and append-only behavior need DB10/activity witnesses.

## 8. TPO bell + read receipts — activity + per-user notification redesign with a real semantic requirement

Legacy bell behavior is a shared college feed with per-reader acknowledgements:
- one bell item belongs to a college;
- every placement-team reader gets an independent read state in `tpo_bell_read`;
- old shared `tpo_bell.read_at` is a compatibility fallback;
- items older than 30 days become effectively read for unread-count purposes.

A single `in_app_notifications.read_at` row is only equivalent if vNext fan-outs one notification per authorized user from a shared activity/event source.

Disposition:
- `tpo_bell` eight fields -> **REDESIGNED** to shared `activity_events` source + per-user `in_app_notifications`;
- `tpo_bell_read` four fields -> **REDESIGNED**, provided reader type/id normalizes to canonical user and fanout/read receipts preserve independent team state.

Required witnesses include team-member A reading without clearing B, recruiter/TPO recipient isolation, college isolation, 30-day policy decision and immutable source event history.

## Remaining previously-reviewed blockers

The earlier 188-field pass still carries three blockers:
1. `tpo_message.sender_type`: final source/DB contract is `RECRUITER`, while current vNext producer still emits `HR`.
2. `tpo_college_settings.job_types_json`
3. `tpo_college_settings.outcome_labels_json`

The two settings now have staged SQL in `db09-job-outcome-settings-candidate.sql`; they may move from BLOCKED to MAPPED-at-staged-design level. The message producer mismatch stays BLOCKED until the producer and database vocabulary move atomically.

## Gate

After this pass the canonical DB09 ledger may reach **279/279 disposition-reviewed**, but:
- **0/279 remain DB/runtime verified**;
- no PostgreSQL replay was executed;
- no numbered migration was registered by Chat 3;
- cross-domain DB08/DB10 handoffs remain required;
- DB-012 must not be marked DONE_VERIFIED on disposition evidence alone.
