# Work packet: edit src/modules/projects/admin-readiness-overrides-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u004-college-admin-projects-readiness.md, docs/audit/gap2/lane-7/u032-superadmin-readiness.md

## G2-7-004-043  [P1] GAP  facet F11  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:161-168: archived omitted from chooser, but archived with override deliberately present in Active overrides.
- vNext now: V/modules/projects/college-readiness-releases-service.ts:22; modules/projects/admin-readiness-overrides-service.ts:42-57: archived excluded from both.
- Fix: Include archived overrides in audit list; keep chooser exclusion.

## G2-7-032-078  [P1] GAP  facet F22  effort L
- Legacy: readiness/index.js:190-200 DTO overrideActive, overrideValue bool, overrideNote, overrideByName, overrideAt
- vNext now: readiness-service + activityEvents metadata state FORCE_UNLOCK/FORCE_BLOCK/CLEAR via admin-readiness-overrides-service.ts:34-50
- Fix: Crosswalk override history and latest state, including actor/time/note and cleared override
