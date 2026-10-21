# Work packet (wave 2): edit src/components/placements/tpo-round-apply-control.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u022-tpo-results-controller.md

## G2-12-022-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/RoundsTab.js:374-387 — apply dialog: explanation, status tags, 5-column grid, irreversible warning
- vNext now: src/components/placements/tpo-round-apply-control.tsx:42-76 — embedded section with preview counters, scroll rows, action buttons
- Fix: Compare exact section order and restore legacy modal presentation in clone layer

## G2-12-022-006  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/RoundsTab.js:321,374-387 — button Review and apply N results; modal Apply and notify / cancel
- vNext now: src/components/placements/tpo-round-apply-control.tsx:45-47,70-75 — Preview applying round results then Confirm and apply N result(s) / Not yet
- Fix: Align exact action copy and affordance (if preserving staged vs applied semantics)

## G2-12-022-007  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/RoundsTab.js:379-386 — tags show outcome count and destination; columns Student, Roll, Result, Entered by, Reason
- vNext now: src/components/placements/tpo-round-apply-control.tsx:51-60 — cards show counts and rows only student/outcome/destination/status
- Fix: Add roll, source and reason columns to consequence preview

## G2-12-022-026  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/RoundsTab.js:374-388 — modal opens after pending fetch; Apply and notify confirmation
- vNext now: src/components/placements/tpo-round-apply-control.tsx:48-76 — inline preview region shown after fetch, no modal overlay
- Fix: Decide and implement legacy confirmation dialog rather than silently changing interaction

## G2-12-022-044  [P2] GAP  facet F14  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/RoundsTab.js:381-386 — export searchable preview sheet with Roll/Source/Reason
- vNext now: src/components/placements/tpo-round-apply-control.tsx:62-67,82-85 — preview and apply report CSV with reduced fields
- Fix: Add all legacy export columns and sanitized source/reason to CSV

## G2-12-022-049  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/RoundsTab.js:374-387 — Apply <round> results; Apply and notify; This is not an undo
- vNext now: src/components/placements/tpo-round-apply-control.tsx:43-75 — Apply results for the whole round; Confirm and apply N result(s); no undo text
- Fix: Use exact old action/irreversibility copy or record approved change

## G2-12-022-016  [P3] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/RoundsTab.js:381-386 — preview grid height 360, searchable, export
- vNext now: src/components/placements/tpo-round-apply-control.tsx:57-67 — max-height 240 list and separate CSV export
- Fix: Match height and search affordance; retain CSV
