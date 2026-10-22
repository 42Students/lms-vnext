# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## [x] G2-7-002-020 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/audit/index.js:275-280,81-99: Destructive actions count exact listed action keys, including mentor/student reassignment and readiness override.
- Expected fix: Maintain explicit mapped destructive taxonomy and count raw items, including overrides and assignments.

## [x] G2-7-004-032 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:592-606: release failure shows `Couldn't load releases`, leaves readiness visible.
- Expected fix: Isolate optional releases failure and show its alert without crashing readiness.

## [x] G2-7-007-005 [P1] GAP facet F02
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:87-112: one Card with intro, four metrics, filter row then table.
- Expected fix: Recreate Resource activity Card with counters and 4-column data table.

## [x] G2-7-009-015 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/index.js:11-14: Summary consumes from/reason/openTemplate context from all deep links.
- Expected fix: Ensure downstream summary action/At-risk context restored from query.

## [x] G2-7-011-042 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:94-101: blank goal explicitly sent to clear while unknown facts retained.
- Expected fix: Test clearing a template-derived goal and retaining any unknown overview keys.

## [x] G2-7-013-042 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/resources.js:55-57: resourcesToken stale snapshot used for whole section CAS
- Expected fix: Specify conflict handling for concurrent add/remove/reorder vs legacy section snapshot

## [x] G2-7-014-069 [P1] GAP facet F20
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:78-83,97-110 client IDs stamped, fresh siblings, sprintsToken CAS
- Expected fix: Write concurrency tests for title rename, key remap and simultaneous editors

## [x] G2-7-015-055 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:595-608 hand progress only when no tasks/sprints
- Expected fix: Compute derived server/display, lock manual override with work present

## [x] G2-7-016-069 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LFE/dto/projects/ProjectWorkspaceUpdateDTO.java:20,33-35 tasks array + tasksToken
- Expected fix: Preserve array order, key uniqueness and section CAS

## [x] G2-7-017-052 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:265-282 append is default, replacement only when explicit checkbox selected
- Expected fix: Make default operation additive and preserve existing members

## [x] G2-7-018-060 [P1] GAP facet F19
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:47-59 GET paginated on server, page size 20
- Expected fix: Implement efficient tenant-indexed deleted count and list

## [x] G2-7-033-065 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: colleges.js:74-76 numeric template id, college numeric ID assignment state array
- Expected fix: Build old numeric/slug -> UUID template/college and pinned version crosswalk

## [x] G2-8-021-017 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: Legacy teacher load is scoped by classId and course ID/slug and facultyId (docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:43-66).
- Expected fix: Keep a visible class-course-faculty mapping and prevent silently selecting the wrong term/delivery.

## [x] G2-8-019-005 [P1] GAP facet F03
- Files: src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:19-35 old/new/status, when, actor, reason
- Expected fix: Show reason/actor in authorized TPO timeline; redact for learner where appropriate.

## [x] G2-12-012-004 [P1] GAP facet F04
- Files: src/modules/placements/public-join/send-code-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/MailDomainResolver.java:5-15 returns ACCEPTS_MAIL, NO_MAIL, UNKNOWN
- Expected fix: Define shared tri-state domain outcome with explicit error mapping and documented callers

## [x] G2-12-012-009 [P1] GAP facet F07
- Files: src/modules/placements/public-join/send-code-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:44-62 catches all other naming/runtime failures as UNKNOWN
- Expected fix: Do not reject otherwise-valid company address for transient DNS failure; fail open or defer verification per product decision

## [x] G2-12-012-012 [P1] GAP facet F10
- Files: src/modules/placements/public-join/send-code-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:45-66 JNDI queries MX, falls back to A and AAAA
- Expected fix: Check A and AAAA fallback after absent MX before NO_MAIL

## [x] G2-12-012-017 [P1] GAP facet F12
- Files: src/modules/placements/public-join/send-code-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/MailDomainResolver.java:10-15 UNKNOWN is neither acceptance proof nor definite NO_MAIL
- Expected fix: Preserve tri-state uncertainty semantics in all call sites

## [x] G2-12-012-018 [P1] GAP facet F13
- Files: src/modules/placements/public-join/send-code-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:28-35 repeats lookup if cache expired and leaves UNKNOWN uncached
- Expected fix: On temporary DNS outage show retryable state and permit continuation when safe

## [x] G2-12-012-026 [P1] GAP facet F20
- Files: src/modules/placements/public-join/send-code-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:50-52 MX OR A OR AAAA; NO_MAIL only if all absent
- Expected fix: Support valid A/AAAA-only domains rather than false negative

## [x] G2-15-026-018 [P1] MISSING facet F06
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:509-548 internalNotes accepts string or null and numeric optimistic version
- Expected fix: Build notes form with max length policy and current revision

## [x] G2-8-026-014 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Legacy recruiter identifies by contactMail and firstName/lastName, phone, designation (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CollegePublicLinkService.java:55-63,202-213).
- Expected fix: Define exact name split and historic recruiter email ID crosswalk.

## [x] G2-8-030-006 [P1] GAP facet F03
- Files: src/app/(authenticated)/admin/placements/drives/page.tsx, src/components/placements/super-admin-bulk-drive-actions.tsx
- Legacy: Old Create Job, View Applications, Edit, Open/Close, Delete per row docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:566-610,719-721.
- Expected fix: Restore direct edit/delete and view applications row actions.

## [x] G2-8-030-010 [P1] GAP facet F04
- Files: src/app/(authenticated)/admin/placements/drives/page.tsx, src/modules/placements/admin-drive-directory-model.ts
- Legacy: Old deadline from applicationDeadline or importantDates.find label application deadline, format DD MMM YYYY, missing — docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:195-203,27-39.
- Expected fix: Backfill legacy importantDates-deadline fallback before dropping old source.

## [x] G2-8-030-031 [P1] GAP facet F09
- Files: src/components/placements/super-admin-bulk-drive-actions.tsx
- Legacy: Old Delete impact Modal shows job title, counts and learner notice warning docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:421-460.
- Expected fix: Preserve separate delete impact and confirmation, never equate close with delete.


Lane chat-11 verification: legacy/vNext source review completed for all 25 rows. Existing implementations confirmed include release-error isolation, four-metric resource audit, deep-link query preservation, overview merge of unknown keys, resource-library CAS, sprint row-version concurrency, derived progress lock, additive learner roster, scoped deleted pagination, historical template ID mapping, scoped faculty-delivery navigation, tri-state mail DNS, staff-only notes/history, and distinct delete-impact UX. Repaired destructive taxonomy, actor timeline attribution, legacy deadline display fallback, duplicate sprint/task keys, and 20-row deleted-workspace default. Intentional parity distinction: secure vNext applicant notes are versioned with staff-only history rather than destructive overwrite.
