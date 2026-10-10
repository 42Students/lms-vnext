# DB10 shared operational persistence — Chat 5 source contract

**Task:** DB-013 · **Phase:** DATABASE · **Status:** PARTIAL SOURCE RECONCILIATION, NOT RUNTIME VERIFIED  
**Legacy backend oracle:** `42Students/lms@prod-2026` `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy frontend oracle:** `42Students/lms2-fe@prod-2026` `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`  
**Source census:** `docs/planning/db-pass4-columns-db10_shared_operations.json` — 19 tables / 221 candidate fields.

This is source evidence, not PostgreSQL acceptance. No migration replay, lint, typecheck, unit, integration, build or browser result is claimed here.

## 1. Active skill catalog is a real persisted product contract

The DB10 census lists `skills`, `skill_synonyms` and `skill_usage`. These are not dead historical tables.

Legacy runtime producers/consumers prove active behavior:

- `SkillRepository.searchSkillsRanked` queries `skills` and ranks exact/prefix/contains matches using `usage_count` and `search_priority`.
- `SkillSearchService` exposes ranked search, category lookup, fuzzy fallback, synonym search, popularity and async usage increments.
- `SkillSynonymRepository` and `SynonymDataLoader` persist alternate terms such as `js → javascript`; loader behavior treats a synonym as globally unique.
- `SkillsSearchController /api/v2/skills` exposes search, popular, category, exists and selection endpoints.
- `SkillUsageTracker` creates/reads/writes a separate `skill_usage(skill_name, usage_count, last_used)` table and drives v2 popularity.

Before this DB-013 pass the vNext source tree had no file path containing “skill”, so there was no persisted equivalent.

### Staged greenfield redesign

`src/db/schema/db10-skills-catalog.draft.ts` now defines an **unregistered** candidate:

- canonical `skills` table with normalized name, display name, category, active flag, usage count, search priority and `last_used_at`;
- `skill_synonyms` with FK to the canonical skill and case-insensitive global synonym uniqueness;
- PostgreSQL checks for nonblank names, non-negative usage and source priority range 0–100.

Because vNext has no legacy data migration, the duplicated legacy counters are deliberately collapsed: both old `skills.usage_count` and v2 `skill_usage.usage_count/last_used` become one canonical skill popularity state. API work must make every selection path perform an atomic `usage_count = usage_count + 1, last_used_at = now()` update. This is **REDESIGNED**, not an exact table clone.

Chat 1 must review/register the final schema and migration. The draft is intentionally not exported from `src/db/schema/index.ts`.

## 2. Notification-template tables must not be blindly recreated

The source census contains both `notification_template` and `lms_notification_template`, each with 28 historical fields including channel, language, version, subject/body/html, external template ID, DLT IDs, example data, active/default flags and actor metadata.

However current legacy runtime evidence points elsewhere:

- `NotificationEventRegistry` explicitly describes itself as **“In-code notification configuration per event: channels and in-app content. No DB or CSV.”**
- `NotificationDispatcherServiceImpl` reads in-app content from that registry and obtains email template IDs through `ZeptoMailTemplateIdResolver`.
- TPO mail/SMS paths use environment/provider template configuration.
- `notification_templates.csv` exists as a resource, but the reviewed source tree exposes no `NotificationTemplate` JPA entity, repository or notification-template data-loader class.

Therefore both 28-field tables are **candidate historical/dead configuration persistence**, not automatically active product state. Do not create 56 fields merely because they appear in the historical snapshot. DB-019 must perform an exhaustive raw-SQL/reference scan before assigning `RETIRED_APPROVED`; until then they remain UNVERIFIED, not retired.

Provider template identifiers and DLT metadata that are still operational must be mapped either to deployment configuration/secret management or a deliberate persisted template registry with versioning. They must not be silently lost.

## 3. Legacy SMS delivery audit is not equivalent to the current recruiter outbox draft

Legacy `V134__sms_delivery_log.sql` persists one audit row per SMS attempt:

- purpose;
- recipient suffix only (not full phone number);
- `SENT` means provider accepted, **not handset delivered**;
- provider message ID;
- safe failure summary;
- optional college;
- created timestamp.

The migration deliberately excludes message body and full phone number for privacy.

Current `db10-outbound-messages.draft.ts` is a stronger encrypted transactional outbox, but it is currently constrained to recruiter invitation template keys and cannot be declared the complete equivalent of generic `sms_delivery_log`. It also distinguishes provider accepted/delivered states more precisely.

Required DB10 decision: either broaden the outbox/delivery-attempt model to every SMS producer or preserve a separate privacy-minimized delivery-attempt projection. In both cases support must be able to answer “was this provider-accepted, when, for what purpose, and what safe failure/provider ID was recorded?” without exposing the raw message or phone number.

## 4. Scheduled-job lease draft is a legitimate redesign, pending producer proof

Legacy `V135__scheduled_job_lock.sql` exists because every Spring replica otherwise executes every scheduled notification job. It persists `job_name`, `locked_until`, nullable `locked_by` and `updated_at`.

`db10-scheduled-job-leases.draft.ts` keeps the lease expiry semantics and adds a positive fencing token. This is a defensible stronger design, but it is only a draft. Acceptance requires a real lease-acquire/renew/release producer with stale-holder fencing tests on PostgreSQL; table presence alone is insufficient.

## 5. Current generic tables are only partial mappings

### `admin_audit_log → activity_events`

`activity_events` captures tenant scope, actor UUID/membership, module/event/subject/summary, metadata and time. Legacy `admin_audit_log` also persists actor user type, contact-mobile snapshot, IP address, user agent and action payload.

Do not mark all 13 source fields mapped until privacy/security policy decides which request-context fields must remain explicit, which belong in constrained metadata, and what retention/redaction applies.

### `app_setting → module_access_rules`

Legacy `AppSetting` is an arbitrary scoped key/value store across GLOBAL / organization / college / department / program / batch / class / learner. `module_access_rules` is a typed boolean module gate for only projects/placements/electives. It is not a generic app-setting equivalent.

Every active legacy setting key must be individually mapped to a typed vNext domain setting, external deployment config, or approved retirement. Re-creating an unrestricted string key/value dump should be avoided unless a real consumer requires it.

### `notification → in_app_notifications`

vNext correctly improves read state by materializing one row per user/event. Legacy itself documents that a class-wide notification's single `is_read` column cannot represent per-recipient reads. But legacy schedule/delivery retry state and domain deep-link context are separate persisted concepts and need explicit mapping to activity/outbox/domain references rather than being assumed covered by title/body/action href.

### `announcements`

`db10-announcements.draft.ts` is a dedicated scheduled/expiring/pinned/soft-delete candidate and is structurally closer to legacy announcements than `in_app_notifications`. It remains unregistered and tenant-target FKs/receiver type semantics need PostgreSQL proof.

## 6. Still-open DB10 source groups

The following source concepts remain unresolved enough that DB-013 must stay IN_PROGRESS:

- log alert signature/state/account blast-radius and triage memory;
- bug tracker drafts versus all V151–V154 fields and workflow constraints;
- notification scheduling/retry/deletion/deep-link persistence;
- generic outbound/SMS delivery audit;
- arbitrary app settings disposition;
- admin audit request-context/privacy retention;
- notification template historical-table retirement proof;
- announcements target FK enforcement;
- exact 221-field row-by-row disposition.

## 7. Acceptance gate for this batch

DB-013 can become **COMPLETED (unverified)** only after every one of the 221 source fields has a source-backed candidate/disposition and every active relational/state concept has either an implementation/draft handoff or explicit downstream owner. It cannot become `DONE_VERIFIED` until registered migrations replay from zero on disposable PostgreSQL and negative/producer-consumer tests pass.

The skills draft authored here has **not** been exported, migrated or executed.
