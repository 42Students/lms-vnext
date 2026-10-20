# UI/UX polish queue: lane chat-8

29 surfaces, in order. ONE SURFACE PER TURN: take only the first unticked surface, make it excellent, tick it, and stop. The next surface comes with the next message. Never work on several surfaces at once.

Polish checklist (apply every point to the surface and to every component it renders, in every state):
1. Clutter: one clear primary action per surface, secondary actions demoted or moved into a menu; merge duplicate links/buttons; remove decoration that carries no information; collapse rarely used filters or fields behind a disclosure; no card inside card.
2. Hierarchy: one h1 (page) or one clear title (overlay), short subtitle, sections in the order people use them, most important content above the fold, related controls grouped with a clear label.
3. Alignment: every section starts on the same left edge, equal gutters and gaps (legacy scale 4/8/12/16/24/32), controls in a row share one height, labels align with inputs, columns align, no stray margins, header actions never wrap badly.
4. Density: consistent padding, comfortable line length, tables trimmed to the columns that matter (rest behind details), no walls of text; empty, loading and error states have a clear message and a next step.
5. Mobile 375 and tablet 768: real layouts (stack, reorder, full-width primary action, 44px tap targets), nothing cramped or overflowing; overlays become full-width sheets on mobile.
6. Keep exactly: legacy colours, radii, control sizes, fonts and wording (docs/design); keep ids, data-testid, aria labels, routes and behaviour; no new packages; valid TSX.

Route files rule: when you polish a PAGE surface, ALSO polish the loading.tsx, error.tsx, not-found.tsx and template.tsx in the same route folder, and check the nearest parent layout.tsx, as part of that same surface (they are the loading, error and missing states of that page). Tick the page only when its route files are done too.

Proof: ONE entry per surface in docs/audit/ux/polish-lane-8.md: surface | problems found (clutter, misalignment, hierarchy, density, mobile) | what you removed, merged, moved or realigned | files changed. Push to chatgpt/chat-8-b with [chat-8], ticking [x] in this queue in the same push.

- [x] `src/app/(authenticated)/college/academics/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/academics/sections/[sectionId]/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/activity/[eventId]/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/activity/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/announcements/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/assignments/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/attendance/corrections/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/attendance/departments/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/attendance/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/attendance/settings/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/batch-promotion/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/batches/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/branding/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/classes/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/classes/recurring-preview/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/college-profile/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/companies/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/contacts/[membershipId]/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/contacts/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/course-progress/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/courses/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/departments/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/domains/page.tsx` (College admin page)
- [x] `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/electives/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/faculty-assignment/page.tsx` (College admin page)
- [ ] `src/components/college/college-faculty-assignment-actions.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/college/college-student-lifecycle-action.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/people/faculty-profile-editor.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
