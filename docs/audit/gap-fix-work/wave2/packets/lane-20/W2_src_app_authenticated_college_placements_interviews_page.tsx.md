# Work packet (wave 2): edit src/app/(authenticated)/college/placements/interviews/page.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u002-college-admin-calendar.md

## G2-5-002-001  [P2] GAP  facet F01 Purpose/entry/navigation  effort M
- Legacy: Unified Placements navigation, active jobs menu, AdminGroupShell; global Interviews content. (docs/legacy-source/frontend/src/pages/college-admin/calendar.js:15-18; docs/legacy-source/frontend/src/pages/college-admin/calendar.js:44-55)
- vNext now: Separate /college/placements/calendar and /college/placements/interviews routes. (src/app/(authenticated)/college/placements/calendar/page.tsx:15-40; src/app/(authenticated)/college/placements/interviews/page.tsx:21-30)
- Fix: Restore single discoverable global Interviews entry in the Placements group.

## G2-5-002-003  [P2] GAP  facet F01 Purpose/entry/navigation  effort S
- Legacy: Missing college warning and exact contact-admin instruction. (docs/legacy-source/frontend/src/pages/college-admin/calendar.js:30-41)
- vNext now: Redirects non-college-admin/missing membership to dashboard. (src/app/(authenticated)/college/placements/calendar/page.tsx:23-31; src/app/(authenticated)/college/placements/interviews/page.tsx:22-23)
- Fix: Differentiate absent college from forbidden membership and display legacy warning.

## G2-5-002-005  [P2] GAP  facet F02 Layout/section order  effort S
- Legacy: Title Interviews, exact long review subtitle, All companies scope sublabel. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:753-761)
- vNext now: Calendar title Placement Interview Calendar; directory other description, missing scope sublabel. (src/components/placements/placement-calendar-workspace.tsx:563-575; src/app/(authenticated)/college/placements/interviews/page.tsx:57-59)
- Fix: Use exact title, subtitle and All companies marker.

## G2-5-002-007  [P2] GAP  facet F03 Every visible element  effort S
- Legacy: Top-right Refresh reload icon with loading indicator. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:762-770)
- vNext now: Placement operations navigation or Exports in header; no Refresh. (src/components/placements/placement-calendar-workspace.tsx:576-589; src/app/(authenticated)/college/placements/interviews/page.tsx:58-59)
- Fix: Add explicit Refresh button with loading and scoped refetch.

## G2-5-002-014  [P2] GAP  facet F04 Data formatting  effort M
- Legacy: Online camera-tag; In-person location-tag. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:598-607)
- vNext now: VIRTUAL/ON_CAMPUS inferred from room URL and printed as enum. (src/modules/placements/college-interview-directory-service.ts:58-60; src/app/(authenticated)/college/placements/interviews/page.tsx:49)
- Fix: Map to exact labels/icons and preserve raw venue.

## G2-5-002-019  [P2] GAP  facet F05 Tables/lists  effort L
- Legacy: All matching interviews shown as mobile cards, View and ICS visible. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:651-734; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:1018-1021)
- vNext now: DataTable/mobilePriority; View in Manage disclosure; no per-row ICS. (src/app/(authenticated)/college/placements/interviews/page.tsx:43-55; src/app/(authenticated)/college/placements/interviews/page.tsx:108-111)
- Fix: Match interview mobile card/action placements.

## G2-5-002-029  [P2] GAP  facet F07 Validation/errors  effort M
- Legacy: Initial spinner Loading interviews... and refresh overlay. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:791-822)
- vNext now: No explicit route-level spinner/refresh overlay in page. (src/app/(authenticated)/college/placements/interviews/page.tsx:21-31; src/app/(authenticated)/college/placements/interviews/page.tsx:57-119)
- Fix: Add loading and refreshing states.

## G2-5-002-047  [P2] GAP  facet F13 States  effort S
- Legacy: Unassigned college distinct from no interviews. (docs/legacy-source/frontend/src/pages/college-admin/calendar.js:30-41; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:737-747)
- vNext now: Redirect or storage-unavailable warning. (src/app/(authenticated)/college/placements/interviews/page.tsx:22-23; src/app/(authenticated)/college/placements/interviews/page.tsx:60-62)
- Fix: Distinguish permissions, unassigned and empty.

## G2-5-002-053  [P2] GAP  facet F16 Responsive  effort L
- Legacy: Separate small-screen card layout and mobile filter bar. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:651-734; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:925-1021)
- vNext now: Calendar hides grid below 992 and uses agenda; directory generic DataTable. (src/components/placements/placement-calendar-workspace.tsx:961-966; src/components/placements/placement-calendar-workspace.tsx:1105-1136; src/app/(authenticated)/college/placements/interviews/page.tsx:43-55)
- Fix: Recreate card layout and action placement on mobile.

## G2-5-002-057  [P2] GAP  facet F17 Accessibility  effort M
- Legacy: Row click plus download prevents bubbling. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:614-623; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:1023-1043)
- vNext now: Link inside Manage, no row click. (src/app/(authenticated)/college/placements/interviews/page.tsx:51-55; src/app/(authenticated)/college/placements/interviews/page.tsx:108-111)
- Fix: Add keyboard-accessible row link and action bubbling guard.

## G2-5-002-058  [P2] GAP  facet F18 Copy  effort S
- Legacy: Exact copy Interviews / All companies / Refresh / Export CSV / Clear filters. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:753-761; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:762-770; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:873-923)
- vNext now: Different page title, navigation, Advanced filters, Apply filters, Clear. (src/components/placements/placement-calendar-workspace.tsx:563-590; src/app/(authenticated)/college/placements/interviews/page.tsx:57-111)
- Fix: Use exact legacy copy and layout.

## G2-5-002-033  [P3] GAP  facet F08 Success/toasts  effort S
- Legacy: Warnings are closable. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:779-789)
- vNext now: No closable fetch warning state. (src/app/(authenticated)/college/placements/interviews/page.tsx:21-31; src/app/(authenticated)/college/placements/interviews/page.tsx:57-119)
- Fix: Offer dismissible warning and explicit retry.
