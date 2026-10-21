# Work packet: edit src/proxy.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/college-hidden-student-group.md

## G2-14-007-001  [P1] MISSING  facet F01  effort S
- Legacy: Legacy nested /college-admin/student-groups/:id is retired and replaces location with /college-admin/people after router ready; vNext no matching route/redirect in next.config — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:6-12`
- vNext now: `next.config.ts:7-18`; `src/proxy.ts:9-35`
- Fix: Add explicit old URL wildcard redirect to current canonical People target

## G2-14-007-003  [P1] GAP  facet F01  effort S
- Legacy: Legacy router.replace history, no back entry to retired group; vNext missing legacy redirect risks 404/back-loop — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:9-12`
- vNext now: `next.config.ts:7-18`; `src/proxy.ts:9-35`
- Fix: Use replace/temporary server redirect without preserving old page in history

## G2-14-007-043  [P1] MISSING  facet F23  effort S
- Legacy: vNext has no old /college-admin/student-groups/:id bookmark redirect while legacy explicitly preserved links to People — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:6-12`
- vNext now: `next.config.ts:7-18`; `src/proxy.ts:9-35`
- Fix: Add old URL redirect to People/Contacts and use temporary replace semantics
