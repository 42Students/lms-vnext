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
- [x] `src/components/shell/learner-notification-bell.tsx`
- [x] `src/components/shell/learner-topbar-tools.tsx`
- [x] `src/components/shell/membership-switcher.tsx`
- [x] `src/components/shell/mobile-navigation.tsx`
- [x] `src/components/shell/page-title.tsx`
- [x] `src/components/shell/route-announcer.tsx`
- [x] `src/components/shell/route-progress.tsx`
- [x] `src/components/shell/route-transition.tsx`
- [x] `src/components/shell/shell-connectivity-notice.tsx`
- [x] `src/components/shell/shell-nav-icons.tsx`
- [x] `src/components/shell/shell-widget-boundary.tsx`
- [x] `src/components/shell/sidebar-nav.tsx`
- [x] `src/components/shell/topbar/account-menu.tsx`
- [x] `src/components/shell/topbar/command-search.tsx`
- [x] `src/components/shell/topbar/icons.tsx`
- [x] `src/components/shell/topbar/legacy-topbar.tsx`
- [x] `src/components/shell/topbar/notification-actions.tsx`
- [x] `src/components/shell/topbar/notification-empty.tsx`
- [x] `src/components/shell/topbar/organization-switcher.tsx`
- [x] `src/components/shell/topbar/tpo-find-suggestions.tsx`
- [x] `src/components/shell/topbar/tpo-notification-cluster.tsx`
- [x] `src/components/shell/topbar/tpo-quick-create.tsx`
- [x] `src/components/shell/tpo-mobile-footer.tsx`
- [x] `src/components/shell/tpo-topbar-messages.tsx`
- [x] `src/app/maintenance/page.tsx`
- [x] `src/app/offline/page.tsx`
- [x] `src/app/page.tsx`
- [x] `src/app/placements/page.tsx`
- [x] `src/app/platform/page.tsx`
- [x] `src/app/privacy-policy/page.tsx`
- [x] `src/app/quiz/page.tsx`
- [x] `src/app/recruiter-invite/[token]/page.tsx`
- [x] `src/app/request-demo/page.tsx`
- [x] `src/app/superadmin-login/page.tsx`
- [x] `src/app/universities/page.tsx`
- [x] `src/components/auth/device-list.tsx`
- [x] `src/components/ui/bottom-sheet.tsx`
- [x] `src/components/ui/dialog.tsx`
- [x] `src/components/ui/dropdown.tsx`
- [x] `src/components/ui/filter-bar.tsx`
- [x] `src/components/ui/menu.tsx`
- [x] `src/components/ui/modal.tsx`
- [x] `src/components/ui/popover.tsx`
- [x] `src/components/ui/select.tsx`
- [x] `src/components/ui/split-button.tsx`
- [ ] `src/components/ui/toast.tsx`
- [ ] `src/components/ui/tooltip.tsx`
- [ ] `src/components/ui/use-confirm-flow.tsx`
- [ ] `src/components/auth/membership-recovery.tsx`
- [ ] `src/components/courses/faculty-course-tab-navigation.tsx`
- [ ] `src/components/placements/super-admin-drive-tabs.tsx`
- [ ] `src/components/public/error-recovery-actions.tsx`
- [ ] `src/components/tpo/tpo-draft-drive-step-one-form.tsx`
- [ ] `src/components/ui/file-dropzone.tsx`
