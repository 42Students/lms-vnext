# Screen #05: Blueprint — actionable source-to-prototype audit

**Real uploaded reference:** `Course › Blueprint.png` inside `42LMS pages prototype-png-faculty.zip`. **Route:** `/teacher/courses/:deliveryId/blueprint`.
**Queue status:** ACTIVE. **Visual acceptance: NOT SIGNED OFF.**
**Run to examine:** https://github.com/42Students/lms-vnext/actions/runs/40298561321 (historical; compare run SHA to latest source commit).

## What we inspected

- [`src/components/courses/faculty-prototype-blueprint.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/components/courses/faculty-prototype-blueprint.tsx)
- [`src/components/courses/faculty-prototype-lesson-items.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/components/courses/faculty-prototype-lesson-items.tsx)
- [`src/components/courses/faculty-prototype-blueprint-row-actions.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/components/courses/faculty-prototype-blueprint-row-actions.tsx)
- [`src/modules/courses/faculty-blueprint-add-target.ts`](https://github.com/42Students/lms-vnext/blob/main/src/modules/courses/faculty-blueprint-add-target.ts)

## Brutal page-level checklist

Only close an item after current-code proof. CODE means source exists, **not** verified complete. All entries intentionally start unchecked.

- [ ] **F05-01 · P0 · CODE:** Lesson rail and six mixed-kind content rows preserve persisted sequence.
- [ ] **F05-02 · P0 · VERIFY:** All six + Add content links open correct preselected authoring type, not only URL.
- [ ] **F05-03 · P0 · OPEN:** Hash link into closed advanced <details> may not reveal authoring tool.
- [ ] **F05-04 · P0 · BLOCKED:** DB05_CONTENT_ORDER_READY gate: prove real reorder persistence, including quizzes.
- [ ] **F05-05 · P0 · CODE:** Edit, archive confirmation and exact response receipt, owned-scope protections.
- [ ] **F05-06 · P1 · OPEN:** Lesson engagement footer lacks opened/finished/average-time metrics from screenshot.
- [ ] **F05-07 · P1 · DECISION:** + Lesson and Rename currently disabled due College Admin syllabus ownership.
- [ ] **F05-08 · P1 · VERIFY:** Video/YouTube/PDF/Live/Assignment/Quiz exact item deep links.
- [ ] **F05-09 · P0 · VERIFY:** Dirty Reset, unknown-save outcome and stale optimistic version behavior.
- [ ] **F05-10 · P0 · INVESTIGATE:** Post-change Blueprint browser gate blocked by shared TPO typecheck failure.
- [ ] **F05-11 · P2 · VISUAL:** 310px rail, rows, tooltip badges, engagement footer and 390px overflow.

## Mandatory acceptance gates (all unchecked)

- [ ] Compare rendered desktop 1440×1000 side-by-side with the **original uploaded** PNG (annotated differences).
- [ ] Compare responsive mobile 390×844, keyboard focus, controls, form labels and no document overflow.
- [ ] Verify direct-link, cross-delivery/cross-college authorization and no sensitive learner leaks.
- [ ] Verify success, failure, conflict, stale version, duplicate writes and unknown-outcome recovery.
- [ ] Exercise empty, loading, error, missing roster, no data and archived states with seeded scenarios.
- [ ] Attach post-change commit SHA and *passing* page-specific browser/TypeScript evidence, not older green runs.
- [ ] Receive separate image-level visual approval or record explicit, approved exceptions.

**Next action:** take the first remaining P0 OPEN / BLOCKED / VERIFY issue, run targeted tests, update this file and [the single ledger](00-closure-ledger.md) only with concrete evidence.
