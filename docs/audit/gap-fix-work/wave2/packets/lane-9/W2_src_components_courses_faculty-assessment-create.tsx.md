# Work packet (wave 2): edit src/components/courses/faculty-assessment-create.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/faculty-all-quizzes.md, docs/audit/gap2/lane-4/teacher-all-assignments.md

## G2-3-006-007  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:300-305`
- vNext now: `src/components/courses/faculty-assessment-create.tsx:39-50`
- Fix: Legacy PlusOutlined Create Quiz within PageHeader; new Create Quiz button in its own bordered section and linked results top action.

## G2-3-006-019  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:201-266`
- vNext now: `src/components/courses/faculty-assessment-create.tsx:39-85`
- Fix: Legacy course+lesson selection first in Ant Modal, then separate QuizBuilderModal; vNext one Drawer with inline lesson authoring after Continue.

## G2-3-006-021  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:213-255`
- vNext now: `src/components/courses/faculty-assessment-create.tsx:46-70`
- Fix: Legacy course lookup/error and lessons lookup/error distinct skeletons and Retry buttons; vNext preloads lesson choices and gives no retry inside Drawer.

## G2-3-006-029  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:201-266`
- vNext now: `src/components/courses/faculty-assessment-create.tsx:47-85`
- Fix: Legacy two Modal overlays (course context then builder) with escape/close semantics; vNext Drawer + inline form changes focus trap, backdrop and scroll.

## G2-3-006-047  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:201-266`
- vNext now: `src/components/courses/faculty-assessment-create.tsx:47-85`
- Fix: Legacy mobile-safe centered context and builder modals, vNext drawer fills side; screenshot at 375/768/1280.

## G2-3-006-056  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:33-39`
- vNext now: `src/components/courses/faculty-assessment-create.tsx:16-37`
- Fix: Legacy snapshots selected lesson before closing picker; vNext uses mutable selected course/lesson keys in Drawer. Verify no invalidation during async save.

## G2-4-012-002  [P2] GAP  facet F01  effort M
- Legacy: Header right holds All courses picker and plus-icon Create Assignment. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:650-691`)
- vNext now: New header shows Assessment results overview; create trigger and course filter below. (`src/app/(authenticated)/teacher/allAssignments/page.tsx:13-17`; `src/components/courses/faculty-assessment-create.tsx:39-45`)
- Fix: Place picker and plus Create button in page-head toolbar.

## G2-4-012-024  [P2] GAP  facet F06  effort M
- Legacy: One 640px Create New Assignment DrawerWidget, Cancel/Create footer. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:525-548`)
- vNext now: New first stage selects course/lesson and Continue opens nested builder. (`src/components/courses/faculty-assessment-create.tsx:47-81`)
- Fix: Restore one-step 640px drawer with same footer and sequence.

## G2-4-012-027  [P2] GAP  facet F06  effort M
- Legacy: Legacy Course and Lesson searchable Select and field-level Retry after lookup failure. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:598-668`)
- vNext now: Native course/class and lesson controls in first-stage drawer. (`src/components/courses/faculty-assessment-create.tsx:52-70`)
- Fix: Restore searchable fields, loading placeholders and lookup Retry.

## G2-4-012-032  [P2] GAP  facet F06  effort M
- Legacy: Close/save disabled during upload, dirty close requires discard confirmation. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:380-401`; `docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:538-546`)
- vNext now: New create tracks dirty changes but has no upload-related close guard. (`src/components/courses/faculty-assessment-create.tsx:30-37`; `src/components/courses/faculty-assessment-create.tsx:82-84`)
- Fix: Implement pending upload lock and exact discard copy.

## G2-4-012-070  [P2] GAP  facet F16  effort M
- Legacy: Legacy horizontal action rail and 640px drawer. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:126-193`; `docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:527-548`)
- vNext now: New disclosure actions grid, nested drawers without stated width. (`src/components/courses/faculty-assessment-overview.tsx:193-253`; `src/components/courses/faculty-assessment-create.tsx:47-81`)
- Fix: Match desktop card action row and mobile stacking, drawer width.

## G2-4-012-074  [P2] GAP  facet F17  effort M
- Legacy: Dirty drawer closing asks Discard this assignment draft? with Keep editing and blocks uploads. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:380-401`)
- vNext now: New draft confirmation labels Discard draft; no upload guard. (`src/components/courses/faculty-assessment-create.tsx:30-37`; `src/components/courses/faculty-assessment-create.tsx:82-84`)
- Fix: Match exact confirmation and close guards.

## G2-4-012-075  [P2] GAP  facet F18  effort S
- Legacy: Header title My Assignments, action Create Assignment. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:650-691`)
- vNext now: Title matches, create isolated in separate section. (`src/app/(authenticated)/teacher/allAssignments/page.tsx:13-17`; `src/components/courses/faculty-assessment-create.tsx:39-45`)
- Fix: Match label location and Plus icon.
