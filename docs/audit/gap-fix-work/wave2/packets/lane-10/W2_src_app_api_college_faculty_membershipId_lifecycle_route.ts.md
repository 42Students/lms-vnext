# Work packet (wave 2): edit src/app/api/college/faculty/[membershipId]/lifecycle/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/admin-user-lifecycle-controller.md

## G2-1-001-001  [P2] GAP  facet F01  effort M
- Legacy: `AdminUserLifecycleController.java:42-46,83-86,137-140`; `Faculty.js:875-913`, `Students.js:1028-1064` put actions in respective roster.
- vNext now: `college-faculty-lifecycle-action.tsx:64-71`, `college-student-lifecycle-action.tsx:42-46` show detail/directory actions; `/api/college/faculty/[membershipId]/lifecycle/route.ts:10-19`.
- Fix: Keep suspend/reactivate actions in the same legacy roster action column as well as any detail page; preserve row access.
