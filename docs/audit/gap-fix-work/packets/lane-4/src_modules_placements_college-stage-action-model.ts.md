# Work packet: edit src/modules/placements/college-stage-action-model.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-applications.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-shortlisted.md, docs/audit/gap2/lane-13/job-application-status-validator.md, docs/audit/gap2/lane-9/college-admin-jobs-applications.md

## G2-10-011-053  [P1] GAP  facet F12  effort L
- Legacy: docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:5-14 — Admin transitions permit reversals INTERVIEW→ASSESSMENT/SHORTLISTED, OFFERED→INTERVIEW and HIRED→OFFERED.
- vNext now: src/modules/placements/college-stage-action-model.ts:24-32 — Pipeline map does not allow those reversals; separate REINSTATE only.
- Fix: Implement safe status reversal with history and offer/joining safeguards, or record intentional policy exception.

## G2-10-015-033  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1378-1442; docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:5-14 — Admin transitions allow INTERVIEW→ASSESSMENT, OFFERED→INTERVIEW, HIRED→OFFERED.
- vNext now: src/modules/placements/college-stage-action-model.ts:24-32; src/components/placements/college-application-pipeline-controls.tsx:20-26 — Forward-only vNext disallows these reversals.
- Fix: Keep reversal semantics or record deliberate retirement.

## G2-10-015-050  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:5-14 — Reverse paths from INTERVIEW/OFFERED/HIRED and REJECTED reinstate available.
- vNext now: src/modules/placements/college-stage-action-model.ts:24-32 — Reversal options removed, Reinstate separate action.
- Fix: Restore audit-safe reversals or mark intentional.

## G2-10-015-083  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-105 — Numeric jobApplication ID, canonical status, score, notes, optimistic version.
- vNext now: src/modules/placements/college-drive-applications-model.ts:3-17; src/modules/placements/college-stage-action-model.ts:24-32 — UUID application + stage row, screening split, no score column.
- Fix: Add field mapping to support legacy view with truthful data.

## G2-13-010-002  [P1] GAP  facet F01  effort M
- Legacy: Old frontend admin validator mirrors backend state-machine (`docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:1-26`)
- vNext now: New stage-action model has shorter transition map (`src/modules/placements/college-stage-action-model.ts:23-32`)
- Fix: Synchronize UI controls with validated server transitions and explain omitted historical edges.

## G2-13-010-015  [P1] GAP  facet F05  effort M
- Legacy: Old APPLIED next is SHORTLISTED,REJECTED,WITHDRAWN (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:18-19`)
- vNext now: New APPLIED moves SHORTLISTED,ASSESSMENT,REJECTED; withdrawal separate (`src/modules/placements/college-stage-action-model.ts:24-25`)
- Fix: Remove APPLIED→ASSESSMENT shortcut absent in old, keep separate withdrawal action.

## G2-13-010-017  [P1] GAP  facet F05  effort M
- Legacy: Old INTERVIEW next SHORTLISTED,ASSESSMENT,OFFERED,WAITLISTED,REJECTED,WITHDRAWN (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:28-32`)
- vNext now: New INTERVIEW next WAITLISTED,OFFERED,REJECTED (`src/modules/placements/college-stage-action-model.ts:28-28`)
- Fix: Restore valid multi-round regressions INTERVIEW→ASSESSMENT/SHORTLISTED after DB/stage checks.

## G2-13-010-018  [P1] GAP  facet F05  effort L
- Legacy: Old OFFERED next HIRED,REJECTED,INTERVIEW,WITHDRAWN (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:34-35`)
- vNext now: New OFFERED next HIRED,REJECTED (`src/modules/placements/college-stage-action-model.ts:30-30`)
- Fix: Handle OFFERED→INTERVIEW reversal after offer outcome cancellation verification.

## G2-9-010-056  [P1] GAP  facet F12  effort L
- Legacy: `docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:5-14` — Legacy state machine includes INTERVIEW to SHORTLISTED, ASSESSMENT and HIRED to OFFERED reversals
- vNext now: `src/modules/placements/college-stage-action-model.ts:24-32` — vNext stage map allows forward moves only; reinstatement rejected only
- Fix: Restore intended reversal transitions with audit/offer guards or document product decision

## G2-9-010-057  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:6-8` — Legacy APPLIED only SHORTLISTED/REJECTED; ASSESSMENT after shortlist
- vNext now: `src/modules/placements/college-stage-action-model.ts:24-26` — APPLIED directly to ASSESSMENT as extra path
- Fix: Confirm APPLIED→ASSESSMENT allowance; align with legacy if exact parity required
