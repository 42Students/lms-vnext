# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-5/u007-superadmin-calendar.md

30 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-5/u007-superadmin-calendar.md

## G2-5-007-001  [P2] GAP  facet F01 Purpose/entry/navigation  effort M
- Legacy: SuperAdminGroupShell groupKey placements around Interviews content (docs/legacy-source/frontend/src/pages/superadmin/calendar.js:20-32)
- vNext now: Separate calendar route with no explicit SuperAdminGroupShell (src/app/(authenticated)/admin/placements/calendar/page.tsx:42-48)
- Fix: Restore Placements grouped-tab navigation.

## G2-5-007-004  [P2] GAP  facet F01 Purpose/entry/navigation  effort S
- Legacy: No college message Select an Organization + College in the header above to view interviews. (docs/legacy-source/frontend/src/pages/superadmin/calendar.js:28-29)
- vNext now: EmptyState Select a college scope and new safety-scope description (src/app/(authenticated)/admin/placements/calendar/page.tsx:24-35)
- Fix: Restore exact legacy no-college message and warning styling.

## G2-5-007-007  [P2] GAP  facet F02 Layout/section order  effort M
- Legacy: Scheduled, Today, Companies, Conflicts four metrics (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:771-775)
- vNext now: College rounds and Matching events only (src/components/placements/placement-calendar-workspace.tsx:635-664)
- Fix: Restore all 4 appointment summary metrics.

## G2-5-007-009  [P2] GAP  facet F03 Visible elements  effort S
- Legacy: Header Refresh icon/button (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:762-770)
- vNext now: Placement operations arrow action, no Refresh (src/components/placements/placement-calendar-workspace.tsx:576-589)
- Fix: Restore Refresh action in header.

## G2-5-007-010  [P2] GAP  facet F03 Visible elements  effort M
- Legacy: Toolbar search/status/type/mode, Sort by, Export CSV, conflict/filters (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:824-923)
- vNext now: Date/company, collapsible round type/job, Apply filters (src/components/placements/placement-calendar-workspace.tsx:751-879)
- Fix: Restore complete appointment filter/sort toolbar.

## G2-5-007-020  [P2] GAP  facet F05 Tables/lists  effort M
- Legacy: Pagination defaults20, sizes10/20/50/100 (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:1023-1047)
- vNext now: Server pageSize from generic admin reader model; no 20/50/100 UI shown (src/modules/admin-ui/super-admin-placement-interviews-service.ts:28-32)
- Fix: Match page size selection and range counter.

## G2-5-007-021  [P2] GAP  facet F05 Tables/lists  effort M
- Legacy: Dedicated compact interview cards on mobile with View and per-row ICS (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:651-734)
- vNext now: AdminScopedReadPage generic cards, no per-row calendar invite (src/app/(authenticated)/admin/placements/interviews/page.tsx:9-11)
- Fix: Match candidate interview card layout and actions.

## G2-5-007-022  [P2] GAP  facet F05 Tables/lists  effort M
- Legacy: Sort date asc/desc, job title, status (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:89-94; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:288-304)
- vNext now: Sort jobTitle, sequence, id fixed (src/modules/admin-ui/super-admin-placement-interviews-service.ts:28-32)
- Fix: Add legacy per-column sorts and status grouping.

## G2-5-007-027  [P2] GAP  facet F06 Forms  effort M
- Legacy: Filter and sort update instantly, page reset (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:232-312)
- vNext now: Form Apply filters needed (src/components/placements/placement-calendar-workspace.tsx:751-869)
- Fix: Auto-apply or retain direct no-Apply flow.

## G2-5-007-032  [P2] GAP  facet F08 Success/toasts  effort S
- Legacy: Error warning closable, no success toast (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:779-789)
- vNext now: No warning-state banner at route (src/app/(authenticated)/admin/placements/calendar/page.tsx:21-48)
- Fix: Use dismissible warning with Retry.

## G2-5-007-037  [P2] MISSING  facet F10 Actions/side effects  effort M
- Legacy: Download .ics per interview with scheduledDate/duration/location (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:395-404; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:614-623)
- vNext now: No per-appointment ICS control in generic round listing (src/app/(authenticated)/admin/placements/interviews/page.tsx:9-11)
- Fix: Add single interview .ics output.

## G2-5-007-038  [P2] MISSING  facet F10 Actions/side effects  effort M
- Legacy: Filtered appointment CSV download (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:873-896)
- vNext now: No appointment CSV in calendar toolbar (src/components/placements/placement-calendar-workspace.tsx:751-879)
- Fix: Restore filtered interviews.csv with exact columns.

## G2-5-007-043  [P2] GAP  facet F12 Business rules  effort M
- Legacy: Today count from appointment start, local day (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:339-354)
- vNext now: Summary rounds/events, no Today appointment count (src/components/placements/placement-calendar-workspace.tsx:635-664)
- Fix: Calculate today's scheduled interview count.

## G2-5-007-046  [P2] GAP  facet F13 States  effort M
- Legacy: Initial Loading interviews... spinner (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:791-822)
- vNext now: Await SSR data; no explicit loading spinner in route (src/app/(authenticated)/admin/placements/calendar/page.tsx:21-48)
- Fix: Add Interviews route loading skeleton.

## G2-5-007-047  [P2] GAP  facet F13 States  effort L
- Legacy: Previous rows stale on refresh and warning instead of false empty (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:779-789)
- vNext now: Partial calendar summary warning when counts missing, not interview read failure state (src/components/placements/placement-calendar-workspace.tsx:592-594)
- Fix: Preserve same-scope previous appointment list on failure.

## G2-5-007-048  [P2] GAP  facet F13 States  effort S
- Legacy: No-college named empty instruction (docs/legacy-source/frontend/src/pages/superadmin/calendar.js:28-31)
- vNext now: Different EmptyState wording and page content (src/app/(authenticated)/admin/placements/calendar/page.tsx:24-35)
- Fix: Match original Select an Organization + College text.

## G2-5-007-050  [P2] MISSING  facet F14 Exports  effort S
- Legacy: Individual ICS filename/event detail (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:614-623)
- vNext now: No row ICS on summary read (src/app/(authenticated)/admin/placements/interviews/page.tsx:9-11)
- Fix: Add per-appointment calendar invitation output.

## G2-5-007-053  [P2] GAP  facet F15 Notifications  effort M
- Legacy: Legacy interview notes/details saved for interviewer context (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:75-83)
- vNext now: Generic round projection omits candidate notes/interviewer name (src/modules/admin-ui/super-admin-placement-interviews-service.ts:12-39)
- Fix: Preserve valid invitation context but protect private candidate remarks.

## G2-5-007-054  [P2] GAP  facet F16 Responsive  effort L
- Legacy: Mobile cards show status, title, candidate, mode, View, ICS (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:651-734)
- vNext now: New event cards show company/round data, not candidate (src/components/placements/placement-calendar-workspace.tsx:346-425)
- Fix: Create mobile candidate appointment cards.

## G2-5-007-055  [P2] GAP  facet F16 Responsive  effort M
- Legacy: Desktop table x=1100 horizontal scroll (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:1023-1039)
- vNext now: Calendar seven-column grid at wide breakpoints (src/components/placements/placement-calendar-workspace.tsx:905-1136)
- Fix: Use horizontally scrollable interview table on desktop.

## G2-5-007-056  [P2] GAP  facet F17 Accessibility  effort S
- Legacy: Mobile View aria names applicant/job (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:671-678)
- vNext now: Round link names event rather than learner (src/components/placements/placement-calendar-workspace.tsx:227-245)
- Fix: Restore contextual candidate+job accessible labels.

## G2-5-007-059  [P2] GAP  facet F18 Wording  effort S
- Legacy: Select an Organization + College in the header above to view interviews. (docs/legacy-source/frontend/src/pages/superadmin/calendar.js:28-29)
- vNext now: Select a college scope; organization/all-platform not sufficient (src/app/(authenticated)/admin/placements/calendar/page.tsx:32-35)
- Fix: Use exact legacy context help.

## G2-5-007-060  [P2] GAP  facet F18 Wording  effort S
- Legacy: Date ↑ Earliest, Date ↓ Latest, Job title, Status sorts (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:89-94)
- vNext now: Fixed jobTitle/sequence/id order (src/modules/admin-ui/super-admin-placement-interviews-service.ts:28-32)
- Fix: Use exact sort labels and comparator.

## G2-5-007-061  [P2] GAP  facet F18 Wording  effort S
- Legacy: Confirmed, Reschedule, No Show status wording (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:96-103)
- vNext now: Only round lifecycle statuses (src/app/(authenticated)/admin/placements/interviews/page.tsx:4)
- Fix: Restore badge labels and counts.

## G2-5-007-063  [P2] GAP  facet F19 Performance  effort M
- Legacy: 20/page, allow10/20/50/100 (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:1023-1047)
- vNext now: Generic query pageSize, no exact UI choice here (src/modules/admin-ui/super-admin-placement-interviews-service.ts:28-32)
- Fix: Match pagination default/options.

## G2-5-007-067  [P2] MISSING  facet F21 Integrations  effort M
- Legacy: Local ICS/CSV export from appointment rows (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:614-623; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:873-896)
- vNext now: No corresponding download in admin round reader (src/app/(authenticated)/admin/placements/interviews/page.tsx:9-11)
- Fix: Add endpoints with college scope and data redaction.

## G2-5-007-070  [P2] GAP  facet F22 Data/migrations  effort M
- Legacy: ONLINE/OFFLINE and free-text venue/mode (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:69-79)
- vNext now: Round mode projection only (src/modules/admin-ui/super-admin-placement-interviews-service.ts:17-18)
- Fix: Preserve venue and meeting link per appointment.

## G2-5-007-008  [P3] GAP  facet F02 Layout/section order  effort S
- Legacy: Title Interviews, exact review subtitle, scope All companies (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:753-761)
- vNext now: Title/subtitle now match, but scope All companies absent (src/components/placements/placement-calendar-workspace.tsx:563-575)
- Fix: Add All companies scope beside heading.

## G2-5-007-013  [P3] GAP  facet F03 Visible elements  effort S
- Legacy: Deterministic company color tag under job (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:60-69; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:433-436)
- vNext now: Company plain text, no deterministic palette (src/components/placements/placement-calendar-workspace.tsx:360-374)
- Fix: Restore hash-based company tag colors.

## G2-5-007-031  [P3] GAP  facet F08 Success/toasts  effort S
- Legacy: Refresh no toast, GET only (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:762-770)
- vNext now: No Refresh action, SSR loads (src/components/placements/placement-calendar-workspace.tsx:563-589)
- Fix: Add refresh loading indicator without success toast.
