# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-7-014-016 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LFE/dto/projects/ProjectSprintDTO.java:8-42 includes sprintKey, dueLabel, sprintState, releaseKey, progress, taskCount, completedTaskCount, created/updated by
- Expected fix: Document full DTO field mapping; preserve dueLabel and historical attribution in view projection

## G2-7-015-030 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:316-356 sends only touched fields, classId 0 means detach
- Expected fix: Implement dirty-field-only PATCH or robust full-state CAS with selective updates

## G2-7-016-035 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:68-79 materializeSectionKeys maps provisional sprint/task links before save
- Expected fix: Map old sprint/task keys to stable UUIDs losslessly

## G2-7-017-027 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:363-369 students modal defaults replaceExisting false (append)
- Expected fix: Offer append mode by default with replace optional; retain explicit full-replace mode

## G2-7-018-016 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:127-128 recoverableContent controls warning for full vs partial restoration
- Expected fix: Track legacy recoverability and warn when old edits not recoverable

## G2-7-027-004 [P1] GAP facet F01
- Files: src/app/(authenticated)/mentor/projects/[projectId]/page.tsx
- Legacy: PDC:838-871 delivery query maps Overview and opens final submission modal once
- Expected fix: Open final submission review once on delivery deeplink, respect closing

## G2-7-028-030 [P1] GAP facet F05
- Files: src/components/projects/project-participant-list-controls.tsx
- Legacy: ProjectsContent.jsx:293-296 attention Needs my review or Blocked
- Expected fix: Accept old ?attention=BLOCKED link and offer Blocked option

## G2-7-033-018 [P1] GAP facet F05
- Files: src/components/projects/super-admin-template-college-bulk.tsx
- Legacy: colleges.js:286-293 selected Table rows persist across 10-row pagination
- Expected fix: Preserve selected colleges across multiple pages and clear scope

## G2-7-033-024 [P1] GAP facet F06
- Files: src/components/projects/super-admin-template-college-bulk.tsx
- Legacy: colleges.js:141-163 bulk selected assigned/unassigned, refresh+CAS snapshot before write
- Expected fix: Provide versioned batch CAS or equivalent concurrent change reconciliation

## G2-7-033-036 [P1] GAP facet F10
- Files: src/components/projects/super-admin-template-college-bulk.tsx
- Legacy: colleges.js:148-155 bulk reads current set then compare-and-set whole list
- Expected fix: Decide atomic batch vs partial per-college behavior and collision handling

## G2-7-033-038 [P1] GAP facet F11
- Files: src/modules/projects/template-college-availability-service.ts
- Legacy: colleges.js:24-26 assignment is platform-wide, ignores header selected college
- Expected fix: Honor Super Admin global assignment management regardless of selected college, while checking row permissions

## G2-7-033-044 [P1] GAP facet F12
- Files: src/components/projects/super-admin-template-college-bulk.tsx
- Legacy: colleges.js:148-156 CAS against latest full set for bulk
- Expected fix: Test concurrent admin bulk updates do not overwrite unrelated assignments

## G2-7-033-062 [P1] GAP facet F20
- Files: src/components/projects/super-admin-template-college-bulk.tsx
- Legacy: colleges.js:141-163 bulk CAS latest assignment set
- Expected fix: Compare audit order and partial retries to atomic legacy bulk semantics

## G2-7-035-037 [P1] MISSING facet F09
- Files: src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx
- Legacy: overview.js:761-795 Template preview Modal width820
- Expected fix: Restore 820px read-only preview dialog and six-row loading skeleton

## G2-8-027-008 [P1] GAP facet F03
- Files: (none, new feature)
- Legacy: Legacy status SCHEDULED,CONFIRMED,RESCHEDULE_REQUESTED,COMPLETED,CANCELLED,NO_SHOW (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:49-58).
- Expected fix: Define distinct booking/learner confirmation/reschedule/completion status projection.

## G2-8-027-057 [P1] GAP facet F23
- Files: src/modules/placements/learner-round-confirmation-service.ts
- Legacy: Legacy confirms learner interview via standalone interview lifecycle statuses (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:731-793).
- Expected fix: Define explicit lifecycle mapping for old confirmed and reschedule requested states.

## G2-11-030-011 [P1] GAP facet F05
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx
- Legacy: 112-128 nine status tabs, default ALL or ASSESSMENT shortlisted; select-all matching cap3000
- Expected fix: Map old APPLIED/ASSESSMENT/INTERVIEW/OFFERED state tabs and counts.

## G2-19-028-007 [P1] GAP facet F07
- Files: src/modules/projects/meeting-service.ts
- Legacy: RepeatingItemEditor.jsx:253-275 max500 row validator
- Expected fix: Map batch errors to row

## G2-19-028-010 [P1] GAP facet F10
- Files: src/modules/projects/meeting-service.ts
- Legacy: meetings.js:66-72 PUT meetingsList and meetingsToken
- Expected fix: Offer guarded batch compatibility

## G2-8-017-037 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LBE/controller/AdminProjectTemplateController.java:304-323,392-433 DELETE archive, POST publish/unpublish
- Expected fix: Check archive with active college assignments; surface guard and workflow to revoke before archive.

## G2-8-026-040 [P1] GAP facet F12
- Files: src/modules/placements/public-join/preview-service.ts
- Legacy: Legacy token may be long-lived until rotated/disabled; no expiresAt in live lookup (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CollegePublicLinkService.java:232-238).
- Expected fix: Decide retirement/rotation of valid legacy unlimited links rather than expiring imported links silently.

## G2-8-009-002 [P1] GAP facet F01
- Files: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx
- Legacy: course slug or numeric course ID from Redux, with slug first (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:37-45`)
- Expected fix: Preserve legacy slug/course-ID deep links through scoped resolver and canonical delivery redirect

## G2-8-030-041 [P1] GAP facet F12
- Files: src/modules/placements/super-admin-bulk-drive-service.ts, src/components/placements/super-admin-bulk-drive-actions.tsx
- Legacy: Old delete preflight warns active applications and interviews, preserves app records and sends notice docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:421-450.
- Expected fix: Distinguish destructive delete from close/offer withdrawal, verify data handling.

## G2-8-024-065 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: Legacy arbitrary capability grant per college and indefinite validity available (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:56-61,136-146).
- Expected fix: Document explicit product retirement of indefinite custom-capability grants if intentional.

## G2-8-022-019 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: Legacy permits NULL endDate for open season start (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:27-40).
- Expected fix: Support legitimate open-ended season or owner-approved mandatory end-date rule.
