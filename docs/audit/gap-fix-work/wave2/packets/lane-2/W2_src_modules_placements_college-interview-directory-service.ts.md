# Work packet (wave 2): edit src/modules/placements/college-interview-directory-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u002-college-admin-calendar.md, docs/audit/gap2/lane-8/interview-controller.md

## G2-5-002-009  [P2] GAP  facet F03 Every visible element  effort M
- Legacy: Five subtype chips Screening teal, Technical blue, HR purple, Managerial amber, Final dark. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:51-58; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:501-509)
- vNext now: Generic INTERVIEW/GD type as text, no five-color chip. (src/app/(authenticated)/college/placements/interviews/page.tsx:47; src/modules/placements/college-interview-directory-service.ts:13-15)
- Fix: Map subtype palette and per-type labels, preserve fallback.

## G2-5-002-018  [P2] GAP  facet F05 Tables/lists  effort M
- Legacy: Page size default20; choose 10/20/50/100; horizontal scroll 1100. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:1023-1047)
- vNext now: Fixed 25/page Previous/Next, no page size dropdown. (src/app/(authenticated)/college/placements/interviews/page.tsx:113-117; src/modules/placements/college-interview-directory-service.ts:100-104)
- Fix: Default20 with options and same filter/page reset behavior.

## G2-5-002-021  [P2] GAP  facet F05 Tables/lists  effort M
- Legacy: Sort earliest, latest, job title, status. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:89-94; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:288-304)
- vNext now: Upcoming, Recent, Student name. (src/app/(authenticated)/college/placements/interviews/page.tsx:94-98; src/modules/placements/college-interview-directory-service.ts:76-77)
- Fix: Offer exact sort options and algorithms.

## G2-5-002-022  [P2] GAP  facet F06 Forms  effort M
- Legacy: Search... inline Job column, matches title/company/learner immediately. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:409-422; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:274-285)
- vNext now: Standalone labeled q max100; Apply filters submit. (src/app/(authenticated)/college/placements/interviews/page.tsx:64-70; src/modules/placements/college-interview-directory-service.ts:11-12)
- Fix: Match placeholder, placement and immediate filter semantics.

## G2-5-002-025  [P2] GAP  facet F06 Forms  effort S
- Legacy: Mode All modes/Online/In-person. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:83-87; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:268-272)
- vNext now: Raw ALL/ON_CAMPUS/VIRTUAL options. (src/app/(authenticated)/college/placements/interviews/page.tsx:86-93; src/modules/placements/college-interview-directory-service.ts:14)
- Fix: Restore user-facing labels, map stored values.

## G2-5-002-027  [P2] GAP  facet F06 Forms  effort S
- Legacy: Any filter/search/sort resets currentPage=1. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:307-312)
- vNext now: URL filter submits can preserve arbitrary page query or require Clear. (src/app/(authenticated)/college/placements/interviews/page.tsx:24-40; src/modules/placements/college-interview-directory-service.ts:19)
- Fix: Reset page when criteria change and avoid out-of-range blank.

## G2-8-027-048  [P2] GAP  facet F19  effort M
- Legacy: Legacy interview list optional pageable, cap500 org, cap200 learner (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:347-349,511-524).
- vNext now: New TPO slots workspace loads booked+unassigned and college directory page bounded query (src/modules/placements/tpo-interview-slot-service.ts:30-83; src/modules/placements/college-interview-directory-service.ts:11-23).
- Fix: Add server pagination/virtualization for 10k college learners, avoid 1000-row truncation.
