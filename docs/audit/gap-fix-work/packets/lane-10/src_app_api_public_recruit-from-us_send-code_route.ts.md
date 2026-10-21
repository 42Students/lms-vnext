# Work packet: edit src/app/api/public/recruit-from-us/send-code/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/public-placements-page-controller.md

## G2-4-026-045  [P1] GAP  facet F10  effort M
- Legacy: POST send-code validates host+published page then Zepto email (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicPlacementsPageController.java:58-63`)
- vNext now: Origin check, tenant lookup and sendPublicEnquiryCode (`src/app/api/public/recruit-from-us/send-code/route.ts:7-21`)
- Fix: Gate sends on actually published page and equivalent eligibility; preserve stronger anti-abuse.
