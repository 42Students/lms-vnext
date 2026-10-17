# College Operations — chat-4 verified gap coverage

Tests authored but **not run** by builder. PostgreSQL integration acceptance runs in the orchestrator's isolated test database.

| ID | Status | Evidence |
|---|---|---|
| COL-attendance-R01 | DONE | `src/modules/attendance/admin-service.ts` corrects only one exception without writing `attendance_sessions`; `admin-grid-model.ts` preserves unmarked peers; `tests/unit/admin-attendance-grid.test.ts` test `COL-attendance-R01`, `tests/integration/college-admin-attendance.test.ts` test `COL-attendance-R01` exercises persisted correction and unchanged session state. |
