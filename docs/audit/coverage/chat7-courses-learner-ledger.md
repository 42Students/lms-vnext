# Chat-7 course and learner hardening ledger

Source-reviewed for the **Learner role journey** and Super Admin courses/content audit. This is an incremental scope ledger, not a claim that every exported course module function is covered. The lane cannot execute tests locally; cloud CI and real PostgreSQL remain the authoritative execution gates.

| Surface or exported entry | Tenant / role / data-integrity contract | Gap-named test evidence | Status |
|---|---|---|---|
| `listActiveDeliveryLearners` in `src/modules/courses/delivery-roster.ts` | Elective and Section rosters use the exact authorized delivery, college, cohort and period; an inactive/deleted elective **never** falls through to the full Section roster; active learner membership and account required | `tests/unit/chat7-course-delivery-roster-weak.test.ts` (`COURSES-WEAK-DELIVERY-ROSTER-01`) | Authored, CI pending |
| `getSuperAdminStudentCourseProgress` in `src/modules/courses/super-admin-student-course-progress.ts` | Requires Super Admin + acting college + courses.read; selected offering belongs to that college; only active learner membership from current Section/cohort/period and non-ended deliveries included; 501-row sentinel detects real truncation at 500 | `tests/unit/chat7-superadmin-progress-roster-security.test.ts` (`SA-academics-people-67`), `tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts` | Authored, PostgreSQL integration still required |
| `studentCourseCompletion` in `src/modules/courses/super-admin-student-progress-model.ts` | No measured items gives `null`, not invented 0%; counts are bounded by published item denominators | `tests/unit/chat7-superadmin-progress-roster-security.test.ts` (`SA-academics-people-67`) | Authored, CI pending |
| `exportCollegeAssessments` in `src/modules/courses/college-assessment-export-service.ts` | Keep authorized request context/kind on every page; validate kind-specific filters and cap at 1,000 rows | `tests/unit/chat7-college-assessment-export-service-weak.test.ts` (`COURSES-WEAK-EXPORT-SERVICE-01`) | CI reports two failures on old snapshot; source reinspection shows paging/cap guards; verify on new branch CI |
| `FacultyQuizReportPage` in `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx` | Quiz title remains dynamic; exact headings, privacy gate and empty states | `tests/unit/chat7-legacy-faculty-quiz-report-copy.test.ts` | CI reports a failure on old snapshot; reinspection confirms expected headings; requires rerun |
| `CollegeAssignmentActions` in `src/components/courses/college-assignment-actions.tsx` | Explicit changes and stale-version conflicts; never render unexpected raw API errors; edit draft retained on failed save | `tests/unit/chat7-superadmin-assessment-friendly-errors.test.ts` (`SA-academics-people-64`) | Authored, CI pending |
| `CollegeQuizActions`, `CollegeQuizAttempts` in `src/components/courses/` | Friendly errors on metadata/attempt reads and updates; independent retry without showing server details | `tests/unit/chat7-superadmin-assessment-friendly-errors.test.ts` (`SA-academics-people-65`) | Authored, CI pending |
| Super Admin courses/content final-sprint surfaces | Create/edit metadata, bulk visibility, lesson builder, quizzes, assignments, per-student progress; private scanned binary/URL ingestion deliberately gated | `tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts`, `chat7-final-sprint-superadmin-course-visibility.test.ts` and corresponding acceptance | Partial: SA-50 imagery, SA-53 whole-course visibility, SA-60 external ingest still incomplete or blocked |

## Outstanding verification / defects

- **COURSES-WEAK-EXPORT-SERVICE-01:** two reported unit failures require a fresh CI result; no assertion weakened or deleted. The collector already projects the same request context and assessment kind on each page and clamps the export to 1,000.
- **COURSES-WEAK-DELIVERY-ROSTER-01:** inactive-elective fallback and mismatched offering delivery guards were repaired on `chatgpt/chat-7-b`; mock fixtures now reflect actual ACTIVE/deleted flags. Add real-PostgreSQL tenant/role cross-check before release.
- **SA-academics-people-67:** previous roster SQL lacked persisted LEARNER role and did not bind enrolments to the offering cohort; these checks and accurate truncation were added. Published item denominators for mixed section-specific content need separate integration verification.
- Complete the remaining exported `src/modules/courses` functions/learner pages systematically; this ledger documents only reviewed entries.

## Learner Projects cross-module role journey (IIT Dharwad)

| Surface | Invariant | Evidence | Status |
|---|---|---|---|
| `createLearnerOwnTask`, `deleteLearnerOwnTask`, `moveOwnLearnerProjectTask`, `pullOwnBacklogTask` | Persisted active learner/project membership rechecked within transaction; only owner-controlled TODO/IN_PROGRESS/BLOCKED paths and eligible project releases. Task creation previously rejected only SHIPPED; now it positively requires `PLANNED` or `IN_PROGRESS`, consistent with pull, delete and status services. | `tests/unit/PROJ-BREAK-chat7-learner-role-journey.test.ts` — `PROJ-BREAK-LEARNER-91..95` (especially `PROJ-BREAK-LEARNER-95 refuses learner-created tasks in cancelled or shipped release states`) | Source fix committed; Vitest and real-PostgreSQL concurrency checks pending |

This additive learner Projects review does not replace the chat-14-owned project function/page coverage ledger.

## Course and learner function/entrypoint matrix — round 2 (authored, CI pending)

| Exported function or screen | Tested behaviour and denied cases | Named test |
|---|---|---|
| `requireOwnCourseLearnerRead` | Missing, suspended and wrong-role context; persisted wrong actor, college, suspended user/membership; positive read scoped through `courses.read` | `tests/unit/chat7-learner-live-access-behaviour.test.ts` — `LEARNER-COURSE-ACCESS-01` |
| `requireLearningReadAccess` learner route in `learning-access.ts` | Source audit requires active persisted tenant membership, current LEARNER role, user status and exact cohort before granting a Section read; existing offering/delivery permission gate retained | `tests/unit/chat7-learner-live-access-behaviour.test.ts` — `LEARNER-COURSE-ACCESS-01 requires persisted cohort, tenant, active role and user` (source gate; PG role transition matrix still pending) |
| `getLearnerAssignmentMethods` | Rejects malformed IDs, draft/unpublished/hidden, wrong delivery, FACULTY/Mentor access, disappearing assignment; returns exact allowed submission methods for authorized learner | `tests/unit/chat7-learner-assignment-policy-boundary.test.ts` — `LEARNER-ASSIGNMENT-METHODS-01` |
| `listLearnerCourseDeliveries` | Authorized group electives only, never host-Section fallback; active learner role; persisted offering/Section/program cohort and period alignment | `tests/unit/chat7-learner-course-delivery-security.test.ts` — `LEARNER-courses-roster-01` |
| `listLearnerCourseInstructors` | Reject inactive staff membership and deactivated accounts when composing current learner-facing instructor names | `tests/unit/chat7-learner-course-delivery-security.test.ts` — `LEARNER-courses-roster-01 enforces exact offering cohort and period` (source assertion; independent behavioral DB test pending) |
| `parseLearnerQuizDraft`, `normalizeLearnerQuizDraftForQuestions` | Corrupt/oversized storage, constructor/prototype keys, bounded answer/options, stale options, single-choice and inherited selections | `tests/unit/chat7-quiz-draft-embargo-security.test.ts` — `LEARNER-QUIZ-DRAFT-01` |
| `learnerQuizResultsReleased`, `canReviewLearnerQuizCorrectAnswers` | Closed, published, valid due time and authorized attempt jointly required; no premature answer key | `tests/unit/chat7-quiz-draft-embargo-security.test.ts` — `LEARNER-QUIZ-EMBARGO-01` |
| `learnerQuizSubmitDeadlineOpen` | Strict before-deadline, invalid/missing deadlines; due equality is closed | `tests/unit/chat7-quiz-draft-embargo-security.test.ts` — `LEARNER-QUIZ-DEADLINE-01` |
| `learnerQuizRequestCurrent`, `learnerQuizSubmissionReceiptVisible` | Aborted stale navigation and mismatched quiz receipt rejected | `tests/unit/chat7-quiz-draft-embargo-security.test.ts` — `LEARNER-QUIZ-STALE-01` |
| `parseCollegeIstLocal` | Boundary and leap-day IST conversion; invalid day/minutes/timezone-style input | `tests/unit/chat7-course-ist-materials-policy.test.ts` — `COURSE-IST-01` |
| `resourceMaterialCommandSchema`, `resourceMaterialsWriteReady` | Strict commands, URL protocol/credentials/fragment, no storage authority and verified storage-flag enforcement | `tests/unit/chat7-course-ist-materials-policy.test.ts` — `LEARNER-resource-07` |

Limitations: this is an incremental coverage slice, not a complete 345-file course-service register. Real PostgreSQL, browser and cloud CI execution are outstanding; tests were authored without running them.
