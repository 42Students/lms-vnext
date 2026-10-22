# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-11-006-080 [P1] GAP facet F23
- Files: src/modules/placements/tpo-audit-model.ts
- Legacy: Old About categories GENERAL/BULK/SETTINGS/RECRUITER_LEAD/STUDENT and others. `docs/legacy-source/frontend/src/pages/tpo/audit.js:18`
- Expected fix: Keep old facet vocabulary plus approved new kinds.

## G2-11-008-017 [P1] MISSING facet F03
- Files: src/modules/placements/tpo-round-drive-day-service.ts
- Legacy: `Call` phone button links via `tel:` where number exists. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:337`
- Expected fix: Expose phone only to authorized operator view; mask for coordinators.

## G2-11-008-020 [P1] GAP facet F04
- Files: src/modules/placements/tpo-round-drive-day-service.ts
- Legacy: Roster returns name, roll, branch, photo, phone, current and assigned room. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:350`
- Expected fix: Restore operator-only branch, phone, avatar and both rooms.

## G2-11-012-009 [P1] GAP facet F02
- Files: src/app/(authenticated)/tpo/placements/lifecycle/page.tsx
- Legacy: AntD Tabs tab bar wraps table pane. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:423`
- Expected fix: Restore table-within-active-tab layout.

## G2-11-010-007 [P1] GAP facet F02
- Files: src/modules/placements/tpo-drive-tab-model.ts
- Legacy: Six AntD Tabs are a single horizontal strip within detail page. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:459`
- Expected fix: Render exact tab strip and active/hover style on every workspace route.

## G2-12-004-001 [P1] MISSING facet F01
- Files: src/app/(authenticated)/mentor/courses/page.tsx
- Legacy: Legacy dynamic bookmark `/mentor/courses/:courseId` always redirects to `/mentor/projects` `docs/legacy-source/frontend/src/pages/mentor/courses/[courseId]/index.js:1-7`
- Expected fix: Add dynamic route redirect to `/mentor/projects` regardless of id

## G2-12-006-037 [P1] GAP facet F12
- Files: src/modules/placements/learner-applications-browse-model.ts
- Legacy: Live drives include offered RELEASED `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:24-24`
- Expected fix: Reconcile OFFERED and RELEASED

## G2-12-005-014 [P1] GAP facet F04
- Files: src/components/placements/learner-placement-alerts.tsx
- Legacy: Debarment untilDate and untilDrives are visible, plus reason `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:162-173`
- Expected fix: Display structured restriction reason and expiry in page

## G2-13-008-082 [P1] GAP facet F22
- Files: src/components/courses/faculty-submission-file-review.tsx
- Legacy: Old submissionAssets array supports multiple links/files/written parts (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:75-77`)
- Expected fix: Crosswalk asset type/status IDs/multiple parts and migration into normalized attachments.

## G2-13-010-056 [P1] GAP facet F21
- Files: src/modules/placements/tpo-bulk-application-stage-service.ts
- Legacy: Old validator used across JobServiceImpl and ApplicationTransitionService (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:54-62`)
- Expected fix: Centralize shared transition definitions or document divergence to avoid cross-lane inconsistent moves.

## G2-17-23-026 [P1] GAP facet F06 Missing accept
- Files: (none, new feature)
- Legacy: LC:40 Boolean.TRUE.equals(body.get("accept")) means {} silently becomes false and declines
- Expected fix: Retain vNext strict validation; document legacy bug, never provide a compatibility adapter that interprets missing accept as DECLINE

## G2-17-23-088 [P1] GAP facet F22 Audit tables
- Files: (none, new feature)
- Legacy: JS:1238–1241 emits application status history events; TS:188–195 audit log/bell
- Expected fix: Ensure report timeline can relate offer, application, actor, status, cascade and notification from both models

## G2-18-019-012 [P1] GAP facet F04 Expired flag
- Files: (none, new feature)
- Legacy: LV:29-30 `is_expired` int; LR:12-14 requires 0/null
- Expected fix: Enforce clock-based five-minute expiry, never accept stale row simply because integer expired flag was not toggled

## G2-18-026-045 [P1] GAP facet F22 Constraints/index
- Files: (none, new feature)
- Legacy: NewProgramDTO:10-15 validation min1/max255; NPR:47-50 soft logical name uniqueness
- Expected fix: Record deliberate stronger constraints, test conflict codes and archived-record uniqueness/restoration; keep duration terms <=20 for legacy 10-year UI

## G2-19-029-039 [P1] GAP facet F10 Academic source
- Files: (none, new feature)
- Legacy: LB:224-241 checks any departments/faculty/students sufficient for warning
- Expected fix: Surface short legacy academic-warning rule in domain readiness and preserve rich counts on separate operational checklist

## G2-13-001-041 [P1] GAP facet F10
- Files: src/modules/placements/recruiter-company-team-service.ts
- Legacy: Company GET `/api/v1/recruiter/colleges/{collegeId}/company` (`docs/legacy-source/frontend/src/api/Services/RecruiterService.js:79-80`)
- Expected fix: Keep centralized authorization and document transport shift; ensure same company payload fields.

## G2-13-001-042 [P1] GAP facet F10
- Files: src/modules/placements/recruiter-company-team-service.ts
- Legacy: Team GET `/api/v1/recruiter/colleges/{collegeId}/team` (`docs/legacy-source/frontend/src/api/Services/RecruiterService.js:81-82`)
- Expected fix: Compare team query projection, sort, count and authorization for parity.

## G2-13-001-046 [P1] GAP facet F11
- Files: src/modules/placements/recruiter-company-team-service.ts
- Legacy: Old controller requires college grant, even for company/team, using requireCollege (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterDriveController.java:94-108`)
- Expected fix: Document stricter verified/expiry policy as an explicit authorized behavioral change.

## G2-13-001-054 [P1] GAP facet F12
- Files: src/modules/placements/recruiter-team-drive-count-service.ts
- Legacy: Legacy team drive count includes all nondeleted jobs created by each colleague (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterWorkspaceService.java:85-91`)
- Expected fix: Match all-owned count or rename metric to clearly state published visible attributed jobs.

## G2-13-001-077 [P1] GAP facet F20
- Files: src/modules/placements/recruiter-company-team-service.ts
- Legacy: Old team `valid_until` nullable; NULL means no expiry (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterWorkspaceService.java:89-91`)
- Expected fix: Decide migration rule for indefinite grants; no legitimate grant should disappear unexpectedly.

## G2-13-001-082 [P1] GAP facet F22
- Files: src/modules/placements/recruiter-company-team-service.ts
- Legacy: Legacy profile comes from company, company_domain, recruiter foreign key (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterWorkspaceService.java:73-80`)
- Expected fix: Document field migration: name, website, industry, logo, verified, multi-domain; map missing fields or declare intentional dropped fields.

## G2-13-002-070 [P1] GAP facet F19
- Files: src/app/(authenticated)/hr/home/page.tsx
- Legacy: Old Today backend has no 500 jobs truncation flag (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:83-186`)
- Expected fix: Make complete task counts available beyond preview cap.

## G2-18-021-038 [P1] GAP facet F19
- Files: (none, new feature)
- Legacy: Old job list `getCalendarJobsForLearner` dedup visible+applied (JobServiceImpl:1506-1541)
- Expected fix: Union visible and applied job rows once and project each important date only once

## G2-14-005-031 [P1] GAP facet F05
- Files: src/modules/placements/learner-drive-url-model.ts, src/components/placements/learner-jobs-browse.tsx
- Legacy: Legacy URL Saved facet `?tab=saved`; vNext reads `?saved=1`, losing saved-tab old deep links — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:334-336`
- Expected fix: Support tab=saved legacy alias, canonicalize only after preserving state

## G2-14-002-012 [P1] MISSING facet F03
- Files: src/app/(authenticated)/admin/students/page.tsx
- Legacy: Legacy Clear OTP lockout icon only when mobile; vNext row has no such control — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:990-1007`
- Expected fix: Provide privileged, logged OTP lockout reset confirmation
