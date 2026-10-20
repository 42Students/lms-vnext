# Component state audit: lane chat-3

Shared UI components that every page inherits. For each file: compare EVERY state against the legacy rules in docs/design/legacy-styles (components___button.scss, components___form.scss, components___common.scss, components___antddesign.scss, components___dropdown.scss, listing-page-header, notification-drawer, etc.) and docs/design/old-lms-shell.css: default, hover, focus (ring colour, width, offset), active/pressed, disabled (colour, opacity, cursor), loading, error/invalid, selected/checked, placeholder, and the 767px/phone rules. Fix every difference in the component (exact legacy values, not approximations). Proof: ONE line per component in docs/audit/ux/states-lane-3.md listing each state with legacy value versus code value and the number of fixes. Tick [x] here in the same push.

- [x] `src/components/ui/avatar.tsx`
- [x] `src/components/ui/button-group.tsx`
- [x] `src/components/ui/confirm-action-dialog.tsx`
- [x] `src/components/ui/disabled-reason.tsx`
- [x] `src/components/ui/file-dropzone.tsx`
- [x] `src/components/ui/form-section.tsx`
- [x] `src/components/ui/list-toolbar.tsx`
- [x] `src/components/ui/multi-select.tsx`
- [x] `src/components/ui/page-header.tsx`
- [x] `src/components/ui/popover.tsx`
- [x] `src/components/ui/segmented-control.tsx`
- [x] `src/components/ui/stat-tile.tsx`
- [x] `src/components/ui/textarea.tsx`
