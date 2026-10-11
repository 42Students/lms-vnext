# DB09 integration manifest — 2026-10-11

**Owner:** Chat 3 / DB-012 source + staging reconciliation  
**Integrator:** W01 / Chat 1 only  
**Status:** integration-ready staging map; **not migrated, not replayed, not DB-verified**  
**Legacy BE oracle:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy FE oracle:** `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`

## Canonical field status

The DB09 field ledger is closed for source/design disposition:

- 279 / 279 reviewed
- 199 `MAPPED`
- 80 `REDESIGNED`
- 0 field-level `BLOCKED`
- 0 runtime/PostgreSQL verified

This manifest exists to stop W01 from registering duplicate or obsolete DB09 drafts.

## Canonical schema sources

Prefer these TypeScript schemas as the structural source of truth where present:

1. `src/db/schema/tpo-policy.ts`
2. `src/db/schema/tpo-crm.ts`
3. `src/db/schema/tpo-collaboration.ts`

SQL files below are staging/integrity proposals. W01 should produce **one** registered Drizzle migration sequence from the approved final shape, not execute both Drizzle-generated DDL and duplicate CREATE TABLE drafts.

## Required pre-existing parents

DB09 integration assumes the canonical parents already exist and are registered:

- organizations / colleges / users / college_memberships / departments
- placement_companies / placement_company_relationships / recruiter profiles + grants
- placement_jobs / placement_job_rounds / placement_applications
- activity_events / in_app_notifications
- courses
- DB10 encrypted `outbound_messages` contract for external channels

Where a DB09 composite FK needs a parent composite unique key, W01 must deduplicate against constraints already introduced by DB01/DB08/DB10.

## Recommended registration order

### 1. Policy + disclosure

Structural source: `src/db/schema/tpo-policy.ts`  
Reference DDL: `docs/planning/sql/db09-policy-visibility-premerge.sql`

Creates/normalizes college placement rules and company visibility settings.

### 2. Recruiter CRM

Structural source: `src/db/schema/tpo-crm.ts`  
Canonical staged SQL: `docs/planning/sql/db09-tpo-crm-premerge.sql`

Creates:

- `placement_tpo_leads`
- `placement_tpo_lead_activities`
- `placement_tpo_followups`

The canonical SQL was repaired on 2026-10-11: one DDL copy only, valid phone/invite-hash checks, tenant owner/company guards, append-only activity history, and active same-college actor provenance.

**Do not register** the superseded `db09-crm-scoped-fk-candidate.sql` or `db09-crm-tenant-fk-candidate.sql`.

### 3. Collaboration core + tenant FKs

Structural source: `src/db/schema/tpo-collaboration.ts`  
Supplemental scope proposal: `docs/planning/sql/db09-collaboration-scoped-fk-candidate.sql`

Includes message threads/messages, share links/events, college settings, user preferences, saved views, student notes, team members, recruiter-private notes and recruiter read-through state.

The canonical schema uses final recruiter-era codes directly: `RECRUITER` and `RECRUITER_LEADS`. No HR→RECRUITER data-conversion migration is needed in greenfield vNext.

### 4. College TPO setting extensions

Apply only after `placement_tpo_college_settings` exists:

- `docs/planning/sql/db09-college-recruiter-settings-candidate.sql`
- `docs/planning/sql/db09-job-outcome-settings-candidate.sql`

These preserve recruiter-access/approval and custom job/outcome settings that arrived after the first TPO settings migration.

### 5. Company relationship share defaults

`docs/planning/sql/db09-company-export-preference-candidate.sql`

Legacy `industry_company.export_columns_json` is redesigned to tenant-safe `placement_company_relationships.share_column_defaults`; actual share links continue to snapshot their own immutable column selection.

### 6. Multi-college recruiter drive groups

`docs/planning/sql/db09-multicollege-drive-group-candidate.sql`

Register after recruiter identity/company relationships and `placement_jobs`.

### 7. Round scheduling + drive coordinators

**Canonical:** `docs/planning/sql/db09-round-scheduling-candidate.sql`

Includes:

- slot persistence
- round/application assignment
- reschedule requests
- row-version/concurrency fields
- date-scoped drive coordinator assignment
- final `RECRUITER` proposer code

**Do not register** `db09-scheduling-premerge.sql`; it is superseded by the stronger canonical file.

### 8. Prep assignments + TPO bell/read receipts

`docs/planning/sql/db09-prep-bell-read-state-candidate.sql`

Greenfield prep assignments are course-backed. Dormant legacy generic `assessment_id` is intentionally retired; do not invent an unconstrained polymorphic FK.

### 9. Notification undo/digest bridge

**Canonical:** `docs/planning/sql/db09-notification-undo-digest-candidate.sql`

Register only after activity/tenant parents and the approved DB10 encrypted external-delivery contract. It preserves:

- APP/EMAIL/SMS intent
- arbitrary placement event keys
- 30-second undo deadline/group
- digest day/scheduling
- claim lease/fence
- final `RECRUITER` audience
- APP materialization vs encrypted external delivery

**Do not register** `db09-notification-intents-candidate.sql`; it is superseded by the fuller undo/digest draft.

## Explicitly superseded staging files

These remain only as tombstones so future workers do not accidentally revive them:

- `docs/planning/sql/db09-crm-scoped-fk-candidate.sql`
- `docs/planning/sql/db09-crm-tenant-fk-candidate.sql`
- `docs/planning/sql/db09-scheduling-premerge.sql`
- `docs/planning/sql/db09-notification-intents-candidate.sql`
- `docs/planning/sql/db09-final-recruiter-codes-candidate.sql`

## PostgreSQL acceptance matrix

Before DB-012 can move beyond source/design completion:

1. empty-database registered journal replay;
2. migration snapshot/schema drift review;
3. all same-college composite FK negatives;
4. lead/company/owner actor forgery rejection;
5. append-only CRM activity enforcement;
6. duplicate contact/invite-hash and invitation rotation races;
7. message/share/recruiter-private-note cross-tenant privacy;
8. share token/code hash, expiry, revocation and disclosure caps;
9. scheduling cross-job/cross-round FK negatives and assignment/reschedule races;
10. coordinator cross-college authorization negatives;
11. TPO bell independent-reader semantics;
12. prep course tenant/catalog authorization and dedupe race;
13. notification undo vs claim race, APP exactly-once fanout, digest isolation;
14. external sender lease/fence/idempotency and suppression behavior;
15. runtime producer/consumer checks against the exact registered schema.

GitHub Actions availability/billing is **not** a gate. Use the CI-independent disposable PostgreSQL verification path tracked by DB-001.

## Gate statement

This manifest resolves staging ownership/order ambiguity only. It does not convert authored SQL/tests into executed evidence, and it does not authorize DATABASE → API phase promotion.
