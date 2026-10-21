# Work packet: edit src/modules/placements/college-bulk-drive-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-job-controller.md

## G2-2-016-063  [P1] GAP  facet F03  effort M
- Legacy: Job bulk open/close accepts max 100 IDs via jobIds/isActive `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:288-333`
- vNext now: College bulk action requires confirmed true, OPEN/CLOSE action and max 25 UUIDs `src/modules/placements/college-bulk-drive-service.ts:11-16`
- Fix: Either retain 100-job selection or show 25 cap and batch confirmation explicitly

## G2-2-016-092  [P2] GAP  facet F07  effort S
- Legacy: Bulk drive: jobIds and isActive required; jobIds non-empty numbers `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:303-318`
- vNext now: New strict UUID array min1/max25 and confirmed true `src/modules/placements/college-bulk-drive-service.ts:11-16`
- Fix: Show precise invalid-selection, duplicate-ID and confirmation errors

## G2-2-016-098  [P2] GAP  facet F08  effort S
- Legacy: Bulk drive success `Drives updated` and errors `Failed to update drives: ...` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:319-331`
- vNext now: New returns per-row updated/skipped results and reasons `src/modules/placements/college-bulk-drive-service.ts:55-56`
- Fix: Render updated count and skipped reasons with exact confirmation copy
