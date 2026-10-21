# Work packet: edit src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-jobid-edit.md

## G2-11-011-116  [P1] GAP  facet F23  effort L
- Legacy: Legacy same editor serves create/edit, with rich company/pay/policy/rounds. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:41`
- vNext now: vNext dedicated edit form much narrower than creation editor. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx:23`
- Fix: Unify vNext create/edit field coverage; preserve permission differences.

## G2-11-011-052  [P2] GAP  facet F07  effort S
- Legacy: Loading banner exact Loading this drive. You can edit it once it has loaded. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:518`
- vNext now: Server render waits; no matching in-form load banner. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx:16`
- Fix: Add loading route boundary/banner.

## G2-11-011-053  [P2] GAP  facet F07  effort M
- Legacy: Hydration error banner and Retry setup data button. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:519`
- vNext now: notFound for missing; throws other error. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx:17`
- Fix: Add recoverable load error and Retry.
