# Screen #10: Assignment Grading — actionable prototype/code audit

**Original screenshot:** `Assignments › Grade.png` from `42LMS pages prototype-png-faculty.zip`. **Route:** `/teacher/report/assignment/:id/grade`.
**Queue status:** NEEDS-DIRECT-ACCEPTANCE. **Visual screenshot acceptance: PENDING**.
**Evidence:** No dedicated post-change green Faculty screenshot acceptance has been verified.

## Source files compared

- [`src/app/(authenticated)/teacher/report/assignment/[contentId]/grade/page.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/app/(authenticated)/teacher/report/assignment/%5BcontentId%5D/grade/page.tsx)
- [`src/components/courses/faculty-prototype-inline-grader.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/components/courses/faculty-prototype-inline-grader.tsx)
- [`src/components/courses/faculty-assignment-review.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/components/courses/faculty-assignment-review.tsx)

## Concrete adversarial gaps, preserved behavior and proof

Unchecked CODE means implementation exists, not verified. Record commit+run before checking off.

- [ ] **F10-01 · P0 · CODE:** Four filters, selected learner submission, prev/next controls.
- [ ] **F10-02 · P0 · CODE:** Existing private-save and explicit learner-visible publish guards.
- [ ] **F10-03 · P0 · VERIFY:** Grade and next navigates only after verified published receipt; last student stays.
- [ ] **F10-04 · P0 · VERIFY:** Stale version, duplicates, 409 and private grade visibility.
- [ ] **F10-05 · P0 · VERIFY:** Unauthorized learner/assessment/college access blocked.
- [ ] **F10-06 · P1 · OPEN:** Missing learners are non-clickable; screenshot workflows may require reminder.
- [ ] **F10-07 · P1 · VERIFY:** PDF secure file preview, text and URL submissions without leak.
- [ ] **F10-08 · P1 · VERIFY:** All/Missing/Graded/To grade totals, due time IST.
- [ ] **F10-09 · P1 · OPEN:** Screenshot compact inline grade form vs current richer editor layout.
- [ ] **F10-10 · P2 · VISUAL:** Left selected row, right pane and submit footer alignment.

## Universal gates — never skipped

- [ ] Desktop rendered screenshot compared against original uploaded PNG, with annotated differences.
- [ ] 390px mobile/keyboard/accessible names/focus/overflow.
- [ ] Cross-tenant/direct deep-link authorization and confidential-data isolation.
- [ ] State transitions with persisted verification, conflicts and network-unknown recovery.
- [ ] Empty, loading, unavailable and historical data.
- [ ] Current-code targeted browser+typecheck/unit proof, not historical green run.
- [ ] Separate visual sign-off with approved waivers only.

Update both this checklist and [the Faculty closure ledger](00-closure-ledger.md) with evidence before advancing.
