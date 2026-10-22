# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-10-026-019 [P1] GAP facet F07
- Files: src/app/api/public/campaign-unsubscribe/route.ts, src/modules/messaging/tpo-campaign-unsubscribe-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:125-131 — Unknown/used token treated as no-op success.
- Expected fix: Evaluate privacy-safe idempotence for bogus links.

## G2-10-026-028 [P1] GAP facet F10
- Files: src/app/api/public/campaign-unsubscribe/route.ts
- Legacy: docs/legacy-source/frontend/src/api/Services/TpoService.js:132-133; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicCampaignUnsubscribeController.java:23-26 — Axios POST path token and JSON200.
- Expected fix: Audit callers and provide backwards-compatible route.

## G2-10-007-018 [P1] GAP facet F04
- Files: src/modules/module-access/admin-read-service.ts, src/app/(authenticated)/admin/features/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:298-299` counts based on whole fetched scopeRows
- Expected fix: Use scope-wide aggregate queries for counts

## G2-10-007-044 [P1] MISSING facet F09
- Files: src/modules/module-access/admin-module-impact-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:212-248` four-count placements dialog in 2-column grid
- Expected fix: Query upcoming interviews and render all 4 legacy counters

## G2-10-007-047 [P1] GAP facet F10
- Files: src/modules/module-access/admin-read-service.ts, src/app/api/admin/features/[collegeId]/rules/route.ts
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:48-54` GET feature list/catalog and PUT /features/{collegeId} module/enabled
- Expected fix: Document client/API migration and payload versioning

## G2-10-007-049 [P1] GAP facet F10
- Files: src/modules/module-access/admin-college-rule-write.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:208-222` transactional COLLEGE app_setting upsert plus required audit log
- Expected fix: Define setting-key conversion and audit equivalence

## G2-10-007-057 [P1] GAP facet F12
- Files: src/modules/module-access/service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleFeatureCatalog.java:62-85` Placements ignores below-college policy scopes
- Expected fix: Choose legacy college-only vs new learner-level Placements authorization

## G2-10-007-058 [P1] GAP facet F12
- Files: src/modules/module-access/admin-college-rule-write.ts, src/components/admin/college-feature-rule-editor.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:178-206` refuses college writes under inherited/college locks
- Expected fix: Audit college-local lock mutation authority before adopting editor

## G2-10-007-084 [P1] MISSING facet F20
- Files: src/modules/module-access/admin-module-impact-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:246-247` upcoming interview count compares UTC now
- Expected fix: Restore future interview count with UTC cutoff

## G2-10-008-052 [P1] GAP facet F07
- Files: src/app/(authenticated)/admin/placements/analytics/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:115-129` metrics/funnel/company partial errors kept per section
- Expected fix: Implement Promise.allSettled and isolated partial error recovery for metric/funnel/company sections

## G2-10-009-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/admin/inbound-mail/page.tsx, src/modules/inbound-mail/admin-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:9-11`,108-114 /superadmin/inbound-mail is global, no selected college
- Expected fix: Make inbox accessible to all authorized Super Admin scope modes or document and migrate deliberate global-only access

## G2-10-009-021 [P1] MISSING facet F04
- Files: src/modules/inbound-mail/admin-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:29-35` list exposes id, receivedAt, from/to, subject, kind, routing status, preview, handledAt, threadId and joined names
- Expected fix: Add mail kind, routingStatus, preview, handledAt/by, threadId and sender identities to read model

## G2-10-009-028 [P1] GAP facet F05
- Files: src/modules/inbound-mail/admin-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:43-54` default OPEN excludes posted and handled, DONE only handled non-posted, REPLIES posted, ALL any
- Expected fix: Implement explicit routing+handled compound filters matching four legacy views

## G2-10-009-062 [P1] GAP facet F10
- Files: src/modules/inbound-mail/admin-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:84-85` UPDATE inbound_email handled_at timestamp and handled_by actor
- Expected fix: Persist handledAt and handledBy actor for accountability, including reopen clearing

## G2-10-009-065 [P1] GAP facet F11
- Files: src/modules/inbound-mail/admin-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:19-26` comments super admin-only via WebSecurityConfig and platform-wide data
- Expected fix: Honor old Super Admin scoped token semantics or document stricter global-only policy

## G2-10-009-066 [P1] GAP facet F11
- Files: src/app/(authenticated)/admin/inbound-mail/page.tsx, src/modules/inbound-mail/admin-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:9-11` no college selection; all 42lms.com messages visible
- Expected fix: Make scope behavior explicit in UI, do not show generic access failure

## G2-10-009-069 [P1] GAP facet F12
- Files: src/modules/inbound-mail/admin-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:49-54` OPEN = handled_at IS NULL and status != POSTED
- Expected fix: Model triage and routing as independent dimensions

## G2-10-009-070 [P1] GAP facet F12
- Files: src/modules/inbound-mail/admin-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:50` DONE = handled_at IS NOT NULL AND status != POSTED
- Expected fix: Preserve handled timestamp and exclude posted replies from Done

## G2-10-013-081 [P1] GAP facet F23
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:406-649,781-1010 — Legacy UI filters and lists candidate interviews, not drive rounds.
- Expected fix: Treat this as structural parity issue and redesign primary list.

## G2-10-018-077 [P1] GAP facet F19
- Files: src/app/(authenticated)/admin/lecture-halls/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:97-112 — Departments GET separate, fail does not hide room table.
- Expected fix: Split ancillary reads.

## G2-10-019-095 [P1] GAP facet F19
- Files: src/modules/module-access/admin-read-service.ts, src/app/(authenticated)/admin/features/[collegeId]/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:217-257 — Fetches full resolved college tree at once, potentially hundreds of nodes.
- Expected fix: Balance full parity with paginated hierarchy data, guarantee no silently missing nodes.

## G2-10-019-100 [P1] GAP facet F21
- Files: src/modules/module-access/service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:11-13; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ModuleAccessController.java:46-67 — Legacy module-access endpoints call ModuleAccessService and resolved eligibility.
- Expected fix: Map scope chains, locks and placement eligibility exactly across integrations.

## G2-10-023-030 [P1] GAP facet F06
- Files: src/app/(authenticated)/admin/tenants/create/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:81-90 — After college create, select college and jump identity.
- Expected fix: Auto-select with existing scope action and route to launch

## G2-17-026-040 [P1] GAP facet F19
- Files: src/app/(authenticated)/learn/notifications/page.tsx
- Legacy: Legacy class feed default100/max500, batched course slug enrichment; NotificationServiceImpl.java:273-327
- Expected fix: Add paged learner history; avoid naive full-table filter of large notifications.

## G2-11-002-041 [P1] GAP facet F07
- Files: src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx
- Legacy: Offers load error with inline Retry `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:488`
- Expected fix: Separate offers retry
