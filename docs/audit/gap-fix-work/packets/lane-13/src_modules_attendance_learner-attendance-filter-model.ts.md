# Work packet: edit src/modules/attendance/learner-attendance-filter-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/learner-attendance.md

## G2-19-006-077  [P1] GAP  facet F22  effort L
- Legacy: Legacy single numeric courseId selects attendance, independent of sections `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:146-163`
- vNext now: vNext UUID deliveryId required for per-section course and active academic period `src/modules/attendance/learner-attendance-filter-model.ts:17-28` `src/modules/attendance/learner-service.ts:260-269`
- Fix: Handle migrated duplicate course deliveries and preserve historical attendance visibility.
