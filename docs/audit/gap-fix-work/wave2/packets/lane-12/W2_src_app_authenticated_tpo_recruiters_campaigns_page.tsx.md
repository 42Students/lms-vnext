# Work packet (wave 2): edit src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/tpo-email-campaign-service.md, docs/audit/gap2/lane-20/tpo-email-campaign-controller.md

## G2-19-010-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy Engage Companies/recruiter table `Act > Send an email` opens CampaignComposer; listed emails directly inside Engage `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:11-23` `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:60-64`
- vNext now: vNext Emails tab under `/tpo/recruiters/campaigns`, separate `New email campaign` link and draft page `src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx:29-45`
- Fix: Keep Engage selected-recruiter compose entry and permit direct navigation to the new draft with selected IDs.

## G2-19-010-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy campaign history inside one Card, simple List rows `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:60-76`
- vNext now: vNext Emails page has header, filters, campaign cards plus delivery batch receipts `src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx:29-101`
- Fix: Restore primary compact list order and show extra receipt section separately.

## G2-19-010-046  [P2] GAP  facet F13  effort M
- Legacy: Legacy history request error alert with Retry; empty `No emails sent from Engage yet.` `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:52-64`
- vNext now: vNext draft unavailable alert; no campaigns yet; receipt empty reuses old wording `src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx:55-60` `src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx:95-96`
- Fix: Distinguish no campaigns vs no sent campaigns and restore retry affordance.

## G2-19-010-054  [P2] GAP  facet F16  effort M
- Legacy: Legacy campaign history single Card/List with inline Tag counts `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:60-75`
- vNext now: vNext grid of two cards on lg and separate batch receipts `src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx:61-96`
- Fix: Restore legacy card spacing/row density and tag palette at md/phone.

## G2-20-022-002  [P2] GAP  facet F01  effort S
- Legacy: Engage recruitment campaigns `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoEmailCampaignController.java:17-20`
- vNext now: Emails nested under recruiters `src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx:29-42`
- Fix: Preserve navigation hierarchy

## G2-20-022-003  [P2] GAP  facet F02  effort M
- Legacy: Campaign list subject,sender,counts `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:44-48`
- vNext now: New separate drafts and delivery receipts `src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx:55-96`
- Fix: Make section order explicit

## G2-20-022-004  [P2] GAP  facet F03  effort S
- Legacy: Legacy GET emailAvailable boolean `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoEmailCampaignController.java:32-35`
- vNext now: New ready/disabled warning `src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx:78-79`
- Fix: Show send readiness state

## G2-20-022-006  [P2] GAP  facet F04  effort S
- Legacy: List includes sent,skipped,failed,recipients `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:44-48`
- vNext now: New status,segment and per-batch receipt counts `src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx:68-94`
- Fix: Show count semantics correctly

## G2-20-022-025  [P2] GAP  facet F18  effort S
- Legacy: Old label campaigns from Engage `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoEmailCampaignController.java:17-20`
- vNext now: New Emails/New email campaign/Back to Engage `src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx:29-42`
- Fix: Match old copy catalogue or document rename

## G2-19-010-009  [P3] GAP  facet F03  effort S
- Legacy: Legacy list status tags `N sent`, conditional `skipped`/`failed` `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:67-73`
- vNext now: vNext campaign cards status plus counts and delivery batch totals `src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx:72-94`
- Fix: Match status chip colors, conditional visibility and count placement.

## G2-19-010-013  [P3] GAP  facet F04  effort S
- Legacy: Legacy history timestamp `HH:mm D MMM YYYY`, local dayjs `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:67-70`
- vNext now: vNext explicit IST timestamp via tpoCampaignHistoryTime `src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx:69-71`
- Fix: Match exact date/clock rendering in user-facing history.
