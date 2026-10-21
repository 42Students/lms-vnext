# Work packet: edit src/app/api/projects/[projectId]/readiness/override/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u032-superadmin-readiness.md

## G2-7-032-042  [P1] GAP  facet F10  effort L
- Legacy: AdminService.js:470-471 POST /api/v1/admin/projects/{id}/readiness/override payload collegeId, override bool\|null, note
- vNext now: readiness/override/route.ts:8-14 POST /api/projects/{UUID}/readiness/override payload state FORCE_UNLOCK/FORCE_BLOCK/CLEAR
- Fix: Map old boolean/null contract to state enum, preserve access and effects
