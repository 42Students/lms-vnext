# Work packet: edit src/modules/placements/learner-applications-browse-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/placement-applications.md

## G2-12-006-013  [P1] GAP  facet F05  effort S
- Legacy: In progress uses a.live or offered RELEASED, Finished is complement `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:17-24,43-54`
- vNext now: Progress derived from rejected/withdrawn/hired status, no live drive or released status `src/modules/placements/learner-applications-browse-model.ts:29-50`
- Fix: Reconcile legacy live/finished status mapping

## G2-12-006-037  [P1] GAP  facet F12  effort S
- Legacy: Live drives include offered RELEASED `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:24-24`
- vNext now: Finished determined by hired/rejected/withdrawn `src/modules/placements/learner-applications-browse-model.ts:29-50`
- Fix: Reconcile OFFERED and RELEASED
