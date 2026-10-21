# Work packet: edit src/db/schema/db10-bug-tracker.ts

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l19-u020-bug-tracker-access.md, docs/audit/gap2/lane-16/u002-tracker-report.md, docs/audit/gap2/lane-16/u003-tracker-issue-detail.md, docs/audit/gap2/lane-19/bug-tracker-access-entity.md, docs/audit/gap2/lane-3/bug-report-activity.md, docs/audit/gap2/lane-4/bug-report-model.md

## G2-19-020-041  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugTrackerAccess.java:12-37 — bug_tracker_access numeric ID, hash unique, role, active, two LocalDateTime fields.
- vNext now: src/db/schema/db10-bug-tracker.ts:17-32 and drizzle/0076_db10_announcements_bug_tracker.sql:99-109 — PostgreSQL UUID, varchar caps, bool, timestamptz, hash/role checks.
- Fix: Migrate account access IDs safely; exclude seeded fixed token hashes.

## G2-16-002-086  [P1] GAP  facet F22  effort L
- Legacy: `BugReport.java:10-110`: MySQL `bug_report` bigint identity, local timestamps and @Version; `BugReportAttachment.java:9-35` bigint FK.
- vNext now: `db10-bug-tracker.ts:52-115,138-154`: PostgreSQL `bug_reports` UUID, timestamptz, integer version, UUID attachment FK.
- Fix: Document ID mapping for migrated report references and verify schema constraints before enabling new record forms.

## G2-16-002-088  [P1] GAP  facet F22  effort M
- Legacy: `BugTrackerService.java:44-49`: links to active existing reporter access.
- vNext now: `report-service.ts:24-29`; `db10-bug-tracker.ts:17-30`: creates inactive throwaway access row per report.
- Fix: Define proper retained reporter identity and storage lifecycle; avoid unbounded inactive credential rows.

## G2-16-002-089  [P1] GAP  facet F22  effort L
- Legacy: `BugReportAttachment.java:11-35`; `BugTrackerAttachmentService.java:130-136`: attachment metadata and storage key persisted.
- vNext now: `db10-bug-tracker.ts:138-154`: matching schema fields, but intake form has no producer.
- Fix: Wire persistent attachment inserts after validated signed object confirmation.

## G2-16-003-080  [P1] GAP  facet F22  effort L
- Legacy: `BugReportAttachment.java:9-35`: attachments store key/original name/type/size.
- vNext now: `db10-bug-tracker.ts:138-154`; `admin-service.ts:263-274`: same metadata, deliberately no download URL.
- Fix: Preserve storage authorization yet enable viewer-scoped signed thumbnails, not raw public objects.

## G2-19-020-052  [P1] GAP  facet F19  effort M
- Legacy: Old ByTokenHash and ByDisplayName repository are single-result Optional queries. `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugTrackerAccessRepository.java:8-10`
- vNext now: vNext token hash unique index, displayName not unique, reporter uses immutable user association. `src/db/schema/db10-bug-tracker.ts:17-32` `src/modules/bug-tracker/reporter-service.ts:12-24`
- Fix: Handle duplicate display names safely; never resolve ownership from ambiguous name.

## G2-19-020-058  [P1] GAP  facet F22  effort L
- Legacy: Old bug_report.reporter_access_id references bug_tracker_access old Long ID. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:21-26`
- vNext now: vNext bug_reports.reporter_access_id UUID restrict and reporterUserId optional. `src/db/schema/db10-bug-tracker.ts:52-61` `drizzle/0076_db10_announcements_bug_tracker.sql:129-132`
- Fix: Migrate linked reports and activities in one referentially safe transaction; preserve unknown reporter ownership.

## G2-3-021-041  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReportActivity.java:11-37`, `docs/legacy-source/backend/src/main/resources/db/migration/V153__bug_tracker_workflow.sql:13-27`
- vNext now: `src/db/schema/db10-bug-tracker.ts:117-136`, `src/db/schema/index.ts:75-75`
- Fix: Legacy singular bug_report_activity with FK CASCADE vs vNext plural bug_report_activities FK RESTRICT, UUID ids and actor provenance check; migration needs explicit remap and retention policy.

## G2-4-021-001  [P1] GAP  facet F01  effort M
- Legacy: Legacy BugReport JPA entity backs bug tracker report intake and Super Admin issue views. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:10-23`)
- vNext now: New db10BugReports plus report/admin services, guarded by DB10_TRACKER_READY runtime flag. (`src/db/schema/db10-bug-tracker.ts:52-89`; `src/modules/bug-tracker/report-service.ts:18-31`; `src/modules/bug-tracker/readiness.ts:1-13`)
- Fix: Verify migration applied and runtime flag active before claiming equivalent read/write.

## G2-4-021-040  [P1] GAP  facet F11  effort L
- Legacy: Legacy reporterAccess may be external link-based session. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:21-23`)
- vNext now: New schema designs hashed tokens and sessions, but intake intentionally issues none. (`src/db/schema/db10-bug-tracker.ts:17-50`; `src/modules/bug-tracker/report-service.ts:12-16`)
- Fix: Do not grant unverified external reporter access; seek owner-approved auth design.

## G2-4-021-062  [P1] GAP  facet F22  effort L
- Legacy: Legacy bug_report single table Long ID, publicId, access FK, workflow fields and JPA version. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:10-110`)
- vNext now: New bug_reports UUID and same most fields with version+check constraints; activities/attachments separate. (`src/db/schema/db10-bug-tracker.ts:52-155`)
- Fix: Produce full legacy-to-DB10 field mapping including old IDs/attachments.

## G2-4-021-029  [P2] GAP  facet F08  effort S
- Legacy: Legacy report create success has publicId and workflow initial state. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:18-19`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:67-68`)
- vNext now: New creates status NEW and returns publicId only. (`src/modules/bug-tracker/report-service.ts:20-55`; `src/db/schema/db10-bug-tracker.ts:73-74`)
- Fix: Include created state and user-facing confirmation for old consumer.
