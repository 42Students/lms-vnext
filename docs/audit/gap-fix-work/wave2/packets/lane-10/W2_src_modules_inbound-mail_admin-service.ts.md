# Work packet (wave 2): edit src/modules/inbound-mail/admin-service.ts

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-inbound-mail.md, docs/audit/gap2/lane-5/u026-public-inbound-email-controller.md, docs/audit/gap2/lane-8/l13-u024-superadmin-inbound-mail-controller.md

## G2-10-009-024  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:74-76` full body_text returned on GET one
- vNext now: `src/modules/inbound-mail/admin-service.ts:50-54` list loads entire bodyPlain and `src/components/admin/inbound-mail-list.tsx:86` clips it at 15000
- Fix: Implement detail-only body fetch to avoid huge list payload and preserve full text

## G2-10-009-025  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:62-68` list provides total, open and pageSize 50
- vNext now: `src/modules/inbound-mail/admin-service.ts:67-69` total/toReadCount/page/hasMore analogous but different status semantics
- Fix: Retain total/open semantics and 50-item pagination after rebuilding status mapping

## G2-10-009-032  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:59-68` order e.id DESC, limit50, page zero-based
- vNext now: `src/modules/inbound-mail/admin-service.ts:50-55` order receivedAt DESC,id DESC, 1-based page
- Fix: Map id-desc vs timestamp-desc ordering and page default; verify receivedAt/id monotonicity

## G2-10-009-068  [P2] GAP  facet F11  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:128-146` drawer shows full body to Super Admin only
- vNext now: `src/components/admin/inbound-mail-list.tsx:86` clips body to 15000, `src/modules/inbound-mail/admin-service.ts:60-64` gates global Super Admin
- Fix: Keep full-body authorization while avoiding eager exposure in list

## G2-10-009-081  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:59-65` fetchWithErrorHandling catches list response failure
- vNext now: `src/modules/inbound-mail/admin-service.ts:65-68` repository exceptions bubble to `src/app/(authenticated)/admin/inbound-mail/error.tsx:4-7`
- Fix: Provide inline retry for scoped read error

## G2-10-009-105  [P2] GAP  facet F19  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:60-61` ORDER BY e.id DESC LIMIT50 OFFSET(page*50)
- vNext now: `src/modules/inbound-mail/admin-service.ts:54` receivedAt DESC/id DESC LIMIT51 OFFSET
- Fix: Check timestamp ordering under delayed worker delivery and reconcile default

## G2-10-009-107  [P2] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:168-174` lowercases sender and parses header email
- vNext now: `src/modules/inbound-mail/message-model.ts:9-11` validates email shape; `src/modules/inbound-mail/admin-service.ts:50-54` stores existing values
- Fix: Normalize sender and address display on input; don't lose malformed-but-received mail

## G2-5-026-024  [P2] GAP  facet F10  effort M
- Legacy: Legacy matches recruiter/learner sender and college for inbound mail attribution. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:126-145`
- vNext now: vNext inbox schema can associate collegeId but no recruiterId/learnerId. `src/db/schema/inbound-mail.ts:19-28`, `src/modules/inbound-mail/admin-service.ts:50-55`
- Fix: Persist resolved actor relationship for operator filtering.

## G2-13-024-001  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:24-26 GET /api/v1/superadmin/inbound-mail global inbox
- vNext now: src/app/(authenticated)/admin/inbound-mail/page.tsx:16-19 /admin/inbound-mail dashboard and src/modules/inbound-mail/admin-service.ts:60-64 requires global super-admin context
- Fix: Register legacy deep-link redirect and preserve global inbox navigation

## G2-13-024-012  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:74-76 single GET adds body_text AS body
- vNext now: src/modules/inbound-mail/admin-service.ts:41-55 list selects full bodyPlain for all 50 messages
- Fix: Return short preview for list and full body only from detail service

## G2-13-024-013  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:63-68 API response items,total,open,pageSize (50)
- vNext now: src/modules/inbound-mail/admin-service.ts:15-18,67-69 returns available,items,page,hasMore,total,toReadCount
- Fix: Preserve list response contract or map fields in compatibility adapter

## G2-13-024-017  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:59-61 order e.id DESC, offset max(0,page)*50
- vNext now: src/modules/inbound-mail/admin-service.ts:50-55 order receivedAt DESC then UUID and page 1-based
- Fix: Use deterministic received/id ordering and zero↔one page conversion; confirm if legacy ID order differs

## G2-13-024-030  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:68-71 opens row, separate GET full body with loading flag
- vNext now: src/modules/inbound-mail/admin-service.ts:41-55 list already pulls complete body; no message-open API
- Fix: Load full body lazily and show Loading... in drawer

## G2-13-024-032  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:81 default done=true; false reopens
- vNext now: src/modules/inbound-mail/admin-service.ts:80-97 requires explicit expectedStatus/version and status; triage transition model limits transitions
- Fix: Provide done/reopen affordances with one safe CAS operation and recoverable conflict state

## G2-13-024-048  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:29-35 outer joins recruiter/learner/college per list row
- vNext now: src/modules/inbound-mail/admin-service.ts:50-54 queries single inbound table; no joined names
- Fix: Batch/join identities avoiding N+1 lookup

## G2-13-024-016  [P3] GAP  facet F05  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:55-58 q checks fromAddress,subject,body_text with escaped % and _
- vNext now: src/modules/inbound-mail/admin-service.ts:33-36,45-48 searches same conceptual 3 fields via ILIKE escaped wildcard
- Fix: Preserve case-sensitive legacy LIKE semantics only if required; confirm production MySQL collation
