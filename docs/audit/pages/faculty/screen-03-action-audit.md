# Screen #03: Courses — actionable source-to-prototype audit

**Real uploaded reference:** `Faculty › Courses.png` inside `42LMS pages prototype-png-faculty.zip`. **Route:** `/teacher/courses`.
**Queue status:** RECHECK. **Visual acceptance: NOT SIGNED OFF.**
**Run to examine:** https://github.com/42Students/lms-vnext/actions/runs/40283586626 (historical; compare run SHA to latest source commit).

## What we inspected

- [`src/components/courses/faculty-prototype-course-directory.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/components/courses/faculty-prototype-course-directory.tsx)
- [`src/app/(authenticated)/teacher/courses/page.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/app/(authenticated)/teacher/courses/page.tsx)
- [`src/modules/courses/faculty-course-month-attendance-model.ts`](https://github.com/42Students/lms-vnext/blob/main/src/modules/courses/faculty-course-month-attendance-model.ts)

## Brutal page-level checklist

Only close an item after current-code proof. CODE means source exists, **not** verified complete. All entries intentionally start unchecked.

- [ ] **F03-01 · P0 · CODE:** Course rows grouped from assigned teaching deliveries, correct class links.
- [ ] **F03-02 · P1 · CODE:** Academic period, Regular / Electives and All filters + scoped counts.
- [ ] **F03-03 · P0 · CODE:** Marked-only monthly attendance percentage from authorized roster.
- [ ] **F03-04 · P0 · INVESTIGATE:** Expanded Courses legacy regression failed in workflow 40284030101; isolate cause.
- [ ] **F03-05 · P0 · VERIFY:** Another Faculty / college cannot access direct course or class IDs.
- [ ] **F03-06 · P1 · VERIFY:** To grade, To publish and Nothing waiting from true content states.
- [ ] **F03-07 · P1 · VERIFY:** Course/title/code search, zero results, combination of filter states.
- [ ] **F03-08 · P1 · VERIFY:** Missing roster, unmarked session: Not recorded rather than 0%.
- [ ] **F03-09 · P1 · DECISION:** How to show Not assigned to a class without granting extra access.
- [ ] **F03-10 · P2 · VISUAL:** Prototype table density, course metadata, attendance and outlined Open.

## Mandatory acceptance gates (all unchecked)

- [ ] Compare rendered desktop 1440×1000 side-by-side with the **original uploaded** PNG (annotated differences).
- [ ] Compare responsive mobile 390×844, keyboard focus, controls, form labels and no document overflow.
- [ ] Verify direct-link, cross-delivery/cross-college authorization and no sensitive learner leaks.
- [ ] Verify success, failure, conflict, stale version, duplicate writes and unknown-outcome recovery.
- [ ] Exercise empty, loading, error, missing roster, no data and archived states with seeded scenarios.
- [ ] Attach post-change commit SHA and *passing* page-specific browser/TypeScript evidence, not older green runs.
- [ ] Receive separate image-level visual approval or record explicit, approved exceptions.

**Next action:** take the first remaining P0 OPEN / BLOCKED / VERIFY issue, run targeted tests, update this file and [the single ledger](00-closure-ledger.md) only with concrete evidence.
