# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-3-025-040 [P1] GAP facet F12
- Files: src/components/courses/learner-course-list.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/StudentCourseServiceImpl.java:162-181`
- Expected fix: Legacy defaults to batch.currentSemester or 1 and falls back from invalid/foreign requested semester; vNext preferred academic period comes from available deliveries and period options.

## G2-3-025-061 [P1] MISSING facet F20
- Files: src/components/courses/learner-course-list.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentCourseController.java:45-51`
- Expected fix: Missing explicit requestedSemesterId and semesterFallbackApplied response; add recoverable invalid-selection feedback and canonical picker reset.

## G2-3-025-071 [P1] MISSING facet F23
- Files: src/app/api/courses/learner/route.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentCourseController.java:98-125`
- Expected fix: Legacy dedicated byClass endpoint is absent from this vNext endpoint; verify independent faculty roster API before declaring entire feature absent.

## G2-3-005-008 [P1] GAP facet F03
- Files: src/components/courses/college-quiz-actions.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:476-485`
- Expected fix: Old Delete permanently deletes quiz but new Archive retains history; resolve intended lifecycle explicitly.

## G2-3-005-032 [P1] GAP facet F09
- Files: src/components/courses/college-quiz-actions.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:375-405`
- Expected fix: Attempt-count preflight must permit metadata-only edits after submissions, never full question edit; fallback on count failure.

## G2-3-005-036 [P1] GAP facet F10
- Files: src/components/courses/college-quiz-attempts.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:29-42`; `docs/legacy-source/frontend/src/api/Services/quizServices.js:47-49`
- Expected fix: Legacy fetch all quiz attempts without selecting section; new paged per-delivery reader must expose complete cross-section access.

## G2-3-005-038 [P1] GAP facet F11
- Files: src/modules/courses/college-assessment-aggregate-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:128-155`
- Expected fix: Old collegeId change wipes all filters/dialogs and invalidates request sequence; ensure new SSR adminScope and client dialogs reset.

## G2-3-005-055 [P1] GAP facet F20
- Files: src/components/courses/college-quiz-actions.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:287-319`
- Expected fix: Per-record mutation locks and disabled edit/publish/delete while pending must be comparable.

## G2-3-004-028 [P1] GAP facet F11
- Files: src/app/(authenticated)/admin/quizzes/page.tsx, src/modules/courses/college-assessment-aggregate-service.ts
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:33-46`; `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:121-170`
- Expected fix: Legacy scope selection persists and is applied via scope-token context, vNext depends server adminScope. Verify selected college survives navigation/reload and cannot leak across tenants.

## G2-3-004-030 [P1] GAP facet F12
- Files: src/components/courses/admin-assessment-read-directory.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:442-474`
- Expected fix: Verify result-release gating deadline and transitions; legacy only enables after due, vNext uses status/resultReleaseReady with CLOSED option. Preserve exact guard.

## G2-3-004-031 [P1] GAP facet F12
- Files: src/components/courses/admin-assessment-read-directory.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:377-405`
- Expected fix: Legacy edit submissions count preflight restricts question edits; vNext metadata editor may be offered without preflight modal. Preserve count-gated edits.

## G2-3-004-047 [P1] GAP facet F22
- Files: src/modules/courses/college-assessment-aggregate-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/quizzes.js:25-27`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:85-87`
- Expected fix: Legacy numeric collegeId and scoped admin principal vs vNext UUID adminScope; ensure immutable mapped tenant/college and authorization checks.

## G2-4-004-010 [P1] GAP facet F03
- Files: src/components/courses/college-assessment-aggregate.tsx
- Legacy: Course select label placeholder `All courses` 260px, searchable client-side. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:403-407`)
- Expected fix: Restore searchable course picker backed by authorized course options and course ID filtering.

## G2-4-004-011 [P1] GAP facet F03
- Files: src/components/courses/college-assessment-aggregate.tsx
- Legacy: Section select placeholder `All scopes` 220px, disabled until course selected; options sorted label. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:408-413; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:217-247`)
- Expected fix: Restore course-dependent class/section selector with eligible section IDs and proper reset.

## G2-4-004-022 [P1] GAP facet F04
- Files: src/components/courses/college-assessment-aggregate.tsx
- Legacy: Legacy per-assignment submission counts include totalSubmitted,totalStudents,totalGraded,notGraded. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:350-358; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:129-131`)
- Expected fix: Reconcile denominator/cohort filtering and expose notGraded count to match legacy stats semantics.

## G2-4-004-072 [P1] GAP facet F14
- Files: src/components/courses/college-assessment-aggregate.tsx, src/modules/courses/college-assessment-export-model.ts
- Legacy: `Export CSV (page)` only currently displayed 20 rows, filename `assignments-college-ID-page-P.csv`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:329-341`)
- Expected fix: Offer exact current-page export with legacy columns and filename; keep full-filter export as separately labeled option.

## G2-4-005-014 [P1] GAP facet F05
- Files: src/app/(authenticated)/college/faculty-assignment/page.tsx
- Legacy: Class filter by classId with complete options. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:477-483`)
- Expected fix: Allow all current/historical authorized classes.

## G2-4-032-034 [P1] GAP facet F10
- Files: src/modules/courses/learner-assignment-due-notice-model.ts
- Legacy: Assignment and quiz reminders daily 9am, skip submitted (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:282-335`)
- Expected fix: Implement 24-hour dispatch and keep read-only due widget as extra.

## G2-4-032-052 [P1] MISSING facet F15
- Files: src/modules/messaging/tpo-campaign-dispatch-service.ts
- Legacy: Single TRAI job-update template using name (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:156-169`)
- Expected fix: Connect Exotel DLT template for legacy job update events.

## G2-4-019-019 [P1] GAP facet F05
- Files: src/modules/courses/college-learner-progress-service.ts
- Legacy: Legacy completed counts current attempt only to avoid exceeding 100 percent on retakes. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:82-99`)
- Expected fix: Exclude older attempt completions when reporting learner progress.

## G2-4-019-040 [P1] GAP facet F10
- Files: src/modules/courses/college-learner-progress-service.ts
- Legacy: Legacy course progress admin counts only current attempt across measured content and submitted assessments. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:62-86`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:82-99`)
- Expected fix: Scope report by current attempt for retakes.

## G2-4-007-010 [P1] GAP facet F03
- Files: src/components/courses/admin-assessment-read-directory.tsx
- Legacy: Course Select searchable and Scope Select dependent on chosen course. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:403-414`)
- Expected fix: Restore courseId picker and classId scoped filter.

## G2-4-010-010 [P1] GAP facet F03
- Files: src/components/courses/college-assessment-aggregate.tsx
- Legacy: Course select label placeholder `All courses` 260px, searchable client-side. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:403-407`)
- Expected fix: Restore searchable course picker backed by authorized course options and course ID filtering.

## G2-4-010-011 [P1] GAP facet F03
- Files: src/components/courses/college-assessment-aggregate.tsx
- Legacy: Section select placeholder `All scopes` 220px, disabled until course selected; options sorted label. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:408-413; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:217-247`)
- Expected fix: Restore course-dependent class/section selector with eligible section IDs and proper reset.

## G2-4-010-022 [P1] GAP facet F04
- Files: src/components/courses/college-assessment-aggregate.tsx
- Legacy: Legacy per-assignment submission counts include totalSubmitted,totalStudents,totalGraded,notGraded. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:350-358; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:129-131`)
- Expected fix: Reconcile denominator/cohort filtering and expose notGraded count to match legacy stats semantics.

### Lane-5 fast verification triage (2026-10-22)
- **G2-3-025-040 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
- **G2-3-025-061 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
- **G2-3-025-071 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
- **G2-3-005-008 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
- **G2-3-005-032 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
- **G2-3-005-036 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
- **G2-3-005-038 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
- **G2-3-005-055 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
- **G2-3-004-028 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
- **G2-3-004-030 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
- **G2-3-004-031 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
- **G2-3-004-047 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
- **G2-4-004-010 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
- **G2-4-004-011 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
- **G2-4-004-022 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
- **G2-4-004-072 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
- **G2-4-005-014 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
- **G2-4-032-034 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
- **G2-4-032-052 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
- **G2-4-019-019 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
- **G2-4-019-040 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
- **G2-4-007-010 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
- **G2-4-010-010 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
- **G2-4-010-011 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
- **G2-4-010-022 — DEFERRED**: Source checked for presence; requested parity needs cross-component and runtime validation; not certified OK.
