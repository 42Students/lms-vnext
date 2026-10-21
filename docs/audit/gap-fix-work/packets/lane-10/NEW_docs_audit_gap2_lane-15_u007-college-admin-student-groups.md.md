# Work packet: NEW / MISSING items from docs/audit/gap2/lane-15/u007-college-admin-student-groups.md

2 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-15/u007-college-admin-student-groups.md

## G2-15-007-023  [P1] GAP  facet F11  effort M
- Legacy: Old group page disabled regardless of admin role or module enablement (`student-groups.js:6-13`)
- vNext now: VNext academics.manage authorized admin can view/create (college/groups/page.tsx:51-53,79-83)
- Fix: Restore global hide until owner authorizes group consumer

## G2-15-007-040  [P1] GAP  facet F23  effort S
- Legacy: Legacy path only skeleton/redirect, no create/search/row actions (student-groups.js:14-19)
- vNext now: VNext offers create, filters, row actions and group detail navigation (college/groups/page.tsx:79-125,140-183)
- Fix: Implement exact legacy alias redirect, keep new functionality separate and permission-gated
