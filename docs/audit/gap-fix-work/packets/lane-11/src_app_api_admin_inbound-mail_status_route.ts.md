# Work packet: edit src/app/api/admin/inbound-mail/status/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-inbound-mail.md, docs/audit/gap2/lane-8/l13-u024-superadmin-inbound-mail-controller.md

## G2-10-009-044  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:80-86` done mutation HTTP404 if ID missing
- vNext now: `src/app/api/admin/inbound-mail/status/route.ts:18-22` returns MESSAGE_CHANGED409 or STORAGE_UNAVAILABLE503
- Fix: Map missing message to not-found/reload semantics, not a generic stale conflict

## G2-13-024-024  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:84-86 update missing id returns HTTP404
- vNext now: src/modules/inbound-mail/admin-service.ts:90-97 stale/missing treated identically STALE; src/app/api/admin/inbound-mail/status/route.ts:18-19 HTTP409
- Fix: Differentiate not-found from optimistic conflict without leaking unauthorized identifiers
