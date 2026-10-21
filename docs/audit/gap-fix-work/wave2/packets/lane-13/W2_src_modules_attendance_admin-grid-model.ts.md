# Work packet (wave 2): edit src/modules/attendance/admin-grid-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/attend.md

## G2-8-021-048  [P2] GAP  facet F14  effort M
- Legacy: Legacy monthly teacher view PDF generated on client and error notice on failure (docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:175-185).
- vNext now: New admin grid offers CSV export with cell neutralization (src/components/attendance/admin-attendance-workspace.tsx:467-473; src/modules/attendance/admin-grid-model.ts:135-140).
- Fix: Add PDF parity or explicitly retire PDF, retain injection-safe CSV.
