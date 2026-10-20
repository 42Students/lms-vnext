# Component state audit: lane chat-2

Shared UI components that every page inherits. For each file: compare EVERY state against the legacy rules in docs/design/legacy-styles (components___button.scss, components___form.scss, components___common.scss, components___antddesign.scss, components___dropdown.scss, listing-page-header, notification-drawer, etc.) and docs/design/old-lms-shell.css: default, hover, focus (ring colour, width, offset), active/pressed, disabled (colour, opacity, cursor), loading, error/invalid, selected/checked, placeholder, and the 767px/phone rules. Fix every difference in the component (exact legacy values, not approximations). Proof: ONE line per component in docs/audit/ux/states-lane-2.md listing each state with legacy value versus code value and the number of fixes. Tick [x] here in the same push.

- [ ] `src/components/ui/alert.tsx`
- [ ] `src/components/ui/breadcrumbs.tsx`
- [ ] `src/components/ui/choice-input.tsx`
- [ ] `src/components/ui/dialog.tsx`
- [ ] `src/components/ui/error-state.tsx`
- [ ] `src/components/ui/form-grid.tsx`
- [ ] `src/components/ui/list-row.tsx`
- [ ] `src/components/ui/modal.tsx`
- [ ] `src/components/ui/page-canvas.tsx`
- [ ] `src/components/ui/permission-action.tsx`
- [ ] `src/components/ui/searchable-select.tsx`
- [ ] `src/components/ui/stacked-metric-bar.tsx`
- [ ] `src/components/ui/tabs.tsx`
- [ ] `src/components/ui/use-confirm-flow.tsx`
