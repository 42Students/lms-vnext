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

| src/components/hr/recruiter-round-inline-editor.tsx | Replaced custom role=dialog overlay with native shared Dialog: focus trap and restoration, Escape/backdrop dismissal blocked while submitting, conditional vertical scroll cues; enlarged inline round controls to 44px. | UX-hr-round-editor-chat15-01 |
| src/app/(authenticated)/hr/profile/page.tsx | Replaced nested 2x horizontal table scroller with responsive DataTable/ScrollCue, 44px accessible access listing, original grant wording. | UX-hr-data-tables-chat15-01 |
| src/app/(authenticated)/hr/company/reports/page.tsx | Replaced duplicated mobile cards / nested desktop raw table with one shared DataTable, preserves all 10 metrics, mobile disclosures, responsive cues. | UX-hr-data-tables-chat15-01 |

| src/components/hr/recruiter-notification-bell.tsx (second pass) | Corrected footer from /hr/messages (conversations) to /hr/notifications; Escape now returns trigger focus, outside pointer closes, links and retry are 44px. | UX-chat15-overlays-second-pass |
| src/components/tracker/tracker-live-logs-explorer.tsx | Replaced falsely modal, inline report export with real shared Dialog; labelled CSV/text export, 44px result actions, empty role=status, keyboard-reachable details. | UX-chat15-overlays-second-pass |
| src/components/tracker/tracker-telegram-manual-panel.tsx | Enlarged all digest/test/confirm actions to 44px; confirmation and rate-limit consequence retained. | UX-chat15-overlays-second-pass |
| src/components/activity/learner-notifications-inbox.tsx | Fixed 40px action to 44px; retained Dialog focus, guarded mark-all and explicit errors. | UX-chat15-overlays-second-pass |

## Still pending

Other HR, tracker, activity and verification surfaces in docs/audit/ui-surfaces/UI-SURFACES.md require individual scroll and motion verification. Shell source remains owned by chat-9; only non-mutating coverage is planned here. Unreviewed components are not waived.
