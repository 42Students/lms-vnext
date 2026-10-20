# Component state audit: lane chat-1

Shared UI components that every page inherits. For each file: compare EVERY state against the legacy rules in docs/design/legacy-styles (components___button.scss, components___form.scss, components___common.scss, components___antddesign.scss, components___dropdown.scss, listing-page-header, notification-drawer, etc.) and docs/design/old-lms-shell.css: default, hover, focus (ring colour, width, offset), active/pressed, disabled (colour, opacity, cursor), loading, error/invalid, selected/checked, placeholder, and the 767px/phone rules. Fix every difference in the component (exact legacy values, not approximations). Proof: ONE line per component in docs/audit/ux/states-lane-1.md listing each state with legacy value versus code value and the number of fixes. Tick [x] here in the same push.

- [x] `src/components/ui/action-pagination.tsx`
- [x] `src/components/ui/bottom-sheet.tsx`
- [x] `src/components/ui/checkbox.tsx`
- [x] `src/components/ui/date-range-picker.tsx`
- [x] `src/components/ui/empty-state.tsx`
- [x] `src/components/ui/form-field.tsx`
- [x] `src/components/ui/input.tsx`
- [ ] `src/components/ui/metric-bar.tsx`
- [ ] `src/components/ui/page-back-link.tsx`
- [ ] `src/components/ui/password-input.tsx`
- [ ] `src/components/ui/search-field.tsx`
- [ ] `src/components/ui/split-button.tsx`
- [ ] `src/components/ui/table.tsx`
- [ ] `src/components/ui/tooltip.tsx`
