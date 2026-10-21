# Work packet (wave 2): edit src/modules/placements/tpo-followup-queue-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u022-tpo-recruiter-lead-controller.md

## G2-14-022-030  [P2] GAP  facet F09  effort M
- Legacy: Legacy add followup and move directly via endpoints `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterLeadController.java:120-138`
- vNext now: New confirmed queue create/done and move in CRM service `src/modules/placements/tpo-followup-queue-service.ts:129-225` `src/modules/placements/tpo-crm-service.ts:453-483`
- Fix: Align followup edit dialog and due date time picker

## G2-14-022-034  [P2] GAP  facet F10  effort S
- Legacy: Legacy markDone idempotent (already done returns no change) `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:248-253`
- vNext now: New confirmed completion returns ALREADY_DONE error `src/modules/placements/tpo-followup-queue-service.ts:198-213`
- Fix: Make duplicate completion safe/idempotent after network retry

## G2-14-022-037  [P2] GAP  facet F11  effort M
- Legacy: Legacy mutation requires TPO/college admin current college matching lead/followup `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAccessGuard.java:13-19` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAccessGuard.java:132-138`
- vNext now: New college membership and placements.manage on write `src/modules/placements/tpo-crm-service.ts:185-200` `src/modules/placements/tpo-followup-queue-service.ts:29-53`
- Fix: Document college admin equivalent manage access where intentional

## G2-14-022-045  [P2] GAP  facet F13  effort S
- Legacy: Legacy empty followups GET returns empty list `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterLeadController.java:141-144`
- vNext now: New queue returns items + totals and filters `src/modules/placements/tpo-followup-queue-service.ts:57-124`
- Fix: Provide list-only result to old page action if still used

## G2-14-022-060  [P2] GAP  facet F20  effort S
- Legacy: Legacy move/followupDone locks open state, repeated Done no-op `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:239-265`
- vNext now: New CAS completion throws already-done `src/modules/placements/tpo-followup-queue-service.ts:198-213`
- Fix: Make repeat done idempotent for retries
