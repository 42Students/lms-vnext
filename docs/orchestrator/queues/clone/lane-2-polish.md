# UI/UX polish queue: lane chat-2

33 surfaces, in order. ONE SURFACE PER TURN: take only the first unticked surface, make it excellent, tick it, and stop. The next surface comes with the next message. Never work on several surfaces at once.

Polish checklist (apply every point to the surface and to every component it renders, in every state):
1. Clutter: one clear primary action per surface, secondary actions demoted or moved into a menu; merge duplicate links/buttons; remove decoration that carries no information; collapse rarely used filters or fields behind a disclosure; no card inside card.
2. Hierarchy: one h1 (page) or one clear title (overlay), short subtitle, sections in the order people use them, most important content above the fold, related controls grouped with a clear label.
3. Alignment: every section starts on the same left edge, equal gutters and gaps (legacy scale 4/8/12/16/24/32), controls in a row share one height, labels align with inputs, columns align, no stray margins, header actions never wrap badly.
4. Density: consistent padding, comfortable line length, tables trimmed to the columns that matter (rest behind details), no walls of text; empty, loading and error states have a clear message and a next step.
5. Mobile 375 and tablet 768: real layouts (stack, reorder, full-width primary action, 44px tap targets), nothing cramped or overflowing; overlays become full-width sheets on mobile.
6. Keep exactly: legacy colours, radii, control sizes, fonts and wording (docs/design); keep ids, data-testid, aria labels, routes and behaviour; no new packages; valid TSX.

Route files rule: when you polish a PAGE surface, ALSO polish the loading.tsx, error.tsx, not-found.tsx and template.tsx in the same route folder, and check the nearest parent layout.tsx, as part of that same surface (they are the loading, error and missing states of that page). Tick the page only when its route files are done too.

Proof: ONE entry per surface in docs/audit/ux/polish-lane-2.md: surface | problems found (clutter, misalignment, hierarchy, density, mobile) | what you removed, merged, moved or realigned | files changed. Push to chatgpt/chat-2-b with [chat-2], ticking [x] in this queue in the same push.

- [x] `src/app/(authenticated)/tpo/messages/notifications/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/messages/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/more/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/notifications/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/about/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/[applicationId]/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applications-export/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/cancel-preview/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/candidate-schedule/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/close-preview/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/closeout/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/discussion/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/drive-day/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/extend-deadline/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/interview-slots/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/joining/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/slots/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/selections/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-audit/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/shortlist/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/waitlist/page.tsx` (TPO page)
- [x] `src/components/placements/drive-day-roster.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [x] `src/components/placements/placement-calendar-workspace.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [x] `src/components/placements/placement-drive-workspace.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [x] `src/components/placements/placement-recruiter-access.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [x] `src/components/placements/recruiter-focused-review-shortcuts.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/super-admin-bulk-drive-actions.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/tpo-bulk-round-result-recorder.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/tpo-drive-clone-action.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/tpo-drive-workspace-nav.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/tpo-mark-own-notification-read.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/tpo-round-result-entry-form.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/tpo-trust-toggle.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/tpo/tpo-applications-spreadsheet.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/tpo/tpo-batch-rule-editor.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/tpo/tpo-company-team-conversation.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/tpo/tpo-notice-undo-toast.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/tpo/tpo-topbar-new-menu.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
