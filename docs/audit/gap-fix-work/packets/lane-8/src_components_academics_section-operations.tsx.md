# Work packet: edit src/components/academics/section-operations.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/class-schedule-controller.md

## G2-2-032-047  [P3] GAP  facet F08  effort S
- Legacy: ClassScheduleController.java:189-190 delete message `Class schedule deleted successfully`.
- vNext now: schedule-service.ts:477-501 marks CANCELLED; section-operations.tsx:520 says `Schedule event cancelled`.
- Fix: Choose old delete wording or explicit canceled wording, preserve feedback placement.
