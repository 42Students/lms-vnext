# Screen #02: Today — actionable source-to-prototype audit

**Real uploaded reference:** `Faculty › Today.png` inside `42LMS pages prototype-png-faculty.zip`. **Route:** `/teacher`.
**Queue status:** RECHECK. **Visual acceptance: NOT SIGNED OFF.**
**Run to examine:** https://github.com/42Students/lms-vnext/actions/runs/40282276117 (historical; compare run SHA to latest source commit).

## What we inspected

- [`src/app/(authenticated)/teacher/page.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/app/(authenticated)/teacher/page.tsx)
- [`src/components/faculty/faculty-today-panel.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/components/faculty/faculty-today-panel.tsx)
- [`src/app/api/courses/faculty/shell-counts/route.ts`](https://github.com/42Students/lms-vnext/blob/main/src/app/api/courses/faculty/shell-counts/route.ts)

## Brutal page-level checklist

Only close an item after current-code proof. CODE means source exists, **not** verified complete. All entries intentionally start unchecked.

- [ ] **F02-01 · P0 · CODE:** Live member greeting / college code / IST date and action count vs sidebar badge.
- [ ] **F02-02 · P0 · CODE:** Four real CTA routes: grade, attendance, discussion reply, draft quiz.
- [ ] **F02-03 · P1 · CODE:** Permanent Today’s Classes + This Week right rail, responsive stacking.
- [ ] **F02-04 · P0 · VERIFY:** Cross-check oldest pending grade and session roster against authorized DB.
- [ ] **F02-05 · P0 · VERIFY:** Next-class countdown midnight / no class / cancelled session.
- [ ] **F02-06 · P1 · DECISION:** Later currently dismisses for this visit only; agree persist/snooze semantics.
- [ ] **F02-07 · P1 · VERIFY:** Deadline denominators and unique hand-ins under multiple sections.
- [ ] **F02-08 · P0 · VERIFY:** Cross-college task and link denial, not only hidden in UI.
- [ ] **F02-09 · P1 · VERIFY:** Undo Later and keyboard control order on desktop/mobile.
- [ ] **F02-10 · P2 · VISUAL:** Task card heights, pills, spacing, right rail, screenshot-to-render evidence.

## Mandatory acceptance gates (all unchecked)

- [ ] Compare rendered desktop 1440×1000 side-by-side with the **original uploaded** PNG (annotated differences).
- [ ] Compare responsive mobile 390×844, keyboard focus, controls, form labels and no document overflow.
- [ ] Verify direct-link, cross-delivery/cross-college authorization and no sensitive learner leaks.
- [ ] Verify success, failure, conflict, stale version, duplicate writes and unknown-outcome recovery.
- [ ] Exercise empty, loading, error, missing roster, no data and archived states with seeded scenarios.
- [ ] Attach post-change commit SHA and *passing* page-specific browser/TypeScript evidence, not older green runs.
- [ ] Receive separate image-level visual approval or record explicit, approved exceptions.

**Next action:** take the first remaining P0 OPEN / BLOCKED / VERIFY issue, run targeted tests, update this file and [the single ledger](00-closure-ledger.md) only with concrete evidence.
