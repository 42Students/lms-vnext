# Work packet: edit src/modules/placements/learner-placement-event-copy.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l12-u010-job-notification-helper.md

## G2-12-010-005  [P1] GAP  facet F04  effort M
- Legacy: Variables learnerName, jobTitle, companyName, status, applicationId, jobId `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:146-154`
- vNext now: New message built only from bounded subject and kind `src/modules/placements/learner-placement-event-copy.ts:48-55`
- Fix: Persist event metadata for job/company/application IDs and reconstruct safe named messages.

## G2-12-010-008  [P1] GAP  facet F04  effort M
- Legacy: Assessment URL per-application overrides job default `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:165-174`
- vNext now: New copy provides fixed actionHref to applications, no assessmentUrl `src/modules/placements/learner-placement-event-copy.ts:33-40`
- Fix: Preserve sanitized assessment link in invitation with ownership check.

## G2-12-010-019  [P1] GAP  facet F10  effort M
- Legacy: INTERVIEW/REJECTED/SHORTLISTED/ASSESSMENT/OFFERED/HIRED/WAITLISTED accepted; unknown statuses silent `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:94-119`
- vNext now: New event kinds many but only generic APPLICATION_STATUS_CHANGED for status notices `src/modules/placements/learner-placement-event-copy.ts:3-12`
- Fix: Map each state (including waitlisted, offered, hired) to distinct registry-equivalent notification copy.

## G2-12-010-025  [P1] GAP  facet F12  effort M
- Legacy: Offer/hired both mapped to distinct JOB_OFFER_EXTENDED and JOB_HIRED `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:245-256`
- vNext now: New OFFER_RELEASED and OFFER_ACCEPTED_REPORTED event variants `src/modules/placements/learner-placement-event-copy.ts:4-10`
- Fix: Map offer acceptance vs hired meaning, never treat as synonyms.

## G2-12-010-046  [P1] MISSING  facet F23  effort M
- Legacy: Legacy enriches assessment URL, interview venue and rejection reason `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:165-179`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:195-238`
- vNext now: New subject-only copy drops structured fields `src/modules/placements/learner-placement-event-copy.ts:48-55`
- Fix: Implement safe per-event deep-link and metadata model with consent and context.
