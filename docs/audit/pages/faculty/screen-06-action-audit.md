# Screen #06: Course Students — actionable prototype/code audit

## Code validation update — 27 October 2026

- [2bc7a5f](https://github.com/42Students/lms-vnext/commit/2bc7a5f62009c9109ab249d953b54938e2b360a3) prevents a false Behind filter when there is no measurable published work or course completion is unavailable; an unavailable denominator is not zero.
- [40385171351](https://github.com/42Students/lms-vnext/actions/runs/40385171351): the focused prototype and retained desktop/mobile roster/privacy browser tests passed **after** the code change; the workflow failed afterward at unrelated TPO TS2322. This is focused-browser evidence, **not global green**.
- Still required for final account-wide code closure: broader transient/stale roster/partial-signal scenarios, global TypeScript recovery, and shared navigation regression. Screenshot visual review remains deferred.

**Original reference:** `Course › Students.png` in user-uploaded `42LMS pages prototype-png-faculty.zip`; route `/teacher/courses/:deliveryId/students`.
**Audit phase:** RECHECK; **rendered visual parity not signed off**.
**Earlier test evidence, not current-code guarantee:** https://github.com/42Students/lms-vnext/actions/runs/40293289182.

## vNext source inspected

- [`src/components/courses/faculty-prototype-student-directory.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/components/courses/faculty-prototype-student-directory.tsx)
- [`src/modules/courses/faculty-course-home-service.ts`](https://github.com/42Students/lms-vnext/blob/main/src/modules/courses/faculty-course-home-service.ts)
- [`src/modules/courses/faculty-roster-export.ts`](https://github.com/42Students/lms-vnext/blob/main/src/modules/courses/faculty-roster-export.ts)
- [`tests/e2e/faculty-students-prototype.spec.ts`](https://github.com/42Students/lms-vnext/blob/main/tests/e2e/faculty-students-prototype.spec.ts)

## Page-specific adversarial checklist

CODE = present in source, still requires verification. All checkboxes start open.

- [ ] **F06-01 · P0 · CODE:** Four KPI cards: students, behind, attendance low, latest assignment missing.
- [ ] **F06-02 · P0 · CODE:** Scoped roster search + student detail link.
- [ ] **F06-03 · P1 · CODE:** All / Behind filter uses published content progress below 30%.
- [ ] **F06-04 · P0 · INVESTIGATE:** Last Students CI blocked on unrelated TPO + earlier Blueprint TypeScript.
- [ ] **F06-05 · P0 · VERIFY:** Masked phone, college-only email; CSV omits private contacts.
- [ ] **F06-06 · P1 · VERIFY:** Content progress percentage not grade percentage; quiz/assignment states.
- [ ] **F06-07 · P1 · VERIFY:** Latest missing-submission count with class membership changes.
- [ ] **F06-08 · P1 · VERIFY:** Unavailable roster/attendance renders dash, not fabricated zero.
- [ ] **F06-09 · P1 · VERIFY:** Mobile overflow, contact link accessibility and no leaks in tooltips.
- [ ] **F06-10 · P2 · VISUAL:** Four card widths, roster pills, contact column and header spacing.

## Mandatory evidence gates

- [ ] Original screenshot compared with rendered 1440×1000 page; record every gap.
- [ ] Responsive 390×844, keyboard, focus, Escape, labels and no horizontal document overflow.
- [ ] Negative cross-delivery / college access and privacy for this page.
- [ ] Empty, loading, error, archived, optional source unavailable and stale-data cases.
- [ ] Successful mutation + denied/stale/unknown response recovery where applicable.
- [ ] Unit + browser acceptance pass on a commit **including the latest page source**.
- [ ] Explicit final visual sign-off or documented permission/product deviations.

After every resolved row: append exact fix commit, matching post-change CI run and screenshot evidence, then update [the single closure ledger](00-closure-ledger.md).
