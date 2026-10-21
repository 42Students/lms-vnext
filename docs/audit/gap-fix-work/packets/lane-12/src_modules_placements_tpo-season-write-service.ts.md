# Work packet: edit src/modules/placements/tpo-season-write-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/tpo-season-controller.md

## G2-8-022-033  [P1] MISSING  facet F10  effort M
- Legacy: Legacy openRegistration sets isRegistrationOpen and deadline; saves season (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:44-50).
- vNext now: New create/close/edit mutate season fields but no registration flags (src/db/schema/placements.ts:383-415; src/modules/placements/tpo-season-write-service.ts:52-68).
- Fix: Reintroduce registration lifecycle write and linked learner eligibility read.
