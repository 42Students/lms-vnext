# Screen #07: Course Attendance — actionable prototype/code audit

**Original reference:** `Course › Attendance.png` in user-uploaded `42LMS pages prototype-png-faculty.zip`; route `/teacher/courses/:deliveryId/attendanceDetail`.
**Audit phase:** RECHECK; **rendered visual parity not signed off**.
**Earlier test evidence, not current-code guarantee:** https://github.com/42Students/lms-vnext/actions/runs/40295364519.

## vNext source inspected

- [`src/components/attendance/faculty-prototype-attendance.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/components/attendance/faculty-prototype-attendance.tsx)
- [`src/modules/attendance/faculty-prototype-session-selection.ts`](https://github.com/42Students/lms-vnext/blob/main/src/modules/attendance/faculty-prototype-session-selection.ts)
- [`src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/app/(authenticated)/teacher/courses/%5BdeliveryId%5D/attendanceDetail/page.tsx)

## Page-specific adversarial checklist

CODE = present in source, still requires verification. All checkboxes start open.

- [ ] **F07-01 · P0 · CODE:** Choose active/today authorized class instead of next future event.
- [ ] **F07-02 · P0 · CODE:** Present/Absent, all roster completion, confirm, correction reason.
- [ ] **F07-03 · P0 · VERIFY:** Foreign delivery/session ID or cross-college learner denied.
- [ ] **F07-04 · P0 · VERIFY:** Session opening and correction window enforced in UI and API.
- [ ] **F07-05 · P1 · VERIFY:** Search, first six, Show all; marks persist when search changes.
- [ ] **F07-06 · P1 · VERIFY:** Schedule class CTA opens actual scheduling disclosure, collision checks.
- [ ] **F07-07 · P0 · VERIFY:** Failed POST / conflict / aborted response no duplicate write.
- [ ] **F07-08 · P1 · DECISION:** Bulk Mark everyone action is not submission; verify explicit confirmation.
- [ ] **F07-09 · P2 · VISUAL:** Two tabs, cards, footer submit, row controls and mobile.

## Mandatory evidence gates

- [ ] Original screenshot compared with rendered 1440×1000 page; record every gap.
- [ ] Responsive 390×844, keyboard, focus, Escape, labels and no horizontal document overflow.
- [ ] Negative cross-delivery / college access and privacy for this page.
- [ ] Empty, loading, error, archived, optional source unavailable and stale-data cases.
- [ ] Successful mutation + denied/stale/unknown response recovery where applicable.
- [ ] Unit + browser acceptance pass on a commit **including the latest page source**.
- [ ] Explicit final visual sign-off or documented permission/product deviations.

After every resolved row: append exact fix commit, matching post-change CI run and screenshot evidence, then update [the single closure ledger](00-closure-ledger.md).
