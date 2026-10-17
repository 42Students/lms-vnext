# Graceful-operation adoption — chat-13

These are scoped implementation contracts for the Super Admin placements interview page. They do not certify checklist-wide coverage. Tests were authored but not run.

| ID | Status | Evidence |
|---|---|---|
| GR-35 | DONE | `src/components/placements/college-interview-appointments.tsx`; `tests/unit/chat13-placement-interview-graceful.test.ts` → `GR-35 destructive interview cancellation has a named confirmation dialog` (page-scoped, unrun) |
| GR-90 | DONE | `src/components/placements/college-interview-appointments.tsx`; `tests/unit/chat13-placement-interview-graceful.test.ts` → `GR-90 interview API failures are friendly, persistent and announced with an alert` (page-scoped, unrun) |
| GR-30 | DONE | Scoped to Super Admin drive forms; `tests/unit/chat13-drive-friendly-guarded.test.ts` → `GR-30 both drive forms use the synchronous guarded-action lock and busy button` (not run) |
| GR-31 | DONE | Scoped to Super Admin drive forms; `tests/unit/chat13-drive-friendly-guarded.test.ts` → `GR-31 drive POST PATCH and PUT mutations use the guarded apiFetch helper` (not run) |
| GR-32 | DONE | Scoped to Super Admin drive forms; `tests/unit/chat13-drive-friendly-guarded.test.ts` → `GR-32 a conflicting drive update retains current inputs and reports a friendly error` (not run) |
| GR-33 | DONE | Scoped to Super Admin drive forms; `tests/unit/chat13-drive-friendly-guarded.test.ts` → `GR-33 drive creation checks business fields before making requests` (not run) |
| GR-36 | DONE | Scoped to Super Admin drive forms; `tests/unit/chat13-drive-friendly-guarded.test.ts` → `GR-36 drive create explains why there is no active placement season` (not run) |
| GR-37 | DONE | Scoped to Super Admin drive forms; `tests/unit/chat13-drive-friendly-guarded.test.ts` → `GR-37 user-facing interview/calendar dates identify IST` (not run) |
| GR-62 | DONE | Scoped to Super Admin drive forms; `tests/unit/chat13-drive-friendly-guarded.test.ts` → `GR-62 long drive forms warn before losing unsaved changes and clear after confirmed save` (not run) |
| GR-90 | DONE | Scoped to Super Admin drive forms; `tests/unit/chat13-drive-friendly-guarded.test.ts` → `GR-90 drive forms use shared toast feedback on failure and never print an API error code` (not run) |
