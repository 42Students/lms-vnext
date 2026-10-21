# Work packet: edit src/modules/attendance/admin-grid-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u001-college-admin-attendance.md, docs/audit/gap2/lane-5/u006-superadmin-attendance.md

## G2-5-001-038  [P1] GAP  facet F12 Business rules and formulas  effort M
- Legacy: Legacy counts held sessions with explicit absence as counted even if attendanceMarked flag absent; docs/legacy-source/frontend/src/utils/adminAttendanceGrid.js:6-18
- vNext now: Cell state says counted only if session status MARKED, even if exception exists; src/modules/attendance/admin-grid-model.ts:91-111,114-132
- Fix: Treat historical exception rows in unmarked sessions as counted for affected learner when parity/migrated data requires it.

## G2-5-006-013  [P1] GAP  facet F04 Data formatting  effort M
- Legacy: Daily cell P/A/N/X or attended/marked ratio multiple (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:185-207)
- vNext now: Session count or single badge, not daily attended/marked ratio (src/components/attendance/admin-attendance-workspace.tsx:527-552; src/modules/attendance/admin-grid-model.ts:91-132)
- Fix: Show aggregate ratio for multi-session days.

## G2-5-006-042  [P1] GAP  facet F12 Business rules  effort M
- Legacy: Class monthly percent denominator per learner marked or absent-implied sessions (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:99-112)
- vNext now: Marked-session global numerator × active roster, exceptions undercount in unmarked (src/components/attendance/admin-attendance-workspace.tsx:230-236; src/modules/attendance/admin-grid-model.ts:91-132)
- Fix: Calculate per-learner denominator correctly for absent-implied statuses.
