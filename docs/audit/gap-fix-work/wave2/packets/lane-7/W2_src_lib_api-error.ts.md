# Work packet (wave 2): edit src/lib/api-error.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/cross-02-authorization-roles.md

## G2-2-036-048  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/access/AccessControlService.java:100 'You do not teach this course or class'
- vNext now: src/lib/api-error.ts:214-221 scope code + friendly message
- Fix: Match denial copy to legacy where safe.
