# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-18-025-012 [P1] GAP facet F06
- Files: src/modules/bug-tracker/admin-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTrackerLogsAccessController.java:53-54,76-85 — bcrypt-hash configured secret, null hash 503, mismatch 401
- Expected fix: Document intentionally nonparity; use standard account credentials and MFA

## G2-18-025-028 [P1] GAP facet F15
- Files: src/modules/bug-tracker/admin-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTrackerLogsAccessController.java:78-88 — logs IP on denied/allowed password attempt; no actor identity
- Expected fix: Ensure log-view access events capture actual actor (and redact sensitive source)

## G2-18-025-039 [P1] GAP facet F22
- Files: src/app/(authenticated)/tracker/logs/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/TrackerLogsAccessRequest.java:6-8 — no DB credential row; password hash in config
- Expected fix: Document credentials not migrated for safety; no static hashed secret onboarding

## G2-18-024-016 [P1] GAP facet F05
- Files: src/modules/activity/service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/AdminAuditLogRepository.java:84-99 — category query filters persisted action/entity types before LIMIT/page.
- Expected fix: Align old important/setup/people/teaching/projects membership before pagination.

## G2-18-024-018 [P1] GAP facet F06
- Files: src/modules/activity/super-admin-audit-route-query-model.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:105-123 — actorUserId/organizationId/collegeId numeric, entityId string, size/page int.
- Expected fix: Translate numeric identifiers and org-scope filtering.

## G2-18-024-028 [P1] GAP facet F10
- Files: src/modules/activity/service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:175-183 — calls audit.search or audit.searchByCategory with derived scope.
- Expected fix: Map legacy category/action semantics to activityEvents query.

## G2-18-024-034 [P1] GAP facet F12
- Files: src/modules/activity/super-admin-audit-route-query-model.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminAuditLogService.java:139-148 — category whitelist exact lowercase important/setup/people/teaching/projects.
- Expected fix: Restore category mapping to equivalent event semantics.

## G2-19-030-039 [P1] GAP facet F12
- Files: src/app/(authenticated)/tpo/profile/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyProfileServiceImpl.java:116-130 — accepts HTTPS URL and owned image R2 key; previous owned file deleted best effort.
- Expected fix: Make owner decision on signed URL-only photo editing; enforce type/size and rollback.

## G2-10-003-065 [P1] GAP facet F21
- Files: src/modules/activity/service.ts
- Legacy: Legacy activity events originate from AdminAuditLogService.log writes by controllers `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminAuditLogService.java:31-82`
- Expected fix: Inventory legacy writer coverage and preserve all important audit event emissions across modules

## G2-10-008-025 [P1] GAP facet F04
- Files: src/modules/admin-ui/super-admin-hiring-report-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2279-2307` totalApplications and status snapshot buckets from JobApplication
- Expected fix: Map status taxonomy and application inclusion rules one-to-one for metric parity

## G2-10-008-027 [P1] GAP facet F04
- Files: src/modules/admin-ui/super-admin-hiring-funnel-model.ts, src/app/(authenticated)/admin/placements/analytics/page.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2408-2434` true funnel counts EVER reached each stage using status history
- Expected fix: Use immutable status history for cumulative funnel; do not relabel snapshot as conversion

## G2-10-008-028 [P1] GAP facet F04
- Files: src/modules/admin-ui/super-admin-hiring-report-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2443-2524` per-job companyName and jobTitle from Job plus stage counts
- Expected fix: Include legacy unlinked free-text company/job rows or document data-migration exclusivity

## G2-10-008-045 [P1] GAP facet F06
- Files: src/modules/admin-ui/super-admin-hiring-report-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:72-79` date endpoints inclusive day start/end ISO via .startOf/.endOf
- Expected fix: Define single IST interpretation and inclusive end-of-day time boundary across app

## G2-10-008-071 [P1] GAP facet F11
- Files: src/modules/admin-ui/super-admin-hiring-report-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2536-2550` resolves college jobs plus shared org jobs for metrics
- Expected fix: Include organization-visible shared jobs in count/report if legacy required

## G2-10-008-072 [P1] GAP facet F12
- Files: src/modules/admin-ui/super-admin-hiring-funnel-model.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2408-2434` cumulative ever-reached stages including rejected former interviewees
- Expected fix: Implement cumulative ever-stage reach and monotonic-conversion semantics

## G2-10-008-074 [P1] MISSING facet F12
- Files: src/app/(authenticated)/admin/placements/analytics/page.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2309-2340` average first shortlisted stage versus applied timestamp
- Expected fix: Derive transition history timing; do not approximate from current status

## G2-10-008-078 [P1] GAP facet F12
- Files: src/modules/admin-ui/super-admin-hiring-funnel-model.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:510-514` conversion is rounded current stage / previous reached stage
- Expected fix: Calculate percentages using historical counts with zero-denominator null semantics

## G2-10-008-106 [P1] GAP facet F19
- Files: src/modules/admin-ui/super-admin-hiring-report-service.ts, src/modules/admin-ui/super-admin-hiring-funnel-model.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2294-2307` GROUP BY status query, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2410-2429` cumulative history query
- Expected fix: Retain bounded aggregate performance while adding correct historical funnel query

## G2-10-008-111 [P1] GAP facet F20
- Files: src/modules/admin-ui/super-admin-hiring-report-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:72-79` serializes dayjs local start/end into ISO timestamps
- Expected fix: Add timezone-specific integration test across IST midnight/DST-free date boundaries

## G2-10-008-116 [P1] GAP facet F21
- Files: src/modules/admin-ui/super-admin-hiring-report-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2310-2340` relies on job_application_status_history transitions
- Expected fix: Read immutable stage history or persist compatible stage reach events for funnel/latency

## G2-10-008-118 [P1] GAP facet F22
- Files: src/modules/admin-ui/super-admin-hiring-report-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:12-39` legacy job_application unique learner/job, status, applied timestamp
- Expected fix: Map legacy statuses+appliedAt to new submission and college stage fields before interpreting KPIs

## G2-10-008-120 [P1] GAP facet F22
- Files: src/modules/admin-ui/super-admin-hiring-report-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:29-48` legacy job stores free-text company and optional linked companyId
- Expected fix: Ensure unlinked migrated job names retained with fallback company representation

## G2-10-008-122 [P1] GAP facet F22
- Files: src/modules/admin-ui/super-admin-hiring-report-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2536-2545` resolves optional org jobs with college visibility
- Expected fix: Maintain old org-shared visibility in schema joins when authorized

## G2-10-014-005 [P1] GAP facet F02
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:112-145 — Settings tab, full JobForm immediately visible, Drive status card, Danger zone card.
- Expected fix: Match full section order and forms.

## G2-10-019-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/admin/module-access/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/module-access.js:9-25 — /superadmin/module-access resolves header selected college; no college is warning-only.
- Expected fix: Render scoped editor directly for selected college; preserve dedicated path and fallback warning.
