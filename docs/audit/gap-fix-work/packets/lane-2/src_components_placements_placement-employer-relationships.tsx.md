# Work packet: edit src/components/placements/placement-employer-relationships.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-companies.md

## G2-9-004-006  [P1] GAP  facet F02  effort M
- Legacy: Ant Table with six columns and horizontal scroll (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:395-432`)
- vNext now: Stacked two-column relationship cards (`src/components/placements/placement-employer-relationships.tsx:184-302`)
- Fix: Build legacy table view: Company, Contact, Website, Drives, Last active, Actions.

## G2-9-004-018  [P1] MISSING  facet F04  effort M
- Legacy: Actions History/Edit/Delete or Restore (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:304-316`)
- vNext now: Save/Archive or Restore; no detailed History (`src/components/placements/placement-employer-relationships.tsx:303-340`)
- Fix: Restore History and applicable canonical Edit controls.

## G2-9-004-039  [P1] MISSING  facet F08  effort M
- Legacy: Detail history network error has Retry and message (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:246-268`)
- vNext now: No history fetch/action (`src/components/placements/placement-employer-relationships.tsx:184-343`)
- Fix: Restore history-specific error retry.

## G2-9-004-042  [P1] MISSING  facet F09  effort M
- Legacy: History modal width720 with KPI stats and job table (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:523-579`)
- vNext now: No History modal (`src/components/placements/placement-employer-relationships.tsx:181-343`)
- Fix: Restore drive-history modal and data API.

## G2-9-004-043  [P1] GAP  facet F09  effort M
- Legacy: Delete Popconfirm blocked if driveCount >0 (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:316-338`)
- vNext now: Archive confirmation independent of drive count (`src/components/placements/placement-employer-relationships.tsx:310-345`)
- Fix: Reconcile link dependency guard with relationship archival semantics.

## G2-9-004-060  [P1] MISSING  facet F13  effort M
- Legacy: History modal Skeleton/Error/Retry/No jobs states (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:531-541`)
- vNext now: No history detail UI (`src/components/placements/placement-employer-relationships.tsx:184-343`)
- Fix: Implement history states with independent loading/error.

## G2-9-004-066  [P1] GAP  facet F15  effort M
- Legacy: Internal notes explicitly not student-visible (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:506-518`)
- vNext now: Trust and owner relationship details private to college (`src/components/placements/placement-employer-relationships.tsx:256-302`)
- Fix: Restore private notes with no learner leak; do not treat trusted flag as notes.

## G2-9-004-069  [P1] MISSING  facet F17  effort M
- Legacy: History job row keyboard Enter/Space opens job with role/button (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:553-570`)
- vNext now: No job row/link (`src/components/placements/placement-employer-relationships.tsx:181-342`)
- Fix: Implement focusable job history row/links with keyboard activation.

## G2-9-004-088  [P1] MISSING  facet F23  effort M
- Legacy: Legacy full details/history/edit/contact management in page (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:431-579`)
- vNext now: VNext relationship owner/trusted controls replace identity editing (`src/components/placements/placement-employer-relationships.tsx:188-342`)
- Fix: Restore vetted college-owned metadata/history features without cross-tenant identity mutation.

## G2-9-004-037  [P2] GAP  facet F08  effort M
- Legacy: Delete success Company deleted (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:216-243`)
- vNext now: Employer relationship archived, global identity kept (`src/components/placements/placement-employer-relationships.tsx:133-142`)
- Fix: Make toast clear but align product-approved archive policy.
