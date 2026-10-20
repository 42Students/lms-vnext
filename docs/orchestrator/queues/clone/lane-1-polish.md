# UI/UX polish queue: lane chat-1

33 surfaces, in order. ONE SURFACE PER TURN: take only the first unticked surface, make it excellent, tick it, and stop. The next surface comes with the next message. Never work on several surfaces at once.

Polish checklist (apply every point to the surface and to every component it renders, in every state):
1. Clutter: one clear primary action per surface, secondary actions demoted or moved into a menu; merge duplicate links/buttons; remove decoration that carries no information; collapse rarely used filters or fields behind a disclosure; no card inside card.
2. Hierarchy: one h1 (page) or one clear title (overlay), short subtitle, sections in the order people use them, most important content above the fold, related controls grouped with a clear label.
3. Alignment: every section starts on the same left edge, equal gutters and gaps (legacy scale 4/8/12/16/24/32), controls in a row share one height, labels align with inputs, columns align, no stray margins, header actions never wrap badly.
4. Density: consistent padding, comfortable line length, tables trimmed to the columns that matter (rest behind details), no walls of text; empty, loading and error states have a clear message and a next step.
5. Mobile 375 and tablet 768: real layouts (stack, reorder, full-width primary action, 44px tap targets), nothing cramped or overflowing; overlays become full-width sheets on mobile.
6. Keep exactly: legacy colours, radii, control sizes, fonts and wording (docs/design); keep ids, data-testid, aria labels, routes and behaviour; no new packages; valid TSX.

Route files rule: when you polish a PAGE surface, ALSO polish the loading.tsx, error.tsx, not-found.tsx and template.tsx in the same route folder, and check the nearest parent layout.tsx, as part of that same surface (they are the loading, error and missing states of that page). Tick the page only when its route files are done too.

Proof: ONE entry per surface in docs/audit/ux/polish-lane-1.md: surface | problems found (clutter, misalignment, hierarchy, density, mobile) | what you removed, merged, moved or realigned | files changed. Push to chatgpt/chat-1-b with [chat-1], ticking [x] in this queue in the same push.

- [x] `src/app/(authenticated)/tpo/announcements/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/audit/actors/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/audit/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/batches/[batchId]/classes/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/batches/[batchId]/history/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/batches/[batchId]/invitation-prep/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/batches/[batchId]/nudge-prep/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/batches/[batchId]/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/batches/[batchId]/registrations/[membershipId]/history/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/batches/[batchId]/registrations/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/batches/[batchId]/reminder-prep/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/batches/[batchId]/rules/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/batches/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/calendar/export/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/calendar/interviews/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/calendar/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/calendar/rounds/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/companies/[companyId]/contact-log/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/companies/[companyId]/feedback/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/companies/[companyId]/manage/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/companies/[companyId]/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/companies/[companyId]/people/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/companies/[companyId]/team/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/companies/archived/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/companies/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/drive-day/[roundId]/no-shows/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/drive-day/[roundId]/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/drive-day/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/find/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/follow-ups/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/home/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx` (TPO page)
- [ ] `src/components/placements/college-interview-status-actions.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/learner-placement-requests.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/placement-drive-controls.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/placement-job-lifecycle-controls.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/placement-season-manager.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/report-interactive-table.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/tpo-bulk-drive-reminder.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/tpo-drive-change-requests.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/tpo-drive-saved-views.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/tpo-joining-update-form.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/tpo-round-check-in.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/tpo-selection-import.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/tpo/recruiter-roster-display-controls.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/tpo/tpo-batch-invitation-control.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/tpo/tpo-company-memory-workspace.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/tpo/tpo-mobile-footer.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/tpo/tpo-team-assign-unowned.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
