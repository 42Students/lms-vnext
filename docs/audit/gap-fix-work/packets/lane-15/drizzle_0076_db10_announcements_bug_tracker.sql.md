# Work packet: edit drizzle/0076_db10_announcements_bug_tracker.sql

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l19-u020-bug-tracker-access.md, docs/audit/gap2/lane-19/bug-tracker-access-entity.md

## G2-19-020-041  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugTrackerAccess.java:12-37 — bug_tracker_access numeric ID, hash unique, role, active, two LocalDateTime fields.
- vNext now: src/db/schema/db10-bug-tracker.ts:17-32 and drizzle/0076_db10_announcements_bug_tracker.sql:99-109 — PostgreSQL UUID, varchar caps, bool, timestamptz, hash/role checks.
- Fix: Migrate account access IDs safely; exclude seeded fixed token hashes.

## G2-19-020-057  [P1] GAP  facet F22  effort L
- Legacy: Old bug_tracker_access JPA Long ID, display_name120, token_hash64 unique, role24, active boolean, timestamp local. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugTrackerAccess.java:14-36`
- vNext now: vNext SQL registered UUID ID, same lengths, role CHECK, hex token hash CHECK and timestamptz. `drizzle/0076_db10_announcements_bug_tracker.sql:99-109` `drizzle/0076_db10_announcements_bug_tracker.sql:144-145`
- Fix: Backfill grant IDs/hashes/roles/timestamps; reject nonhex legacy hashes to review rather than silently discard.

## G2-19-020-058  [P1] GAP  facet F22  effort L
- Legacy: Old bug_report.reporter_access_id references bug_tracker_access old Long ID. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:21-26`
- vNext now: vNext bug_reports.reporter_access_id UUID restrict and reporterUserId optional. `src/db/schema/db10-bug-tracker.ts:52-61` `drizzle/0076_db10_announcements_bug_tracker.sql:129-132`
- Fix: Migrate linked reports and activities in one referentially safe transaction; preserve unknown reporter ownership.

## G2-19-020-059  [P1] GAP  facet F22  effort M
- Legacy: Old no explicit access_role enum values or tokenHash regex in model. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugTrackerAccess.java:21-28`
- vNext now: vNext PostgreSQL requires REPORTER/MANAGER and /^[0-9a-f]{64}$/ hash. `drizzle/0076_db10_announcements_bug_tracker.sql:99-109`
- Fix: Inventory legacy values and normalize before applying checks or runtime writes.
