# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u035-superadmin-template-overview.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u035-superadmin-template-overview.md

## G2-7-035-077  [P1] GAP  facet F22  effort L
- Legacy: overview.js:78-103 initial workspace status enum ACTIVE/IN_PROGRESS/READY/BLOCKED/ARCHIVED
- vNext now: validation.ts:328-338 project initialStatus PLANNED/ACTIVE
- Fix: Crosswalk seeded workspace status semantics and no Archived default
