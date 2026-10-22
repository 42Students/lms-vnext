# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-7-035-046 [P1] MISSING facet F11
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx
- Legacy: overview.js:409-414 Create workspace requires selected college
- Expected fix: Retain selected-college assignment check on restored action

## G2-7-035-047 [P1] GAP facet F11
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: src/components/projects/template-metadata-edit-control.tsx
- Legacy: overview.js:183 useUnsavedFormGuard on form
- Expected fix: Implement dirty editor guard across close, tabs and refresh

## G2-7-035-061 [P1] GAP facet F17
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: src/components/projects/template-metadata-edit-control.tsx
- Legacy: overview.js:183 dirty guard prevents keyboard navigation away with unsaved changes
- Expected fix: Add beforeunload and in-app tab guard for editor

## G2-7-035-076 [P1] GAP facet F22
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: src/components/projects/template-metadata-edit-control.tsx
- Legacy: overview.js:277-302 overview unknown facts preserved, delivery instructions cleared explicitly
- Expected fix: Add versioned overview blueprint edit without destroying unknown fields

## G2-8-027-010 [P1] GAP facet F03
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: (none, new feature)
- Legacy: Legacy feedback rating, comments, recommend action and submittedBy fields (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:108-112,147-159).
- Expected fix: Restore authorized interview feedback fields/read-only learner projection.

## G2-11-030-027 [P1] GAP facet F10
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx
- Legacy: 1130-1250 bulk status and partial failure preview targeted 3000
- Expected fix: Restore bulk transitions with per-row skipped reasons and safe select-all.

## G2-18-022-004 [P1] GAP facet F03
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: src/modules/placements/tpo-offer-lifecycle-model.ts, src/modules/placements/offer-service.ts
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/OffersTab.js:24-28 statuses SELECTED,PENDING_VERIFICATION,RELEASED,ACCEPTED,DECLINED,EXPIRED,WITHDRAWN,REVOKED
- Expected fix: Restore visible selection/verification states or explicit state mapping badges

## G2-18-022-015 [P1] GAP facet F06
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: src/modules/placements/tpo-offer-lifecycle-model.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java:76-85 bulkVerify max200
- Expected fix: Create verify action max200 with per-record errors

## G2-8-6-001 [P1] GAP facet F01
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: src/app/(authenticated)/learn/my-placements/assessments/page.tsx, src/modules/placements/learner-assessment-browse-service.ts, src/app/(authenticated)/learn/my-placements/schedule/page.tsx
- Legacy: Old bookmark automatically routes to /learn/my-placements/schedule (`docs/legacy-source/frontend/src/pages/learn/my-placements/assessments.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- Expected fix: Provide legacy redirect compatibility or record intentional canonical-route break

## G2-8-6-037 [P1] MISSING facet F23
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: src/app/(authenticated)/learn/my-placements/assessments/page.tsx, src/modules/placements/learner-assessment-browse-service.ts, src/app/(authenticated)/learn/my-placements/schedule/page.tsx
- Legacy: Old route auto-redirected with three-row transition placeholder (`docs/legacy-source/frontend/src/pages/learn/my-placements/assessments.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- Expected fix: Resolve explicit compatibility policy before UI fixes; preserve old bookmarks

## G2-8-017-044 [P1] GAP facet F12
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: (none, new feature)
- Legacy: LBE/model/ProjectTemplate.java:22-44 slug unique global, lifecycle DRAFT / version increments, status separate IN_PROGRESS
- Expected fix: Define explicit state/status migration table; avoid silently losing workflow status.

## G2-8-026-065 [P1] GAP facet F23
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: src/modules/placements/public-join/join-service.ts
- Legacy: Legacy postDirect and long-lived college public link, old tokens rebuilt with HMAC nonce (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CollegePublicLinkService.java:91-141).
- Expected fix: Document approved retirement of unlimited token and direct-post option or restore equivalent.

## G2-8-025-027 [P1] GAP facet F10
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: src/modules/courses/learner-course-file-reference-service.ts
- Legacy: Legacy GET authenticates then resolves contentId, lesson and scope before signing URL (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:51-118).
- Expected fix: Add exactly selected material row join and file scan/owner verification before granting.

## G2-8-025-057 [P1] GAP facet F22
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: src/modules/courses/learner-course-file-reference-service.ts
- Legacy: Legacy storage key pattern org-{id}/college-{id}/lesson-content/... (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:40-41,109-115).
- Expected fix: Bind each FILE object to lessonContentMaterial tenant and parent, enforce key generation uniqueness.

## G2-8-009-048 [P1] GAP facet F20
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx, src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx
- Legacy: legacy routeToCourseTab retains query except prior filter and merges lesson/content for deep links (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:146-165`)
- Expected fix: Preserve faculty content deep links / ?content= from old firstPendingContent

## G2-8-028-006 [P1] GAP facet F02
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: src/components/projects/class-team-workspace-creator.tsx
- Legacy: Old initial default mode single and Status ACTIVE docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:36-50,205-213.
- Expected fix: Restore original default single-workspace flow with ACTIVE/mentor requirement or owner-approved default policy.

## G2-8-028-012 [P1] GAP facet F04
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: src/components/projects/class-team-workspace-creator.tsx
- Legacy: Old single-workspace form stores title, summary, status, templateId, mentorId, learnerIds docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:298-307,404-527.
- Expected fix: Implement equivalent single workspace branch with full data fields rather than silently converting to class team.

## G2-8-028-015 [P1] GAP facet F04
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: src/components/projects/class-team-workspace-creator.tsx
- Legacy: Old outcome has Created/Failed, workspace ID, details, completedAt timestamp docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:267-276,567-585.
- Expected fix: Restore failure explanation per learner and completion timestamp for bulk auditing.

## G2-8-028-021 [P1] MISSING facet F06
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: src/components/projects/class-team-workspace-creator.tsx
- Legacy: Old Summary optional multiline rows3 placeholder Short live workspace summary docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:418-420.
- Expected fix: Add summary input and pass to all created workspace records.

## G2-8-028-024 [P1] GAP facet F06
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: src/components/projects/class-team-workspace-creator.tsx
- Legacy: Old Class selector only cohort/teams, required placeholder Required in cohort mode — search by class name docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:485-507.
- Expected fix: Add no-class single workspace mode, maintain required class only for cohort/team modes.

## G2-8-028-025 [P1] GAP facet F06
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: src/components/projects/class-team-workspace-creator.tsx
- Legacy: Old Students multiselect max500, search by student name and Or add a whole class docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:511-545.
- Expected fix: Support selected learners/whole class option for single workspaces with 500 max.

## G2-8-028-028 [P1] GAP facet F06
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: src/components/projects/class-team-workspace-creator.tsx
- Legacy: Old Cancel/Back guards dirty changes via useUnsavedFormGuard and confirmDiscardIfDirty docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:10,59,358-363.
- Expected fix: Implement browser+route dirty guard, preserve edited team allocations.

## G2-8-028-032 [P1] GAP facet F07
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: src/components/projects/class-team-workspace-creator.tsx
- Legacy: Old preflight invalid server response exact The server did not return a valid cohort preflight. Nothing was created. docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:240-245.
- Expected fix: Show explicit preflight fetch error and retry instead of silently disabling create.

## G2-8-028-035 [P1] GAP facet F08
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: src/components/projects/class-team-workspace-creator.tsx
- Legacy: Old partial failure remains on page, toast N workspace(s) created; N students failed, export report docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:288-295.
- Expected fix: Include failed outcome rows and their exact reasons in exported report and UI.

## G2-8-028-038 [P1] GAP facet F10
- Verification: DEFERRED — full old-LMS parity and behavioral safety require deeper code-path verification; not asserted as implemented.
- Files: src/components/projects/class-team-workspace-creator.tsx
- Legacy: Old single calls createProject payload organizationId,collegeId,classId,templateId,mentorId,learnerIds,status docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:298-320.
- Expected fix: Reinstate single createProjectInstance POST path and accurate payload, not force class-team.
