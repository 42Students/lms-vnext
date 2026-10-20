# Component state audit: lane chat-16

Shared UI components that every page inherits. For each file: compare EVERY state against the legacy rules in docs/design/legacy-styles (components___button.scss, components___form.scss, components___common.scss, components___antddesign.scss, components___dropdown.scss, listing-page-header, notification-drawer, etc.) and docs/design/old-lms-shell.css: default, hover, focus (ring colour, width, offset), active/pressed, disabled (colour, opacity, cursor), loading, error/invalid, selected/checked, placeholder, and the 767px/phone rules. Fix every difference in the component (exact legacy values, not approximations). Proof: ONE line per component in docs/audit/ux/states-lane-16.md listing each state with legacy value versus code value and the number of fixes. Tick [x] here in the same push.

- [x] `src/components/ui/board-column.tsx`
- [x] `src/components/ui/card.tsx`
- [x] `src/components/ui/date-input.tsx`
- [x] `src/components/ui/dropdown.tsx`
- [x] `src/components/ui/filter-chip.tsx`
- [x] `src/components/ui/input-group.tsx`
- [x] `src/components/ui/menu.tsx`
- [x] `src/components/ui/overlay-close-icon.tsx`
- [x] `src/components/ui/pagination.tsx`
- [x] `src/components/ui/scroll-cue.tsx`
- [x] `src/components/ui/skeleton.tsx`
- [x] `src/components/ui/summary-strip.tsx`
- [x] `src/components/ui/toast.tsx`
