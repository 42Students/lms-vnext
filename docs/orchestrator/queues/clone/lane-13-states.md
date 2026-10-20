# Component state audit: lane chat-13

Shared UI components that every page inherits. For each file: compare EVERY state against the legacy rules in docs/design/legacy-styles (components___button.scss, components___form.scss, components___common.scss, components___antddesign.scss, components___dropdown.scss, listing-page-header, notification-drawer, etc.) and docs/design/old-lms-shell.css: default, hover, focus (ring colour, width, offset), active/pressed, disabled (colour, opacity, cursor), loading, error/invalid, selected/checked, placeholder, and the 767px/phone rules. Fix every difference in the component (exact legacy values, not approximations). Proof: ONE line per component in docs/audit/ux/states-lane-13.md listing each state with legacy value versus code value and the number of fixes. Tick [x] here in the same push.

- [x] `src/components/ui/banner.tsx`
- [x] `src/components/ui/calendar-grid.tsx`
- [x] `src/components/ui/data-table.tsx`
- [x] `src/components/ui/drawer.tsx`
- [x] `src/components/ui/filter-bar.tsx`
- [x] `src/components/ui/inline-notice.tsx`
- [x] `src/components/ui/long-text.tsx`
- [ ] `src/components/ui/otp-input.tsx`
- [ ] `src/components/ui/page-size-select.tsx`
- [ ] `src/components/ui/range-slider.tsx`
- [ ] `src/components/ui/selection-controls.tsx`
- [ ] `src/components/ui/step-indicator.tsx`
- [ ] `src/components/ui/timeline.tsx`
