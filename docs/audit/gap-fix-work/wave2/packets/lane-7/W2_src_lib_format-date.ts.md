# Work packet (wave 2): edit src/lib/format-date.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/cross-22-copy-time-accessibility.md

## G2-2-037-033  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassScheduleController.java:102-119 inclusive local end day
- vNext now: src/lib/format-date.ts:6-27 fixed IST instant formatter
- Fix: Define date-only filter day windows in IST, convert to UTC exclusive next day.

## G2-2-037-063  [P2] GAP  facet F23  effort S
- Legacy: src/lib/safe-format.ts:6-10 safe date helper fallback em dash
- vNext now: src/lib/format-date.ts:21-27 direct DateTimeFormat could throw invalid date
- Fix: Use safe formatter wrappers consistently for null/invalid values.
