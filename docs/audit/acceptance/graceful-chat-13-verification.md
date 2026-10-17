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
| GR-70 | DONE | Super Admin interview card; `tests/unit/chat13-superadmin-interview-graceful.test.ts` → `GR-70 isolates the Super Admin interview card in a retryable client error boundary` (page-scoped; not run) |
| GR-64 | DONE | Super Admin interview card; `tests/unit/chat13-superadmin-interview-graceful.test.ts` → `GR-64 prevents an empty error export and caps long downloads with a plain notice` (page-scoped; not run) |
| GR-91 | DONE | Super Admin interview card; `tests/unit/chat13-superadmin-interview-graceful.test.ts` → `GR-91 provides a keyboard-reachable retry button with a visible focus ring` (page-scoped; not run) |
| GR-92 | DONE | Super Admin interview card; `tests/unit/chat13-superadmin-interview-graceful.test.ts` → `GR-92 explains failures with text rather than color alone` (page-scoped; not run) |
| GR-56 | DONE | Placement application drawer; `tests/unit/chat13-placement-detail-graceful.test.ts` → `GR-56 external assessment links are visible and copyable if opening fails` (page-scoped, unrun) |
| GR-90 | DONE | Placement application drawer; `tests/unit/chat13-placement-detail-graceful.test.ts` → `GR-90 focuses an accessible error message following a failed application request` (page-scoped, unrun) |
| GR-91 | DONE | Placement application drawer; `tests/unit/chat13-placement-detail-graceful.test.ts` → `GR-91 provides a keyboard-reachable, visibly focused Refresh and Copy link action` (page-scoped, unrun) |
| GR-92 | DONE | Placement application drawer; `tests/unit/chat13-placement-detail-graceful.test.ts` → `GR-92 uses written messages for link-copy and application errors` (page-scoped, unrun) |
| GR-40 | NOT-A-GAP | `tests/unit/chat13-page-scoped-not-applicable.test.ts` → `GR-40 Interview operations has no file upload input`. Scoped solely to these read-only surfaces, not app-wide (not run) |
| GR-63 | NOT-A-GAP | `tests/unit/chat13-page-scoped-not-applicable.test.ts` → `GR-63 Interview operations has no import or bulk write action`. Scoped solely to these read-only surfaces, not app-wide (not run) |
| GR-74 | NOT-A-GAP | `tests/unit/chat13-page-scoped-not-applicable.test.ts` → `GR-74 Analytics and interview operations render no logos or avatars`. Scoped solely to these read-only surfaces, not app-wide (not run) |
| GR-75 | NOT-A-GAP | `tests/unit/chat13-page-scoped-not-applicable.test.ts` → `GR-75 Analytics and interview operations use no realtime socket or bell`. Scoped solely to these read-only surfaces, not app-wide (not run) |
| GR-77 | NOT-A-GAP | `tests/unit/chat13-page-scoped-not-applicable.test.ts` → `GR-77 Analytics and interview operations have no print or PDF view`. Scoped solely to these read-only surfaces, not app-wide (not run) |
| GR-72 | DONE | Super Admin calendar independently catches booking-service failures and shows retry without blanking other event sections; `tests/unit/chat13-superadmin-booked-interviews.test.ts` → `GR-72 supplementary booked-interview data stays scoped and warns when truncated` (page-scoped; not run) |
