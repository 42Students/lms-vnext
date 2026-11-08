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

## 8 November 2026 — selection freeze and 320px learner history regression

- [Source fix 065ce3f1](https://github.com/42Students/lms-vnext/commit/065ce3f1f087be4935fc0cfde74b094b5c82ef5f) closes a draft-state race in `faculty-attendance-workspace.tsx`: individual and bulk attendance mark controls now refuse changes during confirmation, a synchronous submission lock, or an unknown PATCH outcome. Unknown-write recovery still requires reloading the saved roster; this change does not retry or bypass the server mutation.
- [Unit check 00f76523](https://github.com/42Students/lms-vnext/commit/00f765234e72f063ff29d79b29ed90d3a6970a0e) covers all selection entrypoints; [responsive Playwright check c93ca06](https://github.com/42Students/lms-vnext/commit/c93ca06efd6aff65544187a0d5ee6a7107bd9fdf) checks signed-in learner history filter/reset, keyboard focus and no overflow at 320px and desktop. [Workflow 0ffdf2b](https://github.com/42Students/lms-vnext/commit/0ffdf2b172bf199162facbb4003afe7e4e050cc7) now requires all 15 role/browser scenarios.
- [Shared acceptance run 42487970844](https://github.com/42Students/lms-vnext/actions/runs/42487970844) was **pending when recorded**. The shared acceptance workflow also lints the changed Faculty component. This is not passed evidence: retain DOING until exact-SHA job completion and the previously listed policy reset, correction, focus, role and failure-path gaps are reviewed.

## Added rendered Faculty schedule acceptance harness — 8 November 2026

- [Fixture `b8af0a67`](https://github.com/42Students/lms-vnext/commit/b8af0a67c27efaa91a6edd8f30b1379d0ded07fe) renders the real Faculty editor with deterministic synthetic session data only when both development mode and `UX_G132_SCHEDULE_FIXTURE=1` are set; no authenticated identity, database or mutation bypass is created.
- [Responsive browser spec `ef5233cf`](https://github.com/42Students/lms-vnext/commit/ef5233cfbed42c703a42721fe076f3568e86779e) checks Create/Reschedule confirmation at 1280×800 and 390×844, exact IST windows, optional location, keyboard-available native controls, no horizontal overflow and that Cancel does not produce attendance mutation requests.
- [Dedicated workflow `ff70ecb8`](https://github.com/42Students/lms-vnext/commit/ff70ecb84758f237b56436bdce5124b0e46c4884) runs exact-SHA verification, scoped lint, TypeScript, focused existing unit regressions, Chromium and saved screenshots. Its authored steps are **not proof of a successful run** until a real exact-SHA Actions receipt is inspected.
- The browser witness is an isolated synthetic editor, not a valid authorization or saved-persisted-session witness. The original G132 Faculty success/conflict/double-submit/marking and negative role/tenant gates remain open; group state stays **DOING**.

## 8 November 2026 — expanded persisted Faculty acceptance (pending)

- Source commits: [Faculty mark/correct desktop/mobile screenshots](https://github.com/42Students/lms-vnext/commit/b8494116da8f0c7e0669d6a7eb5dad8ef0859485), [required 15-case CI gate](https://github.com/42Students/lms-vnext/commit/aa85d6106820b42fa5a61c646bcb60d01b355cb6), [Faculty schedule reschedule/CAS acceptance](https://github.com/42Students/lms-vnext/commit/3c21dc2844c12c4260a55802f5aa423fa2c1698b), [16-case gate](https://github.com/42Students/lms-vnext/commit/d3a650cb6003a51da5ac23d7b2328b1326b4e62b), [serial seeded-DB execution](https://github.com/42Students/lms-vnext/commit/39b386440319bde6c1e70e1b10fae233a5dbb47f).
- Test coverage added to **required** exact-SHA lint, TypeScript, unit and Playwright checks: real Faculty attendance mark, correction, error-free desktop/mobile rendering and a foreign-delivery rejection; cancellation of rescheduling, successful persisted rescheduling and 409 stale-version replay, with desktop/mobile screenshots. Tests mutate a shared disposable seed, so run with `--workers=1` to avoid cross-test race conditions.
- [Current latest required browser run 42488321833](https://github.com/42Students/lms-vnext/actions/runs/42488321833) is **PENDING at writing**, not accepted proof. Keep group **DOING** until its exact-SHA results and screenshots are inspected.
- Still to verify before closure: Super Admin entire-college override reset (including cancel and stale/error handling), complete admin correction workflow, responsive 320px/focus sequence and all five components' failure recovery. Previous G132 proof does not cover these gaps.


## 8 November 2026 — failed exact-SHA matrix diagnosed and unblocked

- [Run 42488321833](https://github.com/42Students/lms-vnext/actions/runs/42488321833) **FAILED** with 14/17 Playwright cases passing after successful scoped lint, full TypeScript and 23 unit tests. Three failures were isolated: the mark/correct test unconditionally read a potentially aborted response body after React route refresh; the scheduling and rescheduling tests attempted to parse successful POST bodies while `router.refresh()` aborted their browser transfers. Retrying the first test left a persisted overlapping session and correctly produced a 409 conflict on replay.
- [Fix ea10867e](https://github.com/42Students/lms-vnext/commit/ea10867e18d31a7b82ed2ecf84acb6dc86e8d58c) checks PATCH status without requiring body consumption, then still asserts saved and corrected attendance through the real UI and report.
- [Fix 3010bfb5](https://github.com/42Students/lms-vnext/commit/3010bfb5cb870adc4ee85ba26652dcfad4394ef1) checks a persisted scheduled UUID from the refreshed authorized Faculty session picker instead of reading a browser-aborted POST body, retaining the explicit overlapping duplicate 409 replay test.
- [Fix 617b5807](https://github.com/42Students/lms-vnext/commit/617b5807797db994472d7920df5cd1abe7b83d2f) reloads the server-backed scheduled session after a 200 reschedule, verifies stored IST start/end values and still requires a stale `expectedUpdatedAt` replay to return 409.
- [Workflow correction c471d6ff](https://github.com/42Students/lms-vnext/commit/c471d6ff2e9ac9882b4bc9dbf4f5e6c9d7efc77e) raises the required completed Playwright count from outdated 16 to the actual **17** scenarios, with zero skips, flaky or unexpected results. This restores strictness rather than omitting tests.
- [Follow-up run 42492174092](https://github.com/42Students/lms-vnext/actions/runs/42492174092) is the exact-SHA acceptance gate for these changes. Treat its actual final conclusion as authoritative. **DOING remains** until every end-to-end verification and remaining reset/recovery/keyboard/scope review is complete.
