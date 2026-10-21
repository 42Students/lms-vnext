# Work packet (wave 2): edit src/components/courses/college-quiz-create.tsx

23 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-admin-quizzes.md, docs/audit/gap2/lane-3/superadmin-quizzes-section.md, docs/audit/gap2/lane-3/superadmin-quizzes.md

## G2-3-001-007  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:497-521`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:83-97`; `src/components/courses/college-quiz-create.tsx:97-105`
- Fix: Use legacy `Create quiz` button with Plus icon gated by course + lesson; remove always-visible `Create New Quiz` affordance.

## G2-3-001-024  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:535-557`
- vNext now: `src/components/courses/college-quiz-create.tsx:105-117`
- Fix: Separate searchable course selector from dependent lesson selector, resetting lesson on course change.

## G2-3-001-025  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:293-307`
- vNext now: `src/components/courses/college-quiz-create.tsx:105-106`
- Fix: Use modal `Create quiz`/`Edit quiz` (820px/94vw) and legacy dismiss/dirty protection, not expanding inline form.

## G2-3-001-026  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:345-347`
- vNext now: `src/components/courses/college-quiz-create.tsx:119-122`
- Fix: Restore Quiz title placeholder `Example: Java basics checkpoint` and required validation wording.

## G2-3-001-029  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:391-411`
- vNext now: `src/components/courses/college-quiz-create.tsx:135-140`
- Fix: Restore legacy Switch controls and their per-quiz explanatory helper text; vNext uses checkboxes without helper prose.

## G2-3-001-031  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:491-505`
- vNext now: `src/components/courses/college-quiz-create.tsx:144-155`
- Fix: Restore per-question max points 100 (legacy UI), not 1000; reconcile backend numeric contract before changing.

## G2-3-001-032  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:477-504`; `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:539-558`
- vNext now: `src/components/courses/college-quiz-create.tsx:143-189`
- Fix: Match legacy form per-question `Question` label, Type radio buttons, `Add option`, `Add question`, `Remove`; preserve vNext accessible reordering as extra.

## G2-3-001-045  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:293-307`
- vNext now: `src/components/courses/college-quiz-create.tsx:105-210`
- Fix: Restore dirty-aware modal overlay close/Escape/backdrop semantics (blocked saving), beyond inline opened state.

## G2-3-001-059  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:169-189`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:200-214`
- vNext now: `src/components/courses/college-quiz-create.tsx:97-105`
- Fix: Expose separate course/lesson loading and Retry options on failed metadata fetch, rather than only unavailable lessons.

## G2-3-001-067  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/layouts/AdminLayout.js:336-366`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:210-232`; `src/components/courses/college-quiz-create.tsx:105-110`
- Fix: Verify 768px breakpoint behavior of inline builder and sticky footer versus legacy modal capped at min(820px,94vw).

## G2-3-001-068  [P2] GAP  facet F16  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:533-558`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:475-485`
- vNext now: `src/components/courses/college-quiz-create.tsx:106-130`; `src/components/courses/college-quiz-actions.tsx:83-90`
- Fix: Verify 44px touch targets/scroll for filter selectors, row actions and confirmation controls on 375px.

## G2-3-001-070  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:293-307`; `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:345-345`
- vNext now: `src/components/courses/college-quiz-create.tsx:105-130`
- Fix: Restore dialog focus trap, Escape and accessible name `Create quiz`; inline form may not give equivalent focus transition.

## G2-3-001-072  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:554-557`
- vNext now: `src/components/courses/college-quiz-create.tsx:100-103`
- Fix: Change `Create New Quiz` to legacy button `Create quiz`; preserve `Create New Quiz` as section heading if needed.

## G2-3-001-074  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:497-505`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:540-558`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:109-137`; `src/components/courses/college-quiz-create.tsx:107-117`
- Fix: Use legacy placeholders `All courses`, `Course for new quiz`, `Lesson for new quiz` vs exact-code/search labels.

## G2-3-005-005  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:553-559`
- vNext now: `src/components/courses/college-quiz-create.tsx:98-106`
- Fix: Use Plus icon and exact Create quiz enabled only after course and lesson selection.

## G2-3-005-017  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:533-560`
- vNext now: `src/components/courses/college-quiz-create.tsx:98-132`
- Fix: Require separate course and dependent lesson selector before launching modal.

## G2-3-005-018  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:293-345`
- vNext now: `src/components/courses/college-quiz-create.tsx:98-122`
- Fix: Modal create width 820px/94vw and centered overlay differs from inline quiz authoring.

## G2-3-005-019  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:345-347`
- vNext now: `src/components/courses/college-quiz-create.tsx:112-121`
- Fix: Restore title placeholder Example: Java basics checkpoint and required-message wording.

## G2-3-005-022  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:391-415`
- vNext now: `src/components/courses/college-quiz-create.tsx:133-142`
- Fix: Restore Switch controls with explanatory help, and Publish now default on; new checkbox/draft-only flow diverges.

## G2-3-005-023  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:478-568`
- vNext now: `src/components/courses/college-quiz-create.tsx:140-208`
- Fix: Restore question type/points/options hierarchy and Add option/Add question/remove affordances.

## G2-3-005-048  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:293-307`
- vNext now: `src/components/courses/college-quiz-create.tsx:100-205`
- Fix: Mobile modal capped at 94vw with focus trap versus inline stack, check viewport-fit/scroll footer.

## G2-3-005-051  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:554-560`
- vNext now: `src/components/courses/college-quiz-create.tsx:98-107`
- Fix: Use Create quiz action not Create New Quiz and legacy selected course/lesson placeholders.

## G2-3-004-016  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:535-558`
- vNext now: `src/components/courses/college-quiz-create.tsx:100-130`; `src/app/(authenticated)/admin/quizzes/page.tsx:54-59`
- Fix: Legacy requires separate course and course-dependent lesson before enabling create modal; vNext inline authoring has different flow/visibility.
