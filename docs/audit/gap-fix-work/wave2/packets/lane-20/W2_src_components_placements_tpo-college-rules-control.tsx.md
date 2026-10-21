# Work packet (wave 2): edit src/components/placements/tpo-college-rules-control.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l11-u024-tpo-settings.md

## G2-11-024-006  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:187-201 active nav/button, unsaved badge beside panel title
- vNext now: src/components/placements/tpo-settings-nav.tsx:31-40 links are inside Disclosure; src/components/placements/tpo-college-rules-control.tsx:94-95 unsaved notice inside form
- Fix: Restore nav active chip and panel-level dirty tag.

## G2-11-024-007  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:210-211 primary Save changes disabled until dirty
- vNext now: src/components/placements/tpo-college-rules-control.tsx:120-123 uses always-enabled Review and confirm rules
- Fix: Match Save changes disabled state and label.

## G2-11-024-012  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:333-345 compact inline sentence rules card
- vNext now: src/components/placements/tpo-college-rules-control.tsx:89-119 responsive full-width grid and collapsible example
- Fix: Restore inline sentence numeric controls and visible example.

## G2-11-024-022  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:127-129 Modal.confirm danger on unsaved nav
- vNext now: src/components/placements/tpo-college-rules-control.tsx:131-140 ConfirmDialog only for rules
- Fix: Use shared danger modal on every section.

## G2-11-024-040  [P2] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:335-341 inline sentence select/input widths
- vNext now: src/components/placements/tpo-college-rules-control.tsx:94-113 responsive 2-column grid labels
- Fix: Match inline controls at 375/768/1280.

## G2-11-024-042  [P2] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:199 unsaved changes status tag next to current panel title
- vNext now: src/components/placements/tpo-college-rules-control.tsx:94-95 InlineNotice in form
- Fix: Announce dirty state in panel heading.
