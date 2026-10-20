# UI/UX polish queue: lane chat-7

36 surfaces, in order. ONE SURFACE PER TURN: take only the first unticked surface, make it excellent, tick it, and stop. The next surface comes with the next message. Never work on several surfaces at once.

Polish checklist (apply every point to the surface and to every component it renders, in every state):
1. Clutter: one clear primary action per surface, secondary actions demoted or moved into a menu; merge duplicate links/buttons; remove decoration that carries no information; collapse rarely used filters or fields behind a disclosure; no card inside card.
2. Hierarchy: one h1 (page) or one clear title (overlay), short subtitle, sections in the order people use them, most important content above the fold, related controls grouped with a clear label.
3. Alignment: every section starts on the same left edge, equal gutters and gaps (legacy scale 4/8/12/16/24/32), controls in a row share one height, labels align with inputs, columns align, no stray margins, header actions never wrap badly.
4. Density: consistent padding, comfortable line length, tables trimmed to the columns that matter (rest behind details), no walls of text; empty, loading and error states have a clear message and a next step.
5. Mobile 375 and tablet 768: real layouts (stack, reorder, full-width primary action, 44px tap targets), nothing cramped or overflowing; overlays become full-width sheets on mobile.
6. Keep exactly: legacy colours, radii, control sizes, fonts and wording (docs/design); keep ids, data-testid, aria labels, routes and behaviour; no new packages; valid TSX.

Route files rule: when you polish a PAGE surface, ALSO polish the loading.tsx, error.tsx, not-found.tsx and template.tsx in the same route folder, and check the nearest parent layout.tsx, as part of that same surface (they are the loading, error and missing states of that page). Tick the page only when its route files are done too.

Proof: ONE entry per surface in docs/audit/ux/polish-lane-7.md: surface | problems found (clutter, misalignment, hierarchy, density, mobile) | what you removed, merged, moved or realigned | files changed. Push to chatgpt/chat-7-b with [chat-7], ticking [x] in this queue in the same push.

- [x] `src/app/(authenticated)/admin/placements/shortlisted/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/placements/student-lookup/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/programs/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/projects/[projectId]/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/projects/[projectId]/readiness/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/projects/at-risk/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/projects/audit/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/projects/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/projects/readiness/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/projects/reassign-mentor/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/projects/submissions/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/projects/templates/[templateId]/overview/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/projects/templates/[templateId]/resources/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/projects/templates/[templateId]/sprints/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/projects/templates/[templateId]/tasks/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/projects/templates/new/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/projects/templates/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/projects/workspaces/new/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/quizzes/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/recruiters/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/resources/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/semester-courses/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/semesters/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/settings/auth/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/settings/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/students/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/tenants/create/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/tenants/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/tenants/setup/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/verification/page.tsx` (Admin page)
- [x] `src/app/(authenticated)/admin/videos/page.tsx` (Admin page)
- [ ] `src/components/admin/college-admin-lifecycle-action.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [x] `src/components/admin/college-feature-rule-editor.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/admin/managed-college-subdomain.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [x] `src/components/admin/student-rule-editor.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/admin/super-admin-batch-roster-manager.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [x] `src/components/admin/super-admin-company-verification.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/admin/tenant-restore-action.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
