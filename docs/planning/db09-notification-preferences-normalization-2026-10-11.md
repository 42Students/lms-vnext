# DB-036 — TPO notification switches and personal preference persistence

**Worker:** Chat 3 · **Phase:** DATABASE · **Date:** 2026-10-11  
**Status:** source-backed Drizzle domain schema staging; **unregistered/unreplayed, not DB-verified**  
**Legacy BE oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Sources:** `V165__tpo_v1_complete.sql`, `TpoSettingsHubService.java`, `NotificationOutboxService.java`  
**Target structural model:** `src/db/schema/tpo-collaboration.ts` (only Chat 1 integrates the shared migration journal/barrel).  
**Test definitions:** `tests/db09-notification-preferences-normalization.test.mjs`.

## Core source semantics and the normalized contract

The two frozen legacy JSON blobs contain **closed, boolean-only preference sets**. Generic JSONB does not enforce these keys, types or source defaults and allows accidental new toggles without a deliberate business decision. The new data model is independently queryable and constrained.

### College TPO settings — outbound optional notices

The frozen `TpoSettingsHubService.TOGGLE_KEYS` permits exactly four switches. The legacy GET projects all switches as `true` when the settings row or JSON keys are missing. Save is *per-key merge*: a submitted boolean replaces the old value, missing or nonboolean values preserve the old value.

| Legacy API key | Normalized Drizzle field | SQL column | Initial value |
| --- | --- | --- | --- |
| `driveOpenEmail` | `notifyDriveOpenEmail` | `notify_drive_open_email` | `TRUE` |
| `resultApplied` | `notifyResultApplied` | `notify_result_applied` | `TRUE` |
| `nudges` | `notifyNudges` | `notify_nudges` | `TRUE` |
| `prepAssigned` | `notifyPrepAssigned` | `notify_prep_assigned` | `TRUE` |

The source `NotificationOutboxService.OPTIONAL_EVENT_SWITCH` **actively consumes** these values:
- `DRIVE_PUBLISHED` and `DRIVE_UPDATED` → `driveOpenEmail`
- `APPLICATION_STATUS_CHANGED` and `NOW_INELIGIBLE` → `resultApplied`
- `NUDGE` → `nudges`
- `PREP_ASSIGNED` → `prepAssigned`

When an optional event has **exactly false** for its switch, its optional delivery is suppressed. No settings row means enabled. All other notices remain always-on; changing these columns must **never** suppress mandatory round/offer/deadline/cancellation notices. Legacy SMS-cap semantics are a separate concern and are not widened by this schema refactor.

**API wave contract:** expose the historical `notificationToggles` object with exactly the same four camelCase keys, backed by the four boolean columns. Transactionally merge partial updates instead of replacing all values with defaults. The database migration does not implement or verify this producer/consumer cutover.

### Personal TPO preferences — saved user choices

The frozen `TpoSettingsHubService.myPrefs` and `saveMyPrefs` persist exactly five boolean choices; missing row yields the defaults below. Writes merge known keys, accepting only booleans. The legacy service reads JSON on GET and writes it on PUT; **the inspected source does not establish that actual notification dispatch uses these personal values**. Do not invent that guarantee as part of this DB phase.

| Legacy API key | Normalized Drizzle field | SQL column | Initial value |
| --- | --- | --- | --- |
| `morningDigest` | `morningDigest` | `morning_digest` | `FALSE` |
| `recruiterMessages` | `recruiterMessages` | `recruiter_messages` | `TRUE` |
| `requests` | `requests` | `requests` | `TRUE` |
| `resultsReady` | `resultsReady` | `results_ready` | `TRUE` |
| `followUps` | `followUps` | `follow_ups` | `TRUE` |

VNext uses the existing composite primary key `(college_id, user_id)` for the personal row; only an appropriately scoped TPO user may read/write. Keep the college identifier derived from the current authorized membership or reject an arbitrary unrelated college. Do not flatten to a global `user_id` key and allow one college to change another college's preferences.

**API wave contract:** still return the same five camelCase properties; write partial boolean updates without erasing unaffected values. On GET, missing row yields the documented defaults. These rules are **not** proof of legacy personal preference delivery enforcement.

## Existing schema corruption repaired in the same claimed file

Before DB-036, the latest `src/db/schema/tpo-collaboration.ts` contained an **unterminated trusted-domain SQL regexp** followed by approximately 216 repeated lines: duplicated declarations for personal preferences, saved views, student notes, team members, recruiter notes and notification reads. This was a real source-integrity problem, not a design preference.

DB-036 surgically removed the duplicate block and completed the frozen trusted-domain regexp `^[a-z0-9.-]+[.][a-z]{2,}$`. Exactly one declaration remains per exported table, and the trusted-domain free-email denylist remains in the retained canonical check. The new regression file specifically checks both invariants. No unrelated SQL migration, recruiter policy service or production database was touched.

## W01/Chat 1 integration gates

1. **Model and migration alignment:** generate/register `placement_tpo_college_settings` with four named `boolean NOT NULL DEFAULT true` columns and `placement_tpo_user_preferences` with five named `boolean NOT NULL` columns matching the table above. Do not recreate `notify_toggles` or `preferences` JSONB as competing writers. Keep unrelated flexible `job_types` and `outcome_labels` JSONB, their constraints and existing college/user FK/PK.
2. **Dependency registration:** this is an unregistered vNext structural contract. Integrate after `colleges` and `users`; reconcile adjacent DB09 trusted-domain/prep-course tables and their source guards in the same canonical schema to avoid Drizzle drift. This is greenfield: no historical MySQL data migration or JSON backfill is required.
3. **Database negatives on disposable PostgreSQL:** check each column type is `boolean`, `NOT NULL`, has the exact default, rejects `NULL`, has no legacy JSONB target, and `(college_id, user_id)` prevents duplicate preference rows. Verify missing company settings rows remain logically default-true on API read, even if no settings record exists.
4. **Tenant and principal witnesses:** a recruiter or unrelated user must not update TPO college switches, and a college A actor must not read or mutate college B personal settings. Direct SQL role permissions or RLS checks must be evaluated separately from service guards.
5. **Concurrency and partial updates:** submit two racing partial writes and prove one key update does not reset another key; ensure the eventual API transaction uses a correct conflict/version strategy. Do not interpret two independent Boolean defaults as a complete merge implementation.
6. **Dispatcher and user-choice parity:** test all six optional event→switch cases, mandatory notices unaffected by switches, and exact personal choice read/write roundtrips. Do not assert the personal choices change delivery behavior unless the producer/consumer evidence actually establishes it.

## Source ledger and proof state

`docs/planning/database-parity-db09-field-ledger.json` rows `DB09-TPO_COLLEGE_SETTINGS-12` and `DB09-TPO_USER_PREFS-02` are now `REDESIGNED` with comma-delimited exact normalized target columns. **279/279** original source candidates have disposition records: **195 MAPPED, 84 REDESIGNED**, **0 DB/runtime or workflow verified**. No retirement was silently introduced.

Seven Node static regression definitions were authored. Running `node --test tests/db09-notification-preferences-normalization.test.mjs` in a suitable checkout and the full independent migration harness is still required; do not claim a passed Node suite or PostgreSQL until executed and evidenced. GitHub Actions billing is intentionally not a blocker.
