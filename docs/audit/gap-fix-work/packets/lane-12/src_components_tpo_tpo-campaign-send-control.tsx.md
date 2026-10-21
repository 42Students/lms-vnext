# Work packet: edit src/components/tpo/tpo-campaign-send-control.tsx

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

## G2-19-010-028  [P2] GAP  facet F08  effort S
- Legacy: Legacy successful send toast counts accepted SENT/skipped/failed `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:27-29`
- vNext now: vNext InlineNotice counts acceptedByProvider with qualification `src/components/tpo/tpo-campaign-send-control.tsx:58-59`
- Fix: Match counts and feedback location, preserve provider truth caveat.

## G2-19-010-029  [P2] GAP  facet F08  effort S
- Legacy: Legacy email send failure toast `Couldn't send` or server message `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:25-29`
- vNext now: vNext persistent inline `The campaign could not be sent. Refresh before retrying.` / ALREADY_STARTED `src/components/tpo/tpo-campaign-send-control.tsx:26-35`
- Fix: Provide actionable error and avoid retrying unverified send.
