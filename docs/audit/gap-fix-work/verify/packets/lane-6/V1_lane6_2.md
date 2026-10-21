# Verification packet (P1 sample): 22 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-2-016-013 [P1] GAP facet F06
- Files: src/modules/placements/validation.ts
- Legacy: Create validates visibilityType INTERNAL_ONLY/HYBRID/EXTERNAL_ONLY (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:479-489`)
- Expected fix: Map old visibility modes to vNext job applicationMode/public link semantics

## G2-2-019-003 [P1] MISSING facet F01
- Files: src/app/(authenticated)/admin/announcements/page.tsx
- Legacy: AdminNotificationDeliveryController.java:110-115 POST `/{id}/cancel-schedule?collegeId=`
- Expected fix: Expose cancel-schedule POST and link from scheduled rows.

## G2-2-020-003 [P1] GAP facet F01
- Files: src/app/api/projects/class-team-workspaces/route.ts
- Legacy: AdminProjectController.java:79-139 create teams and team reconcile
- Expected fix: Expose per-team group reconciliation and status/count results.

## G2-2-020-053 [P1] GAP facet F15
- Files: src/modules/projects/admin-submission-review-service.ts
- Legacy: AdminProjectController.java:447-457 PROJECT_DELIVERY_ADMIN_REVIEW logs feedback/status
- Expected fix: Persist audit event for every admin decision and text feedback.

## G2-19-022-103 [P1] GAP facet F12
- Files: src/app/(authenticated)/tpo/recruiters/page.tsx, src/app/api/placements/tpo/bulk-actions/preview/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadsHubService.java:184-188 manual stage allowlist NEW, CONTACTED, NOT_NOW; NOT_NOW reason mandatory
- Expected fix: Mirror manual stage transition guard and reason/revisit validation

## G2-20-012-023 [P1] GAP facet F11
- Files: src/modules/placements/application-service.ts
- Legacy: Legacy visibility gated targeting, not candidate eligibility attributes `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:48-59`
- Expected fix: Owner choose hard visibility policy; document academic threshold behavior explicitly

## G2-13-020-023 [P1] GAP facet F07
- Files: src/modules/placements/validation.ts
- Legacy: Missing domain says 'Add the company’s website or a company email...' `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:143-146`
- Expected fix: Reject missing verified company identity and preserve helper copy.

## G2-13-030-013 [P1] GAP facet F06
- Files: src/modules/placements/validation.ts
- Legacy: recommendAction required `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:138-149`
- Expected fix: Restore four allowed recommendations with explicit transition mapping.

## G2-4-023-073 [P1] MISSING facet F23
- Files: src/modules/placements/company-service.ts, src/modules/placements/tpo-company-create-model.ts
- Legacy: Legacy `/resolve` allows TPO to explicitly create distinct company despite same-name duplicate (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:39-45,52-58`)
- Expected fix: Build controlled distinct-name override with domains and duplicate review, not blanket creation.

## G2-5-006-043 [P1] GAP facet F12 Business rules
- Files: (none, new feature)
- Legacy: Correction controls present/absent reason per status (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:185-207)
- Expected fix: Restore conditional action and legacy allowed reason set.

## G2-5-007-023 [P1] GAP facet F06 Forms
- Files: src/modules/admin-ui/super-admin-placement-interviews-service.ts
- Legacy: Search... inside Job column, matches job/company/student (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:409-422)
- Expected fix: Include candidate/company text in scoped appointment search.

## G2-5-023-043 [P1] GAP facet F12
- Files: src/modules/placements/tpo-drive-change-request-service.ts, src/db/schema/placement-drive-change-requests.ts
- Legacy: Legacy duplicate OPEN per `(job, field, direction)`, except OTHER; proposed equal to current rejected. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:97-130`
- Expected fix: Enforce atomic per-field-direction active uniqueness and no-op comparison.

## G2-5-028-043 [P1] GAP facet F10
- Files: src/app/api/projects/route.ts, src/modules/projects/instance-service.ts
- Legacy: Legacy create POST with class/mentor/learners and full project metadata. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:467-521`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:173-195`
- Expected fix: Provide migration path for ad-hoc workspace creation or seed assigned templates.

## G2-6-027-063 [P1] GAP facet F23
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Legacy optional resume URL, status history DTO, saved IDs and explicit feedback strings are part of controller API (JobController.java:395-405,475-483,830-852).
- Expected fix: List separately approved removals vs regressions; obtain owner decision for resume and status history parity.

## G2-14-030-053 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LBE/model/Interview.java:49-93,114-135 interviewType, roundDescription, location, notes, feedback and requested reschedule prior slot/version.
- Expected fix: Write migration field map and add or relate missing interview content/previous slot/request history.

## G2-7-014-073 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LFE/model/ProjectSprint.java:27-118 ID integer, unique (project_id,sprint_key), version, sprintStatus + sprintState, dueLabel, releaseId
- Expected fix: Produce lossless mapping including dueLabel, derived status, version and historical started/completed attribution

## G2-8-012-013 [P1] GAP facet F06
- Files: src/modules/placements/validation.ts
- Legacy: Create validates visibilityType INTERNAL_ONLY/HYBRID/EXTERNAL_ONLY (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:479-489`)
- Expected fix: Map old visibility modes to vNext job applicationMode/public link semantics

## G2-8-031-023 [P1] GAP facet F06
- Files: src/app/(authenticated)/activity/page.tsx
- Legacy: docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:60-61 defaults category Important and range 30d.
- Expected fix: Default importance=HIGH/CRITICAL or equivalent legacy important taxonomy on initial load.

## G2-15-026-033 [P1] GAP facet F10
- Files: src/modules/placements/job-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:388-435 open/close status
- Expected fix: Preserve nuanced open/close vs publish/cancel lifecycle and validate transitions

## G2-9-004-053 [P1] GAP facet F12
- Files: src/modules/placements/company-service.ts
- Legacy: Cannot delete company when linked drives >0 (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:305-334`)
- Expected fix: Decide whether action should be blocked/relabeled based on active drives.

## G2-9-008-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/college/hiring-dashboard/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/hiring-dashboard.js:23-35` — Missing college displays warning Admin not assigned to a college and exact contact text
- Expected fix: Show no-college warning with contact guidance without exposing private data

## G2-9-014-053 [P1] GAP facet F10
- Files: src/modules/placements/college-application-stage-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1070-1120` — Assessment transition optionally persists job-level URL or per-application URL; dispatch notification.
- Expected fix: Support assessment URL distribution and optional save-to-drive.
