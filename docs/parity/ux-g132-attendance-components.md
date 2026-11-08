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

## Executed cross-role and policy mutation evidence — 8 November 2026

- [Exact-SHA run 42470168923](https://github.com/42Students/lms-vnext/actions/runs/42470168923) **SUCCEEDED** on `2f5993b190a27c6e4f46b9202e7ec5bbff36142e`: original 10 role/responsive scenarios plus two new persisted-policy/negative-authorization scenarios, with TypeScript and scoped lint. Browser artefacts include desktop/mobile screenshots and traces.
- `tests/e2e/ux-g132-attendance-policy-mutation.spec.ts` exercises a server-authorized Super Admin selection of seeded college A, invalid threshold, confirmation cancellation, real compare-and-set PATCH/save with receipt, cross-college PATCH denial, restore to initial value, and mobile verification. A seeded College Admin's direct policy mutation is forbidden by the service despite the read-only UI.
- The tested Super Admin editor lives at `/admin/attendance`; the separate College Admin settings route must not be mistaken for a platform role entrypoint. No routing or privilege constraints were weakened to make the test pass.
- **Remaining DOING gaps:** faculty schedule conflict/double-submit and mark/correction positive/negative flows, reset-college-override confirmation, error recovery, full five-component focus and responsive review. Successful focused acceptance does not certify all G132 workflows or release security.

## Faculty scheduling confirmation improvement — 8 November 2026

- [Source commit `b9fe4619`](https://github.com/42Students/lms-vnext/commit/b9fe461939c54176655ee90ad9593b250fc50ad0) makes the editor's heading change between Schedule and Reschedule and adds a confirmation summary with the exact session title, typed start/end in IST, optional location, and whether it creates a new session or updates the selected unmarked session.
- [Unit source contract `f9eea9c3`](https://github.com/42Students/lms-vnext/commit/f9eea9c3cca1cb00e346119fb2a3b8bac22dfc17) checks those confirmation details are present in the existing focused UX batch. No authorization, stored schedule timestamps, optimistic version checks or request payloads were changed.
- These edits are **committed, not independently CI-verified** in this update. Keep UX-G132 **DOING** until successful exact-SHA checks and the previously listed real Faculty mutation/conflict/replay/marking and responsive role-authorization evidence are complete.
