# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-5/u002-college-admin-calendar.md

15 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-5/u002-college-admin-calendar.md

## G2-5-002-008  [P2] GAP  facet F03 Every visible element  effort M
- Legacy: Toolbar order: count, conditional Company dropdown, job chip, Sort by, Export CSV, conflict pill, Clear filters. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:824-923)
- vNext now: Search form, Advanced filters, header Exports; no conflict-only pill. (src/app/(authenticated)/college/placements/interviews/page.tsx:58-107)
- Fix: Restore action order and conditional chips.

## G2-5-002-012  [P2] GAP  facet F04 Data formatting  effort M
- Legacy: Job cell title/company tag; Candidate name with department gray subtext. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:406-480)
- vNext now: Columns reorder as Student, Company / drive, Department separate. (src/app/(authenticated)/college/placements/interviews/page.tsx:43-47)
- Fix: Recreate legacy compound job/candidate cells and order.

## G2-5-002-017  [P2] GAP  facet F05 Tables/lists  effort M
- Legacy: Desktop columns Job, Candidate, Type, Status, Date & Time, Interviewer, Mode, Actions. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:406-649)
- vNext now: Student, Company/drive, Department, Type, Scheduled time, Mode/venue, Status, Actions. (src/app/(authenticated)/college/placements/interviews/page.tsx:43-55)
- Fix: Restore column names/order and missing interviewer.

## G2-5-002-020  [P2] GAP  facet F05 Tables/lists  effort M
- Legacy: Click any table row to open applicant. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:1040-1043)
- vNext now: Requires opening Manage then clicking generic View applications. (src/app/(authenticated)/college/placements/interviews/page.tsx:51-55)
- Fix: Make row selectable and keyboard-operable; precise applicant destination.

## G2-5-002-030  [P2] GAP  facet F07 Validation/errors  effort S
- Legacy: Empty unfiltered 'No interviews scheduled yet.', filtered has full instructions. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:115-120; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:796-814)
- vNext now: Always No matching interviews / No interviews match these filters. (src/app/(authenticated)/college/placements/interviews/page.tsx:109-111)
- Fix: Differentiate initial zero from filtered zero with exact copy.

## G2-5-002-035  [P2] GAP  facet F09 Modals/drawers  effort S
- Legacy: Mobile View in card header, ICS alongside Mode. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:671-679; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:721-732)
- vNext now: View hidden inside Manage disclosure. (src/app/(authenticated)/college/placements/interviews/page.tsx:51-55)
- Fix: Expose direct View/ICS actions on mobile without extra click.

## G2-5-002-038  [P2] GAP  facet F10 Actions/side effects  effort M
- Legacy: Per-row ICS title uses type/job/company; duration/location/interviewer. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:395-404; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:614-623)
- vNext now: Only bulk ICS under header Exports. (src/app/(authenticated)/college/placements/interviews/page.tsx:58-59)
- Fix: Add single-item ICS endpoint or client download with exact fields.

## G2-5-002-046  [P2] GAP  facet F13 States  effort M
- Legacy: Initial loading, fetch cancellation, stale response protection. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:129-188; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:791-822)
- vNext now: SSR render without explicit fetching states. (src/app/(authenticated)/college/placements/interviews/page.tsx:21-31)
- Fix: Add route loading skeleton, refetch UI and stale guard.

## G2-5-002-049  [P2] GAP  facet F14 Exports  effort M
- Legacy: Individual ICS per interview on table and mobile. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:614-623; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:721-733)
- vNext now: Only header bulk ICS. (src/app/(authenticated)/college/placements/interviews/page.tsx:51-59)
- Fix: Add per-row calendar invitation with interviewer and duration.

## G2-5-002-052  [P2] GAP  facet F15 Notifications  effort M
- Legacy: Interview includes notes and mandatory roundDescription for candidate notifications. (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:75-83)
- vNext now: Directory projection omits notes and round description. (src/modules/placements/college-interview-directory-service.ts:42-61)
- Fix: Preserve original details in ICS and drill-in as privacy allows.

## G2-5-002-055  [P2] GAP  facet F17 Accessibility  effort S
- Legacy: Mobile View aria label names learner and job. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:671-678)
- vNext now: View applications lacks named learner context. (src/app/(authenticated)/college/placements/interviews/page.tsx:51-54)
- Fix: Set contextual accessible View link label.

## G2-5-002-059  [P2] GAP  facet F18 Copy  effort S
- Legacy: Date ↑ Earliest, Date ↓ Latest, Job title, Status. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:89-94)
- vNext now: Upcoming first, Recent first, Student name. (src/app/(authenticated)/college/placements/interviews/page.tsx:94-98)
- Fix: Use exact sorting labels.

## G2-5-002-062  [P2] GAP  facet F20 Edge/concurrency  effort M
- Legacy: Abort previous fetch, refetch on focus with debounce. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:129-188; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:214-222)
- vNext now: No explicit focus refetch or abort in server route. (src/app/(authenticated)/college/placements/interviews/page.tsx:21-31)
- Fix: Add manual Refresh or refocus stale check; guard navigation race.

## G2-5-002-010  [P3] GAP  facet F03 Every visible element  effort S
- Legacy: Stable hashed company color palette and company Tag below job. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:60-69; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:433-436)
- vNext now: Company is plain text before job title. (src/app/(authenticated)/college/placements/interviews/page.tsx:45)
- Fix: Restore deterministic company tag colors and compound cell.

## G2-5-002-026  [P3] GAP  facet F06 Forms  effort S
- Legacy: Department filter inline candidate header; company filter only if >2 options. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:443-457; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:830-844)
- vNext now: Both always inside Advanced filters disclosure. (src/app/(authenticated)/college/placements/interviews/page.tsx:72-85)
- Fix: Match conditional visibility and inline placement.
