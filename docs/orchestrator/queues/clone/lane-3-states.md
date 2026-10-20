# Component state audit: lane chat-3

Shared UI components that every page inherits. For each file: compare EVERY state against the legacy rules in docs/design/legacy-styles (components___button.scss, components___form.scss, components___common.scss, components___antddesign.scss, components___dropdown.scss, listing-page-header, notification-drawer, etc.) and docs/design/old-lms-shell.css: default, hover, focus (ring colour, width, offset), active/pressed, disabled (colour, opacity, cursor), loading, error/invalid, selected/checked, placeholder, and the 767px/phone rules. Fix every difference in the component (exact legacy values, not approximations). Proof: ONE line per component in docs/audit/ux/states-lane-3.md listing each state with legacy value versus code value and the number of fixes. Tick [x] here in the same push.

- [ ] `src/components/ui/avatar.tsx`
- [ ] `src/components/ui/button-group.tsx`
- [ ] `src/components/ui/confirm-action-dialog.tsx`
- [ ] `src/components/ui/disabled-reason.tsx`
- [ ] `src/components/ui/file-dropzone.tsx`
- [ ] `src/components/ui/form-section.tsx`
- [ ] `src/components/ui/list-toolbar.tsx`
- [ ] `src/components/ui/multi-select.tsx`
- [ ] `src/components/ui/page-header.tsx`
- [ ] `src/components/ui/popover.tsx`
- [ ] `src/components/ui/segmented-control.tsx`
- [ ] `src/components/ui/stat-tile.tsx`
- [ ] `src/components/ui/textarea.tsx`
