# Work packet (wave 2): edit src/modules/messaging/tpo-campaign-draft-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/tpo-email-campaign-service.md, docs/audit/gap2/lane-20/tpo-email-campaign-controller.md

## G2-19-010-011  [P2] GAP  facet F04  effort M
- Legacy: Legacy list returns id, subject, createdAt, recipients, sent, skipped, failed, `sentBy` from faculty name `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:43-47`
- vNext now: vNext lists campaignId/title/subject/segment/status/sender_name/created_at/sent/failed/skipped from drafts `src/modules/messaging/tpo-campaign-draft-service.ts:98-114`
- Fix: Make old list fields available; use sender displayName mapping and explicit recipients count.

## G2-19-010-012  [P3] GAP  facet F04  effort S
- Legacy: Legacy latest 100 by numeric campaign ID descending `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:43-47`
- vNext now: vNext latest 100 by createdAt DESC then UUID `src/modules/messaging/tpo-campaign-draft-service.ts:102-114`
- Fix: Document deterministic chronological sort and legacy backfill order.

## G2-20-022-007  [P3] GAP  facet F05  effort S
- Legacy: Latest100 sorted id DESC `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:44-48`
- vNext now: Drafts latest100 by createdAt DESC, ID DESC `src/modules/messaging/tpo-campaign-draft-service.ts:102-114`
- Fix: Document tie sorting and old/new chronology
