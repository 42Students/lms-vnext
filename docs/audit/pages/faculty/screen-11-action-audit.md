# Screen #11: Assignment Report — actionable prototype/code audit

**Original screenshot:** `Assignments › Report.png` from `42LMS pages prototype-png-faculty.zip`. **Route:** `/teacher/report/assignment/:id`.
**Queue status:** RECHECK. **Visual screenshot acceptance: PENDING**.
**Evidence:** [Earlier workflow 40298015791](https://github.com/42Students/lms-vnext/actions/runs/40298015791), not a current-code sign-off.

## Source files compared

- [`src/components/courses/faculty-prototype-assignment-report.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/components/courses/faculty-prototype-assignment-report.tsx)
- [`src/modules/courses/faculty-assessment-report-service.ts`](https://github.com/42Students/lms-vnext/blob/main/src/modules/courses/faculty-assessment-report-service.ts)
- [`tests/e2e/faculty-assignment-report.spec.ts`](https://github.com/42Students/lms-vnext/blob/main/tests/e2e/faculty-assignment-report.spec.ts)

## Concrete adversarial gaps, preserved behavior and proof

Unchecked CODE means implementation exists, not verified. Record commit+run before checking off.

- [ ] **F11-01 · P0 · CODE:** Four KPIs Handed in, Graded, Average, Due from scope-backed report.
- [ ] **F11-02 · P1 · CODE:** Score histogram and last-day/late/not-handed-in categories.
- [ ] **F11-03 · P0 · INVESTIGATE:** Due IST boundary: last-day submission after deadline must count late.
- [ ] **F11-04 · P0 · VERIFY:** Open/Grade drilldown retains exact student and assigned class.
- [ ] **F11-05 · P1 · OPEN:** Screenshot Remind CTA for missing student; current View student differs.
- [ ] **F11-06 · P0 · VERIFY:** CSV export escaping and private contacts, correct scoped rows.
- [ ] **F11-07 · P1 · VERIFY:** Average excludes ungraded and bucket sums are consistent.
- [ ] **F11-08 · P1 · VERIFY:** Missing roster/no due/0 graded/archived null states.
- [ ] **F11-09 · P2 · VISUAL:** Histogram, four KPI tiles, 2 middle cards, scores table density.

## Universal gates — never skipped

- [ ] Desktop rendered screenshot compared against original uploaded PNG, with annotated differences.
- [ ] 390px mobile/keyboard/accessible names/focus/overflow.
- [ ] Cross-tenant/direct deep-link authorization and confidential-data isolation.
- [ ] State transitions with persisted verification, conflicts and network-unknown recovery.
- [ ] Empty, loading, unavailable and historical data.
- [ ] Current-code targeted browser+typecheck/unit proof, not historical green run.
- [ ] Separate visual sign-off with approved waivers only.

Update both this checklist and [the Faculty closure ledger](00-closure-ledger.md) with evidence before advancing.
