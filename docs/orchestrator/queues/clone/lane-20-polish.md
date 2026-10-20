# UI/UX polish queue: lane chat-20

39 surfaces, in order. ONE SURFACE PER TURN: take only the first unticked surface, make it excellent, tick it, and stop. The next surface comes with the next message. Never work on several surfaces at once.

Polish checklist (apply every point to the surface and to every component it renders, in every state):
1. Clutter: one clear primary action per surface, secondary actions demoted or moved into a menu; merge duplicate links/buttons; remove decoration that carries no information; collapse rarely used filters or fields behind a disclosure; no card inside card.
2. Hierarchy: one h1 (page) or one clear title (overlay), short subtitle, sections in the order people use them, most important content above the fold, related controls grouped with a clear label.
3. Alignment: every section starts on the same left edge, equal gutters and gaps (legacy scale 4/8/12/16/24/32), controls in a row share one height, labels align with inputs, columns align, no stray margins, header actions never wrap badly.
4. Density: consistent padding, comfortable line length, tables trimmed to the columns that matter (rest behind details), no walls of text; empty, loading and error states have a clear message and a next step.
5. Mobile 375 and tablet 768: real layouts (stack, reorder, full-width primary action, 44px tap targets), nothing cramped or overflowing; overlays become full-width sheets on mobile.
6. Keep exactly: legacy colours, radii, control sizes, fonts and wording (docs/design); keep ids, data-testid, aria labels, routes and behaviour; no new packages; valid TSX.

Proof: ONE entry per surface in docs/audit/ux/polish-lane-20.md: surface | problems found (clutter, misalignment, hierarchy, density, mobile) | what you removed, merged, moved or realigned | files changed. Push to chatgpt/chat-20-b with [chat-20], ticking [x] in this queue in the same push.

- [ ] `src/components/shell/account-actions.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/admin-scope-switcher.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/app-shell.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/learner-faculty-mobile-footer.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/learner-notification-bell.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/learner-topbar-tools.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/membership-switcher.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/mobile-navigation.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/page-title.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/route-announcer.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/route-progress.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/route-transition.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/shell-connectivity-notice.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/shell-nav-icons.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/shell-widget-boundary.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/sidebar-nav.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/topbar/account-menu.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/topbar/command-search.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/topbar/icons.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/topbar/legacy-topbar.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/topbar/notification-actions.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/topbar/notification-empty.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/topbar/organization-switcher.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/topbar/tpo-find-suggestions.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/topbar/tpo-notification-cluster.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/topbar/tpo-quick-create.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/tpo-mobile-footer.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/components/shell/tpo-topbar-messages.tsx` (Shell piece (top bar, sidebar, switcher, mobile nav, notifications))
- [ ] `src/app/maintenance/page.tsx` (Other page (super admin, public, auth, misc))
- [ ] `src/app/offline/page.tsx` (Other page (super admin, public, auth, misc))
- [ ] `src/app/page.tsx` (Other page (super admin, public, auth, misc))
- [ ] `src/app/placements/page.tsx` (Other page (super admin, public, auth, misc))
- [ ] `src/app/platform/page.tsx` (Other page (super admin, public, auth, misc))
- [ ] `src/app/privacy-policy/page.tsx` (Other page (super admin, public, auth, misc))
- [ ] `src/app/quiz/page.tsx` (Other page (super admin, public, auth, misc))
- [ ] `src/app/recruiter-invite/[token]/page.tsx` (Other page (super admin, public, auth, misc))
- [ ] `src/app/request-demo/page.tsx` (Other page (super admin, public, auth, misc))
- [ ] `src/app/superadmin-login/page.tsx` (Other page (super admin, public, auth, misc))
- [ ] `src/app/universities/page.tsx` (Other page (super admin, public, auth, misc))
