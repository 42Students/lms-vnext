# Work packet: edit src/modules/placements/tpo-followup-queue-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u022-tpo-recruiter-lead-controller.md

## G2-14-022-027  [P3] GAP  facet F08  effort S
- Legacy: Legacy markDone returns 204 no content `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterLeadController.java:127-132`
- vNext now: New complete returns id and done true `src/modules/placements/tpo-followup-queue-service.ts:174-225`
- Fix: Avoid duplicate success toast when consuming old clients
