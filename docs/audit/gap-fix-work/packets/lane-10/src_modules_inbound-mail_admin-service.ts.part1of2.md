# Work packet: edit src/modules/inbound-mail/admin-service.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-inbound-mail.md, docs/audit/gap2/lane-5/u026-public-inbound-email-controller.md, docs/audit/gap2/lane-8/l13-u024-superadmin-inbound-mail-controller.md

## G2-10-009-001  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:9-11`,108-114 /superadmin/inbound-mail is global, no selected college
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:16-19` /admin/inbound-mail page title Inbound mail; `src/modules/inbound-mail/admin-service.ts:60-64` denies narrowed org/college scope
- Fix: Make inbox accessible to all authorized Super Admin scope modes or document and migrate deliberate global-only access

## G2-10-009-021  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:29-35` list exposes id, receivedAt, from/to, subject, kind, routing status, preview, handledAt, threadId and joined names
- vNext now: `src/modules/inbound-mail/admin-service.ts:11-14`,50-54 returns id, receivedAt/from/to/subject/bodyPlain/status/version only
- Fix: Add mail kind, routingStatus, preview, handledAt/by, threadId and sender identities to read model

## G2-10-009-028  [P1] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:43-54` default OPEN excludes posted and handled, DONE only handled non-posted, REPLIES posted, ALL any
- vNext now: `src/modules/inbound-mail/admin-service.ts:30-49` equality filter on NEW/TRIAGED/RESOLVED; posted replies not addressable
- Fix: Implement explicit routing+handled compound filters matching four legacy views

## G2-10-009-062  [P1] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:84-85` UPDATE inbound_email handled_at timestamp and handled_by actor
- vNext now: `src/modules/inbound-mail/admin-service.ts:90-97` UPDATE inbound_mail_messages.status and version only
- Fix: Persist handledAt and handledBy actor for accountability, including reopen clearing

## G2-10-009-065  [P1] GAP  facet F11  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:19-26` comments super admin-only via WebSecurityConfig and platform-wide data
- vNext now: `src/modules/inbound-mail/admin-service.ts:60-64` requires global Super Admin with no selected org/college
- Fix: Honor old Super Admin scoped token semantics or document stricter global-only policy

## G2-10-009-066  [P1] GAP  facet F11  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:9-11` no college selection; all 42lms.com messages visible
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:18` requires admin-scope.select, `src/modules/inbound-mail/admin-service.ts:62-63` scoped admins denied
- Fix: Make scope behavior explicit in UI, do not show generic access failure

## G2-10-009-069  [P1] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:49-54` OPEN = handled_at IS NULL and status != POSTED
- vNext now: `src/modules/inbound-mail/admin-service.ts:31-43` NEW = triage equality (cannot exclude posted)
- Fix: Model triage and routing as independent dimensions

## G2-10-009-070  [P1] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:50` DONE = handled_at IS NOT NULL AND status != POSTED
- vNext now: `src/modules/inbound-mail/admin-service.ts:31-43` RESOLVED = staff triage status, no handled-at marker
- Fix: Preserve handled timestamp and exclude posted replies from Done

## G2-10-009-087  [P1] MISSING  facet F15  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:109-122` postEmailReply triggers message handling, non-posted retained for manual triage
- vNext now: `src/db/schema/inbound-mail.ts:15` and `src/modules/inbound-mail/admin-service.ts:50-54` lack routing outcome and ingestion
- Fix: Persist non-posted reply as staff actionable item with reason/status tag

## G2-10-009-103  [P1] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:29-35` list body_preview max1000, full body only GET one
- vNext now: `src/modules/inbound-mail/admin-service.ts:50-54` selects entire bodyPlain for every list item
- Fix: Select indexed 180-character preview for list, fetch full body on drawer open

## G2-5-026-021  [P1] GAP  facet F09  effort M
- Legacy: Legacy Super Admin handles OTHER and failures in separate inbound mail interface. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:23-32`
- vNext now: vNext has separate triage page, but no generalized receiver operation. `src/app/(authenticated)/admin/inbound-mail/page.tsx:45-76`, `src/modules/inbound-mail/admin-service.ts:57-69`
- Fix: Link persisted inbound events to triage without exposing private messages.

## G2-5-026-035  [P1] GAP  facet F15  effort M
- Legacy: Legacy successful recruiter replies posted to recruiter thread; nonreply surfaced to Super Admin. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:23-32`
- vNext now: vNext accepted replies notify TPO; inbox list unconnected to webhook. `src/modules/placements/recruiter-message-email-inbound-service.ts:87-103`, `src/modules/inbound-mail/admin-service.ts:57-69`
- Fix: Add operator inbox event and meaningful reply notifications together.

## G2-13-024-002  [P1] MISSING  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:72-76 GET /{id} detail endpoint
- vNext now: src/modules/inbound-mail/admin-service.ts:11-18,50-55 only paginated summary fetch; no detail method
- Fix: Add permission-gated GET /api/admin/inbound-mail/{id} full body route

## G2-13-024-008  [P1] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:37-47 sender identity tags Recruiter/Student · College
- vNext now: src/modules/inbound-mail/admin-service.ts:50-54 returns raw sender address only
- Fix: Join sender recruiter/learner/college and expose names/tags

## G2-13-024-010  [P1] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:130-133 Mark done/Move back to To read action hidden if POSTED
- vNext now: src/modules/inbound-mail/admin-service.ts:80-97 accepts status change independent of message routing outcome
- Fix: Prevent any triage mutation on automatically posted conversation replies

## G2-13-024-011  [P1] MISSING  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:29-35 list SELECT id,receivedAt,from/to,subject,kind,status,preview,handledAt,threadId,recruiterName,studentName,collegeName
- vNext now: src/modules/inbound-mail/admin-service.ts:11-14,50-55 exposes id,receivedAt,from,to,subject,bodyPlain,status,version
- Fix: Restore missing kind, routingStatus, threadId, preview, handled timestamps, associated names

## G2-13-024-015  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:43-54 default OPEN excludes handled and POSTED; DONE handled non-POSTED; REPLIES status POSTED; ALL unrestricted
- vNext now: src/modules/inbound-mail/admin-service.ts:18,30-49 exact match NEW/TRIAGED/RESOLVED
- Fix: Implement compound routing status and handledAt predicates; restore REPLIES filter

## G2-13-024-023  [P1] MISSING  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:73-76 unknown id detail returns HTTP404
- vNext now: src/modules/inbound-mail/admin-service.ts:57-69 list only; no detail GET/not-found handler
- Fix: Implement 404 full-detail endpoint and matching drawer error state

## G2-13-024-029  [P1] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:128-146 slide-out drawer; POSTED read-only actions
- vNext now: src/app/(authenticated)/admin/inbound-mail/page.tsx:73-76 rendered client list/drawer; src/modules/inbound-mail/admin-service.ts:86-97 permits transitions without routing context
- Fix: Enforce read-only for posted messages server-side as well as action visibility

## G2-13-024-033  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:20-25 intended SUPER_ADMIN via WebSecurityConfig; global list no selected college needed
- vNext now: src/modules/inbound-mail/admin-service.ts:60-64 requires !adminScope.collegeId && !adminScope.organizationId
- Fix: Make authorized Super Admin inbox accessible despite acting-in-college UI mode or clearly expose scope reset
