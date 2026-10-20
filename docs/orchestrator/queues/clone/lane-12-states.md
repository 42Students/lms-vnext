# Component state audit: lane chat-12

Shared UI components that every page inherits. For each file: compare EVERY state against the legacy rules in docs/design/legacy-styles (components___button.scss, components___form.scss, components___common.scss, components___antddesign.scss, components___dropdown.scss, listing-page-header, notification-drawer, etc.) and docs/design/old-lms-shell.css: default, hover, focus (ring colour, width, offset), active/pressed, disabled (colour, opacity, cursor), loading, error/invalid, selected/checked, placeholder, and the 767px/phone rules. Fix every difference in the component (exact legacy values, not approximations). Proof: ONE line per component in docs/audit/ux/states-lane-12.md listing each state with legacy value versus code value and the number of fixes. Tick [x] here in the same push.

- [ ] `src/components/ui/badge.tsx`
- [ ] `src/components/ui/button.tsx`
- [ ] `src/components/ui/confirm-dialog.tsx`
- [ ] `src/components/ui/disclosure.tsx`
- [ ] `src/components/ui/file-upload.tsx`
- [ ] `src/components/ui/graceful-page-loading.tsx`
- [ ] `src/components/ui/loading-state.tsx`
- [ ] `src/components/ui/needs-doing-chips.tsx`
- [ ] `src/components/ui/page-loading.tsx`
- [ ] `src/components/ui/radio.tsx`
- [ ] `src/components/ui/select.tsx`
- [ ] `src/components/ui/status-badge.tsx`
- [ ] `src/components/ui/third-party-link.tsx`
