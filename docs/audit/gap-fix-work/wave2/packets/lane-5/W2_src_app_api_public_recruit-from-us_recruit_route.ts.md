# Work packet (wave 2): edit src/app/api/public/recruit-from-us/recruit/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/public-placements-page-controller.md

## G2-4-026-079  [P2] GAP  facet F20  effort M
- Legacy: Domain/error response `{error, message}` with 400; PAGE_NOT_FOUND 404 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicPlacementsPageController.java:73-76`)
- vNext now: Generic error codes 400/429/503; no message (`src/app/api/public/recruit-from-us/recruit/route.ts:23-30`)
- Fix: Provide error-code translations to legacy form; preserve rate-limit status.
