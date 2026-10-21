# Work packet: edit src/components/courses/learner-assessment-overview.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/all-assignments.md, docs/audit/gap2/lane-8/learner-all-quizzes.md

## G2-12-007-004  [P1] GAP  facet F02  effort M
- Legacy: PageShell listing header plus vertically stacked 20 assignment cards `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:637-761`
- vNext now: Disclosure metrics, quick chips, search/course/state/sort then DataTable `src/components/courses/learner-assessment-overview.tsx:223-355`
- Fix: Restore legacy row-card hierarchy and dimensions

## G2-12-007-010  [P1] MISSING  facet F03  effort M
- Legacy: Assignment resource cards have icons Instructions/PDF/File/Link, action Open PDF/Open file/Download `docs/legacy-source/frontend/src/components/Assignments/ViewAssignmentModal.jsx:40-94`
- vNext now: Selected Drawer renders plain description under Instructions & resources `src/components/courses/learner-assessment-overview.tsx:579-588`
- Fix: Restore structured resource cards/open/download actions

## G2-12-007-021  [P1] GAP  facet F06  effort S
- Legacy: Open assignment drawer shows structured instructions/materials and own submission `docs/legacy-source/frontend/src/components/Assignments/ViewAssignmentModal.jsx:107-160`
- vNext now: Drawer shows description/submission, no structured PDF/link resource blocks `src/components/courses/learner-assessment-overview.tsx:545-669`
- Fix: Restore rich resource fields and download controls

## G2-12-007-030  [P1] GAP  facet F08  effort S
- Legacy: Refresh stale warning `Couldn't refresh assignments` and Retry `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:709-717`
- vNext now: No last-good stale snapshot banner, server read may fail route `src/components/courses/learner-assessment-overview.tsx:196-219`
- Fix: Preserve last fetched list during reload failure

## G2-12-007-050  [P1] MISSING  facet F14  effort S
- Legacy: Resources support PDF/open, file/download and external HTTPS links `docs/legacy-source/frontend/src/components/Assignments/ViewAssignmentModal.jsx:47-94`
- vNext now: Plain text instructions and submission open control only `src/components/courses/learner-assessment-overview.tsx:579-588`
- Fix: Expose assignment resource cards and downloads

## G2-12-007-077  [P1] MISSING  facet F23  effort S
- Legacy: Legacy rich materials/PDF/download card closure `docs/legacy-source/frontend/src/components/Assignments/ViewAssignmentModal.jsx:40-94`
- vNext now: VNext only plain description in overview `src/components/courses/learner-assessment-overview.tsx:579-588`
- Fix: Restore structured materials in drawer

## G2-8-007-008  [P1] GAP  facet F04  effort M
- Legacy: table fields Overview/Course/Lesson/Due Date/Status/Grade/Actions (`docs/legacy-source/frontend/src/components/Quiz/Table/table.js:57-67`)
- vNext now: same seven quiz columns, but Grade is result visibility label rather than numeric score (`src/components/courses/learner-assessment-overview.tsx:368-406`)
- Fix: Show released numeric score and denominator when authorized, keep unreleased privacy guard

## G2-8-007-009  [P1] GAP  facet F04  effort M
- Legacy: grade submitted with released results renders latestScore/latestMaxScore (`docs/legacy-source/frontend/src/components/Quiz/Table/table.js:281-293`)
- vNext now: grade cell currently renders View result or Not released (`src/components/courses/learner-assessment-overview.tsx:393-395`)
- Fix: Expose published numeric score from scoped grade projection where permitted; never leak answer key early

## G2-12-007-025  [P2] GAP  facet F07  effort S
- Legacy: Submission status read error never treated as Not submitted, disabled Submit `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:68-89`
- vNext now: SubmittedAt from unified DB; disabled when missing due/past deadline `src/components/courses/learner-assessment-overview.tsx:673-694`
- Fix: Show explicit unavailable status if submission rows fail
