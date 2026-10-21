# Work packet (wave 2): edit src/components/placements/college-interview-appointments.tsx (part 2 of 2)

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-interviews.md, docs/audit/gap2/lane-1/l12-u030-interview-form.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-interviews.md

## G2-9-012-011  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:614-640` — Row Download .ics icon and open applications button
- vNext now: `src/components/placements/college-interview-appointments.tsx:117-135` — ICS download in Actions disclosure, no View Applications button
- Fix: Expose row Download .ics plus View applications affordance

## G2-9-012-013  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:396-640` — Per-interview fields job/company, student, department, type, status, schedule, mode, interviewer, location
- vNext now: `src/components/placements/college-interview-appointments.tsx:105-116` — Candidate, Round, datetime/duration, mode/location, interviewer, status; job/company and department hidden
- Fix: Include legacy fields and empty placeholders in same column order

## G2-9-012-014  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:1030-1047` — Candidate table row click navigates to job applications
- vNext now: `src/components/placements/college-interview-appointments.tsx:100-138` — Only Actions disclosure per row; no row click
- Fix: Add View applications link respecting keyboard and nested controls

## G2-9-012-024  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/interviewService.js:93-104` — Legacy edit and cancel use interview id and organization scope
- vNext now: `src/components/placements/college-interview-appointments.tsx:66-89` — New edit/cancel uses typed action, expectedVersion, reason
- Fix: Map legacy action outcomes and explain new version/reason requirements

## G2-9-012-039  [P2] MISSING  facet F10  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/interviews.js:21-24` — On View applications navigates to job-scoped applications
- vNext now: `src/components/placements/college-interview-appointments.tsx:117-135` — No application deep link from appointment row
- Fix: Expose explicit Open application action and preserve candidate identifier

## G2-9-012-049  [P2] GAP  facet F14  effort S
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:614-622` — Per-interview Download .ics
- vNext now: `src/components/placements/college-interview-appointments.tsx:119-124` — Per-booking .ics data URL file interview-{id}.ics
- Fix: Match event title/date/location and filename behavior

## G2-9-012-052  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:925-1049` — Separate mobile filter bar/cards and desktop table; desktop scroll x1100
- vNext now: `src/components/placements/college-interview-appointments.tsx:100-140` — Single DataTable responsive collapse with Actions disclosure, not cards
- Fix: Match 375px cards, 768px table switch and content layout

## G2-9-012-054  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:1023-1043` — Entire desktop table row click opens applications
- vNext now: `src/components/placements/college-interview-appointments.tsx:100-138` — Only action controls clicked, tab-navigation detail row not available
- Fix: Add keyboard-focusable View applications link instead of nonsemantic row click

## G2-12-030-007  [P3] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:279-285 — Interviewer(s) helper tooltip, comma-separated panel names, example placeholder
- vNext now: src/components/placements/college-interview-appointments.tsx:169-170 — Interviewer (optional) plain input with no tooltip/placeholder
- Fix: Restore tooltip, examples, label plural, max length.

## G2-12-030-039  [P3] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:100-105 — candidate missing learner triggers specific toast
- vNext now: src/components/placements/college-interview-appointments.tsx:95-99,153-155 — button disabled if no candidates
- Fix: Show explicit missing-onboarding reason instead of only disabled button.

## G2-12-030-042  [P3] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:234-245 — AntD in-flow candidate strip background #f6f8fa, radius6, 10x14 padding
- vNext now: src/components/placements/college-interview-appointments.tsx:142-158 — Dialog focus, candidate selector no banner
- Fix: Match old neutral card dimensions and density in cloned shell.

## G2-12-030-044  [P3] GAP  facet F18  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:381-387 — buttons Schedule Interview and Cancel
- vNext now: src/components/placements/college-interview-appointments.tsx:143-146 — Schedule and notify, Cancel
- Fix: Restore exact primary label/casing.

## G2-10-013-013  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:602-627 — Online and In-person indicators use VideoCameraOutlined/EnvironmentOutlined.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:50-52; src/components/placements/college-interview-appointments.tsx:111-117 — Mode raw text, no icon tag.
- Fix: Use exact mode icon and visual status pill.

## G2-10-013-064  [P3] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:614-623 — ICS button has title Download .ics.
- vNext now: src/components/placements/college-interview-appointments.tsx:117-126 — ICS command in disclosure; link text inspect live.
- Fix: Match accessible name and visible icon.
