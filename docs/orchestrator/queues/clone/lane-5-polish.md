# UI/UX polish queue: lane chat-5

38 surfaces, in order. ONE SURFACE PER TURN: take only the first unticked surface, make it excellent, tick it, and stop. The next surface comes with the next message. Never work on several surfaces at once.

Polish checklist (apply every point to the surface and to every component it renders, in every state):
1. Clutter: one clear primary action per surface, secondary actions demoted or moved into a menu; merge duplicate links/buttons; remove decoration that carries no information; collapse rarely used filters or fields behind a disclosure; no card inside card.
2. Hierarchy: one h1 (page) or one clear title (overlay), short subtitle, sections in the order people use them, most important content above the fold, related controls grouped with a clear label.
3. Alignment: every section starts on the same left edge, equal gutters and gaps (legacy scale 4/8/12/16/24/32), controls in a row share one height, labels align with inputs, columns align, no stray margins, header actions never wrap badly.
4. Density: consistent padding, comfortable line length, tables trimmed to the columns that matter (rest behind details), no walls of text; empty, loading and error states have a clear message and a next step.
5. Mobile 375 and tablet 768: real layouts (stack, reorder, full-width primary action, 44px tap targets), nothing cramped or overflowing; overlays become full-width sheets on mobile.
6. Keep exactly: legacy colours, radii, control sizes, fonts and wording (docs/design); keep ids, data-testid, aria labels, routes and behaviour; no new packages; valid TSX.

Proof: ONE entry per surface in docs/audit/ux/polish-lane-5.md: surface | problems found (clutter, misalignment, hierarchy, density, mobile) | what you removed, merged, moved or realigned | files changed. Push to chatgpt/chat-5-b with [chat-5], ticking [x] in this queue in the same push.

- [ ] `src/app/(authenticated)/admin/academics/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/academics/sections/[sectionId]/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/announcements/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/assignments/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/attendance/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/audit/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/batch-promotion/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/batches/[batchId]/students/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/batches/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/classes/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/colleges/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/companies/[companyId]/drives/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/companies/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/course-progress/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/course-progress/students/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/courses/offerings/[offeringId]/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/courses/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/departments/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/domains/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/electives/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/faculty-assignment/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/faculty/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/features/[collegeId]/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/history/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/features/page.tsx` (Admin page)
- [ ] `src/app/(authenticated)/admin/hr/page.tsx` (Admin page)
- [ ] `src/components/admin/admin-program-directory.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/admin/college-branding-form.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/admin/college-logo-uploader.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/admin/organization-create-form.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/admin/super-admin-attendance-settings-editor.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/admin/super-admin-college-company-actions.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/admin/super-admin-platform-block-action.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/admin/tenant-settings-editor.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
