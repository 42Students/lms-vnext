# Work packet (wave 2): edit src/modules/messaging/tpo-campaign-dispatch-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/tpo-email-campaign-service.md, docs/audit/gap2/lane-20/tpo-email-campaign-controller.md, docs/audit/gap2/lane-4/cross-notifications.md

## G2-19-010-036  [P2] GAP  facet F10  effort M
- Legacy: Legacy marks company outreach EMAILED only if company key not present `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:97-101`
- vNext now: vNext upsert company communication on sent, only overwrites NOT_CONTACTED `src/modules/messaging/tpo-campaign-dispatch-service.ts:182-199`
- Fix: Verify no regression in company outreach transition/audit and duplicate company keys.

## G2-19-010-045  [P2] GAP  facet F13  effort S
- Legacy: Legacy email not configured returns summary with all rows NOT_CONFIGURED (no delivery), no transport exception `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:60-82` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:114-120`
- vNext now: vNext draft may save, dispatch raises NOT_READY and UI warns `src/modules/messaging/tpo-campaign-dispatch-service.ts:25-44` `src/components/tpo/tpo-campaign-send-control.tsx:41-50`
- Fix: Match warning semantics; don't mark draft as SENT when no provider.

## G2-19-010-049  [P2] GAP  facet F14  effort M
- Legacy: Legacy template provided by ZeptoMail `recruiter-campaign` and signature `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:29-40` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:85-93` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMailService.java:21-24`
- vNext now: vNext template key field provisioned and provider configured by env `src/components/tpo/tpo-campaign-compose.tsx:128-133` `src/modules/messaging/tpo-campaign-dispatch-service.ts:25-38`
- Fix: Map fixed recruiter-campaign template to provisioned allowed template key; no OTP reuse.

## G2-20-022-014  [P2] GAP  facet F10  effort M
- Legacy: Legacy sequential send and recipient statuses `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:68-112`
- vNext now: New DRAFT→SENDING and recipient PENDING→QUEUED→SENT/FAILED `src/modules/messaging/tpo-campaign-dispatch-service.ts:47-51,103-121,171-181`
- Fix: Document unknown queued-after-crash and recovery

## G2-20-022-016  [P2] GAP  facet F11  effort M
- Legacy: Sender authenticated faculty scoped college `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoEmailCampaignController.java:37-42`
- vNext now: Active TPO with placements.manage required `src/modules/messaging/tpo-campaign-dispatch-service.ts:52-67`
- Fix: Check admin/faculty guest send permission

## G2-20-022-029  [P2] GAP  facet F21  effort M
- Legacy: Legacy uses TpoMailService and college sender `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:29-41`
- vNext now: New provider config HTTPS origin and verified template `src/modules/messaging/tpo-campaign-dispatch-service.ts:25-38`
- Fix: Verify provider sending brand and origin

## G2-4-032-041  [P2] GAP  facet F12  effort M
- Legacy: Legacy job application/shortlisted/rejected in-app and SMS, not email (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/NotificationEventRegistry.java:52-70`)
- vNext now: Campaign emails independently targeted to eligible recruiter leads (`src/modules/messaging/tpo-campaign-dispatch-service.ts:102-113`)
- Fix: Keep separate learner transactional notifications from promotional recruiter campaigns.

## G2-4-032-065  [P2] GAP  facet F20  effort M
- Legacy: Cluster lock prevents duplicate cron deliveries (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:65-77`)
- vNext now: Single claim DRAFT→SENDING, QUEUED not automatically retried (`src/modules/messaging/tpo-campaign-dispatch-service.ts:47-50`)
- Fix: Use lock/dedupe on reminder workers; define unknown send state recovery.
