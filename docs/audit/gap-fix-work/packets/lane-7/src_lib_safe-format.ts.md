# Work packet: edit src/lib/safe-format.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/cross-22-copy-time-accessibility.md

## G2-2-037-021  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassScheduleController.java:103-119 invalid start/end date precise
- vNext now: src/lib/safe-format.ts:29-37 different date-range message
- Fix: Expose domain-specific legacy field error where appropriate, don't apply generic text everywhere.
