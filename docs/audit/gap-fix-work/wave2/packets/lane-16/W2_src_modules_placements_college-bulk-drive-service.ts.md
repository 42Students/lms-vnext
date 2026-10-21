# Work packet (wave 2): edit src/modules/placements/college-bulk-drive-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-job-controller.md

## G2-2-016-086  [P2] GAP  facet F06  effort M
- Legacy: Legacy set status from boolean isActive in job body `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:401-425`
- vNext now: New status operation is OPEN/CLOSE with confirmed flag; different draft/closed semantics `src/modules/placements/college-bulk-drive-service.ts:11-16`
- Fix: Map old activation states to modern lifecycle and reject impossible transitions clearly

## G2-2-016-127  [P2] GAP  facet F12  effort M
- Legacy: Bulk drive jobIds may be numeric; underlying service caps 100 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:303-319`
- vNext now: New UUID array must be unique and max25 `src/modules/placements/college-bulk-drive-service.ts:11-16`
- Fix: Show smaller cap and duplicate selection error

## G2-2-016-144  [P3] GAP  facet F18  effort S
- Legacy: Legacy bulk job response string `Drives updated` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:319-321`
- vNext now: New only updated/skipped JSON counts `src/modules/placements/college-bulk-drive-service.ts:55-56`
- Fix: Show old phrase in success toast and distinct skipped warning
