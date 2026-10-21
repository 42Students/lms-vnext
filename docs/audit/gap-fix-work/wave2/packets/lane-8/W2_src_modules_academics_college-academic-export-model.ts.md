# Work packet (wave 2): edit src/modules/academics/college-academic-export-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-batches.md

## G2-9-003-064  [P2] GAP  facet F14  effort M
- Legacy: Legacy CSV id/batchName/programId/currentSemester/academicYear/students/status/start/end (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:543-548`)
- vNext now: New CSV Batch/Batch code/Program name/program code/State/Recorded term/year start/active counts (`src/modules/academics/college-academic-export-model.ts:49-65`)
- Fix: Restore legacy expected export columns if downstream imports rely on them.
