# Work packet (wave 2): edit src/modules/placements/tpo-recruiter-lead-policy.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/choices-controller.md

## G2-2-030-013  [P2] GAP  facet F04  effort M
- Legacy: ChoicesController.java:69-74 lead sources include pickable true/false.
- vNext now: src/modules/placements/tpo-recruiter-lead-policy.ts:1-15 defines lead stage but not pickable source metadata.
- Fix: Represent all nine source choices including non-pickable manual/import with boolean in shared policy.

## G2-2-030-041  [P2] GAP  facet F12  effort M
- Legacy: ChoicesController.java:70-74 SOURCES include system MANUAL/IMPORT marked pickable false.
- vNext now: src/modules/placements/tpo-recruiter-lead-policy.ts:1-15 maps stages, not input-source capability.
- Fix: Prohibit MANUAL and IMPORT from user picker, but support them as system-generated source labels.

## G2-2-030-071  [P2] GAP  facet F23  effort S
- Legacy: ChoicesController.java:68-75 marks MANUAL/IMPORT sources unpickable, but includes them for reports.
- vNext now: src/modules/placements/tpo-recruiter-lead-policy.ts:1-15 addresses stages rather than central source options.
- Fix: Ensure reports retain system sources but picker hides them.
