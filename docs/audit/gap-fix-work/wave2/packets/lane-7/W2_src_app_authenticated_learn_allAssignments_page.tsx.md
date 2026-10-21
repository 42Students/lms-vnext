# Work packet (wave 2): edit src/app/(authenticated)/learn/allAssignments/page.tsx

19 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/all-assignments.md, docs/audit/gap2/lane-3/l15-u031-learning-flow-cross-cutting.md

## G2-12-007-002  [P2] GAP  facet F01  effort S
- Legacy: Shared role-sensitive page displays teacher `My Assignments` and learner `All Assignments` `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:213-217`
- vNext now: Always `All Assignments`, learner-only read `src/app/(authenticated)/learn/allAssignments/page.tsx:64-75`
- Fix: Verify faculty reachability/redirect to teacher workspace

## G2-12-007-003  [P2] GAP  facet F01  effort S
- Legacy: ListingPageHeader combines metrics, course selector and teacher creation `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:597-610,651-691`
- vNext now: PageHeader only title, all controls in later component `src/app/(authenticated)/learn/allAssignments/page.tsx:64-75`
- Fix: Match action/metric placement in PageHeader

## G2-12-007-011  [P2] GAP  facet F04  effort S
- Legacy: Created date supports array [year,month0,day] and ISO with D MMM YYYY fallback em dash `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:25-42`
- vNext now: CreatedAt normalized ISO, formatDate handled component `src/app/(authenticated)/learn/allAssignments/page.tsx:39-40`
- Fix: Ensure month indices and fallback match legacy

## G2-12-007-033  [P2] GAP  facet F09  effort S
- Legacy: Faculty create/edit Drawer and submissions modal only when role FACULTY `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:627-649`
- vNext now: Learner-only overview, faculty controls not rendered `src/app/(authenticated)/learn/allAssignments/page.tsx:62-76`
- Fix: Ensure teacher route provides equivalent functionality

## G2-12-007-035  [P2] GAP  facet F10  effort S
- Legacy: GET submitted assignments independently, maps most recent by lessonContentId `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:330-356`
- vNext now: Assessment service combines submissionId, submittedAt, grade/feedback into row `src/app/(authenticated)/learn/allAssignments/page.tsx:17-60`
- Fix: Preserve latest submission and independent retry semantics

## G2-12-007-039  [P2] GAP  facet F11  effort S
- Legacy: Faculty view submissions/report/edit/create from authenticated teacher role `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:397-431`
- vNext now: No faculty actions in learner page `src/app/(authenticated)/learn/allAssignments/page.tsx:10-80`
- Fix: Route faculty actions to teacher workspace without exposing to learners

## G2-12-007-045  [P2] GAP  facet F13  effort S
- Legacy: Initial loading skeleton 5 assignment cards and metric placeholders `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:542-565`
- vNext now: No page-specific loading fallback in page; route may render server loading `src/app/(authenticated)/learn/allAssignments/page.tsx:62-80`
- Fix: Restore 5 skeleton rows and header pills

## G2-12-007-049  [P2] GAP  facet F13  effort S
- Legacy: Separate submission lookup error with Retry warning, no false Submit `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:720-728`
- vNext now: Submission fields fetched along with assignment rows `src/app/(authenticated)/learn/allAssignments/page.tsx:42-59`
- Fix: Add partial failure warning if separate source unavailable

## G2-12-007-055  [P2] GAP  facet F16  effort S
- Legacy: Card pageShell and horizontal layout inherited old LMS scroll container `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:538-565`
- vNext now: PageHeader and max-width div, newer responsive DataTable `src/app/(authenticated)/learn/allAssignments/page.tsx:63-77`
- Fix: Match old shell/panel widths

## G2-12-007-064  [P2] GAP  facet F18  effort S
- Legacy: Fatal load copy `This is a loading problem, not an empty list.` `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:575-580`
- vNext now: No equivalent specific message on page `src/app/(authenticated)/learn/allAssignments/page.tsx:10-80`
- Fix: Restore clear error message

## G2-12-007-072  [P2] GAP  facet F22  effort S
- Legacy: Legacy LessonContents has contentDataDTO and deadline, submission record separate `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:45-52,69-90`
- vNext now: VNext delivery/content IDs, dueAt, maxPoints, submissionId, gradePublished flattened view `src/app/(authenticated)/learn/allAssignments/page.tsx:17-59`
- Fix: Map all fields including allowed methods/resources

## G2-12-007-075  [P2] GAP  facet F23  effort S
- Legacy: Legacy one shared faculty/learner assignments workspace `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:213-217`
- vNext now: VNext separates faculty and learner pages `src/app/(authenticated)/learn/allAssignments/page.tsx:10-80`
- Fix: Document intentional role split

## G2-15-031-006  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:111-127`
- vNext now: `src/app/(authenticated)/learn/allAssignments/page.tsx:63-74`
- Fix: Legacy assignment cards+drawer vs new PageHeader and LearnerAssessmentOverview.

## G2-15-031-008  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:69-89`
- vNext now: `src/app/(authenticated)/learn/allAssignments/page.tsx:33-58`
- Fix: Compare legacy Due soon/Submitted late/Closed labels to new typed submission states.

## G2-15-031-012  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:45-56`
- vNext now: `src/app/(authenticated)/learn/allAssignments/page.tsx:33-58`
- Fix: Legacy deadline/due_date/dueDate and graded flags vs new dueAt and gradePublished.

## G2-15-031-014  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:111-127`
- vNext now: `src/app/(authenticated)/learn/allAssignments/page.tsx:64-74`
- Fix: Legacy assignment course filter, pagination, cards vs URL-scoped overview.

## G2-15-031-039  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:69-89`
- vNext now: `src/app/(authenticated)/learn/allAssignments/page.tsx:63-74`
- Fix: Old checking/error/overdue assignment row states vs generic overview.

## G2-15-031-053  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:13-19`
- vNext now: `src/app/(authenticated)/learn/allAssignments/page.tsx:10-74`
- Fix: Old paged getAllAssignments vs new joined assessment/submission RSC.

## G2-15-031-051  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:86-89`
- vNext now: `src/app/(authenticated)/learn/allAssignments/page.tsx:64-74`
- Fix: Exact Due soon / Closed · not submitted text needs parity check.
