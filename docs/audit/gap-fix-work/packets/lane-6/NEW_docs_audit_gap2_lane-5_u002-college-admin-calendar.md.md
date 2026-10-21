# Work packet: NEW / MISSING items from docs/audit/gap2/lane-5/u002-college-admin-calendar.md

6 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-5/u002-college-admin-calendar.md

## G2-5-002-037  [P1] GAP  facet F10 Actions/side effects  effort M
- Legacy: Application navigation uses jobApplication ID. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:624-632; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:1040-1043)
- vNext now: Links to broad applications list only. (src/app/(authenticated)/college/placements/interviews/page.tsx:51-54)
- Fix: Open exact application in job with focus anchor.

## G2-5-002-045  [P1] GAP  facet F12 Business rules  effort L
- Legacy: Conflicts computed before user filters. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:224-230)
- vNext now: Conflicts calculated after filters/status and limit. (src/modules/placements/college-interview-directory-service.ts:79-96)
- Fix: Evaluate all tenant-scoped active interviews first.

## G2-5-002-060  [P1] GAP  facet F19 Performance  effort L
- Legacy: Client-side full-list filter, 20/page display; fetch everything for org. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:148-181; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:232-312)
- vNext now: Server reads 5001 then filters status/mode after limit and slices 25. (src/modules/placements/college-interview-directory-service.ts:76-104)
- Fix: Apply all filters in SQL prior to limit, count whole filtered result.

## G2-5-002-066  [P1] GAP  facet F21 Integrations  effort L
- Legacy: Shared conflict helper used for pre-submit warning and calendar. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:42-44; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:224-230)
- vNext now: Directory implements learner-only local overlap computation. (src/modules/placements/college-interview-directory-service.ts:82-96)
- Fix: Share full interviewer/student conflict policy with booking.

## G2-5-002-067  [P1] GAP  facet F22 Models/migrations  effort L
- Legacy: Interview row has job application, learner, name, type, status, version, duration, notes, interviewer. (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:31-93; docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:161-171)
- vNext now: Directory derives BOOKED candidate slot and audit status, drops several fields. (src/modules/placements/college-interview-directory-service.ts:34-75)
- Fix: Create field-by-field migration and parity mapping without losing historic appointments.

## G2-5-002-068  [P1] GAP  facet F22 Models/migrations  effort L
- Legacy: Status CONFIRMED and RESCHEDULE_REQUESTED persist. (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:49-54)
- vNext now: Proposed interview status constraint lacks both. (src/db/schema/placement-college-interviews.ts:18-41)
- Fix: Persist/respecify transitions with proper model migration.
