# Work packet: edit src/modules/placements/public-enquiry/send-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/placements-index.md, docs/audit/gap2/lane-4/public-placements-page-controller.md

## G2-11-001-049  [P1] GAP  facet F11  effort M
- Legacy: Code/recruit require published page, not merely flag. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicPlacementsPageController.java:61`
- vNext now: POST services check enabled only, not fresh publication. `src/modules/placements/public-enquiry/send-service.ts:36`
- Fix: Call full publication guard for POST.

## G2-4-026-037  [P2] GAP  facet F08  effort S
- Legacy: Code response `{status:'CODE_SENT',email:lowercased}` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:119-127`)
- vNext now: Code response `{sent:true}` (`src/modules/placements/public-enquiry/send-service.ts:56-63`)
- Fix: Return normalized destination email and status compatibility.
