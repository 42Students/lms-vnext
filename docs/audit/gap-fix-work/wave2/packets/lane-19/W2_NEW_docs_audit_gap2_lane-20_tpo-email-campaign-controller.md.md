# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-20/tpo-email-campaign-controller.md

5 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/tpo-email-campaign-controller.md

## G2-20-022-001  [P2] GAP  facet F01  effort M
- Legacy: Single GET/POST /api/v1/tpo/campaigns `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoEmailCampaignController.java:17-42`
- vNext now: New history and draft/send routes [A:29-45,R:9-19]
- Fix: Crosswalk legacy URLs and two-stage send

## G2-20-022-009  [P2] GAP  facet F06  effort S
- Legacy: Send max500 unique lead IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:56-59`
- vNext now: Selected IDs max100, eligible max500 [M:8-9,P:19-49]
- Fix: Explain two recipient caps

## G2-20-022-019  [P2] GAP  facet F13  effort S
- Legacy: Legacy mail not configured still records campaign `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:60-64`
- vNext now: New draft can exist while send returns NOT_READY [D:32-87,O:25-44]
- Fix: Show retryable provider-disabled state

## G2-20-022-021  [P2] GAP  facet F15  effort M
- Legacy: Recruiter-campaign ZeptoMail merge and unsub link `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:29-41,86-94`
- vNext now: New dedicated template and recipient signed token [O:25-38,U:21-38]
- Fix: Verify tenant-domain links and template

## G2-20-022-030  [P2] GAP  facet F22  effort L
- Legacy: Old campaign and recipient SQL records statuses/email `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:44-48,108-112`
- vNext now: New UUID campaigns/recipient HMAC+drafts+receipt tables [T:295-384,D:67-85]
- Fix: Map schema safely, no plaintext tokens
