# College Operations — chat-4 verified gap coverage

Tests authored but **not run** by builder. PostgreSQL integration acceptance runs in the orchestrator's isolated test database.

| ID | Status | Evidence |
|---|---|---|
| COL-attendance-R01 | DONE | `src/modules/attendance/admin-service.ts` corrects only one exception without writing `attendance_sessions`; `admin-grid-model.ts` preserves unmarked peers; `tests/unit/admin-attendance-grid.test.ts` test `COL-attendance-R01`, `tests/integration/college-admin-attendance.test.ts` test `COL-attendance-R01` exercises persisted correction and unchanged session state. |
| COL-attendance-R03 | DONE | `src/app/(authenticated)/college/attendance/settings/page.tsx`, `departments/page.tsx`, `src/modules/admin-ui/college-department-insights-service.ts`, `src/modules/attendance/college-correction-read-service.ts`; `tests/integration/college-correction-read.test.ts` test `COL-attendance-R03` and `tests/integration/college-department-insights-denial.test.ts` test `COL-attendance-R03`: explicit acting-college scope, guarded reads and cross-college denial. |

| COL-placements-R02 | DONE | Company list separately shows persisted platform verification (`verifiedAt`), college trust, archived tag when present, domains and cross-college website/email-domain deduplication rule; `tests/unit/chat4-college-company-identity-gap-closure.test.ts` test `COL-placements-R02`. |
