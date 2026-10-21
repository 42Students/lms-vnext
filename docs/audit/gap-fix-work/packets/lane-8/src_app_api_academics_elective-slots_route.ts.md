# Work packet: edit src/app/api/academics/elective-slots/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/elective-admin-controller.md

## G2-4-024-036  [P2] GAP  facet F08  effort M
- Legacy: Legacy slot create/update returns HTTP200 full SlotView (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/electives/ElectiveAdminController.java:89-106`)
- vNext now: New POST201 `{slot}` raw persisted row, client refreshes without toast (`src/app/api/academics/elective-slots/route.ts:9-24`; `src/components/electives/college-slot-manager.tsx:77-88`)
- Fix: Preserve full view response and successful create/update feedback.
