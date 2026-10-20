# UI/UX polish queue: lane chat-15

38 surfaces, in order. ONE SURFACE PER TURN: take only the first unticked surface, make it excellent, tick it, and stop. The next surface comes with the next message. Never work on several surfaces at once.

Polish checklist (apply every point to the surface and to every component it renders, in every state):
1. Clutter: one clear primary action per surface, secondary actions demoted or moved into a menu; merge duplicate links/buttons; remove decoration that carries no information; collapse rarely used filters or fields behind a disclosure; no card inside card.
2. Hierarchy: one h1 (page) or one clear title (overlay), short subtitle, sections in the order people use them, most important content above the fold, related controls grouped with a clear label.
3. Alignment: every section starts on the same left edge, equal gutters and gaps (legacy scale 4/8/12/16/24/32), controls in a row share one height, labels align with inputs, columns align, no stray margins, header actions never wrap badly.
4. Density: consistent padding, comfortable line length, tables trimmed to the columns that matter (rest behind details), no walls of text; empty, loading and error states have a clear message and a next step.
5. Mobile 375 and tablet 768: real layouts (stack, reorder, full-width primary action, 44px tap targets), nothing cramped or overflowing; overlays become full-width sheets on mobile.
6. Keep exactly: legacy colours, radii, control sizes, fonts and wording (docs/design); keep ids, data-testid, aria labels, routes and behaviour; no new packages; valid TSX.

Route files rule: when you polish a PAGE surface, ALSO polish the loading.tsx, error.tsx, not-found.tsx and template.tsx in the same route folder, and check the nearest parent layout.tsx, as part of that same surface (they are the loading, error and missing states of that page). Tick the page only when its route files are done too.

Proof: ONE entry per surface in docs/audit/ux/polish-lane-15.md: surface | problems found (clutter, misalignment, hierarchy, density, mobile) | what you removed, merged, moved or realigned | files changed. Push to chatgpt/chat-15-b with [chat-15], ticking [x] in this queue in the same push.

- [x] `src/app/(authenticated)/recruiter/calendar/page.tsx` (Recruiter/tracker page)
- [x] `src/app/(authenticated)/recruiter/colleges/page.tsx` (Recruiter/tracker page)
- [x] `src/app/(authenticated)/recruiter/company/page.tsx` (Recruiter/tracker page)
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/change-requests/page.tsx` (Recruiter/tracker page)
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/interview-slots/page.tsx` (Recruiter/tracker page)
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/messages/page.tsx` (Recruiter/tracker page)
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/page.tsx` (Recruiter/tracker page)
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/page.tsx` (Recruiter/tracker page)
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/remove/[roundId]/page.tsx` (Recruiter/tracker page)
- [x] `src/app/(authenticated)/recruiter/drives/new/page.tsx` (Recruiter/tracker page)
- [x] `src/app/(authenticated)/recruiter/drives/page.tsx` (Recruiter/tracker page)
- [x] `src/app/(authenticated)/recruiter/drives/proposals/page.tsx` (Recruiter/tracker page)
- [x] `src/app/(authenticated)/recruiter/drives/recorded-outside/page.tsx` (Recruiter/tracker page)
- [x] `src/app/(authenticated)/recruiter/home/page.tsx` (Recruiter/tracker page)
- [x] `src/app/(authenticated)/recruiter/messages/page.tsx` (Recruiter/tracker page)
- [x] `src/app/(authenticated)/recruiter/page.tsx` (Recruiter/tracker page)
- [x] `src/app/(authenticated)/recruiter/profile/page.tsx` (Recruiter/tracker page)
- [x] `src/app/(authenticated)/tracker/audit-findings/[publicId]/page.tsx` (Recruiter/tracker page)
- [x] `src/app/(authenticated)/tracker/audit-findings/page.tsx` (Recruiter/tracker page)
- [x] `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx` (Recruiter/tracker page)
- [x] `src/app/(authenticated)/tracker/issues/page.tsx` (Recruiter/tracker page)
- [x] `src/app/(authenticated)/tracker/logs/page.tsx` (Recruiter/tracker page)
- [x] `src/app/(authenticated)/tracker/mine/[publicId]/page.tsx` (Recruiter/tracker page)
- [x] `src/app/(authenticated)/tracker/mine/page.tsx` (Recruiter/tracker page)
- [x] `src/app/(authenticated)/tracker/page.tsx` (Recruiter/tracker page)
- [x] `src/app/auth/handoff/page.tsx` (Other page (super admin, public, auth, misc))
- [x] `src/app/campaign-unsubscribe/[token]/page.tsx` (Other page (super admin, public, auth, misc))
- [x] `src/app/campaign-unsubscribe/confirmed/page.tsx` (Other page (super admin, public, auth, misc))
- [x] `src/app/college-join/[token]/page.tsx` (Other page (super admin, public, auth, misc))
- [x] `src/app/company-join/[token]/page.tsx` (Other page (super admin, public, auth, misc))
- [x] `src/app/company-share/[token]/page.tsx` (Other page (super admin, public, auth, misc))
- [ ] `src/app/e2e/chat17-ui-kit/page.tsx` (Other page (super admin, public, auth, misc))
- [ ] `src/app/e2e/superadmin-login/page.tsx` (Other page (super admin, public, auth, misc))
- [ ] `src/app/enterprises/page.tsx` (Other page (super admin, public, auth, misc))
- [ ] `src/app/forbidden/page.tsx` (Other page (super admin, public, auth, misc))
- [ ] `src/app/home/page.tsx` (Other page (super admin, public, auth, misc))
- [ ] `src/app/hr-invite/[token]/page.tsx` (Other page (super admin, public, auth, misc))
- [ ] `src/app/login/page.tsx` (Other page (super admin, public, auth, misc))
- [ ] `src/components/tracker/audit-finding-status-action.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/tracker/independent-finding-actions.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/tracker/tracker-issue-bulk-actions.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/tracker/tracker-workflow-panel.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
