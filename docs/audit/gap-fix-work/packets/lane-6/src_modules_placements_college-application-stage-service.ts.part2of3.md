# Work packet: edit src/modules/placements/college-application-stage-service.ts (part 2 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u011-placement-job-service-impl.md, docs/audit/gap2/lane-17/placement-job-service.md, docs/audit/gap2/lane-2/admin-job-controller.md, docs/audit/gap2/lane-9/college-admin-jobs-applications.md, docs/audit/gap2/lane-9/college-admin-jobs-shortlisted.md, docs/audit/gap2/lane-13/job-application-status-validator.md

## G2-14-011-046  [P1] GAP  facet F11  effort M
- Legacy: Legacy org access guard applies across all job CRUD `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:465-475` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:582-595`
- vNext now: New strict placements.manage plus college scope `src/modules/placements/job-service.ts:90-94` `src/modules/placements/college-application-stage-service.ts:18-35`
- Fix: Provide super-admin/org-wide role matrix

## G2-14-011-049  [P1] GAP  facet F12  effort L
- Legacy: Legacy allowed transitions include HIRED to OFFERED reversal `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:20-113`
- vNext now: New stage/offer/joining models separate terminal transitions `src/modules/placements/college-application-stage-service.ts:73-110`
- Fix: Map hire correction reversal and audit

## G2-14-011-052  [P1] GAP  facet F12  effort L
- Legacy: Legacy HIRED blocked if learner already HIRED elsewhere `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:1191-1203`
- vNext now: New HIRED requires accepted joined offer `src/modules/placements/college-application-stage-service.ts:82-90`
- Fix: Enforce global single-hire invariant

## G2-14-011-061  [P1] GAP  facet F15  effort L
- Legacy: Legacy status notice sent asynchronously after transaction commit `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:2004-2024`
- vNext now: New stage service writes in-app event and reject email flag `src/modules/placements/college-application-stage-service.ts:33-40` `src/modules/placements/college-application-stage-service.ts:152-188`
- Fix: Preserve email/SMS template mapping and after-commit semantics

## G2-14-011-062  [P1] GAP  facet F15  effort L
- Legacy: Legacy interview cancellation sends specific notice after commit `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:142-160` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:180-187`
- vNext now: New stage service no direct interview cancellation in mapped path `src/modules/placements/college-application-stage-service.ts:49-110`
- Fix: Emit interview cancellation event and learner message

## G2-14-011-063  [P1] GAP  facet F15  effort M
- Legacy: Legacy status notifications do not require caller notifyByEmail `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:2013-2024`
- vNext now: New college rejects notifyByEmail `src/modules/placements/college-application-stage-service.ts:33-40`
- Fix: Document intentional delivery difference and plan parity

## G2-14-011-074  [P1] GAP  facet F20  effort L
- Legacy: Legacy status updates lock job and other applications in consistent order `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:1169-1186` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:1290-1327`
- vNext now: New stage writes use version checks and locks `src/modules/placements/college-application-stage-service.ts:49-71` `src/modules/placements/tpo-bulk-application-stage-service.ts:101-109`
- Fix: Document and test global lock ordering including interview/offers

## G2-14-011-076  [P1] GAP  facet F21  effort L
- Legacy: Legacy publishes ApplicationStatusChangedEvent and after commit async status emails `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:1268-1273` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:2004-2024`
- vNext now: New stage service emits activity/in-app events `src/modules/placements/college-application-stage-service.ts:152-188`
- Fix: Guarantee outbox/after commit delivery for equivalent notifications

## G2-17-012-007  [P1] GAP  facet F03  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:106-117 — Pipeline statuses SHORTLISTED/INTERVIEW/OFFERED/REJECTED/HIRED.
- vNext now: src/modules/placements/college-application-stage-service.ts:73-140 — Uses APPLIED/SHORTLISTED/REJECTED stage and screening status.
- Fix: Translate legacy statuses or preserve extended org-admin pipeline.

## G2-2-016-095  [P1] GAP  facet F07  effort M
- Legacy: Status mutation catches optimistic lock as 409 `This record was modified by someone else. Please refresh and try again.` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:687-697`
- vNext now: New stage command locks rows and updates version; external error mapping not same text `src/modules/placements/college-application-stage-service.ts:52-69,152-163`
- Fix: Provide explicit 409 stale status handling and reload action when version changed

## G2-2-016-111  [P1] GAP  facet F10  effort L
- Legacy: PUT single applicant status calls updateApplicationStatus including notification and audit `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:637-704`
- vNext now: New stage command stores stage+history+activity and in-app notifications `src/modules/placements/college-application-stage-service.ts:33-185`
- Fix: Verify every legacy status branch, emails and cross-drive offer cascade, not only stage row

## G2-2-016-137  [P1] GAP  facet F15  effort L
- Legacy: Legacy application status transition may trigger assessment and rejection notice via service `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:637-679`
- vNext now: New inserts activity and in-app notification per moved applicant `src/modules/placements/college-application-stage-service.ts:166-180`
- Fix: Compare recipient, channel (email vs in-app), template, timing and retry for each status

## G2-2-016-156  [P1] GAP  facet F21  effort L
- Legacy: Legacy status mutation triggers downstream service notifications and audits `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:516-603,637-704`
- vNext now: New writes activity event + in-app notification transactionally `src/modules/placements/college-application-stage-service.ts:162-180`
- Fix: Match email adapter and ensure post-commit delivery to avoid duplicate/ghost sends

## G2-9-010-049  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:637-705` — PUT application status transitions, updates status-history and messages
- vNext now: `src/modules/placements/college-application-stage-service.ts:152-180` — Stage move persists college stage, screening state, audit event and in-app notification
- Fix: Maintain legacy status/history and notify semantics with documented separate stage model

## G2-9-010-068  [P1] GAP  facet F15  effort L
- Legacy: `docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:73-83` — Bulk transitions explicitly promise students told; Hired withdraws other applications and cancels interviews
- vNext now: `src/modules/placements/college-application-stage-service.ts:166-179` — Writes per-action inAppNotifications and activityEvents but no cross-drive withdrawal in this service
- Fix: Match downstream student notifications and cascade on confirmed hiring via real offer flow

## G2-9-014-053  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1070-1120` — Assessment transition optionally persists job-level URL or per-application URL; dispatch notification.
- vNext now: `src/modules/placements/college-application-stage-service.ts:33-49` — Stage mutation uses reason and in-app notifications, no assessment URL in shortlist.
- Fix: Support assessment URL distribution and optional save-to-drive.

## G2-9-014-061  [P1] GAP  facet F12  effort L
- Legacy: `docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:4-13` — Legacy status transition map includes Assessment->Interview, Interview->Offered, Offered->Hired and Reject.
- vNext now: `src/modules/placements/college-application-stage-service.ts:73-97` — New stage transitions and real-offer checks impose additional constraints.
- Fix: Review transition matrix row-by-row; explain intended changed safeguards.

## G2-9-014-071  [P1] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:77-91` — Bulk preview says each student is told on shortlist/interview/waitlist/offer/hire; hire cancels other applications/interviews.
- vNext now: `src/modules/placements/college-application-stage-service.ts:33-37` — College stage service explicitly disallows email notifications, supports in-app.
- Fix: Document exact recipient and notification type for each transition.

## G2-13-010-022  [P2] GAP  facet F07  effort S
- Legacy: Old validateTransition throws IllegalArgumentException formatted with valid next list (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:106-113`)
- vNext now: New service throws concise `Invalid transition: X to Y` (`src/modules/placements/college-application-stage-service.ts:79-81`)
- Fix: Include permitted next statuses, preserve error clarity.

## G2-13-010-026  [P2] GAP  facet F08  effort S
- Legacy: Legacy caller rejects with `Cannot move from X to Y` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:58-62`)
- vNext now: New backend error `Invalid transition: X to Y` (`src/modules/placements/college-application-stage-service.ts:79-81`)
- Fix: Preserve exact domain wording if client tests depend on it.
