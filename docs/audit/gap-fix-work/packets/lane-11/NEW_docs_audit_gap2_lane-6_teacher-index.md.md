# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/teacher-index.md

2 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/teacher-index.md

## G2-6-007-016  [P1] MISSING  facet F10  effort S
- Legacy: Old avoids rendering faculty course data at root `docs/legacy-source/frontend/src/pages/teacher/index.js:9-11`
- vNext now: New absent index would not render course list `next.config.ts:7-17`
- Fix: Add route alias and forward before route not-found

## G2-6-007-012  [P2] MISSING  facet F07  effort S
- Legacy: Old redirect destination uses temporary redirect (permanent false) `docs/legacy-source/frontend/src/pages/teacher/index.js:4-6`
- vNext now: New redirect list lacks teacher root, no equivalent error handling `next.config.ts:7-17`
- Fix: Use temporary redirect and correct role-specific error boundary
