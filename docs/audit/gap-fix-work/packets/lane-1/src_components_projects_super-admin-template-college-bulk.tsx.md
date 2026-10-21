# Work packet: edit src/components/projects/super-admin-template-college-bulk.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u033-superadmin-template-colleges.md

## G2-7-033-018  [P1] GAP  facet F05  effort M
- Legacy: colleges.js:286-293 selected Table rows persist across 10-row pagination
- vNext now: super-admin-template-college-bulk.tsx:98-115 separate checkboxes only for server page
- Fix: Preserve selected colleges across multiple pages and clear scope

## G2-7-033-024  [P1] GAP  facet F06  effort L
- Legacy: colleges.js:141-163 bulk selected assigned/unassigned, refresh+CAS snapshot before write
- vNext now: super-admin-template-college-bulk.tsx:34-56 per-college request batch without whole-set CAS
- Fix: Provide versioned batch CAS or equivalent concurrent change reconciliation

## G2-7-033-036  [P1] GAP  facet F10  effort L
- Legacy: colleges.js:148-155 bulk reads current set then compare-and-set whole list
- vNext now: super-admin-template-college-bulk.tsx:34-56 sends per-college operations
- Fix: Decide atomic batch vs partial per-college behavior and collision handling

## G2-7-033-044  [P1] GAP  facet F12  effort L
- Legacy: colleges.js:148-156 CAS against latest full set for bulk
- vNext now: super-admin-template-college-bulk.tsx:40-55 partial retry by college
- Fix: Test concurrent admin bulk updates do not overwrite unrelated assignments

## G2-7-033-062  [P1] GAP  facet F20  effort L
- Legacy: colleges.js:141-163 bulk CAS latest assignment set
- vNext now: super-admin-template-college-bulk.tsx:34-56 independent per-college writes
- Fix: Compare audit order and partial retries to atomic legacy bulk semantics

## G2-7-033-031  [P3] GAP  facet F08  effort S
- Legacy: colleges.js:158 Selected colleges assigned / Selected college assignments removed
- vNext now: super-admin-template-college-bulk.tsx:52-55 Selected colleges assigned / Selected colleges removed
- Fix: Match exact remove success copy
