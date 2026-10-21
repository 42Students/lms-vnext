# Work packet: NEW / MISSING items from docs/audit/gap2/lane-1/college-admin-profile.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-1/college-admin-profile.md

## G2-1-026-070  [P1] GAP  facet F20  effort M
- Legacy: src/modules/people/college-admin-profile-edit-service.ts:75-85: locks account+profile but no if-version check; later save can overwrite.
- vNext now: docs/legacy-source/frontend/src/components/profile/about.js:separate section mutations reduce overlap.
- Fix: Require optimistic profileDocumentVersion on PATCH.
