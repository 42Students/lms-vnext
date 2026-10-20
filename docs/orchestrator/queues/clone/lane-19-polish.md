# UI/UX polish queue: lane chat-19

31 surfaces, in order. ONE SURFACE PER TURN: take only the first unticked surface, make it excellent, tick it, and stop. The next surface comes with the next message. Never work on several surfaces at once.

Polish checklist (apply every point to the surface and to every component it renders, in every state):
1. Clutter: one clear primary action per surface, secondary actions demoted or moved into a menu; merge duplicate links/buttons; remove decoration that carries no information; collapse rarely used filters or fields behind a disclosure; no card inside card.
2. Hierarchy: one h1 (page) or one clear title (overlay), short subtitle, sections in the order people use them, most important content above the fold, related controls grouped with a clear label.
3. Alignment: every section starts on the same left edge, equal gutters and gaps (legacy scale 4/8/12/16/24/32), controls in a row share one height, labels align with inputs, columns align, no stray margins, header actions never wrap badly.
4. Density: consistent padding, comfortable line length, tables trimmed to the columns that matter (rest behind details), no walls of text; empty, loading and error states have a clear message and a next step.
5. Mobile 375 and tablet 768: real layouts (stack, reorder, full-width primary action, 44px tap targets), nothing cramped or overflowing; overlays become full-width sheets on mobile.
6. Keep exactly: legacy colours, radii, control sizes, fonts and wording (docs/design); keep ids, data-testid, aria labels, routes and behaviour; no new packages; valid TSX.

Proof: ONE entry per surface in docs/audit/ux/polish-lane-19.md: surface | problems found (clutter, misalignment, hierarchy, density, mobile) | what you removed, merged, moved or realigned | files changed. Push to chatgpt/chat-19-b with [chat-19], ticking [x] in this queue in the same push.

- [ ] `src/components/tpo/tpo-batch-eligibility-import.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/tpo-batch-inline-decision.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/tpo-bell-panel.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/tpo-bulk-action-panel.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/tpo-company-create-form.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/tpo-find-shortcut.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/tpo-keyboard-shortcuts.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/tpo-new-followup-modal.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/tpo-new-recruiter-conversation.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/tpo-notice-composer-dialog.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/tpo-notice-delete-confirm.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/tpo-student-nudge-panel.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/tpo-student-quick-panel.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/tpo-student-saved-views.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/tpo-students-assign-prep.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/tpo-students-bulk-add.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/tpo-students-bulk-debar.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/tpo-students-drive-visibility.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/tpo-team-ask-panel.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/tpo-team-message-actions.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/tpo-timed-debar-control.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tracker/known-errors-workspace.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tracker/tracker-live-logs-explorer.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tracker/tracker-quick-report-launcher.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tracker/tracker-telegram-manual-panel.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/ui/confirm-action-dialog.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/ui/confirm-dialog.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/ui/date-input.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/ui/drawer.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/ui/searchable-select.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/verification/VerificationReviewDrawer.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
