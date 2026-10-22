# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-1-026-051 [P1] GAP facet F13
- Files: src/app/(authenticated)/college/profile/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/profile.js:143-156: background failure preserves last profile and Retry.
- Expected fix: Implement stale-while-revalidate cache state.

## G2-13-027-011 [P1] GAP facet F05
- Files: src/components/courses/faculty-lesson-authoring.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AssignmentContentWriteService.java:153-198 — assignment 1-30 resources of INSTRUCTIONS/PDF/FILE/LINK
- Expected fix: Make dedicated builder available and document resource count/method parity before publishing.

## G2-13-027-014 [P1] GAP facet F06
- Files: src/components/courses/faculty-lesson-authoring.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AssignmentContentWriteService.java:37-39,153-198 — resource enum, allowed methods and link/file validation
- Expected fix: Ensure full builder preserves legacy content resources/submission method settings.

## G2-13-027-028 [P1] GAP facet F13
- Files: src/components/courses/faculty-lesson-authoring.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AssignmentContentWriteService.java:105-148 — file receipt invalid/unavailable rejects with explicit retry
- Expected fix: Expose upload with secure signed receipts when ready; distinguish unavailable vs no options.

## G2-13-027-029 [P1] GAP facet F14
- Files: src/components/courses/faculty-lesson-authoring.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonContentsDTO.java:28,34-47 — ContentDataDTO resources and deadline supplied together
- Expected fix: Ensure resource/method fields are reachable and reviewable before publish.

## G2-13-027-030 [P1] MISSING facet F14
- Files: src/components/courses/faculty-lesson-authoring.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AssignmentContentWriteService.java:127-148 — PDF filename/size/cloud-storage tenant-prefix validation
- Expected fix: Support PDF/file upload receipts with class/college containment and MIME/size checks.

## G2-17-025-002 [P1] GAP facet F01
- Files: src/app/api/courses/quizzes/[quizId]/transition/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:73-96 — PATCH unpublish, publish-grades and unpublish-grades
- Expected fix: Preserve independent reversibility semantics

## G2-19-031-001 [P1] GAP facet F01
- Files: src/modules/courses/discussion-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassroomController.java:28-68` — Course/class classroom uses GET with optional since, POST message, PATCH pin, DELETE.
- Expected fix: Resolve class-to-delivery identity and verify no cross-section thread mixing.

## G2-19-031-071 [P1] GAP facet F11
- Files: src/modules/courses/discussion-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:47-72` — Lesson access checks class/course and faculty teaching scope.
- Expected fix: On per-lesson route enforce content/class teaching assignment.

## G2-1-010-014 [P1] GAP facet F04
- Files: src/app/(authenticated)/learn/profile/verification/page.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:120-141`: education snapshot qualification id/type/program/specialization/institution/year/grading/maxGrade/marksheet, plus resumeUrl.
- Expected fix: Add reviewable submitted-versus-current education evidence fields with signed access.

## G2-10-005-007 [P1] GAP facet F02
- Files: src/app/(authenticated)/dashboard/page.tsx
- Legacy: No college global view consists of hero, exactly four action cards, scope tip `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:45-80`
- Expected fix: Match global section hierarchy and place metrics only where old scoped design shows them

## G2-10-010-029 [P1] GAP facet F12
- Files: src/app/(authenticated)/superadmin/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/index.js:9-10` explicit product rule root should route to superadmin dashboard
- Expected fix: Restore default landing to global Overview/Dashboard independent of tenant selection

## G2-10-015-036 [P1] GAP facet F08
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1529-1542 — Inline stale refresh warning and Retry preserves old data.
- Expected fix: Add Retry while preserving last successful result.

## G2-10-022-026 [P1] MISSING facet F05
- Files: src/app/(authenticated)/admin/settings/page.tsx, src/modules/platform-settings/admin-editor-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1006-1013 — Three scope modes incl ORG unused label.
- Expected fix: Show ORG unused option with read-only cleaning

## G2-10-022-035 [P1] GAP facet F07
- Files: src/modules/platform-settings/admin-editor-service.ts, src/components/admin/tenant-settings-editor.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:920-933 — Per-field required/range validators in Form.Item.
- Expected fix: Add per-key inline validation before submit

## G2-10-022-047 [P1] MISSING facet F09
- Files: src/app/(authenticated)/admin/settings/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:804-825 — Scope dropdown change with dirty edits opens confirm.
- Expected fix: Restore pre-switch confirm

## G2-10-022-097 [P1] GAP facet F21
- Files: src/modules/platform-settings/admin-editor-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AppSettingsService.java:45-76 — Auth host, cookie and OTP reads exact GLOBAL config.
- Expected fix: Label live vs deployment-only effects per key

## G2-10-023-105 [P1] GAP facet F23
- Files: src/app/(authenticated)/admin/tenants/page.tsx, src/app/(authenticated)/admin/tenants/setup/page.tsx, src/app/(authenticated)/admin/tenants/create/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:93-208 — One integrated workflow.
- Expected fix: Reintegrate stage flow or provide exact in-context parity

## G2-19-027-005 [P1] GAP facet F02
- Files: src/components/courses/admin-course-actions.tsx, src/components/courses/admin-course-display-editor.tsx
- Legacy: Legacy course records edit Course Name, Short display name, Official code, introduction and artwork in one course form; Courses.js:41-95
- Expected fix: Create one legacy-faithful edit entry with linked metadata fields and saving state; preserve normalized backend storage.

## G2-19-027-008 [P1] GAP facet F03
- Files: src/components/courses/admin-course-overview.tsx
- Legacy: Legacy `Visible to students` Switch + status tags; Courses.js:90-93,463-511
- Expected fix: Introduce independent visibility toggle with status/enable mapping; do not conflate temporary hidden with archive or delete.

## G2-19-027-010 [P1] GAP facet F04
- Files: src/modules/courses/course-service.ts
- Legacy: Legacy course response curated `{id,slug,courseName,shortTitle,active,deptId,allowedForDisplay,metaData}`; CourseController.java:212-227,250-261
- Expected fix: Build client-facing readonly safe projection, map active/allowedForDisplay and slug, never return full tenant/internal entity.

## G2-19-027-011 [P1] GAP facet F04
- Files: src/modules/courses/course-service.ts, src/components/courses/admin-course-display-editor.tsx
- Legacy: Legacy MetaData has 14 fields including image_url, image_url_lp, thumbnail, amount, course_type/category, dates, html, introduction, takeaways, course_color; MetaData.java:17-32
- Expected fix: Map each metadata field to new Course Home/model; specify dropping price/type/dates separately with owner approval; preserve safe images and HTML.

## G2-19-027-012 [P1] GAP facet F04
- Files: src/modules/courses/course-service.ts
- Legacy: Legacy `slug` random URL-safe ID (max64), stored unique, kept in links and fetch; Course.java:34-36; CourseServiceImpl.java:66-99
- Expected fix: Provide slug alias table/redirect instead of treating human course code as slug or exposing UUID without migration mapping.

## G2-19-027-017 [P1] MISSING facet F05
- Files: src/modules/courses/course-service.ts
- Legacy: Legacy deleted courses fetched separate `/deleted?collegeId` and restore `/{id}`; CourseController.java:450-476
- Expected fix: Offer a clearly labeled archive/recycle tab with scoped restore, keeping active list separate.

## G2-19-027-020 [P1] GAP facet F06
- Files: src/components/courses/admin-course-actions.tsx
- Legacy: Legacy update may change dept within same college after both destination and source access checks; CourseController.java:330-347
- Expected fix: Clarify desired college-internal department reassignment; if restoring, validate both scopes transactionally and forbid cross-college transfer.
