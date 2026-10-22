# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-14-031-009 [P1] MISSING facet F03
- Verification: DEFERRED — referenced implementation exists; full old-LMS authorization and state parity needs focused regression review.
- Files: src/modules/academics/college-mapping-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:104-210 create/update/delete semester controls
- Expected fix: Add direct term metadata edit controls or explicit link to program term editor

## G2-14-031-017 [P1] GAP facet F06
- Verification: DEFERRED — referenced implementation exists; full old-LMS authorization and state parity needs focused regression review.
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/BatchRequestDTO.java:14-29 name/program required, dates/year/status optional
- Expected fix: Document and correctly validate new mandatory code/period compared with legacy

## G2-14-031-029 [P1] GAP facet F10
- Verification: DEFERRED — referenced implementation exists; full old-LMS authorization and state parity needs focused regression review.
- Files: src/modules/academics/college-batch-promotion-execute.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/BatchController.java:159-183 promote transaction emits BATCH_PROMOTE
- Expected fix: Reconcile learner section/teaching transition effects against legacy batch service

## G2-14-031-030 [P1] GAP facet F10
- Verification: DEFERRED — referenced implementation exists; full old-LMS authorization and state parity needs focused regression review.
- Files: src/modules/academics/college-mapping-service.ts, src/modules/courses/offering-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:104-210 semester mutation and 283-470 associated courses
- Expected fix: Connect semester course map writes to term offering and course delivery

## G2-14-031-036 [P1] GAP facet F12
- Verification: DEFERRED — referenced implementation exists; full old-LMS authorization and state parity needs focused regression review.
- Files: src/modules/academics/college-batch-promotion-execute.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/BatchController.java:230-258 direct current semester update
- Expected fix: Decide if controlled correction workflow replaces unrestricted old setter

## G2-14-031-051 [P1] GAP facet F21
- Verification: DEFERRED — referenced implementation exists; full old-LMS authorization and state parity needs focused regression review.
- Files: src/modules/academics/college-batch-promotion-execute.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/BatchController.java:159-175 promotion changes downstream semester/class effects
- Expected fix: Confirm attendance, timetable, placement eligibility and faculty screens all refresh after progression

## G2-15-026-065 [P1] GAP facet F23
- Verification: DEFERRED — referenced implementation exists; full old-LMS authorization and state parity needs focused regression review.
- Files: src/app/(authenticated)/admin/placements/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:139-163 org-wide jobs endpoint supports cross-college context
- Expected fix: Document intentional restriction but restore authorized aggregate read for org/global admins

## G2-8-013-014 [P1] GAP facet F06
- Verification: DEFERRED — referenced implementation exists; full old-LMS authorization and state parity needs focused regression review.
- Files: src/app/api/academics/programs/route.ts
- Legacy: POST /{programId}/select records click without body (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:191-205`)
- Expected fix: Make selection POST a distinct read-side usage event, never create a Program.

## G2-8-013-038 [P1] GAP facet F20
- Verification: DEFERRED — referenced implementation exists; full old-LMS authorization and state parity needs focused regression review.
- Files: src/app/api/academics/programs/route.ts
- Legacy: Legacy scoped results filter by college or organization when relevant (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:51-59`)
- Expected fix: Separate legacy selection count action from program creation.

## G2-8-025-009 [P1] GAP facet F04
- Verification: DEFERRED — quick source lookup cannot identify a safe implementation target.
- Files: (none, new feature)
- Legacy: Legacy FILE cloudStorageObject may be absolute URL or key (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:99-110).
- Expected fix: Normalize allowed legacy public URLs to tenant storage keys in migration with clear rejects.

## G2-8-029-017 [P1] GAP facet F06
- Verification: DEFERRED — referenced implementation exists; full old-LMS authorization and state parity needs focused regression review.
- Files: src/components/projects/super-admin-template-rollback-control.tsx
- Legacy: Old rollback disabled until comparedVersionId equals version.id docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:209-216.
- Expected fix: Require explicit compared-content acknowledgment rather than only page visit before rollback.

## G2-8-029-024 [P1] GAP facet F09
- Verification: DEFERRED — referenced implementation exists; full old-LMS authorization and state parity needs focused regression review.
- Files: src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx, src/components/projects/super-admin-template-rollback-control.tsx
- Legacy: Old Compare changes Modal width860 on clicked row, I reviewed these changes affirmative docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:238-257.
- Expected fix: Add explicit reviewed-this-diff confirmation before enabling rollback.

## G2-8-029-025 [P1] GAP facet F09
- Verification: DEFERRED — referenced implementation exists; full old-LMS authorization and state parity needs focused regression review.
- Files: src/components/projects/super-admin-template-rollback-control.tsx
- Legacy: Old Popconfirm title Roll back to this version? with publication warning docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:208-219.
- Expected fix: Reconcile actual rollback publication semantics; warning cannot contradict persisted status behavior.

## G2-8-029-029 [P1] GAP facet F10
- Verification: DEFERRED — referenced implementation exists; full old-LMS authorization and state parity needs focused regression review.
- Files: src/components/projects/super-admin-template-rollback-control.tsx
- Legacy: Old rollback restores whole legacy snapshot incl lifecycleStatus,publishedAt,archivedAt,isDeleted docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:115-121.
- Expected fix: Verify actual new rollback status/version mutation and explain intentional divergence.

## G2-8-029-032 [P1] GAP facet F12
- Verification: DEFERRED — referenced implementation exists; full old-LMS authorization and state parity needs focused regression review.
- Files: src/components/projects/super-admin-template-rollback-control.tsx
- Legacy: Old rollback warning existing workspaces retain pinned snapshots but publication status travels with snapshot docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:115-138.
- Expected fix: Document precise difference and test rollback of pre-publish/pre-archive version.

## G2-8-029-046 [P1] GAP facet F20
- Verification: DEFERRED — referenced implementation exists; full old-LMS authorization and state parity needs focused regression review.
- Files: src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx, src/components/projects/super-admin-template-rollback-control.tsx
- Legacy: Old compare modal loaded template before rollback, stale version on edit results server 409 docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:140-149.
- Expected fix: Bind previewed compare hash/current version to explicit review to avoid stale/unreviewed rollback.

## G2-8-024-016 [P1] GAP facet F06
- Verification: DEFERRED — quick source lookup cannot identify a safe implementation target.
- Files: (none, new feature)
- Legacy: Legacy create body includes profile fields and collegeIds list for initial grants (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:51-54,84-92).
- Expected fix: Expose new company relationship selection while preserving legacy college choices and validation.

## G2-8-023-070 [P1] GAP facet F22
- Verification: DEFERRED — quick source lookup cannot identify a safe implementation target.
- Files: (none, new feature)
- Legacy: Legacy add source APPLIED_BY_COLLEGE plus optOutUntil (+48h) (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveAddService.java:121-133).
- Expected fix: Backfill provenance and candidate opt-out SLA from old applications.

## G2-9-001-007 [P1] GAP facet F02
- Verification: DEFERRED — referenced implementation exists; full old-LMS authorization and state parity needs focused regression review.
- Files: src/app/(authenticated)/college/activity/page.tsx
- Legacy: Day-grouped chronological activity sections (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:232-259`)
- Expected fix: Rebuild day-grouped narrative feed as primary display.

## G2-9-002-019 [P1] GAP facet F05
- Verification: DEFERRED — referenced implementation exists; full old-LMS authorization and state parity needs focused regression review.
- Files: src/modules/academics/college-batch-promotion-service.ts
- Legacy: Only ACTIVE initially, unless Show completed/inactive checked (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:120-130`)
- Expected fix: Default active only and keep toggle counts.

## G2-9-002-029 [P1] MISSING facet F06
- Verification: DEFERRED — referenced implementation exists; full old-LMS authorization and state parity needs focused regression review.
- Files: src/components/academics/college-promotion-confirmation.tsx
- Legacy: Dirty cancel prompts Discard promotion changes? (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:260-280`)
- Expected fix: Require dirty-form discard confirmation.

## G2-9-002-040 [P1] MISSING facet F09
- Verification: DEFERRED — referenced implementation exists; full old-LMS authorization and state parity needs focused regression review.
- Files: src/components/academics/college-promotion-confirmation.tsx
- Legacy: Dirty-change confirmation Discard changes/Keep reviewing (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:262-278`)
- Expected fix: Add nested modal and pending lock.

## G2-9-002-046 [P1] MISSING facet F10
- Verification: DEFERRED — referenced implementation exists; full old-LMS authorization and state parity needs focused regression review.
- Files: src/app/api/academics/batch-promotion/execute/route.ts
- Legacy: PUT /api/v1/batch/update/{id} status COMPLETED for graduation (`docs/legacy-source/frontend/src/api/Services/AdminService.js:160-163`)
- Expected fix: Connect page to secure graduation service with comparable guard.

## G2-9-002-054 [P1] GAP facet F12
- Verification: DEFERRED — referenced implementation exists; full old-LMS authorization and state parity needs focused regression review.
- Files: src/modules/academics/college-batch-promotion-model.ts
- Legacy: Suggested academic year advances on academic boundary (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:155-201`)
- Expected fix: Implement/approve automatic rollover rules.

## G2-9-002-055 [P1] GAP facet F12
- Verification: DEFERRED — referenced implementation exists; full old-LMS authorization and state parity needs focused regression review.
- Files: src/modules/academics/college-batch-promotion-execute.ts
- Legacy: Deactivates assignments for old batch semester (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:155-183`)
- Expected fix: Compare exact side effect and obtain product approval.
