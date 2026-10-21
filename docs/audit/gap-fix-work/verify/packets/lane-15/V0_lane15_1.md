# Verification packet (P0, do FIRST): 8 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-10-009-064 [P0] MISSING facet F10
- Files: src/db/schema/inbound-mail.ts, src/modules/placements/recruiter-message-email-inbound-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:74-124` inbound receive routes replies to conversations and keeps failed replies for triage
- Expected fix: Wire authenticated inbound ingestion into inbox with durable receipt, routing outcome and manual review states

## G2-10-009-112 [P0] MISSING facet F21
- Files: src/db/schema/inbound-mail.ts, src/modules/placements/recruiter-message-email-inbound-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:23-32` Cloudflare Email Routing/D1 worker signs HTTP with INBOUND_EMAIL_SECRET
- Expected fix: Implement inbound worker endpoint + secure routing and DB row ingestion for every accepted mail

## G2-17-026-024 [P0] GAP facet F11
- Files: src/modules/activity/notification-service.ts
- Legacy: Staff only create; faculty/admin/superadmin edit or delete; faculty creator-only; NotificationController.java:301-315
- Expected fix: Never expose generic delivery API to user; enforce `requirePermission` plus creator/admin edit/delete, including cross-tenant reassignment.

## G2-17-026-025 [P0] GAP facet F11
- Files: src/modules/activity/notification-service.ts
- Legacy: Both prior and requested class/course authorization before update; NotificationController.java:189-200
- Expected fix: Add before/after scope validation for any notification retargeting; never trust requested tenant/recipient.

## G2-15-005-070 [P0] GAP facet F20
- Files: (none, new feature)
- Legacy: Legacy apply handles lost response with fresh applied lookup, never blind retry (JobDetailContent.jsx:598-629)
- Expected fix: On ambiguous network/write outcome re-read own application before saying failed or enabling retry; ensure idempotent backend writes

## G2-16-001-070 [P0] MISSING facet F22
- Files: src/modules/bug-tracker/independent-audit-findings-service.ts
- Legacy: `AuditFindingSyncService.java:31-38`: live tables used by importer and list.
- Expected fix: Register/test numbered migration and verified activation without touching active DB prematurely; board remains unavailable before that.

## G2-3-011-034 [P0] MISSING facet F12
- Files: src/db/schema/placements.ts, src/modules/placements/report-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:108-114`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:392-397`
- Expected fix: Legacy job.counts_as_placed is source of eligibility, held-offer and reports; vNext jobs store only three-value employmentType, no count flag, reports ignore type-specific placed answer. Restore per-drive placed policy.

## G2-6-016-057 [P0] MISSING facet F22
- Files: src/db/schema/index.ts
- Legacy: Legacy persisted skills table integer id and name unique, 200/200/50 lengths (Skill.java:10-33).
- Expected fix: Approve, register and replay numbered DB10 migration; verify FK and seed parity.
