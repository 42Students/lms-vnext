# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-18-013-045 [P1] GAP facet F22
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Legacy Job DB fields numeric org/college, targetDepartmentId/programId, isActive/isDeleted, text CTC; JobSearchDTO.java:19-38;JobSearchCache.java:180-207
- Expected fix: Write explicit Job → placementJobs/roleOptions/targeting field and type matrix, no numeric ID reuse

## G2-15-013-011 [P1] GAP facet F04
- Files: src/modules/people/college-role-directory-model.ts
- Legacy: Legacy result fields id/firstName/lastName/uniqueId/rollNumber/contactMail/contactMobile/department/college/program/class/organization. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchDTO.java:19-34`)
- Expected fix: Build complete approved learner search DTO including roll, program, section, unique/registration ID, scoped contact.

## G2-15-004-020 [P1] GAP facet F05
- Files: src/app/(authenticated)/learn/projects/page.tsx
- Legacy: Legacy search backend title/course/slug (ProjectsContent.jsx:260-267; projectService.js:6-13)
- Expected fix: Include courseLabel in scoped search fields

## G2-15-005-067 [P1] GAP facet F19
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Legacy detail fetch one job visibility and applied check, then other requests as needed (JobDetailContent.jsx:220-278)
- Expected fix: Replace full-feed fetch with ID-scoped permission-checked detail query/targeted stored joins

## G2-15-005-074 [P1] GAP facet F22
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Legacy job is numeric ID, has driveMode, roleOptionsJson, candidatePreferences, JD URL and eligibility visibility (JobDetailContent.jsx:220-237,635-686,1135-1153,1256-1269)
- Expected fix: Document and implement per-field mapping with exact fallback and jurisdiction/tenant scope

## G2-15-006-002 [P1] GAP facet F01
- Files: (none, new feature)
- Legacy: Legacy links `/learn/courses/{slug\|\|id}/home`, teacher cls only (courseListingUtils.js:7-30)
- Expected fix: Map legacy slug/id bookmarks to scoped delivery UUID with tenant-safe redirects

## G2-15-008-039 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: Legacy canAccessCourse faculty, learner or isAdmin, class assignment derived from loginUser/selection (syllabusDetail.js:103-105,143-149)
- Expected fix: Map faculty/admin lesson preview to respective routes with explicit permissions

## G2-16-004-022 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: `BugReportRepository.java:22-27`: search covers ID, description, page, screen and section.
- Expected fix: Add screen and section search; keep reporter search as additional only if approved.

## G2-16-023-009 [P1] GAP facet F04
- Files: src/app/(authenticated)/learn/my-placements/placement/page.tsx
- Legacy: LearnerPlacementService.java:38-44 offers include roleOption, ctcLpa, joiningDate, respondBy, letterUrl, release, channel/dispute.
- Expected fix: Restore offer letter download in placement card or linked offers detail.

## G2-16-024-036 [P1] GAP facet F11
- Files: src/modules/placements/admin-company-directory-service.ts
- Legacy: SuperAdminCompanyController.java:20 restricted ROLE_SUPER_ADMIN globally.
- Expected fix: Permit authorized global curation independent of selected college where owner intends platform-wide.

## G2-16-024-055 [P1] GAP facet F22
- Files: src/modules/placements/admin-company-directory-service.ts
- Legacy: CompanyCurationService.java:35-51 global company search includes all live companies including unlinked.
- Expected fix: Use placementCompanies left join relationships for truly global directory.

## G2-16-025-012 [P1] MISSING facet F05
- Files: src/modules/placements/tpo-drive-change-request-service.ts
- Legacy: DriveChangeRequestService.java:126-130 disallows open duplicate same field+direction, except OTHER.
- Expected fix: Reject duplicate open same job+field+direction in transaction with partial unique index.

## G2-16-025-020 [P1] MISSING facet F07
- Files: src/modules/placements/tpo-drive-change-request-service.ts
- Legacy: DriveChangeRequestService.java:129 duplicate `There is already an open request on...`.
- Expected fix: Enforce duplicate-open and display exact conflict.

## G2-16-025-028 [P1] GAP facet F10
- Files: src/modules/placements/tpo-drive-change-request-service.ts
- Legacy: DriveChangeRequestService.java:210-221 withdrawing proposal permitted even if drive ended.
- Expected fix: Permit WITHDRAW cleanup after drive over, maintain ownership guard.

## G2-16-025-029 [P1] GAP facet F10
- Files: src/modules/placements/tpo-drive-change-request-service.ts
- Legacy: DriveChangeRequestService.java:34-35 all steps write drive Discussion company thread.
- Expected fix: Mirror lifecycle event to shared recruiter/TPO conversation timeline.

## G2-16-025-040 [P1] GAP facet F15
- Files: src/modules/placements/tpo-drive-change-request-service.ts
- Legacy: DriveChangeRequestService.java:280-285 special last-request priority notification.
- Expected fix: Add final-institutional-request completion bell and queue reorder.

## G2-16-025-044 [P1] MISSING facet F18
- Files: src/modules/placements/tpo-drive-change-request-service.ts
- Legacy: DriveChangeRequestService.java:54 multi-role error exact `This drive has several roles; use Something else...`.
- Expected fix: Implement exact explanatory error.

## G2-16-025-046 [P1] GAP facet F20
- Files: src/modules/placements/tpo-drive-change-request-service.ts
- Legacy: DriveChangeRequestService.java:37-38 locks request then drive FOR UPDATE.
- Expected fix: Establish consistent lock order + FOR UPDATE for applying drive edits; prevent deadlocks/races.

## G2-16-025-047 [P1] MISSING facet F20
- Files: src/modules/placements/tpo-drive-change-request-service.ts
- Legacy: DriveChangeRequestService.java:126-130 dedupes open same field/direction under job lock.
- Expected fix: Add partial unique index and check inside transaction.

## G2-16-025-049 [P1] GAP facet F21
- Files: src/modules/placements/tpo-drive-change-request-service.ts
- Legacy: DriveChangeRequestService.java:58-60 uses LiveDriveChangeService, Messages and TPO audit.
- Expected fix: Integrate live drive mutation and recruiter Discussion event emit.

## G2-17-013-009 [P1] GAP facet F04
- Files: src/modules/placements/job-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchDTO.java:19-38 — JobSearchDTO fields id,title,company/logo,desc,responsibilities,type,location,CTC,postedAt,deadline,active,scope and targets.
- Expected fix: Map all DTO fields/nullable defaults and visibility before exposing job search.

## G2-17-013-034 [P1] GAP facet F11
- Files: src/modules/placements/job-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:98-119 — Global superadmin can request org; scoped superadmin derives org from principal.
- Expected fix: Support explicit authorized acting-org search scope for superadmin.

## G2-17-013-055 [P1] GAP facet F22
- Files: src/modules/placements/job-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchDTO.java:19-38 — Cached DTO has integer IDs, org and college, target department/program.
- Expected fix: Define DTO↔normalized schema data mapping and index support.

## G2-17-004-018 [P1] GAP facet F09
- Files: src/modules/projects/learner-project-tab-href-model.ts, src/app/(authenticated)/learn/projects/[projectId]/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/learn/projects/[projectId].js:10-13 specifically prevents tab URL changes from silently discarding open modal/form.
- Expected fix: Add unsaved change guard before dropping taskId/closing detail dialog on tab switch.

## G2-17-004-024 [P1] GAP facet F12
- Files: src/modules/projects/learner-project-tab-href-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/learn/projects/[projectId].js:10-14 retaining modal/tab state is explicit UX invariant.
- Expected fix: Preserve full unsaved action state or ask before discarding on tab navigation.
