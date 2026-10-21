# Work packet (wave 2): edit src/app/(authenticated)/college/course-progress/page.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-course-progress-controller.md, docs/audit/gap2/lane-2/admin-learner-progress-controller.md, docs/audit/gap2/lane-8/college-course-progress.md

## G2-2-015-001  [P2] GAP  facet F01  effort S
- Legacy: route college-admin/course-progress in AdminLayout, active courses menu and content tab (`docs/legacy-source/frontend/src/pages/college-admin/course-progress.js:5-8,17-19,34-44`)
- vNext now: new /college/course-progress PageHeader Progress; shell controls nav externally (`src/app/(authenticated)/college/course-progress/page.tsx:17-19,64-77`)
- Fix: Map old Courses & Content Progress tab active state, heading and alias redirects

## G2-2-015-002  [P2] GAP  facet F01  effort S
- Legacy: when collegeId null, warning rendered before content group shell (`docs/legacy-source/frontend/src/pages/college-admin/course-progress.js:15-33`)
- vNext now: missing membership returns CollegeCourseMissingScope area college (`src/app/(authenticated)/college/course-progress/page.tsx:17-19`)
- Fix: Keep exact no-college warning and group context without exposing other tenants

## G2-2-015-003  [P2] GAP  facet F02  effort S
- Legacy: Course Progress h1 and subtitle See measured completion for a class and course... (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:231-238`)
- vNext now: outer PageHeader Progress and nested h2 Course Progress with same subtitle (`src/app/(authenticated)/college/course-progress/page.tsx:64-75; src/components/courses/college-learner-progress-report.tsx:26-32`)
- Fix: Avoid duplicate/hierarchy title mismatch; choose legacy h1 Course Progress and separate section label

## G2-2-015-050  [P2] GAP  facet F18  effort S
- Legacy: legacy main title Course Progress and Measured work only alert (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:233-245`)
- vNext now: vNext main heading Progress and measured-work footnote after table (`src/app/(authenticated)/college/course-progress/page.tsx:64-65; src/components/courses/college-learner-progress-report.tsx:96-103`)
- Fix: Restore exact title and banner copy/placement

## G2-2-017-007  [P2] MISSING  facet F03  effort S
- Legacy: Successful reset returns counters attempt,previousAttempt,contentItemsReset `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:119-125`
- vNext now: No reset counter visible `src/app/(authenticated)/college/course-progress/page.tsx:65-76`
- Fix: Show attempt number, old number and items reset in success state

## G2-2-017-039  [P2] MISSING  facet F13  effort M
- Legacy: No content => error, no prior progress => alreadyFresh, distinct states `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:92-106`
- vNext now: Only report empty states; neither retake branch shown `src/app/(authenticated)/college/course-progress/page.tsx:60-76`
- Fix: Show no-content, no-prior, submitted and server-error states distinctly

## G2-2-017-040  [P2] MISSING  facet F13  effort S
- Legacy: Synchronous POST, no async frontend loading defined `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:68-125`
- vNext now: No disabled/pending retake control `src/app/(authenticated)/college/course-progress/page.tsx:64-76`
- Fix: Add pending/Retry state and prevent duplicate submit

## G2-2-017-048  [P2] MISSING  facet F18  effort S
- Legacy: Exact text That course has no content to retake and already starting fresh `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:92-106`
- vNext now: No corresponding retake messages `src/app/(authenticated)/college/course-progress/page.tsx:64-76`
- Fix: Keep wording unchanged in inline error/info area

## G2-2-017-049  [P2] MISSING  facet F18  effort S
- Legacy: Retake success explains previous attempt kept as history `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:123-125`
- vNext now: No equivalent success text `src/app/(authenticated)/college/course-progress/page.tsx:64-76`
- Fix: Surface history retention sentence

## G2-8-008-001  [P2] GAP  facet F01  effort S
- Legacy: route college-admin/course-progress in AdminLayout, active courses menu and content tab (`docs/legacy-source/frontend/src/pages/college-admin/course-progress.js:5-8,17-19,34-44`)
- vNext now: new /college/course-progress PageHeader Progress; shell controls nav externally (`src/app/(authenticated)/college/course-progress/page.tsx:17-19,64-77`)
- Fix: Map old Courses & Content Progress tab active state, heading and alias redirects

## G2-8-008-002  [P2] GAP  facet F01  effort S
- Legacy: when collegeId null, warning rendered before content group shell (`docs/legacy-source/frontend/src/pages/college-admin/course-progress.js:15-33`)
- vNext now: missing membership returns CollegeCourseMissingScope area college (`src/app/(authenticated)/college/course-progress/page.tsx:17-19`)
- Fix: Keep exact no-college warning and group context without exposing other tenants

## G2-8-008-003  [P2] GAP  facet F02  effort S
- Legacy: Course Progress h1 and subtitle See measured completion for a class and course... (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:231-238`)
- vNext now: outer PageHeader Progress and nested h2 Course Progress with same subtitle (`src/app/(authenticated)/college/course-progress/page.tsx:64-75; src/components/courses/college-learner-progress-report.tsx:26-32`)
- Fix: Avoid duplicate/hierarchy title mismatch; choose legacy h1 Course Progress and separate section label

## G2-8-008-050  [P2] GAP  facet F18  effort S
- Legacy: legacy main title Course Progress and Measured work only alert (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:233-245`)
- vNext now: vNext main heading Progress and measured-work footnote after table (`src/app/(authenticated)/college/course-progress/page.tsx:64-65; src/components/courses/college-learner-progress-report.tsx:96-103`)
- Fix: Restore exact title and banner copy/placement
