# Work packet (wave 2): edit src/app/api/admin/inbound-mail/status/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-inbound-mail.md, docs/audit/gap2/lane-8/l13-u024-superadmin-inbound-mail-controller.md

## G2-10-009-061  [P2] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/frontend/src/api/Services/SuperAdminInboundMailService.js:11` POST /{id}/done?done=true\|false
- vNext now: `src/app/api/admin/inbound-mail/status/route.ts:9-26` PATCH /api/admin/inbound-mail/status with expectedStatus/version
- Fix: Maintain UI semantics and document new CAS mutation API

## G2-13-024-003  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:80-87 POST /{id}/done?done=true\|false
- vNext now: src/app/api/admin/inbound-mail/status/route.ts:9-26 PATCH /api/admin/inbound-mail/status with expectedStatus/version
- Fix: Map done/reopen actions to CAS status mutation and preserve old URL if needed
