# Work packet (wave 2): edit src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx

32 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-interviews.md

## G2-10-013-001  [P2] MISSING  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/interviews.js:32-45; docs/legacy-source/frontend/src/components/admin/placements/DriveSubNav.jsx:6-11,45-60 — Legacy has Drives breadcrumb and Overview / Applications / Schedule / Settings tabs; Schedule active.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:55-60 — PageHeader 'Interviews · drive' and Drive overview back only; no workspace tab row.
- Fix: Restore breadcrumb/tab strip, active label Schedule.

## G2-10-013-002  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/interviews.js:24-30 — No selected college: 'Select a college to continue' warning Alert with icon.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:26-30 — PageHeader Drives plus EmptyState 'Choose a college'.
- Fix: Preserve warning copy and visual context.

## G2-10-013-003  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/interviews.js:33-45 — JobsErrorBoundary back to /superadmin/jobs, shared SuperAdminLayout shell.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:22-42 — App Router error handling; no matching JobsErrorBoundary back.
- Fix: Add scoped back/retry in failure state.

## G2-10-013-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:748-780 — Heading Calendar + refresh button, summary of interviews in time/status categories.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:55-60,75-93 — PageHeader with filters then appointments and rounds table; no legacy summary band.
- Fix: Match title/metrics/refresh hierarchy and 6-tab workspace.

## G2-10-013-007  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:1020-1056 — Desktop Ant Table with interview rows; mobile cards from renderMobileCard.
- vNext now: src/components/placements/college-interview-appointments.tsx:92-140; src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:78-84 — Candidate appointments DataTable plus separate rounds DataTable; substantially different information architecture.
- Fix: Restore single candidate-interview list before optional round summary.

## G2-10-013-009  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:51-103 — Color-coded interview type (HR, technical, group discussion, default) and status configured as Ant Tag.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:47-54; src/components/placements/college-interview-appointments.tsx:105-117 — Round kind raw text, appointment status badge; original type color mapping absent.
- Fix: Map old interview type labels/colors to new semantic status badges.

## G2-10-013-011  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:771-780 — Top summary metrics show counts and separate labels (see source).
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:78-93 — Shows one 'N matching interview/GD rounds' count and page index.
- Fix: Restore summary counters from actual candidate interviews.

## G2-10-013-012  [P2] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:830-918 — Filters/actions include icons for CSV export, conflicts-only, sorting and Clear filters.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:60-74 — No icons/export/conflicts/sort/clear filters except on invalid query.
- Fix: Add legacy command toolbar with matching outlines/icons.

## G2-10-013-019  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:71-94 — Filter options status: all/upcoming/completed/cancelled; type/mode and sort date asc/desc.
- vNext now: src/modules/placements/college-drive-interviews-model.ts:3-10; src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:62-72 — Status ALL/PENDING/SCHEDULED/COMPLETED/CANCELLED, kind ALL/INTERVIEW/GD; no mode or sort.
- Fix: Translate candidate status semantics and restore mode/date order options.

## G2-10-013-021  [P2] MISSING  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:275-287 — Search matches jobTitle/company/learner text (case-insensitive).
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:60-74 — No text search in schedule route.
- Fix: Add name/company/job search with max length and clear state.

## G2-10-013-022  [P2] MISSING  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:314-340 — Company and department selects are populated from observed interviews and alphabetically sorted.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:60-74 — No company or department filter.
- Fix: Fetch and sort scoped filter options deterministically.

## G2-10-013-023  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:1024-1036 — Table local page and size with per-page count and controls.
- vNext now: src/modules/placements/college-drive-interviews-model.ts:3-10; src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:85-89 — Server page 25 rounds, fixed size; not candidate-interview pagination.
- Fix: Align 10/25/50/100 page choices and record counts where required.

## G2-10-013-027  [P2] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:873-896 — Export interviews.csv from filteredAndSorted candidate rows.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:60-93 — No CSV command on schedule route.
- Fix: Export filtered candidate interviews with same source columns; safe CSV.

## G2-10-013-028  [P2] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:901-918 — Conflicts only toggles a candidate time-clash filter and Clear filters resets all.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:60-74 — No conflict toggle or Clear filters for valid query.
- Fix: Add two toolbar actions and URL serialization.

## G2-10-013-038  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:781-794 — Fetch error Alert inline instead of blocking modal.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:42-45 — Data load may replace page via error boundary.
- Fix: Keep inline error and recover without losing filters.

## G2-10-013-046  [P2] GAP  facet F11  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/interviews.js:33-45 — JobsErrorBoundary gives Go Back to /superadmin/jobs.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:22-41 — Empty college and filter-error states present but no equivalent back from runtime error.
- Fix: Restore Go Back on errors without weakening access.

## G2-10-013-048  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:225-231,536-567 — Conflict detection computes overlap among scheduled interviews, color/tag surfaces collisions.
- vNext now: src/modules/placements/college-round-slot-action-service.ts:103-110; src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:46-54 — Write path guards overlapping slots but listing omits conflict badges for existing records.
- Fix: Project historical collision flags and warn; keep strong booking validation.

## G2-10-013-049  [P2] MISSING  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:341-360 — Today/upcoming/scheduled summary derived from interview scheduledDate.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:78-93 — No candidate schedule summary; rounds count only.
- Fix: Recompute summary from appointment records and correct timezone.

## G2-10-013-050  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:200-220 — Calendar deep-linked candidate job scope and refreshes on focus after idle.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:33-45 — Request-based static server render; no explicit focus refresh.
- Fix: Use revalidation on focus/return from booking to show updated statuses.

## G2-10-013-051  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:148-184,748-780 — Interview loader Spin and Alert error; Refresh control inside header.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/loading.tsx:1-3; src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:55-93 — Generic directory loader; schedule route lacks same list loading state.
- Fix: Clone spinner/text and skeleton shape for calendar.

## G2-10-013-052  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/interviews.js:40-43; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:1018-1045 — No results exact 'No interviews scheduled for this drive yet.' when genuinely empty.
- vNext now: src/components/placements/college-interview-appointments.tsx:138-139; src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:82-83 — 'No candidate interviews have been scheduled for this drive.' and 'No matching interview rounds'.
- Fix: Match exact empty message, distinguish no matching filters.

## G2-10-013-054  [P2] MISSING  facet F14  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:873-896 — Export interviews.csv from visible filter subset via csvExport.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:55-93 — No export button.
- Fix: Export scoped filtered candidate rows, safe formula escaping.

## G2-10-013-061  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:781-1010 — Toolbar responsive wrap, selects and search into visible controls.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:60-74 — Only 2 selects + button in 1/2/3-column responsive grid.
- Fix: Match filter row spacing/breakpoints, overflow and widths.

## G2-10-013-062  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:412-450,488-520 — Column header filters have explicit aria-label per field, editable without mouse.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:62-74 — Selects grouped in labelled GET form; no per-column header controls.
- Fix: Restore keyboard-accessible header/filter controls or parity-equivalent toolbar.

## G2-10-013-067  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:927-1011 — Search placeholder 'Search...', filter labels Type, Status, Mode, Department, Company.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:62-72 — Round kind and Status labels only.
- Fix: Use exact labels/placeholders in list toolbar.

## G2-10-013-068  [P2] MISSING  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:873-896 — Export command labelled 'Export CSV', actual file interviews.csv.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:55-93 — No export label/file.
- Fix: Add exact command/filename.

## G2-10-013-070  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:215-220 — Focus triggers refresh with throttle to avoid stale interview outcomes.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:42-45; src/components/placements/college-interview-appointments.tsx:52-63 — Router refresh after mutation only.
- Fix: Add focus-based revalidation when returning to tab.

## G2-10-013-074  [P2] GAP  facet F20  effort S
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:382-395 — Clear filters resets page to 1 and all dimensions.
- vNext now: src/modules/placements/college-drive-interviews-model.ts:12-30; src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:60-74 — GET filter change can retain page param when navigated manually.
- Fix: Reset page to 1 on changed filter and clear all parameters.

## G2-10-013-076  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:40-45,395-405 — csvExport and calendar export utilities integrated with table.
- vNext now: src/components/placements/college-interview-appointments.tsx:117-126; src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:55-93 — ICS util exists, CSV missing.
- Fix: Implement safe CSV with actual filtered candidate rows.

## G2-10-013-082  [P2] MISSING  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:614-649,873-918 — Legacy .ics and CSV exports and conflict-only triage available.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:55-93; src/components/placements/college-interview-appointments.tsx:117-135 — ICS via disclosure only; no CSV or conflicts-only.
- Fix: Implement export/triage actions with correct data and status.

## G2-10-013-013  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:602-627 — Online and In-person indicators use VideoCameraOutlined/EnvironmentOutlined.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:50-52; src/components/placements/college-interview-appointments.tsx:111-117 — Mode raw text, no icon tag.
- Fix: Use exact mode icon and visual status pill.

## G2-10-013-066  [P3] MISSING  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/interviews.js:41-43 — Scope label 'This drive only' on calendar.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:57-60 — No scope pill; title names drive.
- Fix: Add small 'This drive only' scope label.
