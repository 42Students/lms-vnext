# Work packet: edit src/components/placements/college-drive-archive-action.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-settings.md

## G2-9-013-047  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:69-70` — Delete success Drive deleted then navigate to jobs.
- vNext now: `src/components/placements/college-drive-archive-action.tsx:26-30` — Archive silently routes to /college/placements/drives?status=ARCHIVED.
- Fix: Announce archive success explicitly with accurate non-delete wording.
