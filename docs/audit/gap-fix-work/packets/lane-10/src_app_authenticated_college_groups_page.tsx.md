# Work packet: edit src/app/(authenticated)/college/groups/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u007-college-admin-student-groups.md

## G2-15-007-001  [P1] GAP  facet F01  effort M
- Legacy: Legacy path `/college-admin/student-groups` is deliberately hidden, redirects via router.replace to `/college-admin/people` (`student-groups.js:6-19`)
- vNext now: No vNext same path found; active `/college/groups` directory exposes Student Groups (`college/groups/page.tsx:42-83`)
- Fix: Restore old route alias as server redirect to `/college/people`; keep new directory gated behind owner-approved release flag

## G2-15-007-003  [P1] GAP  facet F01  effort S
- Legacy: Legacy detail `/college-admin/student-groups/[id]` redirects to People too (`student-groups/[id].js:6-15`)
- vNext now: VNext table links `/college/groups/{id}` (`college/groups/page.tsx:145-151`)
- Fix: Ensure legacy detail bookmark redirects to People; don't expose old groups by alias

## G2-15-007-017  [P1] GAP  facet F07  effort M
- Legacy: Legacy student groups deliberately disabled due no consumer (`student-groups.js:6-12`)
- vNext now: New group creation and update reachable to academics.manage (`college/groups/page.tsx:51-53,79-83)
- Fix: Enforce explicit feature readiness/visibility gate, document owner permission to release

## G2-15-007-020  [P1] GAP  facet F10  effort M
- Legacy: Only browser navigation router.replace to People; no backend API call (`student-groups.js:15-19`)
- vNext now: listCollegeGroups scoped DB SELECT plus GroupActions write potential (`college/groups/page.tsx:61-68,79-83; admin-read-service.ts:73-150)
- Fix: Keep old route purely redirect/no group query; classify new CRUD as independent feature

## G2-15-007-024  [P1] GAP  facet F12  effort M
- Legacy: Business decision: generic CRT, club, bus groups have no consumers, hidden 2026-10-04; electives/project teams unaffected (`student-groups.js:6-13`)
- vNext now: VNext explicitly describes study groups, project teams, elective groups and manages STUDY_GROUP (`college/groups/page.tsx:79-82,179-184)
- Fix: Prevent generic group CRUD from implying student visible workflows; tie release to actual targeting features
