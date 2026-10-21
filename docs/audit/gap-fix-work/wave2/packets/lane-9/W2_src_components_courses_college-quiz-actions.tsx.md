# Work packet (wave 2): edit src/components/courses/college-quiz-actions.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-admin-quizzes.md, docs/audit/gap2/lane-3/superadmin-quizzes-section.md

## G2-3-001-044  [P2] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:475-485`
- vNext now: `src/components/courses/college-quiz-actions.tsx:60-63`
- Fix: Restore destructive popconfirm exact description; current native browser confirm omits warning about learner access and irreversibility.

## G2-3-001-068  [P2] GAP  facet F16  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:533-558`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:475-485`
- vNext now: `src/components/courses/college-quiz-create.tsx:106-130`; `src/components/courses/college-quiz-actions.tsx:83-90`
- Fix: Verify 44px touch targets/scroll for filter selectors, row actions and confirmation controls on 375px.

## G2-3-001-071  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:476-485`
- vNext now: `src/components/courses/college-quiz-actions.tsx:60-63`
- Fix: Replace `window.confirm` with focus-managed confirmation matching modal semantics and destructive action labels.

## G2-3-005-033  [P2] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:475-485`
- vNext now: `src/components/courses/college-quiz-actions.tsx:60-80`
- Fix: Use focus-managed destructive confirmation matching Delete quiz prompt, not native confirm/Archive.

## G2-3-005-050  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:474-485`
- vNext now: `src/components/courses/college-quiz-actions.tsx:60-80`
- Fix: Native confirm does not match Ant Popconfirm focus, cancel and keyboard semantics.
