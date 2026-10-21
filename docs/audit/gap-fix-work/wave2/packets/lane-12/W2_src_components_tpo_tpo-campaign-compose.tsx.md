# Work packet (wave 2): edit src/components/tpo/tpo-campaign-compose.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/tpo-email-campaign-service.md

## G2-19-010-007  [P2] GAP  facet F03  effort S
- Legacy: Legacy modal `Send` CTA enabled when emailAvailable and at least one reachable email `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:20-29`
- vNext now: vNext composer Save draft CTA even without deliveryReady, send control disabled if not ready `src/components/tpo/tpo-campaign-compose.tsx:142-145` `src/components/tpo/tpo-campaign-send-control.tsx:41-53`
- Fix: Explain draft vs send distinctly, show direct Send only on verified draft.

## G2-19-010-022  [P2] GAP  facet F06  effort S
- Legacy: Legacy modal disabled if !available or reachable=0 `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:22-23`
- vNext now: vNext Send disabled if !ready/zero/busy; compose Save allowed before provider config `src/components/tpo/tpo-campaign-compose.tsx:142-145` `src/components/tpo/tpo-campaign-send-control.tsx:51-53`
- Fix: Explain draft-allowed/send-disabled difference in inline helper.

## G2-19-010-031  [P2] GAP  facet F09  effort M
- Legacy: Legacy AsyncModal compose opens from selected leads, closes onCancel `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:20-44`
- vNext now: vNext standalone form and separate ConfirmDialog only at send `src/components/tpo/tpo-campaign-compose.tsx:78-146` `src/components/tpo/tpo-campaign-send-control.tsx:54-57`
- Fix: Restore selected-leads composer overlay if owner requires, while saving draft first.

## G2-19-010-049  [P2] GAP  facet F14  effort M
- Legacy: Legacy template provided by ZeptoMail `recruiter-campaign` and signature `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:29-40` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:85-93` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMailService.java:21-24`
- vNext now: vNext template key field provisioned and provider configured by env `src/components/tpo/tpo-campaign-compose.tsx:128-133` `src/modules/messaging/tpo-campaign-dispatch-service.ts:25-38`
- Fix: Map fixed recruiter-campaign template to provisioned allowed template key; no OTP reuse.

## G2-19-010-053  [P2] GAP  facet F16  effort M
- Legacy: Legacy composer AntD modal compact Subject+8-row Email textarea `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:20-44`
- vNext now: vNext full-page form with six-row textarea and larger responsive controls `src/components/tpo/tpo-campaign-compose.tsx:78-146`
- Fix: Match desktop modal density and mobile full-width while retaining safe touch targets.

## G2-19-010-058  [P2] GAP  facet F18  effort S
- Legacy: Legacy Email helper `Write {name} or {company}... signature and unsubscribe link added.` `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:39-41`
- vNext now: vNext preview shows placeholders, separate lengthy template note `src/components/tpo/tpo-campaign-compose.tsx:116-132`
- Fix: Restore exact helper text beside message textarea and keep provider caveat.

## G2-19-010-059  [P2] GAP  facet F18  effort S
- Legacy: Legacy modal title `Email N recruiters` `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:22-22`
- vNext now: vNext form title `Write a campaign` then send title `Send this campaign` `src/components/tpo/tpo-campaign-compose.tsx:78-80` `src/components/tpo/tpo-campaign-send-control.tsx:41-42`
- Fix: Preserve audience-size context in modal/page title.

## G2-19-010-018  [P3] GAP  facet F06  effort S
- Legacy: Legacy form Subject maxLength200, required; Email textarea rows8 max10000 `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:38-42`
- vNext now: vNext Subject maxLength200, Message textarea rows6 max10000 `src/components/tpo/tpo-campaign-compose.tsx:108-116`
- Fix: Use rows8 and label Email for modal-parity mode; preserve content limit.

## G2-19-010-057  [P3] GAP  facet F18  effort S
- Legacy: Legacy email composer field label `Email` vs vNext `Message` `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:39-42` `src/components/tpo/tpo-campaign-compose.tsx:112-114`
- vNext now: vNext Message label `src/components/tpo/tpo-campaign-compose.tsx:112-114`
- Fix: Use Email (or Email message) where this is the same flow.
