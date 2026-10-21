# Work packet: NEW / MISSING items from docs/audit/gap2/lane-5/u007-superadmin-calendar.md

10 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-5/u007-superadmin-calendar.md

## G2-5-007-002  [P1] GAP  facet F01 Purpose/entry/navigation  effort M
- Legacy: Job row opens /superadmin/jobs/:jobId/applications?collegeId=selected (docs/legacy-source/frontend/src/pages/superadmin/calendar.js:12-18)
- vNext now: Event link to /admin/placements/jobs/:jobId#round-id (src/components/placements/placement-calendar-workspace.tsx:227-245)
- Fix: Deep link to exact legacy job application list with selected college parameter.

## G2-5-007-018  [P1] GAP  facet F04 Data formatting  effort L
- Legacy: Per-appointment status badge (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:513-535)
- vNext now: Only round-wide status on list (src/modules/admin-ui/super-admin-placement-interviews-service.ts:35-39)
- Fix: Distinguish appointment state from parent round lifecycle.

## G2-5-007-024  [P1] GAP  facet F06 Forms  effort M
- Legacy: Status filter ALL/ACTIVE/COMPLETED/CANCELLED, Active union3 states (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:71-76)
- vNext now: All/Pending/Scheduled/Completed/Cancelled round filter (src/app/(authenticated)/admin/placements/interviews/page.tsx:4)
- Fix: Implement Active composite from appointment statuses.

## G2-5-007-025  [P1] GAP  facet F06 Forms  effort L
- Legacy: Subtype five choices and mode Online/In-person (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:78-87)
- vNext now: Round kind selector/Job text, not five subtypes or modes (src/components/placements/placement-calendar-workspace.tsx:828-860)
- Fix: Restore appointment type/mode filters with original values.

## G2-5-007-035  [P1] GAP  facet F10 Actions/side effects  effort L
- Legacy: GET individual interview records scoped by organization/college (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:148-161; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:333-385)
- vNext now: Reads placementJobRounds rows only (src/modules/admin-ui/super-admin-placement-interviews-service.ts:9-39)
- Fix: Reconcile legacy Interview entity to appointment model; don't substitute rounds.

## G2-5-007-042  [P1] GAP  facet F12 Business rules  effort L
- Legacy: Conflict computes over all active appointments before visible filters (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:224-230)
- vNext now: Round directory no per-learner/interviewer conflict fields (src/modules/admin-ui/super-admin-placement-interviews-service.ts:23-32)
- Fix: Compute overlaps across whole college appointments, ignore cancelled.

## G2-5-007-045  [P1] GAP  facet F12 Business rules  effort L
- Legacy: Calendar lists all dated interviews, unbounded date filter (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:148-161)
- vNext now: Month/week/agenda date windows (src/components/placements/placement-calendar-workspace.tsx:130-181)
- Fix: Provide unbounded appointment list and pagination independent of graphic window.

## G2-5-007-066  [P1] GAP  facet F21 Integrations  effort L
- Legacy: Legacy GET appointment records from service with feature flag (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:333-385)
- vNext now: Drizzle SELECT rounds; reads only placements tables (src/modules/admin-ui/super-admin-placement-interviews-service.ts:9-39)
- Fix: Trace controller→service→entity of original interviews then replace projection.

## G2-5-007-068  [P1] GAP  facet F22 Data/migrations  effort L
- Legacy: Interview entity has candidate/jobApplication, interviewer, subtype, status, duration/version (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:31-93)
- vNext now: Only placementJobRounds scheduledAt/kind/status/mode/job (src/modules/admin-ui/super-admin-placement-interviews-service.ts:12-39)
- Fix: Create mapping to appointment-level table or join slots/applications.

## G2-5-007-072  [P1] GAP  facet F23 Extra/dropped  effort M
- Legacy: Wrapper callback discards applicationId despite child supplying it (docs/legacy-source/frontend/src/pages/superadmin/calendar.js:12-18)
- vNext now: vNext navigates to round, also discards applicant anchor (src/components/placements/placement-calendar-workspace.tsx:227-245)
- Fix: Fix both application ID propagation and current route deep-link.
