# Work packet (wave 2): edit src/components/tpo/tpo-campaign-send-control.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/tpo-email-campaign-service.md

## G2-19-010-007  [P2] GAP  facet F03  effort S
- Legacy: Legacy modal `Send` CTA enabled when emailAvailable and at least one reachable email `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:20-29`
- vNext now: vNext composer Save draft CTA even without deliveryReady, send control disabled if not ready `src/components/tpo/tpo-campaign-compose.tsx:142-145` `src/components/tpo/tpo-campaign-send-control.tsx:41-53`
- Fix: Explain draft vs send distinctly, show direct Send only on verified draft.

## G2-19-010-010  [P2] GAP  facet F03  effort S
- Legacy: Legacy send success `N sent, N skipped, N failed.` `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:27-29`
- vNext now: vNext InlineNotice `N accepted by provider · N failed · N skipped. Provider acceptance does not prove delivery.` `src/components/tpo/tpo-campaign-send-control.tsx:58-59`
- Fix: Preserve original count ordering where appropriate, retain truthful provider caveat.

## G2-19-010-022  [P2] GAP  facet F06  effort S
- Legacy: Legacy modal disabled if !available or reachable=0 `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:22-23`
- vNext now: vNext Send disabled if !ready/zero/busy; compose Save allowed before provider config `src/components/tpo/tpo-campaign-compose.tsx:142-145` `src/components/tpo/tpo-campaign-send-control.tsx:51-53`
- Fix: Explain draft-allowed/send-disabled difference in inline helper.

## G2-19-010-031  [P2] GAP  facet F09  effort M
- Legacy: Legacy AsyncModal compose opens from selected leads, closes onCancel `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:20-44`
- vNext now: vNext standalone form and separate ConfirmDialog only at send `src/components/tpo/tpo-campaign-compose.tsx:78-146` `src/components/tpo/tpo-campaign-send-control.tsx:54-57`
- Fix: Restore selected-leads composer overlay if owner requires, while saving draft first.

## G2-19-010-045  [P2] GAP  facet F13  effort S
- Legacy: Legacy email not configured returns summary with all rows NOT_CONFIGURED (no delivery), no transport exception `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:60-82` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:114-120`
- vNext now: vNext draft may save, dispatch raises NOT_READY and UI warns `src/modules/messaging/tpo-campaign-dispatch-service.ts:25-44` `src/components/tpo/tpo-campaign-send-control.tsx:41-50`
- Fix: Match warning semantics; don't mark draft as SENT when no provider.

## G2-19-010-059  [P2] GAP  facet F18  effort S
- Legacy: Legacy modal title `Email N recruiters` `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:22-22`
- vNext now: vNext form title `Write a campaign` then send title `Send this campaign` `src/components/tpo/tpo-campaign-compose.tsx:78-80` `src/components/tpo/tpo-campaign-send-control.tsx:41-42`
- Fix: Preserve audience-size context in modal/page title.
