# Work packet (wave 2): edit src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx

23 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/teacher-report-assignment-content-id.md

## G2-4-013-003  [P2] GAP  facet F01  effort M
- Legacy: Back button invokes router.back(), returns to caller. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:154-159`; `docs/legacy-source/frontend/src/components/Report/ReportSummaryHeader.jsx:10-21`)
- vNext now: New hard-coded link to /teacher/allAssignments, losing Blueprint origin. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:49-52`)
- Fix: Return to navigation origin via history with fallback, match Back icon and text.

## G2-4-013-004  [P2] GAP  facet F01  effort M
- Legacy: Invalid positive numeric contentId shows Report not found; valid error has Retry. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:45-52`; `docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:136-147`)
- vNext now: Invalid UUID or query goes to notFound() 404. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:28-37`; `src/modules/courses/faculty-assessment-route-boundary.ts:4-15`)
- Fix: Match recoverable invalid-route error presentation while keeping access secure.

## G2-4-013-005  [P2] GAP  facet F02  effort M
- Legacy: Screen root ln-report-page, summary header, partial warning, Score distribution, Submission timing, Student scores. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:152-208`)
- vNext now: PageHeader plus CSV/submissions links, PDF block, metric dl, Score distribution, timing, Student scores, separate Not submitted and View submissions. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:46-108`; `src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:147-221`)
- Fix: Match exact section order and merge missing list into legacy timing card; move extras to secondary area.

## G2-4-013-006  [P2] GAP  facet F02  effort M
- Legacy: Summary header contains Back and Download PDF above h1, subtitle and stat strip. (`docs/legacy-source/frontend/src/components/Report/ReportSummaryHeader.jsx:10-37`)
- vNext now: New PageHeader title/subtitle, inline toolbar links and separate Download PDF afterward. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:48-95`)
- Fix: Restore two-button nav row before title and tightly grouped stat strip.

## G2-4-013-007  [P2] GAP  facet F02  effort M
- Legacy: Legacy one shared chart section uses bar group, one timing bar, then student rows. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:178-207`)
- vNext now: New score distribution uses Disclosure+MetricBar, timing uses three count tiles and separate missing section. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:108-170`; `src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:187-209`)
- Fix: Restore contiguous bar/segmented timing panel and missing list under it.

## G2-4-013-009  [P2] GAP  facet F03  effort S
- Legacy: Back outlined icon ArrowLeftOutlined label Back. (`docs/legacy-source/frontend/src/components/Report/ReportSummaryHeader.jsx:10-14`)
- vNext now: New plain text link arrow plus My Assignments. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:49-52`)
- Fix: Use outlined Back button with left arrow.

## G2-4-013-010  [P2] GAP  facet F03  effort M
- Legacy: Download PDF primary has DownloadOutlined and loading spinner. (`docs/legacy-source/frontend/src/components/Report/ReportSummaryHeader.jsx:14-21`)
- vNext now: New Download PDF primary separated under heading, no icon and no pending indicator in button component. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:69-94`; `src/components/courses/faculty-report-download.tsx:48-57`)
- Fix: Restore download icon, button position and loading feedback.

## G2-4-013-011  [P2] GAP  facet F03  effort S
- Legacy: Four stat cells Submitted, Average score, Graded, Due date; low average less than 60 renders warning tone. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:160-165`; `docs/legacy-source/frontend/src/components/Report/ReportSummaryHeader.jsx:25-35`)
- vNext now: New four dl cells same labels but no warning color condition. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:95-107`)
- Fix: Apply low-score warning red/amber visual style.

## G2-4-013-013  [P2] GAP  facet F03  effort S
- Legacy: Legacy score distribution empty says No graded scores to chart yet. (`docs/legacy-source/frontend/src/components/Report/ScoreDistributionBars.jsx:25-33`)
- vNext now: New says No grades yet. Grade a submission to populate this score distribution. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:108-114`)
- Fix: Restore exact empty chart wording.

## G2-4-013-014  [P2] GAP  facet F03  effort S
- Legacy: Legacy timing empty says No submitted assignments to chart yet. (`docs/legacy-source/frontend/src/components/Report/SubmissionTimingCard.jsx:35-37`)
- vNext now: New timing displays 0/0/0 counters without that caption. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:147-170`)
- Fix: Add exact timing empty caption and bar placeholder.

## G2-4-013-017  [P2] GAP  facet F04  effort S
- Legacy: Legacy subtitle is courseName only. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:154-157`)
- vNext now: New subtitle course, section and lesson joined with dot. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:48-49`)
- Fix: Use course-only subtitle in header; put more context in detail if needed.

## G2-4-013-019  [P2] GAP  facet F04  effort S
- Legacy: Legacy Due date renders MMM D, YYYY or em dash. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:160-165`)
- vNext now: New en-IN medium-date format or em dash. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:95-104`)
- Fix: Use exact due date format.

## G2-4-013-020  [P2] GAP  facet F04  effort S
- Legacy: Legacy student Submitted cell formats MMM D, h:mm A plus Late pill, missing uses em dash. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:192-205`)
- vNext now: New table date uses IST timestamp plus separate Details text Late/On time and Published/Private. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:172-184`; `src/components/courses/faculty-report-student-table.tsx:69-73`)
- Fix: Render legacy date and Late pill within Submitted cell.

## G2-4-013-052  [P2] GAP  facet F12  effort S
- Legacy: Legacy bar uses minimum 6% width for nonzero count. (`docs/legacy-source/frontend/src/components/Report/ScoreDistributionBars.jsx:35-50`)
- vNext now: New bar width purely rounded bucket share, can be less than 6%. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:120-127`)
- Fix: Apply nonzero min 6% visual floor.

## G2-4-013-058  [P2] GAP  facet F13  effort M
- Legacy: Legacy zero graded distribution text No graded scores to chart yet. (`docs/legacy-source/frontend/src/components/Report/ScoreDistributionBars.jsx:25-33`)
- vNext now: New chart includes all bucket disclosures at zero plus alternate explanatory text. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:108-143`)
- Fix: Use old empty chart component/caption and omit empty bucket bars.

## G2-4-013-062  [P2] GAP  facet F14  effort M
- Legacy: Legacy PDF embeds Not submitted roster as second table and INCOMPLETE DATA banner when roster fails. (`docs/legacy-source/frontend/src/utils/downloadAssignmentReportPdf.js:38-48`; `docs/legacy-source/frontend/src/utils/downloadAssignmentReportPdf.js:100-116`)
- vNext now: New PDF contains plain Not submitted lines and summary text This report is incomplete. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:83-94`; `src/modules/courses/faculty-report-pdf.ts:60-75`)
- Fix: Match missing roster table and prominent incomplete stamp.

## G2-4-013-068  [P2] GAP  facet F16  effort M
- Legacy: Legacy desktop summary stats in one four-wide bar; sections stacked beneath. (`docs/legacy-source/frontend/src/components/Report/ReportSummaryHeader.jsx:25-35`; `docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:178-207`)
- vNext now: New summary uses CSS grid 2cols mobile, 4 sm and full-width bars. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:95-108`)
- Fix: Match breakpoints, spacing and stat card border styles.

## G2-4-013-069  [P2] GAP  facet F16  effort M
- Legacy: Legacy compact timing split bar and missing names list under split counts. (`docs/legacy-source/frontend/src/components/Report/SubmissionTimingCard.jsx:18-55`)
- vNext now: New three stat blocks and separate missing section. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:147-209`)
- Fix: Recreate split bar, pills and missing list in same card on all widths.

## G2-4-013-071  [P2] GAP  facet F17  effort S
- Legacy: Legacy distribution wrapper role=img announces count and bucket bars. (`docs/legacy-source/frontend/src/components/Report/ScoreDistributionBars.jsx:35-50`)
- vNext now: New MetricBar per bucket and Disclosure expandable list. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:115-143`)
- Fix: Preserve accessible chart summary and keyboard behavior.

## G2-4-013-072  [P2] GAP  facet F17  effort S
- Legacy: Legacy timed split bar role=img aria-label N on time, M late. (`docs/legacy-source/frontend/src/components/Report/SubmissionTimingCard.jsx:35-41`)
- vNext now: New dl counters with text labels, no proportional graphic/role img. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:147-169`)
- Fix: Provide comparable screen-reader timing summary and visual bar.

## G2-4-013-076  [P2] GAP  facet F18  effort S
- Legacy: Legacy header button labels Back and Download PDF. (`docs/legacy-source/frontend/src/components/Report/ReportSummaryHeader.jsx:10-21`)
- vNext now: New uses ← My Assignments and separate Download PDF. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:49-52`; `src/components/courses/faculty-report-download.tsx:49-52`)
- Fix: Restore Back text with icon and old placement.

## G2-4-013-008  [P3] GAP  facet F02  effort M
- Legacy: Legacy three report sections have ln-report-section wrapper. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:178-207`)
- vNext now: New sections separated by border-b and py-4 directly on canvas. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:108-170`)
- Fix: Match legacy card/section margins, borders and typography.

## G2-4-013-016  [P3] GAP  facet F04  effort S
- Legacy: Legacy report title contentTitle or content_title, fallback Untitled assignment. (`docs/legacy-source/frontend/src/utils/assignmentReport.js:100-105`)
- vNext now: New page title assignment.title directly from UUID row. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:48-49`)
- Fix: Apply Untitled assignment fallback to empty migrated title.
