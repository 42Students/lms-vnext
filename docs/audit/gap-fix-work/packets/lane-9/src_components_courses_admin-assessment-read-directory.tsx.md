# Work packet: edit src/components/courses/admin-assessment-read-directory.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/superadmin-quizzes.md, docs/audit/gap2/lane-4/superadmin-assignments.md, docs/audit/gap2/lane-4/superadmin-sections-assignments.md

## G2-3-004-030  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:442-474`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:91-101`
- Fix: Verify result-release gating deadline and transitions; legacy only enables after due, vNext uses status/resultReleaseReady with CLOSED option. Preserve exact guard.

## G2-3-004-031  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:377-405`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:85-101`
- Fix: Legacy edit submissions count preflight restricts question edits; vNext metadata editor may be offered without preflight modal. Preserve count-gated edits.

## G2-4-007-010  [P1] GAP  facet F03  effort M
- Legacy: Course Select searchable and Scope Select dependent on chosen course. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:403-414`)
- vNext now: Course code text input and Audience scope enum select. (`src/components/courses/admin-assessment-read-directory.tsx:47-54`)
- Fix: Restore courseId picker and classId scoped filter.

## G2-4-010-109  [P1] GAP  facet F05  effort M
- Legacy: Course select holds `courseId`; selecting course resets class select options and page. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:403-414`)
- vNext now: SA Directory filter only free-text `courseCode`, no courseId or class relationship. (`src/components/courses/admin-assessment-read-directory.tsx:34-61`)
- Fix: Bind searchable courseId list with dependent sectionId and automatic reset.

## G2-4-010-110  [P1] GAP  facet F05  effort M
- Legacy: Class select hidden/disabled before course and values specific classId. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:408-414`)
- vNext now: SA `Audience` enum is shared/section-specific, cannot select an actual Section. (`src/components/courses/admin-assessment-read-directory.tsx:50-54`)
- Fix: Offer dependent actual Section picker and filter by delivery class.

## G2-4-010-119  [P1] GAP  facet F09  effort M
- Legacy: Submissions action opens width760 Modal; publish all uses styled Popconfirm. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:87-156;docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:365-370`)
- vNext now: New SA submissions in item Disclosure and native window.confirm bulk action. (`src/components/courses/admin-assessment-read-directory.tsx:76-83;src/components/courses/college-assignment-review.tsx:29-70`)
- Fix: Restore 760px review modal and accessible Popconfirm, avoid native confirm.

## G2-3-004-021  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:287-317`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:91-106`
- Fix: Legacy exact mutation success/failure toast text and Retry action; vNext shared toast and inline errors differ. Match text by action.
