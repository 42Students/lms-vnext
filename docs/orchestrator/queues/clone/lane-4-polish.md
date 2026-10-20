# UI/UX polish queue: lane chat-4

31 surfaces, in order. ONE SURFACE PER TURN: take only the first unticked surface, make it excellent, tick it, and stop. The next surface comes with the next message. Never work on several surfaces at once.

Polish checklist (apply every point to the surface and to every component it renders, in every state):
1. Clutter: one clear primary action per surface, secondary actions demoted or moved into a menu; merge duplicate links/buttons; remove decoration that carries no information; collapse rarely used filters or fields behind a disclosure; no card inside card.
2. Hierarchy: one h1 (page) or one clear title (overlay), short subtitle, sections in the order people use them, most important content above the fold, related controls grouped with a clear label.
3. Alignment: every section starts on the same left edge, equal gutters and gaps (legacy scale 4/8/12/16/24/32), controls in a row share one height, labels align with inputs, columns align, no stray margins, header actions never wrap badly.
4. Density: consistent padding, comfortable line length, tables trimmed to the columns that matter (rest behind details), no walls of text; empty, loading and error states have a clear message and a next step.
5. Mobile 375 and tablet 768: real layouts (stack, reorder, full-width primary action, 44px tap targets), nothing cramped or overflowing; overlays become full-width sheets on mobile.
6. Keep exactly: legacy colours, radii, control sizes, fonts and wording (docs/design); keep ids, data-testid, aria labels, routes and behaviour; no new packages; valid TSX.

Route files rule: when you polish a PAGE surface, ALSO polish the loading.tsx, error.tsx, not-found.tsx and template.tsx in the same route folder, and check the nearest parent layout.tsx, as part of that same surface (they are the loading, error and missing states of that page). Tick the page only when its route files are done too.

Proof: ONE entry per surface in docs/audit/ux/polish-lane-4.md: surface | problems found (clutter, misalignment, hierarchy, density, mobile) | what you removed, merged, moved or realigned | files changed. Push to chatgpt/chat-4-b with [chat-4], ticking [x] in this queue in the same push.

- [x] `src/app/(authenticated)/tpo/reports/season-pipeline/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/reports/unplaced/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/requests/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/settings/after-college/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/settings/blocked-dates/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/settings/branding/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/settings/job-types/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/settings/notices/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/settings/notifications/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/settings/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/settings/prep-readiness/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/settings/public-link/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/settings/public-page/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/settings/recruiters/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/settings/rules/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/settings/season/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/settings/see/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/settings/team/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/settings/templates/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/settings/trusted/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/students/[membershipId]/history/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/students/[membershipId]/participation/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/students/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/students/preparation-plan/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/students/preparation-prep/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/students/requests/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/team/[threadId]/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/team/company/[companyId]/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/team/everyone/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/team/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/verification/page.tsx` (TPO page)
- [ ] `src/components/placements/learner-placement-preferences.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/placement-draft-edit-form.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/placement-job-create-form.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/placement-role-options.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/recruiter-result-controls.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/super-admin-drive-duplicate.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/tpo-drive-act-on-panel.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/tpo-drive-deadline-form.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/tpo-interview-slot-planner.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/tpo-round-calendar-control.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/tpo-season-controls.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/tpo/grid/grid-workspace.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/tpo/tpo-batch-class-decision.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/tpo/tpo-campaign-send-control.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/tpo/tpo-grid-filter-panel.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/tpo/tpo-spreadsheet-grid.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
