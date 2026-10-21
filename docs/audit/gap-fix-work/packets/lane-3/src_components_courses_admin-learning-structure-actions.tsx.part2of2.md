# Work packet: edit src/components/courses/admin-learning-structure-actions.tsx (part 2 of 2)

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u002-superadmin-lessons.md, docs/audit/gap2/lane-3/college-admin-quizzes.md, docs/audit/gap2/lane-3/superadmin-quizzes-section.md, docs/audit/gap2/lane-15/u003-superadmin-lessons.md

## G2-18-002-049  [P2] GAP  facet F07  effort S
- Legacy: Legacy edit failure Alert `Lesson changes were not saved`, can be closed. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:531-540`
- vNext now: vNext action hook emits toast `Learning structure update failed`. `src/components/courses/admin-learning-structure-actions.tsx:48-70`, `src/components/courses/admin-learning-structure-actions.tsx:516-560`
- Fix: Show field errors in edit Dialog with matching heading while preserving toast only if helpful.

## G2-18-002-052  [P2] GAP  facet F08  effort S
- Legacy: Legacy delete success `Deleted “NAME”. Its uploaded files are kept, so it can be restored if needed.` `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:334-344`
- vNext now: vNext action archives with generic toast and archives rather than soft-deletes, without this copy. `src/components/courses/admin-learning-structure-actions.tsx:615-629`, `src/modules/courses/lesson-service.ts:238-299`
- Fix: Use accurate `Archived` wording and preservation info; never claim files were deleted.

## G2-3-001-039  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:321-347`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:294-299`
- vNext now: `src/components/courses/college-quiz-actions.tsx:74-79`; `src/components/courses/admin-learning-structure-actions.tsx:659-685`
- Fix: Reconcile exact success texts: `Quiz published`, `Quiz deleted`, `Results released to learners` or `Results withheld from learners`.

## G2-3-005-030  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:332-338`
- vNext now: `src/components/courses/admin-learning-structure-actions.tsx:659-694`
- Fix: Restore Results released to learners / Results withheld from learners toast and Release/Withhold label.

## G2-15-003-040  [P3] GAP  facet F08  effort S
- Legacy: Edit success `Updated lesson “{name}”.` (`sections/Lessons.js:303-320`).
- vNext now: Generic `Lesson updated` via mutation callback (`admin-learning-structure-actions.tsx:539-555`).
- Fix: Use exact lesson-name toast and refresh current course.

## G2-18-002-051  [P3] GAP  facet F08  effort S
- Legacy: Legacy edited success `Updated lesson “NAME”.` `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:311-320`
- vNext now: vNext toast title `Lesson updated`. `src/components/courses/admin-learning-structure-actions.tsx:538-556`
- Fix: Include edited lesson name in success toast.
