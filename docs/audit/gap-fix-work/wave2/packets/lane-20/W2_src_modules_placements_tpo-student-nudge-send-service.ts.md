# Work packet (wave 2): edit src/modules/placements/tpo-student-nudge-send-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/tpo-mail-service.md, docs/audit/gap2/lane-4/tpo-students-hub-controller.md

## G2-18-010-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy students see `{college} Placement Cell` sender (`TpoMailService.java:99-115`).
- vNext now: New TPO student nudge channel is in-app with title `Message from Placement Cell` (`tpo-student-nudge-send-service.ts:58-62`).
- Fix: If student mail restored use exact college Placement Cell From name, do not treat notification title as substitute.

## G2-18-010-024  [P2] GAP  facet F06  effort S
- Legacy: Legacy student sendToStudentAsCollege replyTo=null and fromAddress=null (`TpoMailService.java:99-110`).
- vNext now: New notifications to students have no email reply header, because no email is sent (`tpo-student-nudge-send-service.ts:58-62`).
- Fix: If email reinstated preserve no Reply-To and correct platform sender.

## G2-4-022-019  [P2] GAP  facet F06  effort M
- Legacy: Legacy bulk nudge takes free message string. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:85-89`)
- vNext now: New nudge POST uses own validated service and in-app delivery. (`src/app/api/placements/tpo/students/nudges/route.ts:7-16`; `src/modules/placements/tpo-student-nudge-send-service.ts:15-26`)
- Fix: Verify exact message length/default and recipient affordance.

## G2-4-022-051  [P2] GAP  facet F15  effort M
- Legacy: Legacy nudge is an outbound message, service return sent count. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:85-89`)
- vNext now: New nudge send service writes private in-app message plus transactional audit. (`src/modules/placements/tpo-student-nudge-send-service.ts:15-20`; `src/modules/placements/tpo-student-nudge-send-service.ts:27-65`)
- Fix: Confirm old nudge channel SMS/email/in-app and templates/recipient opt-out.

## G2-18-010-009  [P3] GAP  facet F03  effort S
- Legacy: Legacy student prefix `Placement Cell` exact case (`TpoMailService.java:99-115`).
- vNext now: New student nudge uses generic title `Message from Placement Cell`, no per-college sender (`tpo-student-nudge-send-service.ts:58-62`).
- Fix: Keep literal From-name if email channel is implemented.
