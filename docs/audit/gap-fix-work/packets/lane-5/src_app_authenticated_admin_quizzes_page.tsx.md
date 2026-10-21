# Work packet: edit src/app/(authenticated)/admin/quizzes/page.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-quiz-controller.md, docs/audit/gap2/lane-3/superadmin-quizzes-section.md, docs/audit/gap2/lane-3/superadmin-quizzes.md

## G2-2-022-023  [P1] GAP  facet F07  effort M
- Legacy: AdminQuizController.java:62-84 scoped Super Admin forbidden messages
- vNext now: src/app/(authenticated)/admin/quizzes/page.tsx:26-30 Quiz access denied for non-SA, aggregate service uses permissions
- Fix: Ensure wrong college within org and wrong org are both explicitly denied.

## G2-2-022-034  [P1] GAP  facet F11  effort M
- Legacy: AdminQuizController.java:62-84 special superadmin college and organization scope
- vNext now: src/app/(authenticated)/admin/quizzes/page.tsx:25-35 adminScope college requirement
- Fix: Validate selected college belongs to admin principal's org/college, not just non-null.

## G2-3-005-056  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:128-155`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:39-60`
- Fix: Must key/invalidate all dialogs when active college changes, not only server directory list.

## G2-3-004-026  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:265-285`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:52-53`; `src/modules/admin-ui/super-admin-learning-csv-service.ts:29-61`
- Fix: Legacy export page has 5 columns, vNext up to 500 filtered rows/13 columns with truncation marker and different filename. Keep page-export option or clearly label expanded export.

## G2-3-004-028  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:33-46`; `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:121-170`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:25-35`; `src/modules/courses/college-assessment-aggregate-service.ts:53-73`
- Fix: Legacy scope selection persists and is applied via scope-token context, vNext depends server adminScope. Verify selected college survives navigation/reload and cannot leak across tenants.

## G2-3-004-029  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/quizzes.js:25-27`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:39-41`
- Fix: Legacy `key=selectedCollegeId` remounts Quizzes on scope switch and wipes pending controls; vNext SSR reload may preserve inline client state. Key creator by scope or reset state explicitly.

## G2-3-004-044  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/quizzes.js:25-27`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:117-119`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:39-59`
- Fix: Legacy scope keying prevents stale submissions overlay after scope switch, vNext creator/editor scope binding needs active-college guard.

## G2-2-022-021  [P2] GAP  facet F07  effort M
- Legacy: AdminQuizController.java:94-96 exact collegeId must be a positive integer
- vNext now: src/app/(authenticated)/admin/quizzes/page.tsx:32-35 Select a college to continue
- Fix: Preserve exact validation at legacy API boundary and actionable scope message.

## G2-3-005-026  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:576-592`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:54-58`
- Fix: Metadata options failure must offer retry and legacy exact warning, not passive temporarily-unavailable alert.

## G2-3-005-027  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:587-604`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:43-50`
- Fix: Legacy list error retains same-scope previous rows with refresh warning; new error state discards list.

## G2-3-004-018  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/quizzes.js:15-18`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:34-35`
- Fix: Exact missing-scope copy exists but warning hierarchy differs; keep exact heading+description and warning tone.

## G2-3-004-019  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:576-592`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:43-49`; `src/app/(authenticated)/admin/quizzes/page.tsx:55-58`
- Fix: Legacy metadata load has `Quiz setup options could not be loaded` and `Retry options`; vNext generic warning lacks retry on options failure.

## G2-3-004-020  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:590-595`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:43-50`
- Fix: List failure legacy `Quizzes could not be loaded` or `Couldn't refresh quizzes` with last-known rows; vNext `Quizzes unavailable` with retry navigation and no stale rows.

## G2-2-022-022  [P3] GAP  facet F07  effort S
- Legacy: AdminQuizController.java:101-106 500 Failed to fetch quizzes
- vNext now: src/app/(authenticated)/admin/quizzes/page.tsx:43-49 Quizzes unavailable/Retry loading quizzes
- Fix: Map backend failure to equivalent error semantics while keeping retry.

## G2-2-022-024  [P3] GAP  facet F08  effort S
- Legacy: AdminQuizController.java:103 success Quizzes fetched successfully
- vNext now: src/app/(authenticated)/admin/quizzes/page.tsx:51-59 directory only
- Fix: Expose load status or live announcement when list updates.
