# Work packet (wave 2): edit src/components/courses/learner-assessment-overview.tsx

36 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/all-assignments.md, docs/audit/gap2/lane-8/learner-all-quizzes.md

## G2-12-007-005  [P2] GAP  facet F02  effort S
- Legacy: Metrics remain visible at page head, with amber this-month pill `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:651-690`
- vNext now: Collapsed Assessment totals with five tiles `src/components/courses/learner-assessment-overview.tsx:242-269`
- Fix: Restore visible summary pills including this-month count

## G2-12-007-006  [P2] GAP  facet F02  effort S
- Legacy: Semantic ul/list of assignment article row cards `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:730-748`
- vNext now: DataTable listing with columns/status/actions `src/components/courses/learner-assessment-overview.tsx:361-520`
- Fix: Use row-card layout rather than table for pixel-level clone

## G2-12-007-007  [P2] GAP  facet F03  effort S
- Legacy: Row card has 40px assignment icon, title, course, due/created, colored state and Submit/View CTA `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:126-193`
- vNext now: DataTable cells and action row; missing exact icon layout `src/components/courses/learner-assessment-overview.tsx:360-520`
- Fix: Restore row icon/meta/CTA arrangement

## G2-12-007-008  [P2] GAP  facet F03  effort S
- Legacy: MetricPill teal assignment count, amber `N this month` with popover titles `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:656-678`
- vNext now: 5 StatTiles in Disclosure, lacks this-month popover `src/components/courses/learner-assessment-overview.tsx:242-269`
- Fix: Restore metric colors, labels and item popover

## G2-12-007-009  [P2] GAP  facet F03  effort S
- Legacy: Custom illustrated SVG empty state with FileTextOutlined and title `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:92-108,612-618`
- vNext now: Generic EmptyState without identical illustration `src/components/courses/learner-assessment-overview.tsx:206-219`
- Fix: Render source-compatible illustration

## G2-12-007-012  [P2] GAP  facet F04  effort S
- Legacy: Due date formatted `DD MMM YYYY, h:mm A`, created if missing `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:45-52,141-150`
- vNext now: New common formatter and separate detail labels `src/components/courses/learner-assessment-overview.tsx:103-105,545-578`
- Fix: Match date format and due/created fallback

## G2-12-007-013  [P2] GAP  facet F04  effort S
- Legacy: State tone `graded`, `late`, `submitted`, `overdue`, `soon`, `open`, `unknown` with exact messages `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:68-90`
- vNext now: Uses assignmentOverviewState mapping and StatusBadge `src/components/courses/learner-assessment-overview.tsx:36-38,360-520`
- Fix: Map all seven source states, labels and tones in cards

## G2-12-007-014  [P2] GAP  facet F04  effort S
- Legacy: Grade published shows `Graded · <pointsObtained>/<points>` `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:79-83`
- vNext now: Published grade label via dedicated model, score from pointsAwarded/maxPoints `src/components/courses/learner-assessment-overview.tsx:611-614`
- Fix: Verify score text and zero/max guards

## G2-12-007-015  [P2] GAP  facet F04  effort S
- Legacy: This-month assignment count from creation dates, sometimes server aggregate `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:360-375`
- vNext now: No this-month metric; added needs action, overdue, submitted `src/components/courses/learner-assessment-overview.tsx:242-269`
- Fix: Restore monthly assignment metric

## G2-12-007-016  [P2] GAP  facet F05  effort S
- Legacy: AntD searchable course selector All courses, allows clear, displays course name only `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:517-536`
- vNext now: Native Select course name+code+count, URL navigation `src/components/courses/learner-assessment-overview.tsx:294-319`
- Fix: Use legacy searchable selector/option labels

## G2-12-007-018  [P2] GAP  facet F05  effort S
- Legacy: Pagination AntD page20 without size changer `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:749-759`
- vNext now: Custom Previous/Page n/Next buttons `src/components/courses/learner-assessment-overview.tsx:701-725`
- Fix: Match legacy pagination component and button sizing

## G2-12-007-020  [P2] GAP  facet F06  effort S
- Legacy: Course Select searchable/clear, min width200, slug value `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:519-531`
- vNext now: Native select by UUID, no search keyboard filtering `src/components/courses/learner-assessment-overview.tsx:298-318`
- Fix: Recreate legacy search-by-course behavior

## G2-12-007-031  [P2] GAP  facet F09  effort S
- Legacy: Assignment details opens dynamic RightDrawer, then SubmitAssignmentModal `docs/legacy-source/frontend/src/components/Assignments/ViewAssignmentModal.jsx:107-160`
- vNext now: Selected assignment Drawer with inline AssignmentSubmissionControl `src/components/courses/learner-assessment-overview.tsx:520-699`
- Fix: Match nested modal/drawer hierarchy and action placements

## G2-12-007-042  [P2] GAP  facet F12  effort S
- Legacy: Late submissions show Submitted late awaiting grade, grades only when published `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:76-84`
- vNext now: Shows Published grade or submitted waiting; late label not shown in detail `src/components/courses/learner-assessment-overview.tsx:605-615`
- Fix: Preserve late-status flag

## G2-12-007-046  [P2] GAP  facet F13  effort S
- Legacy: Fatal load message `Assignments could not be loaded` with Retry `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:569-585`
- vNext now: Only list empty fallback; route-level error handles fetch `src/components/courses/learner-assessment-overview.tsx:196-219`
- Fix: Restore explicit list load fail recovery

## G2-12-007-056  [P2] GAP  facet F16  effort S
- Legacy: Course selector min200px next to metrics/create at desktop `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:517-536`
- vNext now: Course selector 1-column phone/2-column desktop with search `src/components/courses/learner-assessment-overview.tsx:286-319`
- Fix: Match desktop selector placement

## G2-12-007-058  [P2] GAP  facet F17  effort S
- Legacy: Whole card click proxy aria label `View assignment: <title>` `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:128-135`
- vNext now: DataTable row action opens Drawer with button labels `src/components/courses/learner-assessment-overview.tsx:360-520`
- Fix: Restore card click accessible label

## G2-12-007-060  [P2] GAP  facet F17  effort S
- Legacy: PDF Open new tab rel noopener noreferrer; Download has file-specific aria-label `docs/legacy-source/frontend/src/components/Assignments/ViewAssignmentModal.jsx:47-75`
- vNext now: Submission file open control; no material resource action `src/components/courses/learner-assessment-overview.tsx:590-596`
- Fix: Use descriptive link targets and safe external rel

## G2-12-007-061  [P2] GAP  facet F18  effort S
- Legacy: List shows course title and `Due DD MMM YYYY, h:mm A` `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:140-150`
- vNext now: Table due date label via learnerAssessmentDateLabel `src/components/courses/learner-assessment-overview.tsx:360-520`
- Fix: Restore same exact due prefix/date format

## G2-12-007-062  [P2] GAP  facet F18  effort S
- Legacy: `Graded`, `Submitted late · awaiting grade`, `Due soon`, `Closed · not submitted` `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:69-90`
- vNext now: StatusBadge via assignmentOverviewState; may differ `src/components/courses/learner-assessment-overview.tsx:36-38,605-614`
- Fix: Match text/tones one-by-one

## G2-12-007-067  [P2] GAP  facet F20  effort S
- Legacy: Legacy date parser tolerates month-zero arrays/ISO, invalid em dash `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:25-42,45-52`
- vNext now: Single date display model from ISO `src/components/courses/learner-assessment-overview.tsx:103-105`
- Fix: Define parse fallback and time zone consistently

## G2-8-007-005  [P2] GAP  facet F03  effort S
- Legacy: metric pill total quizzes with teal form icon if total>0 (`docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:269-280`)
- vNext now: neutral Badge N Quiz/Quizzes, no teal metric pill (`src/components/courses/learner-assessment-overview.tsx:223-241`)
- Fix: Recreate legacy metric pill icon/color/spacing without changing number source

## G2-8-007-006  [P2] GAP  facet F03  effort S
- Legacy: Submitted count shown as emerald pill with CheckCircleOutlined and popover (`docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:289-296`)
- vNext now: Submitted is a disclosure next to neutral count badge (`src/components/courses/learner-assessment-overview.tsx:225-241`)
- Fix: Match pill presentation and list popover affordance

## G2-8-007-011  [P2] GAP  facet F04  effort S
- Legacy: null due date column '-' and status Unavailable (`docs/legacy-source/frontend/src/components/Quiz/Table/table.js:273-279,349-370`)
- vNext now: null due date displays No deadline (`src/components/courses/learner-assessment-overview.tsx:392-395`)
- Fix: Decide exact no-date fallback, preserve disabled Start if deadline is missing

## G2-8-007-013  [P2] GAP  facet F05  effort M
- Legacy: legacy course select value courseSlug, deduped by slug (`docs/legacy-source/frontend/src/components/Quiz/Table/table.js:90-96,123-140`)
- vNext now: new select value courseId and URL ?course UUID (`src/components/courses/learner-assessment-overview.tsx:298-318`)
- Fix: Support old course slug bookmarks or provide explicit scope mapping

## G2-8-007-014  [P2] GAP  facet F05  effort M
- Legacy: page size 20, 1-based UI/0-based API, server page on demand (`docs/legacy-source/frontend/src/components/Quiz/Table/table.js:40,459-474,727-734`)
- vNext now: page size 20, all scoped quiz items fetched then filtered/sliced in client (`src/components/courses/learner-assessment-overview.tsx:107,153-171`)
- Fix: Retain stable 20 paging and compare count freshness/performance on large rosters

## G2-8-007-016  [P2] GAP  facet F05  effort M
- Legacy: legacy mobile cards include one row Submission in addition to Status (`docs/legacy-source/frontend/src/components/Quiz/Table/table.js:781-800`)
- vNext now: new DataTable mobile uses status detail but no separate Submission label (`src/components/courses/learner-assessment-overview.tsx:383-391`)
- Fix: Compare mobile card label/value order and add legacy submission row if meaningful

## G2-8-007-025  [P2] GAP  facet F09  effort M
- Legacy: legacy learner ViewSubmissions opens 720px centered Modal (`docs/legacy-source/frontend/src/components/Quiz/Table/table.js:615-673`)
- vNext now: new learner list shows Attempt history route action, not modal (`src/components/courses/learner-assessment-overview.tsx:399-404`)
- Fix: Preserve legacy immediate submissions visibility or document route transition with accessible back link

## G2-8-007-026  [P2] GAP  facet F09  effort S
- Legacy: legacy Submitted Quizzes metric pill opens popover of names (`docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:183-195,289-297`)
- vNext now: new Submitted disclosure with scrollable list (`src/components/courses/learner-assessment-overview.tsx:226-240`)
- Fix: Match popover max height/position/accessibility or approve disclosure visual change

## G2-8-007-028  [P2] GAP  facet F10  effort M
- Legacy: learner submissions fetched separately on click (`docs/legacy-source/frontend/src/components/Quiz/Table/table.js:516-529`)
- vNext now: new route link to per-quiz attempt history; list service includes attempts counts (`src/components/courses/learner-assessment-overview.tsx:402-404`)
- Fix: Verify attempt history contents and permission gating versus old modal output

## G2-8-007-039  [P2] GAP  facet F16  effort M
- Legacy: purpose-built learn-quizzes-mobile cards and desktop AntD table (`docs/legacy-source/frontend/src/components/Quiz/Table/table.js:720-818`)
- vNext now: responsive DataTable with mobilePriority (`src/components/courses/learner-assessment-overview.tsx:367-407`)
- Fix: Pixel-compare 375/768 widths, card dividers, labels and action order

## G2-8-007-045  [P2] GAP  facet F18  effort S
- Legacy: legacy grade has Not released/Not graded yet and numeric X/Y (`docs/legacy-source/frontend/src/components/Quiz/Table/table.js:281-293`)
- vNext now: new Grade cell Not released/View result without score (`src/components/courses/learner-assessment-overview.tsx:393-395`)
- Fix: Restore exact released/not graded label and visible numeric score only after authorization

## G2-8-007-046  [P2] GAP  facet F19  effort M
- Legacy: legacy list pagination occurs server with 20 rows each, page-local stats fallback (`docs/legacy-source/frontend/src/components/Quiz/Table/table.js:40,459-504`)
- vNext now: new service assembles all own quiz rows then client pages by 20 (`src/modules/courses/learner-assessment-service.ts:63-72; src/components/courses/learner-assessment-overview.tsx:163-171`)
- Fix: Assess course size, DB query cap and scalable server pagination

## G2-12-007-048  [P3] GAP  facet F13  effort S
- Legacy: No assignments yet illustrated and description from teacher/learner `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:611-625`
- vNext now: Same learner title and description, different illustration `src/components/courses/learner-assessment-overview.tsx:206-219`
- Fix: Restore custom SVG

## G2-12-007-057  [P3] GAP  facet F16  effort S
- Legacy: AntD numbered pagination pages, aligned center `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:749-759`
- vNext now: Prev/page/next large touch buttons `src/components/courses/learner-assessment-overview.tsx:701-725`
- Fix: Match spacing/number controls

## G2-12-007-059  [P3] GAP  facet F17  effort S
- Legacy: Empty SVG aria-hidden `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:92-108`
- vNext now: Generic EmptyState, no custom SVG `src/components/courses/learner-assessment-overview.tsx:206-219`
- Fix: Maintain decorative icon semantics
