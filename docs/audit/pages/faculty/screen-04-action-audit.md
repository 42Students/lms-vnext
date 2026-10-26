# Screen #04: Course Overview — actionable source-to-prototype audit

**Real uploaded reference:** `Course › Overview.png` inside `42LMS pages prototype-png-faculty.zip`. **Route:** `/teacher/courses/:deliveryId/home`.
**Queue status:** RECHECK. **Visual acceptance: NOT SIGNED OFF.**
**Run to examine:** https://github.com/42Students/lms-vnext/actions/runs/40284557334 (historical; compare run SHA to latest source commit).

## What we inspected

- [`src/components/courses/faculty-prototype-course-priorities.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/components/courses/faculty-prototype-course-priorities.tsx)
- [`src/components/courses/faculty-course-workspace.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/components/courses/faculty-course-workspace.tsx)
- [`src/modules/courses/faculty-course-home-service.ts`](https://github.com/42Students/lms-vnext/blob/main/src/modules/courses/faculty-course-home-service.ts)

## Brutal page-level checklist

Only close an item after current-code proof. CODE means source exists, **not** verified complete. All entries intentionally start unchecked.

- [ ] **F04-01 · P0 · CODE:** Five tabs, course heading, class chooser and permanent right-side summary cards.
- [ ] **F04-02 · P0 · CODE:** Class progress, current-month attendance, quiz average, behind count sourced.
- [ ] **F04-03 · P0 · VERIFY:** Needs You grading/quiz/attendance/discussion tasks match selected class.
- [ ] **F04-04 · P1 · VERIFY:** Every quick link routes to correct assessment/session/discussion.
- [ ] **F04-05 · P1 · DECISION:** About-course Edit vs Details read-only: College Admin permission policy.
- [ ] **F04-06 · P0 · VERIFY:** Class-switch isolation of metric values and task queue.
- [ ] **F04-07 · P1 · VERIFY:** Mutation then refresh updates stale scores/attendance/discussions.
- [ ] **F04-08 · P1 · VERIFY:** Unavailable signals shown as unknown—not 0 or fabricated.
- [ ] **F04-09 · P2 · VISUAL:** Side rail proportions, heading metadata, row heights, colored counters.

## Mandatory acceptance gates (all unchecked)

- [ ] Compare rendered desktop 1440×1000 side-by-side with the **original uploaded** PNG (annotated differences).
- [ ] Compare responsive mobile 390×844, keyboard focus, controls, form labels and no document overflow.
- [ ] Verify direct-link, cross-delivery/cross-college authorization and no sensitive learner leaks.
- [ ] Verify success, failure, conflict, stale version, duplicate writes and unknown-outcome recovery.
- [ ] Exercise empty, loading, error, missing roster, no data and archived states with seeded scenarios.
- [ ] Attach post-change commit SHA and *passing* page-specific browser/TypeScript evidence, not older green runs.
- [ ] Receive separate image-level visual approval or record explicit, approved exceptions.

**Next action:** take the first remaining P0 OPEN / BLOCKED / VERIFY issue, run targeted tests, update this file and [the single ledger](00-closure-ledger.md) only with concrete evidence.
