# Screen #09: Assignments & Quizzes — actionable prototype/code audit

**Original reference:** `Assignments & quizzes.png` in user-uploaded `42LMS pages prototype-png-faculty.zip`; route `/teacher/assessments`.
**Audit phase:** RECHECK; **rendered visual parity not signed off**.
**Earlier test evidence, not current-code guarantee:** https://github.com/42Students/lms-vnext/actions/runs/40295538156.

## vNext source inspected

- [`src/components/courses/faculty-prototype-assessment-directory.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/components/courses/faculty-prototype-assessment-directory.tsx)
- [`src/app/(authenticated)/teacher/assessments/page.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/app/(authenticated)/teacher/assessments/page.tsx)
- [`src/components/courses/faculty-assessment-create.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/components/courses/faculty-assessment-create.tsx)
- [`tests/e2e/faculty-assessments-prototype.spec.ts`](https://github.com/42Students/lms-vnext/blob/main/tests/e2e/faculty-assessments-prototype.spec.ts)

## Page-specific adversarial checklist

CODE = present in source, still requires verification. All checkboxes start open.

- [ ] **F09-01 · P0 · CODE:** Unified table with All / Assignments / Quizzes + course filter.
- [ ] **F09-02 · P0 · CODE:** Two create actions open real authorized draft dialogs.
- [ ] **F09-03 · P0 · VERIFY:** Lifecycle statuses: To grade, Open, Draft, Published correctly transition.
- [ ] **F09-04 · P0 · VERIFY:** Title/Open/Grade/Report href points to exact ID and correct delivery.
- [ ] **F09-05 · P1 · VERIFY:** Course dropdown keyed only by code: check same-code multiple offerings.
- [ ] **F09-06 · P0 · VERIFY:** Quiz result privacy before teacher publishes/release.
- [ ] **F09-07 · P1 · VERIFY:** Unique assignment submitters vs quiz attempts and denominator.
- [ ] **F09-08 · P1 · VERIFY:** Archive/no deadline/empty filter/mobile responsiveness.
- [ ] **F09-09 · P2 · VISUAL:** Header, badge colors, status pills, right-side action buttons.

## Mandatory evidence gates

- [ ] Original screenshot compared with rendered 1440×1000 page; record every gap.
- [ ] Responsive 390×844, keyboard, focus, Escape, labels and no horizontal document overflow.
- [ ] Negative cross-delivery / college access and privacy for this page.
- [ ] Empty, loading, error, archived, optional source unavailable and stale-data cases.
- [ ] Successful mutation + denied/stale/unknown response recovery where applicable.
- [ ] Unit + browser acceptance pass on a commit **including the latest page source**.
- [ ] Explicit final visual sign-off or documented permission/product deviations.

After every resolved row: append exact fix commit, matching post-change CI run and screenshot evidence, then update [the single closure ledger](00-closure-ledger.md).
