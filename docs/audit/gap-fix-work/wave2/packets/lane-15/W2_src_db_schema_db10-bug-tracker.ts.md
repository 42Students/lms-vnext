# Work packet (wave 2): edit src/db/schema/db10-bug-tracker.ts

25 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l19-u020-bug-tracker-access.md, docs/audit/gap2/lane-16/u002-tracker-report.md, docs/audit/gap2/lane-16/u003-tracker-issue-detail.md, docs/audit/gap2/lane-16/u004-tracker-issues-index.md, docs/audit/gap2/lane-20/bug-report-attachment.md, docs/audit/gap2/lane-3/bug-report-activity.md

## G2-19-020-007  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugTrackerAccess.java:14-16 — Long auto_increment primary key.
- vNext now: src/db/schema/db10-bug-tracker.ts:18 — UUID random primary key.
- Fix: Map numeric reporter_access_id to UUID for legacy issue history.

## G2-19-020-009  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugTrackerAccess.java:30-36 — LocalDateTime createdAt/updateAt.
- vNext now: src/db/schema/db10-bug-tracker.ts:23-24 — timestamptz createdAt/updatedAt.
- Fix: Convert timezone meaning on migration.

## G2-19-020-011  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugTrackerAccessRepository.java:9-10 — active token/hash or case-insensitive name lookup.
- vNext now: src/db/schema/db10-bug-tracker.ts:26-27 — unique hash and role+active index; name lookup has no dedicated unique index.
- Fix: Add validated display-name search query/index or prohibit impersonating lookup.

## G2-19-020-024  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugTrackerAccess.java:27-28 — access active=true default.
- vNext now: src/db/schema/db10-bug-tracker.ts:22 — active true default but src/modules/bug-tracker/report-service.ts:28 explicitly inserts false.
- Fix: Document inactive-on-intake behavior and activation workflow.

## G2-19-020-035  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugTrackerAccessRepository.java:10 — active reporter-name lookup may scan without specific index.
- vNext now: src/db/schema/db10-bug-tracker.ts:26-27 — token unique plus active/role index, no display_name functional index.
- Fix: Provide case-insensitive name/active index if enrollment used.

## G2-19-020-038  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugTrackerAccess.java:30-36 — local datetime for created/updated.
- vNext now: src/db/schema/db10-bug-tracker.ts:23-24 — timestamptz, DB default now.
- Fix: Normalize UTC/IST on imports.

## G2-19-020-042  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugTrackerAccessRepository.java:9-10 — active hash/name queries; no name uniqueness.
- vNext now: src/db/schema/db10-bug-tracker.ts:25-32 — unique hash and active/role index, no displayName index.
- Fix: Resolve name lookup/index strategy.

## G2-16-002-087  [P2] GAP  facet F22  effort M
- Legacy: `BugReport.java:25-69`; `BugReportCreateRequest.java:9-41`: reporter/account/environment/location/type/description/severity/evidence and optional source fields.
- vNext now: `db10-bug-tracker.ts:59-73`; `report-input-model.ts:6-19`: fields preserved in Drizzle, but sourceUrl/path/browser/viewport cannot be submitted by current form.
- Fix: Either support optional captured source metadata in API/quick report or document retained read-only fields.

## G2-16-003-079  [P2] GAP  facet F22  effort L
- Legacy: `BugReport.java:10-110`: persisted status, resolution, source metadata, issue details, optimistic version.
- vNext now: `db10-bug-tracker.ts:52-115`: equivalent domain fields in Postgres, row id UUID instead of MySQL bigint.
- Fix: Confirm historical report reference migration or approved no-migration, and reflect source metadata.

## G2-16-004-078  [P2] GAP  facet F22  effort M
- Legacy: `BugReport.java:10-110`: same status/environment/reporter/created_at fields with MySQL ID.
- vNext now: `db10-bug-tracker.ts:52-115`: equivalent columns with UUID, timestamptz, version.
- Fix: Maintain old publicID lookup compatibility if historical data imported; owner says no migration might waive.

## G2-20-020-004  [P2] GAP  facet F04  effort M
- Legacy: Long ID, key unique700 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReportAttachment.java:13-21`
- vNext now: UUID, key unique700 `src/db/schema/db10-bug-tracker.ts:138-148`
- Fix: Map IDs

## G2-20-020-022  [P2] GAP  facet F22  effort M
- Legacy: Legacy Long IDs/meta `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReportAttachment.java:9-35`
- vNext now: New UUID plus DB MIME/size checks `src/db/schema/db10-bug-tracker.ts:138-154`
- Fix: Migration crosswalk

## G2-3-021-007  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReportActivity.java:12-37`, `docs/legacy-source/backend/src/main/resources/db/migration/V153__bug_tracker_workflow.sql:13-27`
- vNext now: `src/db/schema/db10-bug-tracker.ts:117-136`
- Fix: Legacy BIGINT event and issue IDs, timestamp DATETIME(6) unzoned; vNext UUID IDs, timestamptz, restrictive issue FK. Specify import identity/timezone mapping.

## G2-3-021-035  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/resources/db/migration/V153__bug_tracker_workflow.sql:23-25`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugReportActivityRepository.java:8-10`
- vNext now: `src/db/schema/db10-bug-tracker.ts:130-131`, `src/modules/bug-tracker/admin-service.ts:246-262`
- Fix: Legacy index issue+createdAt ASC and full fetch; VNext same index but cursor ORDER BY createdAt/id DESC, no compound tie-breaker index. Add index for stable keyset paging.

## G2-3-021-043  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReportActivity.java:20-33`
- vNext now: `src/db/schema/db10-bug-tracker.ts:121-136`
- Fix: Legacy actor_name may be set without user FK, vNext actorUserId or accessId XOR constraint requires resolving historical Engineering/reporter event authors. Supply migration system actor.

## G2-4-021-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy report ID Long and public_id up to24 for direct lookup. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:14-19`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugReportRepository.java:12-14`)
- vNext now: New UUID primary ID and LMS-numeric public ID with case-insensitive unique index. (`src/db/schema/db10-bug-tracker.ts:52-55`; `src/db/schema/db10-bug-tracker.ts:89-91`)
- Fix: Preserve historical public IDs and old route links with safe resolver.

## G2-4-021-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy report holds reporter, context, severity, description, evidence, resolution and retest in one row. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:25-110`)
- vNext now: New split report fields and append-only activity/attachment tables, same core categories. (`src/db/schema/db10-bug-tracker.ts:52-129`)
- Fix: Reconstruct detail sections and activity timeline with exact labels/order.

## G2-4-021-007  [P2] MISSING  facet F03  effort M
- Legacy: Legacy sourceUrl/sourcePath/browser/viewport optional for automatic bug context. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:55-65`)
- vNext now: New report table has columns, but public intake validator lacks these properties and write omits them. (`src/db/schema/db10-bug-tracker.ts:69-72`; `src/modules/bug-tracker/report-input-model.ts:6-20`; `src/modules/bug-tracker/report-service.ts:31-46`)
- Fix: Capture safe browser,viewport and source context from authenticated application.

## G2-4-021-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy evidence_link1000, source_url2000, source_path500, browser500, viewport64. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:52-65`)
- vNext now: New columns same lengths, but intake exposes only evidenceLink. (`src/db/schema/db10-bug-tracker.ts:68-72`; `src/modules/bug-tracker/report-input-model.ts:19-20`)
- Fix: Wire remaining context fields with safe allowlist.

## G2-4-021-032  [P2] GAP  facet F09  effort M
- Legacy: Legacy report intake may attach screenshots, separate BugReportAttachment relation. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:52-65`)
- vNext now: New staged attachment table, screenshot policy PNG/JPEG/WebP <=8MB max3. (`src/db/schema/db10-bug-tracker.ts:138-154`; `src/modules/bug-tracker/access-and-attachments.ts:42-49`)
- Fix: Verify upload UI, provisional grants and screenshot display in report form.

## G2-4-021-056  [P2] GAP  facet F19  effort S
- Legacy: Legacy environment/time count used for alerts. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugReportRepository.java:15-16`)
- vNext now: New indexed environment+createdAt and correlation service exists, count query absent. (`src/db/schema/db10-bug-tracker.ts:95-95`; `src/modules/bug-tracker/tracker-cloud-logs.ts:45-76`)
- Fix: Use index to implement scoped efficient environment count.

## G2-4-021-058  [P2] GAP  facet F20  effort M
- Legacy: Legacy publicId unique varchar24 and case-insensitive lookup. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:18-19`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugReportRepository.java:12-14`)
- vNext now: New lowercase unique index and random generated decimal public ID. (`src/db/schema/db10-bug-tracker.ts:90-90`; `src/modules/bug-tracker/report-service.ts:20-21`)
- Fix: Handle public ID collision retries and format historical ids.

## G2-4-021-063  [P2] GAP  facet F22  effort M
- Legacy: Legacy original schema JPA timestamps LocalDateTime, no timezone. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:97-110`)
- vNext now: New timestamps withTimezone, createdAt/updatedAt default now. (`src/db/schema/db10-bug-tracker.ts:85-88`)
- Fix: Define IST/source zone on migration to prevent wrong incident chronology.

## G2-4-021-065  [P2] GAP  facet F22  effort M
- Legacy: Legacy publicId max24 nullable unique JPA field, likely populated by service. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:18-19`)
- vNext now: New notNull public ID and lowercase unique index. (`src/db/schema/db10-bug-tracker.ts:53-55`; `src/db/schema/db10-bug-tracker.ts:89-91`)
- Fix: Backfill missing/duplicate legacy IDs with logged reconciliation.

## G2-8-031-068  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:~20-160 normalized bug_report with independent reporter and progress; activities/attachments from bug tracker.
- vNext now: src/db/schema/db10-bug-tracker.ts:52-155 bug_reports plus bug_report_activities/attachments; normalized UUID ids, status/attestations and indexes.
- Fix: Document legacy bug status/attachment field mapping and migration consequences; no data migration expected but functional parity required.
