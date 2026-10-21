# Work packet (wave 2): edit src/components/placements/tpo-settings-nav.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l11-u024-tpo-settings.md

## G2-11-024-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:184-194 left grouped nav Placement policy/People with exactly five visible tabs
- vNext now: src/components/placements/tpo-settings-nav.tsx:4-27 includes sixteen visible links across three groups
- Fix: Show only old five tabs with original groups and order.

## G2-11-024-006  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:187-201 active nav/button, unsaved badge beside panel title
- vNext now: src/components/placements/tpo-settings-nav.tsx:31-40 links are inside Disclosure; src/components/placements/tpo-college-rules-control.tsx:94-95 unsaved notice inside form
- Fix: Restore nav active chip and panel-level dirty tag.

## G2-11-024-039  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:184-205 two-column desktop pane layout and grouped nav
- vNext now: src/components/placements/tpo-settings-nav.tsx:28-41 compact Disclosure/horizontal links at all widths
- Fix: Clone desktop sidebar and mobile stacked nav.

## G2-11-024-041  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:189-190 nav native buttons aria-current
- vNext now: src/components/placements/tpo-settings-nav.tsx:31-36 native Link aria-current, extra disclosure step
- Fix: Keep visible focusable tabs without expansion.

## G2-11-024-044  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:67-72 capitalization Placement rules, Placement team, Recruiters
- vNext now: src/components/placements/tpo-settings-nav.tsx:7-16 labels Placement Rules and Placement Team differently
- Fix: Use exact navigation capitalization.
