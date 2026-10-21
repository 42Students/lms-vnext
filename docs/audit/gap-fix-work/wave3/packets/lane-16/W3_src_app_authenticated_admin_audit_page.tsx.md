# Work packet (wave 3): edit src/app/(authenticated)/admin/audit/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-audit-logs.md

## G2-9-027-062  [P1] MISSING  facet F23  effort L
- Legacy: Supports reusable per-record `fixedEntityId` embedded in other admin drawers `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:21-43`
- vNext now: Only generic Activity Log and per-event detail; no equivalent embedded subject mode `src/app/(authenticated)/admin/audit/page.tsx:10-23` `src/app/(authenticated)/activity/[eventId]/page.tsx:13-72`
- Fix: Provide reusable subject event history component.
