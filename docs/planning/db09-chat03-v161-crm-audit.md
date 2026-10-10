# DB-012 · Chat 3 — Recruiter CRM source-to-staged DB audit

**Date:** 2026-10-11 IST · **Global phase:** DATABASE  
**Worker:** Chat 3 / issue #23  
**Legacy BE oracle:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy FE oracle:** `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`  
**Primary source DDL:** V161 TPO drives plus V193 recruiter rename  
**Targets:** `src/db/schema/tpo-crm.ts`, `docs/planning/sql/db09-tpo-crm-premerge.sql`

## Scope and result

This pass reviews the 38 DB09 fields in:

- `recruiter_lead` — 23
- `recruiter_lead_activity` — 8
- `follow_up` — 7

Together with the prior 14 V162 college-policy/privacy rows, the durable DB09 field ledger is now **52/279 source-mapped**. **0/279 are runtime/semantic verified.** No registered migration, disposable PostgreSQL replay, live DB introspection, or executed DB09 test is claimed.

## Exact live source behavior

The frozen production backend still contains active JPA models and `TpoRecruiterLeadService` producers/consumers for all three tables.

### recruiter_lead

The source stores only manual stages `NEW | CONTACTED | NOT_NOW`. Invited, joined and drive-planned states are derived from facts, so vNext must not widen `manual_stage` into a generic lifecycle bucket.

The service actively persists normalized email/phone, company/name/designation, owner faculty, source, not-now reason/date, invite SHA-256 hash, sent/clicked/reminder/bounce/unsubscribe timestamps, recruiter link and audit timestamps. Invite issuance returns a raw random token once but persists only its SHA-256 hash. Reissuing rotates the hash. Unsubscribed or already-joined contacts are blocked from new invitations.

### recruiter_lead_activity

Contact activity persists type/outcome/note/system flag/creator/time. Non-system contact moves a NEW lead to CONTACTED. The vNext proposal deliberately adds `college_id` and a composite lead FK for tenant defense, and the staged SQL makes history append-only.

### follow_up

Follow-up due time, owner, note, completion time and lead are active. Completed follow-ups cannot be moved in the legacy service. vNext adds `college_id` and same-college lead/owner defenses.

## Proposed identity normalizations that remain unverified

These are reasonable vNext redesigns, but name/type alignment alone is not semantic proof:

- legacy `company_id` → `placement_tpo_leads.company_relationship_id`;
- legacy `owner_faculty_id` → `owner_membership_id`;
- legacy `recruiter_id` → canonical recruiter `user_id`;
- activity `created_by` legacy faculty id → `created_by_user_id`;
- legacy logo URL → canonical GCS object path.

Each must be proven against producer/consumer authorization and cross-college negative witnesses.

## Database gaps found

1. **Invite hash shape is not DB-enforced.** The producer is SHA-256 hex, but the staged Drizzle/SQL only made the value unique. A direct write can currently persist arbitrary strings. Add nullable lower-hex 64-character CHECK before registration.
2. **Activity actor provenance is weaker than lead tenant scope.** The child row is tied to a same-college lead, but `created_by_user_id` can still reference a user with no membership in that college. For non-system activities, prove current active membership or redesign to membership identity; SYSTEM events need an explicit null/system provenance rule.
3. **Owner scope relies on staged PostgreSQL triggers.** Drizzle references `college_memberships(id)` but cannot by itself prove the owner belongs to the lead college. The premerge trigger closes this only after it is registered and replayed.
4. **Company relationship scope likewise relies on staged trigger proof.** A single-column FK is insufficient for tenant equivalence.
5. **Follow-up state has no optimistic version.** Concurrent move/done operations need a row lock/CAS witness so a stale move cannot resurrect/change a completed follow-up.
6. **Timestamp semantics changed from MySQL local DATETIME to timestamptz.** This is an intentional improvement only if API/UI conversions and scheduled reminder/follow-up comparisons use the intended college/user timezone consistently.
7. **Derived stage facts span DB08 + identity grants.** A complete DB09 read contract must join verified invite/recruiter/drive/outcome facts rather than copy those states back into `manual_stage`.

## Acceptance witnesses required

- reject duplicate email and duplicate phone in the same college under concurrent insert;
- allow the same normalized contact in different colleges only if that is the approved business rule;
- reject foreign-college owner membership and company relationship via direct SQL;
- reject malformed/non-hex/non-64 invite hashes;
- prove token rotation invalidates the previous hash and plaintext never persists;
- prove unsubscribe/Not Now/joined state blocks issuance through the producer;
- reject foreign-college lead activity/follow-up attachments;
- prove activity history UPDATE/DELETE is rejected;
- prove a non-system activity cannot forge an unrelated tenant actor;
- race follow-up move versus done and ensure terminal completion cannot be overwritten;
- replay the registered migration from an empty PostgreSQL database and diff generated schema.

**Current state:** DB-012 remains IN_PROGRESS. This is source/staged-design evidence only.
