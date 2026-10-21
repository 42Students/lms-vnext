# Work packet: NEW / MISSING items from docs/audit/gap2/lane-15/u008-syllabus-detail.md

15 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-15/u008-syllabus-detail.md

## G2-15-008-014  [P1] GAP  facet F04  effort L
- Legacy: Old types resource/video/assignment/youtube/live_class/quiz with synonyms assessment, quiz_v2 (syllabusDetail.js:44-76,517-561)
- vNext now: VNext enum RESOURCE/VIDEO/YOUTUBE/LIVE_CLASS plus separate assignments/quizzes (learner-course-workspace.tsx:121-132,134-344,344-600)
- Fix: Map all legacy type aliases and inline item order so assessment/quiz variants not silently lost

## G2-15-008-015  [P1] GAP  facet F04  effort M
- Legacy: Legacy progress from getLessonContentProgress and submitted assignment IDs, completion counts all displayed items (syllabusDetail.js:119-137,182-201,494-515)
- vNext now: VNext workspace typed progress per item with overall course aggregate, not same selected-lesson bar (learner-course-workspace.tsx:57-116,616-620,710-762)
- Fix: Compute selected-lesson completed/total and exact Continue next incomplete semantics

## G2-15-008-024  [P1] GAP  facet F06  effort M
- Legacy: Old class scope explicitly resolved from learner class, faculty assignment or selected admin class (syllabusDetail.js:143-149)
- vNext now: VNext delivery ID workspace scoped membership by request (courseTab/page.tsx:42-80)
- Fix: Map legacy selected-class context to correct course delivery, especially admin cross-section preview

## G2-15-008-025  [P1] GAP  facet F07  effort M
- Legacy: Legacy content fetch errors `Lesson content could not be loaded`, server detail, Retry (syllabusDetail.js:360-367,473-478)
- vNext now: VNext server getLearnerCourseWorkspace throws, no local selected-lesson Retry panel (courseTab/page.tsx:58-66,125-135)
- Fix: Add route-boundary per-lesson Retry with exact message and safe server error text

## G2-15-008-026  [P1] GAP  facet F07  effort M
- Legacy: Legacy incomplete completion state `Lesson completion state could not be fully verified` with Retry state (syllabusDetail.js:338-347)
- vNext now: VNext calculated progress shown; no same indeterminate completion banner (learner-course-workspace.tsx:710-762)
- Fix: Fail closed on unread progress/submissions and show explicit retry state before completion-dependent actions

## G2-15-008-028  [P1] GAP  facet F07  effort M
- Legacy: Legacy unknown type has `This content type isn't supported yet`, `Contact your instructor if this looks wrong.` (syllabusDetail.js:553-559)
- vNext now: VNext enum type may omit unrecognized rows entirely (learner-course-workspace.tsx:121-132,134-344)
- Fix: Render noninteractive unknown-type diagnostic rather than drop authored learning item

## G2-15-008-039  [P1] GAP  facet F11  effort M
- Legacy: Legacy canAccessCourse faculty, learner or isAdmin, class assignment derived from loginUser/selection (syllabusDetail.js:103-105,143-149)
- vNext now: VNext learner course route `getLearnerCourseWorkspace` checks scoped enrollment (courseTab/page.tsx:58-80)
- Fix: Map faculty/admin lesson preview to respective routes with explicit permissions

## G2-15-008-040  [P1] GAP  facet F11  effort L
- Legacy: Legacy item availability `learnerChildAvailability` hides non-visible and locks non-actionable (syllabusDetail.js:390-404,463-466)
- vNext now: VNext only published eligible items and scheduled embargo, plus past semester read-only (learner-course-workspace.tsx:157-160,226-252; courseTab/page.tsx:76-80)
- Fix: Compare active/enabled/locked/prerequisites and same hidden vs disabled semantics

## G2-15-008-041  [P1] GAP  facet F12  effort M
- Legacy: Legacy completion counts each visible item, isLearnerContentComplete aggregates resource/video/submission state (syllabusDetail.js:182-201)
- vNext now: VNext overall measuredProgress aggregate and per-item statuses (learner-course-workspace.tsx:616-620,691-762)
- Fix: Compute per-lesson denominator including quiz attempts and assignments exactly

## G2-15-008-046  [P1] GAP  facet F13  effort M
- Legacy: Legacy progress unknown warning holds completion badges/actions but leaves content accessible (syllabusDetail.js:338-347)
- vNext now: VNext progress badge may display from response without separate unknown marker (learner-course-workspace.tsx:168-194,710-762)
- Fix: Add independent progressStateUnknown and hold only completion-dependent controls

## G2-15-008-054  [P1] GAP  facet F17  effort M
- Legacy: Legacy progress unknown Alert role with Retry state, locked row role=status (syllabusDetail.js:338-347,399-404)
- vNext now: VNext badges announce statuses but no explicit unknown-progress Alert (learner-course-workspace.tsx:168-194,710-762)
- Fix: Preserve live regions on error and action disabled rule

## G2-15-008-065  [P1] GAP  facet F22  effort L
- Legacy: Legacy lesson content table has active/enabled, quiz V2 separate, class-specific sorted content (syllabusDetail.js:451-466)
- vNext now: VNext relational lesson_contents/assignments/quizzes, path publishing and scope rules (learner-course-workspace.tsx:134-600,616-669)
- Fix: Prove no hidden/inactive or orphan content leaks and all valid quiz rows appear once

## G2-15-008-066  [P1] GAP  facet F22  effort M
- Legacy: Legacy completion progress authority getLessonContentProgress and learner submitted assignment list (syllabusDetail.js:119-137,494-515)
- vNext now: VNext direct workspace progress+submission status per item (learner-course-workspace.tsx:134-600)
- Fix: Compare cutoff/rounding and authoritative read flags; avoid marking missing API data complete

## G2-15-008-027  [P2] GAP  facet F07  effort M
- Legacy: Legacy if data stale: `Lesson content may be out of date`, error text and Retry (syllabusDetail.js:348-357)
- vNext now: VNext page awaits all data and shows either fresh render or error boundary (courseTab/page.tsx:58-66,125-135)
- Fix: Preserve previously loaded same-scope lesson with amber stale warning

## G2-15-008-029  [P2] GAP  facet F08  effort S
- Legacy: Legacy failed content fetch info toast bottomRight, duration3, `Could not load lesson content` (syllabusDetail.js:473-478)
- vNext now: VNext route no toast for server fetch error (courseTab/page.tsx:58-66)
- Fix: Add exact recovery toast/boundary on transient fetch error, no repeated alerts
