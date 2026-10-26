# Screen #12: Class Schedule — actionable prototype/code audit

**Original screenshot:** `Class schedule.png` from `42LMS pages prototype-png-faculty.zip`. **Route:** `/teacher/calendar`.
**Queue status:** RECHECK. **Visual screenshot acceptance: PENDING**.
**Evidence:** [Earlier workflow 40296450235](https://github.com/42Students/lms-vnext/actions/runs/40296450235), not a current-code sign-off.

## Source files compared

- [`src/components/courses/faculty-prototype-schedule.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/components/courses/faculty-prototype-schedule.tsx)
- [`src/app/(authenticated)/teacher/calendar/page.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/app/(authenticated)/teacher/calendar/page.tsx)
- [`src/modules/courses/faculty-schedule-service.ts`](https://github.com/42Students/lms-vnext/blob/main/src/modules/courses/faculty-schedule-service.ts)
- [`tests/e2e/faculty-class-schedule-prototype.spec.ts`](https://github.com/42Students/lms-vnext/blob/main/tests/e2e/faculty-class-schedule-prototype.spec.ts)

## Concrete adversarial gaps, preserved behavior and proof

Unchecked CODE means implementation exists, not verified. Record commit+run before checking off.

- [ ] **F12-01 · P1 · CODE:** Week/Day/Month, focusable horizontal date grid.
- [ ] **F12-02 · P0 · CODE:** Scheduled classes have correct course Section room + attendance event links.
- [ ] **F12-03 · P1 · VERIFY:** Week starts Monday IST across month/year/leap transition.
- [ ] **F12-04 · P1 · VERIFY:** Today/this week/next class header synchronized with course filter.
- [ ] **F12-05 · P1 · DECISION:** Stable course-hashed colors preserve screenshot grouping and contrast.
- [ ] **F12-06 · P0 · VERIFY:** No calendar leakage to unassigned Faculty course.
- [ ] **F12-07 · P1 · VERIFY:** Date nav bounds, Today return, advanced calendar fallback.
- [ ] **F12-08 · P1 · VERIFY:** No classes and no upcoming classes true empty states.
- [ ] **F12-09 · P2 · VISUAL:** Seven day cards, highlighted today, next-three section.

## Universal gates — never skipped

- [ ] Desktop rendered screenshot compared against original uploaded PNG, with annotated differences.
- [ ] 390px mobile/keyboard/accessible names/focus/overflow.
- [ ] Cross-tenant/direct deep-link authorization and confidential-data isolation.
- [ ] State transitions with persisted verification, conflicts and network-unknown recovery.
- [ ] Empty, loading, unavailable and historical data.
- [ ] Current-code targeted browser+typecheck/unit proof, not historical green run.
- [ ] Separate visual sign-off with approved waivers only.

Update both this checklist and [the Faculty closure ledger](00-closure-ledger.md) with evidence before advancing.
