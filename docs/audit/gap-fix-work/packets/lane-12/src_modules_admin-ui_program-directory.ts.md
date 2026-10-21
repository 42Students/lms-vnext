# Work packet: edit src/modules/admin-ui/program-directory.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-programs.md

## G2-9-018-054  [P1] GAP  facet F14  effort M
- Legacy: Exports programs.csv with id/name/durationYears/departmentId/3 counts `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:292-298`
- vNext now: Exports CSV with ID/Program/Code/Department/Duration Terms/3 counts `src/modules/admin-ui/program-directory.ts:53-69`
- Fix: Restore legacy CSV headers/units and explicit department ID if downstream consumers rely on it.
