# Work packet: edit src/components/tpo/tpo-campaign-compose.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/tpo-email-campaign-service.md

## G2-19-010-002  [P1] GAP  facet F01  effort L
- Legacy: Legacy GET/POST routes `/api/v1/tpo/campaigns`, without draft URL `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoEmailCampaignController.java:17-42`
- vNext now: vNext POST `/api/placements/tpo/campaigns/drafts` then `/drafts/{campaignId}/send` `src/components/tpo/tpo-campaign-compose.tsx:64-73` `src/components/tpo/tpo-campaign-send-control.tsx:22-33`
- Fix: Document API mapping; migrate legacy direct-send bookmarks to controlled draft/confirm workflow.

## G2-19-010-004  [P1] GAP  facet F02  effort M
- Legacy: Legacy composer one modal `Email N recruiters` with Subject and Email fields, immediate Send `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:20-44`
- vNext now: vNext standalone Write a campaign form, audience preview, Save draft then separate send page `src/components/tpo/tpo-campaign-compose.tsx:78-146` `src/components/tpo/tpo-campaign-send-control.tsx:41-57`
- Fix: Match modal density/entry and clearly show 2-step safety workflow; don't send without explicit confirmation.

## G2-19-010-021  [P1] GAP  facet F06  effort M
- Legacy: Legacy direct Send click validates then POST with subject/body/recruiterLeadIds `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:22-29`
- vNext now: vNext Save draft POST, Preview, then separate ConfirmDialog/send POST `src/components/tpo/tpo-campaign-compose.tsx:54-74` `src/components/tpo/tpo-campaign-send-control.tsx:54-57`
- Fix: Retain intentional double-confirm safety, update entry help and completion states.

## G2-19-010-024  [P2] GAP  facet F07  effort S
- Legacy: Legacy backend errors `Give the email a subject`, `Write the email`, `Choose who gets it` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:51-59`
- vNext now: vNext client schema errors min2 and `No eligible email recipients match this audience` `src/modules/messaging/tpo-campaign-draft-model.ts:3-11` `src/components/tpo/tpo-campaign-compose.tsx:69-72`
- Fix: Map literal field-level error copy; keep explicit eligibility reason.

## G2-19-010-025  [P2] GAP  facet F07  effort S
- Legacy: Legacy frontend Subject rule `Give it a subject` `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:38-38`
- vNext now: vNext generic Zod min2 issue shown inline via setError `src/components/tpo/tpo-campaign-compose.tsx:58-61`
- Fix: Match exact field-level validation message in draft form.
