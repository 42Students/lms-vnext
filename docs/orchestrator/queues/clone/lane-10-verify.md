# UI/UX polish VERIFICATION queue: lane chat-10 (surfaces polished by OTHER lanes)

58 surfaces. Each was already polished by another lane. Your job is to VERIFY and improve, strictly one surface at a time.

1. Regressions first (a polish pass edits many files without running code): matching tags, every import present and used, no duplicate attributes, no undeclared packages, props still match their component types, no removed export that another file imports. Fix anything broken.
2. Behaviour kept: ids, data-testid, aria labels, routes, permissions, form fields, wording (docs/audit/legacy-copy-A.md and B.md) and legacy tokens (docs/design) must be unchanged; if the polish dropped or reworded something, restore it.
3. Then judge the surface fresh as a senior product designer: is anything still cluttered, misaligned, duplicated or noisy? One obvious primary action? Aligned left edges and gaps on the legacy scale? Calm density? Real layouts at 375 and 768? Empty, loading, error states with a clear next step? Fix what you find.
4. Also check the route files in the same folder (loading, error, not-found, template) and the nearest parent layout.

Proof: ONE entry per surface in docs/audit/ux/verify-lane-10.md: surface | regressions found and fixed | extra clutter/alignment fixes | files changed (write 'verified, no change' only after a real read of every component). Tick [x] here and push to chatgpt/chat-10-b with [chat-10] after every 2 surfaces.

- [x] `src/components/shell/account-actions.tsx`
- [x] `src/components/shell/admin-scope-switcher.tsx`
- [x] `src/components/shell/app-shell.tsx`
- [x] `src/components/shell/learner-faculty-mobile-footer.tsx`
- [ ] `src/components/shell/learner-notification-bell.tsx`
- [ ] `src/components/shell/learner-topbar-tools.tsx`
- [ ] `src/components/shell/membership-switcher.tsx`
- [ ] `src/components/shell/mobile-navigation.tsx`
- [ ] `src/components/shell/page-title.tsx`
- [ ] `src/components/shell/route-announcer.tsx`
- [ ] `src/components/shell/route-progress.tsx`
- [ ] `src/components/shell/route-transition.tsx`
- [ ] `src/components/shell/shell-connectivity-notice.tsx`
- [ ] `src/components/shell/shell-nav-icons.tsx`
- [ ] `src/components/shell/shell-widget-boundary.tsx`
- [ ] `src/components/shell/sidebar-nav.tsx`
- [ ] `src/components/shell/topbar/account-menu.tsx`
- [ ] `src/components/shell/topbar/command-search.tsx`
- [ ] `src/components/shell/topbar/icons.tsx`
- [ ] `src/components/shell/topbar/legacy-topbar.tsx`
- [ ] `src/components/shell/topbar/notification-actions.tsx`
- [ ] `src/components/shell/topbar/notification-empty.tsx`
- [ ] `src/components/shell/topbar/organization-switcher.tsx`
- [ ] `src/components/shell/topbar/tpo-find-suggestions.tsx`
- [ ] `src/components/shell/topbar/tpo-notification-cluster.tsx`
- [ ] `src/components/shell/topbar/tpo-quick-create.tsx`
- [ ] `src/components/shell/tpo-mobile-footer.tsx`
- [ ] `src/components/shell/tpo-topbar-messages.tsx`
- [ ] `src/app/maintenance/page.tsx`
- [ ] `src/app/offline/page.tsx`
- [ ] `src/app/page.tsx`
- [ ] `src/app/placements/page.tsx`
- [ ] `src/app/platform/page.tsx`
- [ ] `src/app/privacy-policy/page.tsx`
- [ ] `src/app/quiz/page.tsx`
- [ ] `src/app/recruiter-invite/[token]/page.tsx`
- [ ] `src/app/request-demo/page.tsx`
- [ ] `src/app/superadmin-login/page.tsx`
- [ ] `src/app/universities/page.tsx`
- [ ] `src/components/auth/device-list.tsx`
- [ ] `src/components/ui/bottom-sheet.tsx`
- [ ] `src/components/ui/dialog.tsx`
- [ ] `src/components/ui/dropdown.tsx`
- [ ] `src/components/ui/filter-bar.tsx`
- [ ] `src/components/ui/menu.tsx`
- [ ] `src/components/ui/modal.tsx`
- [ ] `src/components/ui/popover.tsx`
- [ ] `src/components/ui/select.tsx`
- [ ] `src/components/ui/split-button.tsx`
- [ ] `src/components/ui/toast.tsx`
- [ ] `src/components/ui/tooltip.tsx`
- [ ] `src/components/ui/use-confirm-flow.tsx`
- [ ] `src/components/auth/membership-recovery.tsx`
- [ ] `src/components/courses/faculty-course-tab-navigation.tsx`
- [ ] `src/components/placements/super-admin-drive-tabs.tsx`
- [ ] `src/components/public/error-recovery-actions.tsx`
- [ ] `src/components/tpo/tpo-draft-drive-step-one-form.tsx`
- [ ] `src/components/ui/file-dropzone.tsx`
