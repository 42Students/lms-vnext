# Work packet (wave 2): edit src/components/academics/section-operations.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/class-schedule-controller.md

## G2-2-032-014  [P2] GAP  facet F02  effort M
- Legacy: Legacy frontend ScheduleClassDrawer under course attendance/timetable opens create/update modal.
- vNext now: src/components/academics/section-operations.tsx:530-998 renders SectionOperations event tools.
- Fix: Clone old drawer, page head, controls and form hierarchy using shared shell.

## G2-2-032-016  [P2] GAP  facet F02  effort M
- Legacy: ClassScheduleController.java:344-393 schedule details include attendance/class roster context.
- vNext now: src/components/academics/section-operations.tsx:530-998 separates section schedule editing.
- Fix: Bring equivalent row details/status chips to staff schedule panel without exposing learners.

## G2-2-032-050  [P2] GAP  facet F09  effort M
- Legacy: Legacy ScheduleClassDrawer modal flow creates/edits recurring schedules.
- vNext now: section-operations.tsx:530-998 renders event create form in section operations.
- Fix: Match drawer width, overlay padding, footer buttons and cancel confirmation.

## G2-2-032-080  [P2] GAP  facet F16  effort M
- Legacy: Legacy schedule form includes startTime/endTime text fields.
- vNext now: section-operations.tsx:820-870 uses date/time Input controls.
- Fix: Align 320px form stacking, text overflow and keyboard input.

## G2-2-032-083  [P3] GAP  facet F18  effort S
- Legacy: ClassScheduleController.java:190 says `Class schedule deleted successfully`.
- vNext now: section-operations.tsx:520 says `Schedule event cancelled`.
- Fix: Decide literal copy parity vs transparent cancellation terminology.
