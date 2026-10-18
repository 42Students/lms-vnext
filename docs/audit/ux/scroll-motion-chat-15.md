# Chat-15 scroll and motion findings · 2026-10-18

## Implemented

| Surface | Cue and safety behaviour | Test |
|---|---|---|
| src/components/tracker/tracker-quick-report-launcher.tsx | Replaced hand-built modal with native shared Drawer. Focus trap/return, Escape/backdrop, scroll locking, keyboard-accessible vertical ScrollCue and visual viewport sizing. Alt+B and captured context retained. | UX-hr-tracker-overlays-chat15-01; UX-chat15-scroll-motion-01 |
| src/components/hr/recruiter-notification-bell.tsx | Wrapped notification results in conditional, focusable vertical ScrollCue with overscroll containment and edge fades. Footer remains outside the scroll region. | UX-hr-tracker-overlays-chat15-01; UX-chat15-scroll-motion-01 |
| src/components/verification/VerificationReviewDrawer.tsx | Added vertical fade cue, overscroll containment, safe-area bottom padding and touch-sized close/sequence controls. Preserved existing focus loop/return and Escape guard. | UX-hr-tracker-overlays-chat15-01; UX-chat15-scroll-motion-01 |
| src/components/tracker/audit-finding-status-action.tsx | Triage select now has at least 44px height; audit confirmation and optimistic version preserved. | UX-hr-tracker-overlays-chat15-01 |
| src/components/hr/recruiter-request-cancel-button.tsx | Cancellation trigger is 44px high; unknown failures use friendly mapping. | UX-hr-tracker-overlays-chat15-01 |
| src/components/ui/bottom-sheet.tsx, loading-state.tsx, selection-controls.tsx, use-confirm-flow.tsx, scroll-cue.tsx | Direct source contract tests check modal focus and cancellation, 44px hit areas, safe motion tokens, accessible skeleton, conditional scroll fades. | UX-ui-primitives-chat15-01; UX-chat15-scroll-motion-01 |

The global invisible scrollbar rule remains unchanged. Native Drawer owns body locking and reduced-motion handling.

## Still pending

Other HR, tracker, activity and verification surfaces in docs/audit/ui-surfaces/UI-SURFACES.md require individual scroll and motion verification. Shell source remains owned by chat-9; only non-mutating coverage is planned here. Unreviewed components are not waived.
