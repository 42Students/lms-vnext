# Work packet: edit src/modules/placements/tpo-student-nudge-send-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/tpo-mail-service.md

## G2-18-010-003  [P1] GAP  facet F01  effort M
- Legacy: Legacy student sendToStudentAsCollege sends placement-branded email (`TpoMailService.java:99-110`).
- vNext now: New TPO student nudge is in-app notification only (`tpo-student-nudge-send-service.ts:15-19,46-65`).
- Fix: Audit student placement event-to-channel matrix, implement email when required.

## G2-18-010-071  [P1] GAP  facet F23  effort L
- Legacy: Legacy support recruiter/system/student email under one branded abstraction (`TpoMailService.java:73-110`).
- vNext now: New TPO student nudges send only in-app and email bridge supports recruiter digest only (`tpo-student-nudge-send-service.ts:15-19,46-65`; `recruiter-message-email-provider.ts:9-21`).
- Fix: Create event/channel coverage matrix, add missing mail event integrations intentionally.

## G2-18-010-032  [P2] GAP  facet F08  effort S
- Legacy: Legacy sendToStudentAsCollege is fire-and-forget result for specific placement events (`TpoMailService.java:99-110`).
- vNext now: New student nudges return `{sent,skipped}` in-app counts (`tpo-student-nudge-send-service.ts:46-66`).
- Fix: Separate email count and in-app count, avoid labeling only-in-app as emailed.
