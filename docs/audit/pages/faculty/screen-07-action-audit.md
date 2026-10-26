# Screen #07: Course Attendance — actionable prototype/code audit

## Code validation update — 27 October 2026

- [75588fd](https://github.com/42Students/lms-vnext/commit/75588fd94851f577f0b1abd95ef98781a818600a) protects the prototype marker against 409/412/408/5xx unknown write receipts and handles a month with no scheduled classes. Pure recovery test added.
- First full Attendance E2E run [40385923788](https://github.com/42Students/lms-vnext/actions/runs/40385923788) found a real issue: after a confirmed advanced correction, immediate report-tab navigation saw an obsolete unsaved snapshot. [2d0bb1e](https://github.com/42Students/lms-vnext/commit/2d0bb1e1e77a63b5857dd3c012543044ee48db1c) fixes the accepted receipt baseline.
- [40386744605](https://github.com/42Students/lms-vnext/actions/runs/40386744605) **passed** focused PostgreSQL/units plus the retained attendance marking, correction, monthly report and prototype browser cases.
- Later [0c9d402](https://github.com/42Students/lms-vnext/commit/0c9d40299256b68a70956dc7af69c6e5367c82c2) also makes advanced 408/409/412/5xx/transport uncertainty fail-closed until hard reload. Newest focused run [40387070834](https://github.com/42Students/lms-vnext/actions/runs/40387070834) was in progress at this record. Don't claim 0c9d acceptance based on prior green.

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
