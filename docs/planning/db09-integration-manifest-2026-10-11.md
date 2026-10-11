# DB09 integration manifest — 2026-10-11

**Owner:** Chat 3 / DB-012 source + staging reconciliation  
**Integrator:** W01 / Chat 1 only  
**Status:** integration-ready staging map; **not migrated, not replayed, not DB-verified**  
**Legacy BE oracle:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy FE oracle:** `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`

## Canonical field status

The DB09 field ledger is closed for source/design disposition:

- 279 / 279 reviewed
- 195 `MAPPED`
- 84 `REDESIGNED`
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

### Canonical parent-key staging

Use exactly one DB09 parent-key source:

- `docs/planning/sql/db09-parent-composite-keys-candidate.sql`

It standardizes ID-first composite UNIQUE keys for colleges, memberships, departments, company relationships, jobs, applications, rounds and activity events, plus `placement_recruiter_profiles(user_id, company_id)` so recruiter-owned multi-college groups cannot pair a recruiter with another company. The collaboration, scheduling and notification child drafts no longer declare their own competing parent keys.

## Recommended registration order

### 0. Shared parent composite keys

Reconcile `db09-parent-composite-keys-candidate.sql` against already registered DB01/DB08/DB10 constraints. Register only missing equivalent keys, once, before DB09 composite child FKs.

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

The canonical SQL was repaired and adversarially hardened on 2026-10-11: one DDL copy only; valid phone/invite-hash and invite-timestamp checks; ACTIVE placement-staff owner/activity/follow-up principals; active company relationship; joined recruiter must have an ACTIVE same-company college grant; append-only activity history; and completed follow-ups cannot be moved or rewound to incomplete. The structural Drizzle source mirrors source-proven invite and follow-up time checks.

**Do not register** the superseded `db09-crm-scoped-fk-candidate.sql` or `db09-crm-tenant-fk-candidate.sql`.

### 3. Collaboration core + tenant FKs

Structural source: `src/db/schema/tpo-collaboration.ts`  
Supplemental scope proposal: `docs/planning/sql/db09-collaboration-scoped-fk-candidate.sql`

Includes message threads/messages, share links/events, college settings, user preferences, saved views, student notes, team members, recruiter-private notes and recruiter read-through state.

The supplemental collaboration SQL now stages fail-closed principal-scope guards: recruiter grants require ACTIVE canonical user/profile/company/relationship/college and same-company ownership; threads/read markers/private notes must stay inside that grant; recruiter message author must equal the thread recruiter; TPO message authors/share creators/preferences/views/student-note authors require explicit TPO actor scope (TPO/COLLEGE_ADMIN membership or placement-team role), not ordinary membership; student-note subjects require an ACTIVE LEARNER role; published message identity/body cannot be rewritten and read state cannot be rewound; share events are append-only. W01 must preserve these semantics when translating the candidate into the registered migration.

The canonical schema uses final recruiter-era codes directly: `RECRUITER` and `RECRUITER_LEADS`. No HR→RECRUITER data-conversion migration is needed in greenfield vNext.

### 4. College TPO settings + normalized trusted/prep selections

Scalar/structured settings that remain canonical columns in
`src/db/schema/tpo-collaboration.ts :: placementTpoCollegeSettings`:

- `job_types`
- `outcome_labels`
- `recruiter_access_months`
- `recruiter_drive_needs_approval`
- templates, SMS cap, branding and prep threshold
- four fixed **typed boolean** optional-notification toggles (formerly `notify_toggles_json`, now `notify_drive_open_email`, `notify_result_applied`, `notify_nudges`, `notify_prep_assigned`, each `NOT NULL DEFAULT true`)

The legacy `tpo_user_prefs.prefs_json` also has a closed key set and is now
normalized to five required booleans in `placement_tpo_user_preferences`:
`morning_digest` defaults false; `recruiter_messages`, `requests`,
`results_ready` and `follow_ups` default true. The college/user composite
primary key remains in force. The legacy personal preferences have active backend GET/PUT persistence and
matching frozen frontend service functions, but direct inspection of the
frozen TPO settings/notifications/profile pages did **not** prove a rendered
consumer. Source evidence also does **not** establish delivery-side consumption.

**DB-036 canonical structural authority:** `src/db/schema/tpo-collaboration.ts`
plus [source contract](db09-notification-preferences-normalization-2026-10-11.md)
and `tests/db09-notification-preferences-normalization.test.mjs`.
The four college settings switches actively govern six optional **external**
outbox deliveries while the APP notice remains present; the frozen TPO Settings
page states this explicitly. The API wave must map old camelCase JSON response
keys to typed DB columns, preserve partial per-key updates, and must not turn an
email switch into an in-app visibility switch. Do not add the two removed JSON
columns as parallel write paths. These structural changes are NOT registered
migrations or executed PostgreSQL tests.

Two source-active legacy JSON lists are **not** canonical columns anymore:

- `trusted_domains_json` → `placement_tpo_trusted_domains`
- `prep_course_ids_json` → `placement_tpo_prep_courses`

Structural source: `src/db/schema/tpo-collaboration.ts`  
Supplemental scope/reference SQL:
`docs/planning/sql/db09-tpo-settings-normalization-candidate.sql`

Trusted domains preserve the frozen source normalization and free-mail denylist
and require an active TPO writer. Prep-course settings carry a real course FK
and allow only active courses from the settings college's **organization**;
this deliberately preserves the legacy `prepCourses(organizationId)`
selector instead of incorrectly narrowing to same-college courses.

The runtime API may continue to expose arrays, but it must project/replace
normalized rows transactionally. Do not recreate `trusted_domains` or
`prep_course_ids` JSON columns as a second writable source of truth.

Do **not** register a post-create ALTER for the four scalar fields. The old
`db09-college-recruiter-settings-candidate.sql` is superseded, and
`db09-job-outcome-settings-candidate.sql` is source-reference text only.

### 5. Company relationship share defaults

**Canonical structural source:** `src/db/schema/placements.ts :: placementCompanyRelationships.shareColumnDefaults`

Legacy `industry_company.export_columns_json` is redesigned to tenant-safe
`placement_company_relationships.share_column_defaults`; actual share links
continue to snapshot their own immutable `placement_tpo_share_links.columns`
selection.

DB-047 closed a staging drift where the ledger/candidate targeted this column
but canonical Drizzle did not contain it. The Drizzle table now owns the
nullable JSONB column and exact 12-value disclosure allowlist check.

`docs/planning/sql/db09-company-export-preference-candidate.sql` is now
**SOURCE REFERENCE ONLY / NO DDL**. **Do not register a post-create ALTER from
that file.** W01 should generate the column/check exactly once from
`placements.ts` and confirm the resulting snapshot matches the source
reference.

No current frozen producer/consumer of the historical global default was
proven. Do not invent runtime default application during migration integration;
the redesign preserves the source concept at a tenant-safe boundary without
changing existing per-share snapshots.

### 6. Multi-college recruiter drive groups

`docs/planning/sql/db09-multicollege-drive-group-candidate.sql`

Register after recruiter identity/company relationships, the recruiter-profile user/company composite key, and `placement_jobs`. The staged group requires non-null recruiter+company **and non-null `created_by_user_id`**, rejects recruiter/company mismatch or a creator other than that recruiter, requires each child job's creator to match the group recruiter, requires the child job's ACTIVE relationship/company and ACTIVE recruiter grant to match the group, and enforces one child job per group+college. Updates to a grouped job's creator must re-run the guard; grant revocation does not erase historic links. The group-owner SQL function must retain paired `$` delimiters (fixed in the unregistered draft).

### 7. Round scheduling + drive coordinators

**Canonical:** `docs/planning/sql/db09-round-scheduling-candidate.sql`

Includes:

- slot persistence
- round/application assignment
- reschedule requests
- row-version/concurrency fields
- date-scoped drive coordinator assignment
- final `RECRUITER` proposer code
- slot-row locking before assignment so concurrent writes cannot exceed capacity
- booked-slot protection against capacity shrink/unconfirm
- ACTIVE LEARNER coordinator scope and TPO-scoped assigning principal

This draft depends on `db09_has_active_tpo_actor` from the collaboration supplemental SQL, so collaboration principal helpers must exist before scheduling triggers are created.

**Do not register** `db09-scheduling-premerge.sql`; it is superseded by the stronger canonical file.

### 8. Prep assignments + TPO bell/read receipts

`docs/planning/sql/db09-prep-bell-read-state-candidate.sql`

Greenfield prep assignments are course-backed. Dormant legacy generic `assessment_id` is intentionally retired; do not invent an unconstrained polymorphic FK. The staged prep trigger requires an ACTIVE LEARNER in the assignment college, an ACTIVE course whose department belongs to that college, and a TPO-scoped assigning user. TPO bell readers require TPO actor scope; bell items and read receipts are append-only. This draft also depends on `db09_has_active_tpo_actor` from collaboration.

### 9. Notification undo/digest bridge

**Canonical:** `docs/planning/sql/db09-notification-undo-digest-candidate.sql`

Register only after collaboration principal helpers, activity/tenant parents and the approved DB10 encrypted external-delivery contract. It preserves:

- APP/EMAIL/SMS intent
- arbitrary placement event keys
- 30-second undo deadline/group
- digest day/scheduling
- claim lease/fence
- final `RECRUITER` audience
- APP materialization vs encrypted external delivery
- recipient-kind/college principal checks
- database-enforced undo deadline and cancelled-group fence
- atomic all-or-nothing undo function
- bounded lease/fence claim function using `FOR UPDATE SKIP LOCKED`
- channel-specific terminal-state checks and FAILED-code shape

**Do not register** `db09-notification-intents-candidate.sql`; it is superseded by the fuller undo/digest draft.

## Explicitly superseded staging files

These remain only as tombstones so future workers do not accidentally revive them:

- `docs/planning/sql/db09-crm-scoped-fk-candidate.sql`
- `docs/planning/sql/db09-crm-tenant-fk-candidate.sql`
- `docs/planning/sql/db09-scheduling-premerge.sql`
- `docs/planning/sql/db09-notification-intents-candidate.sql`
- `docs/planning/sql/db09-final-recruiter-codes-candidate.sql`
- `docs/planning/sql/db09-college-recruiter-settings-candidate.sql`

## PostgreSQL acceptance matrix

Before DB-012 can move beyond source/design completion:

1. empty-database registered journal replay;
2. migration snapshot/schema drift review;
3. shared parent composite key catalog contains no duplicate alternate-order DB09 keys, then all same-college composite FK negatives;
4. lead/company/owner actor forgery rejection;
5. append-only CRM activity enforcement;
6. duplicate contact/invite-hash and invitation rotation races;
7. message/share/recruiter-private-note cross-tenant privacy, including direct-SQL recruiter-grant/company mismatch, forged sender identity, read-marker scope and immutable message/share history;
8. share token/code hash, expiry, revocation and disclosure caps;
9. scheduling cross-job/cross-round FK negatives and assignment/reschedule races;
10. coordinator cross-college authorization negatives;
11. TPO bell independent-reader semantics;
12. prep assignment learner/TPO authorization, same-organization course catalog parity, cross-organization rejection and dedupe race;
12a. trusted-domain malformed/free-mail/cross-college writer negatives and exact-match isolation;
12b. normalized prep-course same-organization FK/scope, archived/inactive parent rejection and atomic settings replacement;
13. notification undo vs claim race, APP exactly-once fanout, digest isolation;
14. external sender lease/fence/idempotency and suppression behavior;
15. runtime producer/consumer checks against the exact registered schema;
16. malformed PL/pgSQL delimiter regression and function/trigger dependency ordering;
17. joined recruiter/company/grant mismatch and inactive principal negatives;
18. share column/stage disclosure allowlists and JSON settings shape;
19. drive-group recruiter/company mismatch, duplicate group+college child race and grant revocation;
20. slot capacity race/booked-slot mutation negatives and TPO-only coordinator assignment;
21. notification cancellation-before-deadline vs concurrent claim stress, stale lease fence and recipient-role forgery.

GitHub Actions availability/billing is **not** a gate. Use the CI-independent disposable PostgreSQL verification path tracked by DB-001.

## Gate statement

This manifest resolves staging ownership/order ambiguity only. It does not convert authored SQL/tests into executed evidence, and it does not authorize DATABASE → API phase promotion.


### Collaboration principal-scope integration note

Post-source review found that parent FKs alone were insufficient for collaboration tables: a syntactically valid recruiter UUID plus college UUID could still be combined by direct SQL without proving an active same-company college grant. The canonical supplemental source is now `db09-collaboration-scoped-fk-candidate.sql` at/after commit `4bb1e313b87a394694bdac198e8cf82b9383d075`, with static guard coverage added in `tests/db09-integration-staging-guard.test.mjs`.

This is still authored staging evidence only. W01 must validate function/trigger ordering, existing parent statuses, empty-DB replay and negative PostgreSQL witnesses before registration.


## DB-032 adversarial staging hardening

After the 279/279 DB09 source/design disposition closed, a second registration-focused pass found multiple invariants that were still service-only. DB-032 deliberately hardens the **unregistered** canonical staging without editing `drizzle/**` or `src/db/schema/index.ts`.

The pass covers recruiter/TPO principal status, company/grant agreement, share disclosure allowlists, immutable message/share/bell history, multi-college drive-group identity, round-slot capacity concurrency, prep/course/learner scope, TPO bell reader scope and notification undo/claim races. Static guard coverage lives in `tests/db09-integration-staging-guard.test.mjs`.

A staging syntax audit also caught single-dollar PL/pgSQL delimiters introduced by text-generation/replacement. All canonical DB09 function drafts were repaired to PostgreSQL `$$` delimiters and the guard suite now rejects a single-dollar opener/terminator regression.

**Evidence classification:** authored staging + read-only source assertions only. Node tests and disposable PostgreSQL have not been executed by Chat 3. W01 must register the final approved shape, then independent DB execution must prove every negative/concurrency witness before DB09 can be runtime-verified.


## DB-034 trusted-domain and prep-course normalization

A post-disposition source audit proved two college settings are active
authorization/readiness inputs, not passive JSON:

- `TpoDriveService.isTrustedRecruiter` uses exact trusted-domain membership
  to auto-approve eligible recruiter drive requests.
- `TpoStudentsReadService.prepAverages` uses selected prep courses to compute
  learner readiness.

DB-034 removes `trustedDomains` and `prepCourseIds` JSON fields from the
canonical structural settings row and replaces them with normalized
`placement_tpo_trusted_domains` and `placement_tpo_prep_courses`.

The canonical DB09 ledger rows for `trusted_domains_json` and
`prep_course_ids_json` are now `REDESIGNED`, not JSON-mapped. W01 must not
resurrect the old JSON targets.

Detailed evidence and runtime cutover notes:
`docs/planning/db09-tpo-settings-normalization-2026-10-11.md`.

**Evidence classification:** source/design/staging only. Static test definitions
are authored; Node and disposable PostgreSQL execution remain downstream.

### Schema repair after DB-034: duplicate export regression

DB-036 also removed an accidentally duplicated chunk of `tpo-collaboration.ts`
that corrupted the trusted-domain SQL check and redeclared several `pgTable`
exports. The retained `placementTpoTrustedDomains` check keeps the frozen
domain-format regexp and free-mail denylist; the seven new static test
definitions assert unique exports, correct nine boolean source defaults and
the two ledger redesign mappings. Inspect these source and schema gates before
building the registered migration. Neither SQL nor Node integration tests are
implicitly certified by this audit.


## CRM canonical-source corruption recovery

A registration-readiness sweep on 2026-10-11 found that parallel staging edits had accidentally reintroduced a malformed/duplicated recruiter-CRM source: `src/db/schema/tpo-crm.ts` had a truncated invite-hash regex plus duplicate activity/follow-up exports, and `db09-tpo-crm-premerge.sql` had duplicate CREATE blocks/functions plus the same truncated CHECK. Chat 3 rebuilt both canonical files from the frozen source contract and retained the stronger tenant/recruiter/follow-up invariants.

W01 must integrate only the clean canonical sources at/after:

- `2495e05501968a57e373651248db7c35340f3178` — rebuilt Drizzle CRM schema.
- `5aabd4122b4fa3d336c94397ee51bda2f5581147` — rebuilt canonical CRM premerge SQL.
- `2ff5928f1c5f572c038d1986924ad96466f5da62` — static guards for Drizzle single-copy integrity and duplicate DDL objects.

The DB09 static guard now protects both TypeScript structural source and staged SQL from this class of concatenation regression. This is authored/read-only evidence, not PostgreSQL replay proof.

## Prep course scope reconciliation

The legacy TPO prep-course selector is organization-scoped, and DB09 normalized settings intentionally preserve that behavior. A later prep-assignment draft had accidentally narrowed the course requirement to the learner's exact college, which would reject a course that the settings contract legally exposes from a sibling college in the same organization.

The canonical prep-assignment trigger at/after `530cc01cb3b1d7df654cf7b799c6fd93dfe7bcb5` now requires:

- active assignment college;
- ACTIVE LEARNER membership in that college;
- ACTIVE course in an unarchived department of any ACTIVE college in the same organization;
- TPO-scoped assigning actor;
- non-past due date.

The static guard compares the settings and assignment drafts so they cannot drift back to conflicting course scopes.
