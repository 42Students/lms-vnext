# Work packet: edit src/modules/projects/readiness-override-copy.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u004-college-admin-projects-readiness.md

## G2-7-004-033  [P3] GAP  facet F08  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:266-293: successful override shows Ant message.success `Readiness updated`; failed `Failed to update readiness`.
- vNext now: V/components/projects/project-readiness-override-form.tsx:57-63; modules/projects/readiness-override-copy.ts:7: inline success/error Alert same copy.
- Fix: Decide exact toast presentation rather than inline alert.
