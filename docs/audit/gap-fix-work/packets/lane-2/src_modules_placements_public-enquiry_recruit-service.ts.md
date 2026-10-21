# Work packet: edit src/modules/placements/public-enquiry/recruit-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/placements-index.md, docs/audit/gap2/lane-4/public-placements-page-controller.md

## G2-11-001-029  [P1] GAP  facet F06  effort M
- Legacy: Server name max150, company max200 after clean(). `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:132`
- vNext now: Name max120/company max150 strict. `src/modules/placements/public-enquiry/recruit-service.ts:18`
- Fix: Align validation lengths and normalization.

## G2-11-001-046  [P1] GAP  facet F10  effort M
- Legacy: Duplicate existing lead reused; activity includes quoted note. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:143`
- vNext now: Lead + enquiry insert, generic note only. `src/modules/placements/public-enquiry/recruit-service.ts:80`
- Fix: Include cleaned hiring note in lead activity.

## G2-11-001-072  [P1] GAP  facet F20  effort M
- Legacy: Legacy note clean() sanitizes and truncates. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:190`
- vNext now: New Zod trim/max, no equivalent sanitizer in schema. `src/modules/placements/public-enquiry/recruit-service.ts:18`
- Fix: Match input sanitation and test markup.

## G2-4-026-029  [P1] GAP  facet F06  effort M
- Legacy: Server name sanitized/truncated at150, company200, note1000 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:130-143`)
- vNext now: Strict name120/company150/hiringFor1500 (`src/modules/placements/public-enquiry/recruit-service.ts:16-21`)
- Fix: Unify server maxlength, optional company and text semantics with legacy.

## G2-4-026-080  [P1] GAP  facet F20  effort M
- Legacy: User inputs sanitised/truncated before persistence (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:188-193`)
- vNext now: Zod bounded validation, no legacy InputSanitizer call (`src/modules/placements/public-enquiry/recruit-service.ts:16-21`)
- Fix: Sanitise HTML/control chars before activity/notification output.

## G2-4-026-032  [P2] GAP  facet F07  effort S
- Legacy: Blank name yields NAME_REQUIRED/`Enter your name` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:131-134`)
- vNext now: Generic INVALID for missing name (`src/modules/placements/public-enquiry/recruit-service.ts:16-25`)
- Fix: Return field-specific NAME_REQUIRED to UI.

## G2-4-026-038  [P2] GAP  facet F08  effort S
- Legacy: Recruit returns `{status:'RECEIVED'}` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:129-146`)
- vNext now: Recruit returns `{received:true}` (`src/modules/placements/public-enquiry/recruit-service.ts:103-108`)
- Fix: Restore status alias for old consumers.
