# Work packet (wave 2): edit src/modules/placements/learner-placement-event-copy.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l12-u010-job-notification-helper.md

## G2-12-010-004  [P2] GAP  facet F03  effort M
- Legacy: No direct buttons or icon text in helper; notification title/body from registry `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:121-138`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/NotificationEventRegistry.java:79-88`
- vNext now: New notice titles from event-kind mapping `src/modules/placements/learner-placement-event-copy.ts:13-29`
- Fix: Compare every emitted notice title, badge/icon and deep link in learner inbox.

## G2-12-010-006  [P2] MISSING  facet F04  effort M
- Legacy: Application date from appliedAt, else statusUpdatedAt, else empty string, 'dd MMM yyyy' `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:154-158`
- vNext now: New copy no date field `src/modules/placements/learner-placement-event-copy.ts:48-55`
- Fix: Add formatted application date to event payload and exact empty fallback.

## G2-12-010-007  [P2] GAP  facet F04  effort M
- Legacy: For INTERVIEW/OFFERED include contactMobile or contactPhone fallback `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:159-163`
- vNext now: New input has no contactPhone in event copy `src/modules/placements/learner-placement-event-copy.ts:48-55`
- Fix: Preserve only when template requires it, with PII safety review and protected payload.

## G2-12-010-009  [P2] GAP  facet F04  effort M
- Legacy: Rejected notices include trimmed rejectionReason when present `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:175-179`
- vNext now: New copy only generic subject `src/modules/placements/learner-placement-event-copy.ts:48-55`
- Fix: Include allowed rejection reason from saved stage transition, safely escaped.

## G2-12-010-012  [P2] GAP  facet F06  effort M
- Legacy: Internal helper inputs JobApplication + status String `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:73-80`
- vNext now: New typed kind comes from predefined event kinds `src/modules/placements/learner-placement-event-copy.ts:3-13`
- Fix: Validate exhaustive stage-to-event enum mapping at boundaries and reject unknown status.

## G2-12-010-026  [P2] GAP  facet F12  effort M
- Legacy: Legacy round name mapping screening/technical/hr/managerial/final + titlecase Round `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:260-270`
- vNext now: New uses bounded subject string only `src/modules/placements/learner-placement-event-copy.ts:48-55`
- Fix: Preserve exact round labels in user-visible notification.

## G2-12-010-028  [P2] GAP  facet F13  effort M
- Legacy: No link/venue now yields 'Details to follow — check the portal closer to the date.' `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:225-238`
- vNext now: New fixed subject and route to schedule `src/modules/placements/learner-placement-event-copy.ts:31-37`
- Fix: Show exact fallback and route even for unscheduled location.

## G2-12-010-034  [P2] GAP  facet F18  effort M
- Legacy: Legacy titles 'Shortlisted', 'Interview Scheduled', 'Application Rejected' from central registry `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/NotificationEventRegistry.java:79-103`
- vNext now: New generic title 'Application status updated' `src/modules/placements/learner-placement-event-copy.ts:18-29`
- Fix: Map exact legacy title per stage or annotate owner-approved copy divergence.

## G2-12-010-035  [P2] GAP  facet F18  effort M
- Legacy: Legacy meeting time format 'hh:mm a' and date 'dd MMM yyyy' in Asia/Kolkata `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:195-200`
- vNext now: New notice copy receives plain subject with no locale formatter `src/modules/placements/learner-placement-event-copy.ts:48-55`
- Fix: Render India-time interview date/time and exact fallback.

## G2-12-010-039  [P2] GAP  facet F20  effort M
- Legacy: Legacy UTC stored interview converted to IST for display `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:195-200`
- vNext now: New copy has no timezone conversion `src/modules/placements/learner-placement-event-copy.ts:48-55`
- Fix: Use explicit Asia/Kolkata time zone and DST-agnostic format.
