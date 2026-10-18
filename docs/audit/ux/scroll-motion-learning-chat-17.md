# Scroll and motion: teacher / learner and public surfaces — chat-17

## Source changes after the shared kit

| Surface | Scroll / motion cue | Status |
|---|---|---|
| `/teacher/calendar` | Old 7-column 44rem schedule grid sat behind an invisible horizontal scrollbar. Wrapped in named `ScrollCue axis=x` with live left/right fades, touch/keyboard scrolling and scroll containment. Original course/schedule wording remains exact. | Implemented |
| `/learn/courses/[deliveryId]/[...courseTab]` via `learner-course-workspace.tsx` | Learning-path filter chips previously clipped without an edge hint. Added horizontal `ScrollCue`, focusable region when overflow occurs, visible fades, and 44px tabs. Lesson and filter URL values unchanged. | Implemented |
| `/teacher/courses/[deliveryId]/students/[membershipId]` | Replaced separate desktop raw `<table>` and duplicated mobile list with shared `DataTable`, explicit legacy empty state, and accessible 4-field mobile cards. This inherits desktop edge fades and keyboard scrolling without duplicating the roster. | Implemented |
| `/company-share/[token]` | Existing shared DataTable now inherits 320px cards and overflow-aware edge fades, with original authorisation and selected-column whitelist intact. | Kit inheritance |
| Public `/home`, `/`, `/request-demo`, `/enterprises`, `/universities`, `/platform` | Marketing shell is vertically document-scrolled, not a nested scroll region; hidden global scrollbar does not truncate document content. No overlay/special scroll behavior required. | Reviewed; unchanged |

**Tests:** existing `UX-learning-cross-audit-chat17.test.ts` and new `UX-kit-scroll-motion-01.test.tsx` plus closure tests. Real screen and keyboard interaction pending orchestrator.

**Legacy wording and privacy:** untouched. No production/environment mutations.
