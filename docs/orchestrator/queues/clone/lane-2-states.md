# Component state audit: lane chat-2

Shared UI components that every page inherits. For each file: compare EVERY state against the legacy rules in docs/design/legacy-styles (components___button.scss, components___form.scss, components___common.scss, components___antddesign.scss, components___dropdown.scss, listing-page-header, notification-drawer, etc.) and docs/design/old-lms-shell.css: default, hover, focus (ring colour, width, offset), active/pressed, disabled (colour, opacity, cursor), loading, error/invalid, selected/checked, placeholder, and the 767px/phone rules. Fix every difference in the component (exact legacy values, not approximations). Proof: ONE line per component in docs/audit/ux/states-lane-2.md listing each state with legacy value versus code value and the number of fixes. Tick [x] here in the same push.

- [x] `src/components/ui/alert.tsx`
- [x] `src/components/ui/breadcrumbs.tsx`
- [x] `src/components/ui/choice-input.tsx`
- [x] `src/components/ui/dialog.tsx`
- [x] `src/components/ui/error-state.tsx`
- [x] `src/components/ui/form-grid.tsx`
- [x] `src/components/ui/list-row.tsx`
- [x] `src/components/ui/modal.tsx`
- [x] `src/components/ui/page-canvas.tsx`
- [x] `src/components/ui/permission-action.tsx`
- [x] `src/components/ui/searchable-select.tsx`
- [x] `src/components/ui/stacked-metric-bar.tsx`
- [x] `src/components/ui/tabs.tsx`
- [x] `src/components/ui/use-confirm-flow.tsx`
