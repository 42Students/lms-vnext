# Verification packet (P1 round 2): 4 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-9-017-086 [P1] GAP facet F19
- Files: src/app/(authenticated)/college/lecture-halls/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:71-91` — Fetch halls/departments independently and failures isolated.
- Expected fix: Decouple lookup and list reads.

## G2-18-023-068 [P1] GAP facet F22
- Files: src/modules/placements/learner-placement-rules-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementRulesService.java:40-80 JSON placement_batch.rules_json overlays college_placement_rules
- Expected fix: Read persisted cohort/batch overrides and add effective rules projection.

## G2-9-028-028 [P1] GAP facet F07
- Files: src/app/(authenticated)/admin/batch-promotion/page.tsx
- Legacy: Preview fetch failure explains couldn't verify; disables promotion `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:191-205,527-548`
- Expected fix: Catch unexpected preview errors with fail-closed local Retry

## G2-9-035-007 [P1] GAP facet F02
- Files: src/app/(authenticated)/dashboard/page.tsx
- Legacy: No college global view consists of hero, exactly four action cards, scope tip `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:45-80`
- Expected fix: Match global section hierarchy and place metrics only where old scoped design shows them
