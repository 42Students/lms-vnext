# UX-G132 — Attendance interactive components

**Canonical state: DOING.** Source registry: five components under `src/components/attendance/`. Only `docs/tracker.json#uxReview` controls status.

## Scope and changes

- **Admin attendance workspace** (`admin-attendance-workspace.tsx`): reviewed existing roster/sessions, correction modal, failure notices and scoped data flow. No backend permission or attendance-count change.
- **College attendance policy** (`college-attendance-policy-form.tsx`): validates whole numbers (threshold 1–100%, correction hours 1–168), prevents submitting invalid policy, introduces explicit confirmation with both values and impact on existing correction windows. Read-only College Admin view is preserved.
- **Faculty schedule editor** (`faculty-attendance-schedule-editor.tsx`): synchronous write lock prevents duplicate create/reschedule when confirmations are clicked rapidly. Existing expectedUpdatedAt optimistic concurrency stays enforced.
- **Faculty attendance workspace** (`faculty-attendance-workspace.tsx`): reviewed existing marking/correction interaction; no mutation in this pass.
- **Learner attendance workspace** (`learner-attendance-workspace.tsx`): reviewed read-only summary/history and status distinctions; no mutation in this pass.

## Verification and required completion proof

- Tracked regression tests: `tests/unit/ux-five-group-batch-20261107.test.ts` (policy review/validation and faculty write lock); `tests/e2e/ux-five-group-batch-20261107.spec.ts` (390px/1280px authenticated College Admin settings with screenshot capture).
- Execute **on a single exact commit SHA**: `npm run lint`, `npm run typecheck`, `npm test`, then browser E2E on disposable database. CI is not claimed green until verified.
- Additional authenticated **Super Admin** browser proof is still needed for editable policy: invalid numeric input; review/cancel; save; server receipt; reset confirmation; error recovery; responsive 320px/390px plus 1280px screenshots. College Admin must remain read-only.
- Faculty flow still requires an end-to-end double-confirm replay witness, schedule-change conflict, attendance marking across 5 component surfaces, focus and overflow checks.
- Security unchanged: permission-scoped attendance policy and faculty attendance routes remain authoritative. Client draft validation is not a permission substitute.

**Do not transition to DONE** without exact-SHA unit/type/lint execution, desktop+mobile captures, role-negative evidence, regression/security reviews.
