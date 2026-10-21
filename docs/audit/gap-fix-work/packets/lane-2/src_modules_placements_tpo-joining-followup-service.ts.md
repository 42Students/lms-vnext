# Work packet: edit src/modules/placements/tpo-joining-followup-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/job-offer.md

## G2-13-015-012  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:73-87` acceptance channel, 48-hour disputable timestamp, joiningStatus, cascadeId
- vNext now: `src/db/schema/placements.ts:1552-1556` channel/disputable/cascadeId, `src/modules/placements/tpo-joining-followup-service.ts:1-?` joining separate table
- Fix: Reconstruct joiningStatus as vNext joining outcome record and verify cascade identifiers/data retention
