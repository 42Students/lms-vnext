# Work packet: edit src/modules/placements/tpo-outcome-label-settings-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/choices-controller.md

## G2-2-030-035  [P1] GAP  facet F11  effort M
- Legacy: ChoicesController.java:85-92 collegeOrNull returns fixed arrays to no-college/recruiter session.
- vNext now: src/modules/placements/tpo-outcome-label-settings-service.ts:38-51 requires TPO or college admin and active college.
- Fix: Provide safe fixed catalog to all authenticated account types with empty dynamic arrays where no college.

## G2-2-030-026  [P2] GAP  facet F07  effort M
- Legacy: ChoicesController.java:85-91 returns fixed options even on RuntimeException resolving tenant.
- vNext now: src/modules/placements/tpo-outcome-label-settings-service.ts:38-51 requires tenant/TPO and can throw for missing actor.
- Fix: Separate public fixed catalog from restricted custom labels, preserving fixed-only fallback for recruiter sessions.
