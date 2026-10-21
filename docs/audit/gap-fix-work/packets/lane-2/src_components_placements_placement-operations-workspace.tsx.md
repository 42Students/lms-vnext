# Work packet: edit src/components/placements/placement-operations-workspace.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-index.md, docs/audit/gap2/lane-11/l17-u030-drives-landing.md, docs/audit/gap2/lane-9/college-admin-jobs-index.md

## G2-10-017-038  [P1] MISSING  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:499-506 — Active drives load failure 'Couldn't refresh active drives' stale warning, Retry.
- vNext now: src/components/placements/placement-operations-workspace.tsx:29-36 — Operations fails whole page; no last-good banner.
- Fix: Render old cards with stale warning and Retry.

## G2-10-017-058  [P1] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:202-204 — Refreshing data retains last college's current scoped rows with RefreshStatus.
- vNext now: src/components/placements/placement-operations-workspace.tsx:25-70 — Full Server Component Promise.all, no stale-data banner.
- Fix: Keep scoped prior results only on same college with warning.

## G2-10-017-076  [P1] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:136-153 — Attention request independently catches errors; job cards still usable.
- vNext now: src/components/placements/placement-operations-workspace.tsx:25-55 — Promise.all across 5 services can reject whole landing.
- Fix: Use allSettled/optional boundaries.

## G2-10-017-089  [P1] GAP  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:136-153,202-204 — Attention/jobserver independent failure and stale-data display.
- vNext now: src/components/placements/placement-operations-workspace.tsx:25-55 — All workspace reads fatal if any dependency fails.
- Fix: Decouple optional services, maintain job cards under partial failure.

## G2-17-030-025  [P1] GAP  facet F07  effort M
- Legacy: Job load error exact `Couldn't load drives. Check your connection and retry.`; DrivesLanding.js:126-133
- vNext now: vNext admin overview awaits multi-service Promise.all, no jobsError recovery scoped panel; placement-operations-workspace.tsx:22-51
- Fix: Wrap jobs fetch independently; show failed load with Retry without erasing policy or other successful data.

## G2-17-030-043  [P1] GAP  facet F13  effort L
- Legacy: Refresh failure preserves last-known jobs and warning, full failure error; DrivesLanding.js:122-133,197-203,497-507
- vNext now: vNext server rejects whole workspace promise and error boundary; placement-operations-workspace.tsx:22-51
- Fix: Cache last-known college-scoped rows and show yellow refresh warning, never empty success.

## G2-9-016-095  [P1] GAP  facet F21  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:5-15` — Direct dependencies AdminService search, attention summary, retention GET, deadline patch, policy and learner lookup.
- vNext now: `src/components/placements/placement-operations-workspace.tsx:1-33` — TPO operations+company+recruiter+seasons services load, retention/lookup omitted.
- Fix: Replace/augment with relevant legacy operating dependencies in correct section.

## G2-9-016-096  [P1] MISSING  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:12-17` — Lazy StudentPlacementLookup panel after drive cards.
- vNext now: `src/components/placements/placement-operations-workspace.tsx:41-98` — Company relationship and recruiter access operations, no lookup.
- Fix: Mount college-scoped StudentPlacementLookup after drive cards.
