# Work packet: NEW / MISSING items from docs/audit/gap2/lane-16/u020-college.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-16/u020-college.md

## G2-16-020-019  [P1] GAP  facet F10  effort M
- Legacy: College.java:36-41 chair/vice chair tied to faculty IDs.
- vNext now: service.ts:1-46 college CRUD and activity without direct chair fields.
- Fix: Implement assignment/validation as separate association with audit.
