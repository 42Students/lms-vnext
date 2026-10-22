# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-1-002-045 [P1] GAP facet F11
- Files: src/app/api/auth/devices/route.ts
- Legacy: `AuthController.java:1099-1108` other-person revoke-all permits caller through `requireAccessLearner` or faculty-schedule access, broader than admin-only in some roles.
- Expected fix: Inventory legacy staff revoke-all privilege and either restore authorized admin-only target action or explicitly restrict with approval.

## G2-1-031-010 [P1] GAP facet F03
- Files: src/app/(authenticated)/learn/profile/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/learn/profile.js:154-161: warning Alert with icon and small Retry for stale errors.
- Expected fix: Preserve last-good profile and retry on core data fetch error.

## G2-10-002-045 [P1] GAP facet F10
- Files: src/app/api/announcements/[announcementId]/route.ts, src/components/announcements/announcement-admin-workspace.tsx
- Legacy: Legacy edit PUT /api/v1/superadmin/announcements/id updates one logical broadcast `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAnnouncementController.java:46-50` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:391-399`
- Expected fix: Expose broadcast-wide edit transaction instead of mutating a single recipient clone

## G2-10-002-046 [P1] GAP facet F10
- Files: src/app/api/announcements/[announcementId]/route.ts, src/components/announcements/announcement-admin-workspace.tsx
- Legacy: Legacy delete DELETE /api/v1/superadmin/announcements/id removes single logical broadcast `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAnnouncementController.java:52-55` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:401-404`
- Expected fix: Create group-scoped deletion that withdraws all college copies and notifications consistently

## G2-10-004-011 [P1] GAP facet F03
- Files: src/app/(authenticated)/admin/companies/page.tsx
- Legacy: Old college list shows Contact person and Contact email column `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:262-269`
- Expected fix: Add authorized college-only contact detail while preventing global cross-college disclosure

## G2-10-010-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/superadmin/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/index.js:9-15` bare /superadmin HTTP 302 Location /superadmin/dashboard
- Expected fix: Redirect legacy root to /dashboard when Super Admin or equivalent Overview route; preserve browser bookmarks

## G2-10-014-006 [P1] MISSING facet F02
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx, src/components/placements/super-admin-drive-archive.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:164-193 — Danger zone red #cf1322 heading, #ffccc7 border, #fff1f0 background.
- Expected fix: Restore prominent destructive region.

## G2-10-014-010 [P1] GAP facet F03
- Files: src/components/placements/super-admin-drive-archive.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:175-191 — Delete drive red primary DeleteOutlined, clear warning.
- Expected fix: Show accessible danger CTA and truthful modern impact.

## G2-10-014-018 [P1] GAP facet F04
- Files: src/components/placements/super-admin-drive-archive.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:170-183 — Warn applicants remain after legacy delete; no notification.
- Expected fix: Explicitly document and validate changed side effects.

## G2-10-014-044 [P1] GAP facet F10
- Files: src/components/placements/super-admin-drive-archive.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:82-100 — Legacy deletes listing and leaves applications without notifications.
- Expected fix: Record mutation side effects and compatibility.

## G2-10-014-048 [P1] GAP facet F11
- Files: src/components/placements/super-admin-drive-archive.tsx, src/components/placements/super-admin-published-drive-edit.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:82-101 — Shared mutationRef blocks overlapping delete/status actions.
- Expected fix: Enforce cross-action mutual exclusion/CAS.

## G2-10-014-050 [P1] GAP facet F12
- Files: src/components/placements/super-admin-drive-archive.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:169-184 — Delete permanently removes listing, retains apps, no notification.
- Expected fix: Review product-approved behavior change.

## G2-10-014-058 [P1] GAP facet F15
- Files: src/components/placements/super-admin-drive-archive.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:172-183 — Delete explicitly tells admins learners won't be notified.
- Expected fix: Confirm actual adapters and show truthful copy.

## G2-10-014-071 [P1] GAP facet F20
- Files: src/components/placements/super-admin-drive-archive.tsx, src/components/placements/super-admin-published-drive-edit.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:25-26,59-101 — Shared lock prevents delete and status actions concurrently.
- Expected fix: Use shared global entity mutation lock.

## G2-10-014-074 [P1] GAP facet F21
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx, src/components/placements/super-admin-drive-archive.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:10,31-53 — AdminService GET job+metrics, status toggle and delete action.
- Expected fix: Map all legacy operations.

## G2-10-014-076 [P1] GAP facet F21
- Files: src/components/placements/super-admin-drive-archive.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:82-101 — Legacy deletion operation leaves applications.
- Expected fix: Review business transaction/audit side effects.

## G2-10-014-078 [P1] GAP facet F22
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:498-544 — Saves importantDates, candidatePreferences, customRules.
- Expected fix: Map/edit JSON with constraints.

## G2-10-014-079 [P1] GAP facet F22
- Files: src/components/placements/super-admin-drive-archive.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:170-183 — Delete retains apps, no learner notification.
- Expected fix: Reconcile ledger semantics.

## G2-10-020-054 [P1] GAP facet F10
- Files: src/app/(authenticated)/admin/programs/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:88-98 — GET /api/v1/new-program/fetch departments separately; retry independently.
- Expected fix: Isolate department and program fetch states/errors.

## G2-10-023-096 [P1] GAP facet F21
- Files: src/app/(authenticated)/admin/tenants/setup/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:70-110 — Legacy subdomain allot/remove through TenantAdminService and DNS expectations.
- Expected fix: Inspect DNS/wildcard verification work and route service outputs

## G2-19-024-044 [P1] GAP facet F20
- Files: src/app/api/announcements/[announcementId]/route.ts
- Legacy: Legacy delete idempotent soft delete by broadcast id; PlacementAnnouncementService.java:401-404
- Expected fix: Make group write CAS and idempotent including repeated DELETE and concurrent edits.

## G2-11-001-049 [P1] GAP facet F11
- Files: src/modules/placements/public-enquiry/send-service.ts
- Legacy: Code/recruit require published page, not merely flag. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicPlacementsPageController.java:61`
- Expected fix: Call full publication guard for POST.

## G2-11-003-039 [P1] GAP facet F07
- Files: src/app/(authenticated)/hr/drives/page.tsx
- Legacy: Missing capability shows exact Drive access is not switched on title `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:116`
- Expected fix: Show capability-specific text

## G2-11-005-056 [P1] GAP facet F07
- Files: src/app/(authenticated)/tpo/announcements/page.tsx
- Legacy: Load error Couldn't load announcements, Retry `docs/legacy-source/frontend/src/pages/tpo/announcements.js:38`
- Expected fix: Separate data failure and query invalidity, show Retry

## G2-11-006-016 [P1] GAP facet F04
- Files: src/modules/placements/tpo-audit-model.ts
- Legacy: About labels: Drives, Recruiters, Students, Offers, Rounds, Shares and downloads, Settings, Bulk actions, General. `docs/legacy-source/frontend/src/pages/tpo/audit.js:18`
- Expected fix: Preserve entity taxonomy separately from event kind.
