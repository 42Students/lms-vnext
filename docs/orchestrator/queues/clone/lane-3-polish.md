# UI/UX polish queue: lane chat-3

33 surfaces, in order. Work the next eight unticked surfaces per turn, strictly sequentially. Finish and record one before inspecting the next; stop after eight surfaces or approximately 50 minutes.

Polish checklist (apply every point to the surface and to every component it renders, in every state):
1. Clutter: one clear primary action per surface, secondary actions demoted or moved into a menu; merge duplicate links/buttons; remove decoration that carries no information; collapse rarely used filters or fields behind a disclosure; no card inside card.
2. Hierarchy: one h1 (page) or one clear title (overlay), short subtitle, sections in the order people use them, most important content above the fold, related controls grouped with a clear label.
3. Alignment: every section starts on the same left edge, equal gutters and gaps (legacy scale 4/8/12/16/24/32), controls in a row share one height, labels align with inputs, columns align, no stray margins, header actions never wrap badly.
4. Density: consistent padding, comfortable line length, tables trimmed to the columns that matter (rest behind details), no walls of text; empty, loading and error states have a clear message and a next step.
5. Mobile 375 and tablet 768: real layouts (stack, reorder, full-width primary action, 44px tap targets), nothing cramped or overflowing; overlays become full-width sheets on mobile.
6. Keep exactly: legacy colours, radii, control sizes, fonts and wording (docs/design); keep ids, data-testid, aria labels, routes and behaviour; no new packages; valid TSX.

Route files rule: when you polish a PAGE surface, ALSO polish the loading.tsx, error.tsx, not-found.tsx and template.tsx in the same route folder, and check the nearest parent layout.tsx, as part of that same surface (they are the loading, error and missing states of that page). Tick the page only when its route files are done too.

Proof: ONE entry per surface in docs/audit/ux/polish-lane-3.md: surface | problems found (clutter, misalignment, hierarchy, density, mobile) | what you removed, merged, moved or realigned | files changed. Push to chatgpt/chat-3-b with [chat-3], ticking [x] in this queue in the same push.

- [x] `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/new/draft/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/new/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/overview/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/recorded-outside/[recordId]/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/recorded-outside/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/placements/schedule-conflicts/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/profile/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/recruiters/[leadId]/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/recruiters/campaigns/[batchId]/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/page.tsx` (TPO page)
- [x] `src/app/(authenticated)/tpo/recruiters/campaigns/new/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/recruiters/campaigns/preview/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/recruiters/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/reports/[slug]/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/reports/accreditation/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/reports/after-college/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/reports/branch-season/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/reports/by-branch/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/reports/by-company/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/reports/ctc/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/reports/failure-reasons/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/reports/intelligence/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/reports/joining-followups/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/reports/joining-status/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/reports/leads/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/reports/offers-acceptance/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/reports/offers-expiry/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/reports/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/reports/placed-branch/page.tsx` (TPO page)
- [ ] `src/app/(authenticated)/tpo/reports/placement-summary/page.tsx` (TPO page)
- [ ] `src/components/placements/learner-placement-academic-evidence.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/placement-candidate-evidence-editor.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/placement-employer-relationships.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/placement-request-queue.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/recruiter-interview-slot-form.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/super-admin-drive-deadline.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/tpo-college-rules-control.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/tpo-drive-close-preview-form.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/tpo-interview-reschedule-form.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/tpo-recruiter-grant-controls.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/tpo-round-results-import.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/placements/tpo-waitlist-promotion-control.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/tpo/tpo-audit-saved-views.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/tpo/tpo-batch-student-saved-views.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/tpo/tpo-due-followup-workspace.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/tpo/tpo-public-join-link-card.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/tpo/tpo-trusted-domain-editor.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
