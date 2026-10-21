# Work packet (wave 2): edit src/app/api/projects/[projectId]/readiness/override/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u004-college-admin-projects-readiness.md

## G2-7-004-040  [P2] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:270-294: POST `{collegeId, override:Boolean\|null, note}` to `/api/v1/admin/projects/:id/readiness/override`.
- vNext now: V/components/projects/project-readiness-override-form.tsx:52-56; api/projects/[projectId]/readiness/override/route.ts:8-15: POST `{state: FORCE_UNLOCK/BLOCK/CLEAR, note}`.
- Fix: Retain or explicitly adapt nullable Boolean payload to string-state contract.
