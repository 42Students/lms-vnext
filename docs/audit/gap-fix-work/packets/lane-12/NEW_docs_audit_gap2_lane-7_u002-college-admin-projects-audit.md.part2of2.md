# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u002-college-admin-projects-audit.md (part 2 of 2)

2 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u002-college-admin-projects-audit.md

## G2-7-002-032  [P2] GAP  facet F07  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:165-170: malformed range ignored; valid `status` alias accepted.
- vNext now: V/modules/projects/admin-audit-query-model.ts:34-67: ignored invalid filters banner; range marked invalid.
- Fix: Honor legacy query aliases and only warn on truly invalid filters.

## G2-7-002-035  [P3] GAP  facet F08  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:497-501: filtered entity tag visibly confirms current filter.
- vNext now: V/components/projects/project-admin-audit-page.tsx:262-264: input holds ID but no active summary/confirmation.
- Fix: Restore active filter chip context.
