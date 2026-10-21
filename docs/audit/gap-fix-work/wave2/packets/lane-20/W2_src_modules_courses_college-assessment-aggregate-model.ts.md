# Work packet (wave 2): edit src/modules/courses/college-assessment-aggregate-model.ts

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-admin-quizzes.md, docs/audit/gap2/lane-4/college-admin-assignments.md, docs/audit/gap2/lane-4/superadmin-assignments.md, docs/audit/gap2/lane-4/superadmin-sections-assignments.md

## G2-3-001-019  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:121-125`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:596-604`
- vNext now: `src/modules/courses/college-assessment-aggregate-model.ts:3-19`; `src/components/courses/college-assessment-aggregate.tsx:281-288`
- Fix: Use server page size 20 with no page-size changer, not hard-coded 25/page.

## G2-3-001-021  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:497-505`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:177-188`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:109-137`; `src/modules/courses/college-assessment-aggregate-model.ts:7-19`
- Fix: Offer searchable, clearable college course-name dropdown; current exact course-code text input behaves differently.

## G2-3-001-076  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:121-125`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:216-259`
- vNext now: `src/modules/courses/college-assessment-aggregate-service.ts:166-177`; `src/modules/courses/college-assessment-aggregate-model.ts:3-19`
- Fix: Compare 20 vs 25 page fetch and server query/index profile; maintain consistent count and deterministic cursor under large lists.

## G2-4-004-017  [P2] GAP  facet F04  effort M
- Legacy: Legacy columns id, title, courseId, classId, points, deadline, stats, plus lessonId/facultyId/updatedAt in response. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:114-139`)
- vNext now: vNext item fields id/title/courseName/courseCode/lessonName/offeringId/status/dueAt/deliverySpecific/points/eligible/submitted/graded. (`src/modules/courses/college-assessment-aggregate-model.ts:69-90`)
- Fix: Maintain traceable mapping of legacy facultyId, lessonId and audience selection for admin edit/parity.

## G2-4-004-019  [P2] GAP  facet F04  effort M
- Legacy: Scope fallback `All eligible sections`, specific `Section id` or class name. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:290-293`)
- vNext now: Displays `Shared offering` or `Section-specific` without specific section name. (`src/components/courses/college-assessment-aggregate.tsx:264-265; src/modules/courses/college-assessment-aggregate-model.ts:35-37`)
- Fix: Display the actual section for scoped assignments and legacy default wording.

## G2-4-004-025  [P2] GAP  facet F05  effort M
- Legacy: 20 rows per page with server pagination, zero-based API page and 1-based UI page; page-size change disabled. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:185; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:263-282; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:423-425`)
- vNext now: 25/page, 1-based query, page max 1000. (`src/modules/courses/college-assessment-aggregate-model.ts:3; src/modules/courses/college-assessment-aggregate-model.ts:18; src/components/courses/college-assessment-aggregate.tsx:296-303`)
- Fix: Use 20/page or document product-approved 25/page; keep correct count and page bounds.

## G2-4-004-061  [P2] GAP  facet F12  effort M
- Legacy: Server list size defaults20 max100; must have positive collegeId and valid class scope. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:93-112`)
- vNext now: Page fixed25 maxpage1000, scope by membership no external collegeId parameter. (`src/modules/courses/college-assessment-aggregate-model.ts:3-19; src/modules/courses/college-assessment-aggregate-service.ts:54-73`)
- Fix: Align page size and explain server query bounds.

## G2-4-004-085  [P2] GAP  facet F19  effort M
- Legacy: Legacy assignment endpoint page size 20 with assignment stats fetched one at a time (max100/pg). (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:50-52; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:105-137`)
- vNext now: Drizzle aggregate query 25/page plus eligibility/activity calculation. (`src/modules/courses/college-assessment-aggregate-model.ts:3; src/modules/courses/college-assessment-aggregate-service.ts:119-127`)
- Fix: Stress-test and quantify query count and data-volume impact for 25 rows vs legacy stats.

## G2-4-007-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy page size20 server and AntD pagination, no page-size changer. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:185;docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:263-287;docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:423-425`)
- vNext now: New aggregate fixed25 records with Pagination. (`src/modules/courses/college-assessment-aggregate-model.ts:3;src/components/courses/admin-assessment-read-directory.tsx:108-114`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-010-017  [P2] GAP  facet F04  effort M
- Legacy: Legacy columns id, title, courseId, classId, points, deadline, stats, plus lessonId/facultyId/updatedAt in response. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:114-139`)
- vNext now: vNext item fields id/title/courseName/courseCode/lessonName/offeringId/status/dueAt/deliverySpecific/points/eligible/submitted/graded. (`src/modules/courses/college-assessment-aggregate-model.ts:69-90`)
- Fix: Maintain traceable mapping of legacy facultyId, lessonId and audience selection for admin edit/parity.

## G2-4-010-019  [P2] GAP  facet F04  effort M
- Legacy: Scope fallback `All eligible sections`, specific `Section id` or class name. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:290-293`)
- vNext now: Displays `Shared offering` or `Section-specific` without specific section name. (`src/components/courses/college-assessment-aggregate.tsx:264-265; src/modules/courses/college-assessment-aggregate-model.ts:35-37`)
- Fix: Display the actual section for scoped assignments and legacy default wording.

## G2-4-010-025  [P2] GAP  facet F05  effort M
- Legacy: 20 rows per page with server pagination, zero-based API page and 1-based UI page; page-size change disabled. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:185; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:263-282; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:423-425`)
- vNext now: 25/page, 1-based query, page max 1000. (`src/modules/courses/college-assessment-aggregate-model.ts:3; src/modules/courses/college-assessment-aggregate-model.ts:18; src/components/courses/college-assessment-aggregate.tsx:296-303`)
- Fix: Use 20/page or document product-approved 25/page; keep correct count and page bounds.

## G2-4-010-061  [P2] GAP  facet F12  effort M
- Legacy: Server list size defaults20 max100; must have positive collegeId and valid class scope. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:93-112`)
- vNext now: Page fixed25 maxpage1000, scope by membership no external collegeId parameter. (`src/modules/courses/college-assessment-aggregate-model.ts:3-19; src/modules/courses/college-assessment-aggregate-service.ts:54-73`)
- Fix: Align page size and explain server query bounds.

## G2-4-010-085  [P2] GAP  facet F19  effort M
- Legacy: Legacy assignment endpoint page size 20 with assignment stats fetched one at a time (max100/pg). (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:50-52; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:105-137`)
- vNext now: Drizzle aggregate query 25/page plus eligibility/activity calculation. (`src/modules/courses/college-assessment-aggregate-model.ts:3; src/modules/courses/college-assessment-aggregate-service.ts:119-127`)
- Fix: Stress-test and quantify query count and data-volume impact for 25 rows vs legacy stats.

## G2-4-010-111  [P2] GAP  facet F05  effort M
- Legacy: Old server list 20 per page and pagination arrows with total. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:185;docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:263-287`)
- vNext now: SA new aggregate service uses 25 per page, generic Pagination. (`src/modules/courses/college-assessment-aggregate-model.ts:3;src/components/courses/admin-assessment-read-directory.tsx:108-114`)
- Fix: Set SA assignment list size20 and match page count/range.

## G2-4-010-129  [P2] GAP  facet F19  effort M
- Legacy: Legacy 20 rows with per-item stats RPC, page-level bounded; client requests 1 page. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:263-287`)
- vNext now: New aggregate 25 rows, joins eligible learners and activity counts. (`src/modules/courses/college-assessment-aggregate-model.ts:3;src/components/courses/admin-assessment-read-directory.tsx:62-76`)
- Fix: Validate query pressure and exact total/eligible denominator; restore page size20.
