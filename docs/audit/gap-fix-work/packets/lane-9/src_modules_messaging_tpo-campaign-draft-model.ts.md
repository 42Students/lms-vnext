# Work packet: edit src/modules/messaging/tpo-campaign-draft-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/tpo-email-campaign-service.md, docs/audit/gap2/lane-20/tpo-email-campaign-controller.md

## G2-19-010-023  [P2] GAP  facet F07  effort S
- Legacy: Legacy backend cleans Subject to200, Body to10000 via sanitizer and trim, truncates overflow `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:51-59` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:158-162`
- vNext now: vNext strict Zod length min2/max200/10000 rejects rather than truncates `src/modules/messaging/tpo-campaign-draft-model.ts:3-11`
- Fix: Preserve safe sanitation; present actionable validation for overlimit instead of silent truncation.

## G2-19-010-024  [P2] GAP  facet F07  effort S
- Legacy: Legacy backend errors `Give the email a subject`, `Write the email`, `Choose who gets it` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:51-59`
- vNext now: vNext client schema errors min2 and `No eligible email recipients match this audience` `src/modules/messaging/tpo-campaign-draft-model.ts:3-11` `src/components/tpo/tpo-campaign-compose.tsx:69-72`
- Fix: Map literal field-level error copy; keep explicit eligibility reason.

## G2-20-022-010  [P2] GAP  facet F07  effort S
- Legacy: Exact missing subject/body errors `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:52-55`
- vNext now: Zod error response INVALID_CAMPAIGN `src/modules/messaging/tpo-campaign-draft-model.ts:3-12`
- Fix: Restore field-level original messages
