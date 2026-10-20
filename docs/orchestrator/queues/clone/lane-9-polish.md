# UI/UX polish queue: lane chat-9

29 surfaces, in order. ONE SURFACE PER TURN: take only the first unticked surface, make it excellent, tick it, and stop. The next surface comes with the next message. Never work on several surfaces at once.

Polish checklist (apply every point to the surface and to every component it renders, in every state):
1. Clutter: one clear primary action per surface, secondary actions demoted or moved into a menu; merge duplicate links/buttons; remove decoration that carries no information; collapse rarely used filters or fields behind a disclosure; no card inside card.
2. Hierarchy: one h1 (page) or one clear title (overlay), short subtitle, sections in the order people use them, most important content above the fold, related controls grouped with a clear label.
3. Alignment: every section starts on the same left edge, equal gutters and gaps (legacy scale 4/8/12/16/24/32), controls in a row share one height, labels align with inputs, columns align, no stray margins, header actions never wrap badly.
4. Density: consistent padding, comfortable line length, tables trimmed to the columns that matter (rest behind details), no walls of text; empty, loading and error states have a clear message and a next step.
5. Mobile 375 and tablet 768: real layouts (stack, reorder, full-width primary action, 44px tap targets), nothing cramped or overflowing; overlays become full-width sheets on mobile.
6. Keep exactly: legacy colours, radii, control sizes, fonts and wording (docs/design); keep ids, data-testid, aria labels, routes and behaviour; no new packages; valid TSX.

Route files rule: when you polish a PAGE surface, ALSO polish the loading.tsx, error.tsx, not-found.tsx and template.tsx in the same route folder, and check the nearest parent layout.tsx, as part of that same surface (they are the loading, error and missing states of that page). Tick the page only when its route files are done too.

Proof: ONE entry per surface in docs/audit/ux/polish-lane-9.md: surface | problems found (clutter, misalignment, hierarchy, density, mobile) | what you removed, merged, moved or realigned | files changed. Push to chatgpt/chat-9-b with [chat-9], ticking [x] in this queue in the same push.

- [x] `src/app/(authenticated)/college/faculty/[membershipId]/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/faculty/import/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/faculty/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/groups/[groupId]/import-preview/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/groups/[groupId]/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/groups/[groupId]/rule-preview/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/groups/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/hiring-dashboard/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/lecture-halls/[hallId]/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/lecture-halls/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/lessons/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/live-classes/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/people/manage/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/people/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/placements/calendar/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/placements/drives/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/placements/interviews/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/placements/new/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/placements/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/placements/readiness-by-department/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/placements/retention/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/placements/student-lookup/page.tsx` (College admin page)
- [ ] `src/components/college/college-faculty-lifecycle-action.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/college/use-college-confirmation.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/people/faculty-profile-text-section.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
