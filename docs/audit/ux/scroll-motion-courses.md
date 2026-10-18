# Learner Courses, Projects and Assessments — hidden-scrollbar audit

Owner lane: chat-7. Date: 2026-10-18. Source-reviewed UX hardening; browser and assistive-technology certification have not been executed.

| Surface | Scroll target | Change and cue | Keyboard/mobile contract |
|---|---|---|---|
| `src/components/projects/learner-board-interactive.tsx` | Horizontal Board task lanes | Visible phone hint: “Scroll sideways to see all Board lanes.”; `overscroll-x-contain` | Named `role=region`, `tabIndex=0`, focus outline; status and backlog controls at least 44px |
| `src/components/courses/learner-course-list.tsx` | Semester Details → All Courses; Credits Breakdown | Context-specific “Scroll inside the list” text when more than eight items; no visible scrollbar required | Named focusable `overflow-y-auto` regions with `overscroll-contain`; inline content remains in the details panel |
| `src/components/courses/learner-assessment-overview.tsx` | Quiz summary → Submitted quiz titles | “Scroll to see more submitted quizzes.” when more than five items | Named focusable vertical list with `overscroll-contain` and visible focus ring |
| `src/components/courses/college-quiz-attempts.tsx` | Super Admin Quiz directory → per-Section submission/attempt panel | “Scroll inside this panel to see more quiz submissions.” after five rows | Named focusable `overflow-y-auto overscroll-contain` panel, visible focus ring, 44px pagination and Section controls |
| `src/components/courses/college-assignment-review.tsx` | Super Admin Assignment directory → Section grading controls | Existing partial-publish/retry progress text stays visible | Section dropdown and Publish grades/Retry actions upgraded to 44px for touch; no extra nested scroll |
| `src/components/courses/learner-course-discussion.tsx` | Course discussion thread | Already has `overscroll-contain`, focus-visible outline and mobile “Jump to latest” affordance | Existing behavior retained, no extra nested scroll added |

The Board now fails closed for malformed/overlong filters **after** the project authorization check with a “Clear filters” action, rather than silently showing all tasks. The Board progress endpoint and controls also use one allowed learner transition policy; `TODO` is not an allowed destination from an existing task state.

Evidence: `tests/unit/PROJ-BREAK-chat7-learner-board-filters-and-scroll.test.ts`, `tests/unit/PROJ-BREAK-chat7-learner-progress-transition-matrix.test.ts`, `tests/unit/UX-chat7-learner-scroll-motion-01.test.ts`, `tests/unit/chat7-superadmin-course-assessment-ux-boundaries.test.ts`. No animation durations or one-off easing tokens added.

Remaining verification: run 320px/375px phone and keyboard walk for all three lists after the owner’s final all-lane CI/build pass. No screenshot-based sign-off is claimed.

## Learner/Faculty resource materials controls (chat-7 follow-up)

`src/components/courses/lesson-resource-materials-control.tsx` keeps its existing per-material error, confirmation, retry and cancellation text, but raises editable links, Save/Remove/Edit buttons and title/HTTPS inputs to **44px** touch height. The existing external-link navigation remains `noopener noreferrer`. `tests/unit/UX-chat7-resource-material-touch-10.test.ts` captures action, confirmation, role-independent error and touch-size source checks. This was source-reviewed only; a real 320px device, keyboard focus and screen-reader walkthrough is still required.
