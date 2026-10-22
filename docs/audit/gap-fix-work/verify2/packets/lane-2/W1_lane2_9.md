# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-7-014-048 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:217-242,280-345 stable `_clientId` before title changes; remaps task sprintKey
- Expected fix: Map provisional keys and dependent tasks safely in import/migration

## G2-7-015-052 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:66-85 statuses ACTIVE/IN_PROGRESS/READY/BLOCKED + archived displayed disabled
- Expected fix: Define status migration (READY/BLOCKED/IN_PROGRESS) and preserve lifecycle meaning

## G2-7-016-067 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LFE/dto/projects/ProjectTaskDTO.java:8-62 legacy taskKey/dueLabel/sprintKey/status/submittedBy/time/carriedOver/createdByType
- Expected fix: Define lossless task DTO projection and migration for historical fields

## G2-7-017-050 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:363-445 Manage students applies to all workspaces including teamGroupId; TeamGroupNotice clarifies synchronization
- Expected fix: Document intentional class-team source-of-truth divergence and guide editor to correct screen

## G2-7-018-041 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:19-21 deleted workspaces soft-deleted, absent from ordinary list but recoverable
- Expected fix: Represent separate soft deletion from archived status or explicitly merge with migration semantics

## G2-7-031-021 [P1] GAP facet F11
- Files: src/app/(authenticated)/admin/projects/page.tsx, src/app/(authenticated)/admin/projects/templates/page.tsx
- Legacy: superadmin/projects/index.js:10-15 templates first is Super Admin catalogue authoring not per-college workspace
- Expected fix: Land on template catalogue to avoid bogus select-college state for Super Admin

## G2-8-021-010 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Legacy `class_schedule_id` is int (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Attend.java:24-25).
- Expected fix: Backfill session identities and preserve historical schedule-to-course associations.

## G2-8-027-036 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Legacy schedule supports five interviewType and per-learner cross-application overlap check using global buffer (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:50-99,233-242).
- Expected fix: Enforce candidate double-booking across jobs and colleges, not only same room/round.

## G2-8-019-026 [P1] GAP facet F10
- Files: src/modules/placements/learner-application-detail-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:60-77 synthetic baseline if no history exists
- Expected fix: Generate accurate initial event for legacy applications with no status-history rows.

## G2-11-021-022 [P1] GAP facet F10
- Files: src/modules/placements/report-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:90-100 GET getReport(name, batch/branch/company/mode/category)
- Expected fix: Map API query fields and all result row fields for every report

## G2-15-026-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/admin/placements/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:41-51 /api/v1/admin/placement/jobs for organization-scoped admin jobs (vasan)
- Expected fix: Restore org-scoped authorized view (or explicit redirect/UX parity waiver), retaining College Admin isolation

## G2-8-5-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/learn/my-placements/rules/page.tsx, src/modules/placements/learner-placement-rules-service.ts, src/app/(authenticated)/learn/my-placements/placement/page.tsx
- Legacy: Old bookmark automatically routes to /learn/my-placements/placement#rules (`docs/legacy-source/frontend/src/pages/learn/my-placements/rules.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- Expected fix: Provide legacy redirect compatibility or record intentional canonical-route break

## G2-8-5-037 [P1] MISSING facet F23
- Files: src/app/(authenticated)/learn/my-placements/rules/page.tsx, src/modules/placements/learner-placement-rules-service.ts, src/app/(authenticated)/learn/my-placements/placement/page.tsx
- Legacy: Old route auto-redirected with three-row transition placeholder (`docs/legacy-source/frontend/src/pages/learn/my-placements/rules.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- Expected fix: Resolve explicit compatibility policy before UI fixes; preserve old bookmarks

## G2-8-017-074 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LBE/model/ProjectTemplate.java:43-44 lifecycle_status VARCHAR(20) default 'DRAFT'
- Expected fix: Preserve separate lifecycle and workflow statuses in migration.

## G2-8-028-002 [P1] GAP facet F01
- Files: src/app/(authenticated)/admin/projects/workspaces/new/page.tsx
- Legacy: Old page Back to workspaces pushes list after unsaved guard docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:353-366.
- Expected fix: Intercept navigation from dirty workspace creator, show exact discard confirmation.

## G2-8-024-020 [P1] GAP facet F06
- Files: src/modules/placements/super-admin-hr-service.ts
- Legacy: Legacy grant validUntil blank means no expiry (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:56-61,177-183).
- Expected fix: Prominently disclose changed default and migrate indefinite access intentionally.

## G2-8-023-037 [P1] MISSING facet F10
- Files: (none, new feature)
- Legacy: Legacy Undo reverses application status/history, cancels pending notices within window (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:154-192).
- Expected fix: Implement safe, bounded application bulk Undo with notification cancellation or explicitly mark feature dropped.

## G2-8-022-038 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Legacy current picks newest isCurrent from potential multiple matches (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:27-29).
- Expected fix: Separate selection-current from lifecycle ACTIVE/CLOSED.

## G2-9-004-006 [P1] GAP facet F02
- Files: src/components/placements/placement-employer-relationships.tsx
- Legacy: Ant Table with six columns and horizontal scroll (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:395-432`)
- Expected fix: Build legacy table view: Company, Contact, Website, Drives, Last active, Actions.

## G2-9-004-018 [P1] MISSING facet F04
- Files: src/components/placements/placement-employer-relationships.tsx
- Legacy: Actions History/Edit/Delete or Restore (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:304-316`)
- Expected fix: Restore History and applicable canonical Edit controls.

## G2-9-004-028 [P1] MISSING facet F07
- Files: src/components/placements/college-company-create.tsx
- Legacy: Logo URL optional valid HTTPS max500 (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:484-490`)
- Expected fix: Support canonical logo URL or permitted upload under signed object scheme.

## G2-9-004-030 [P1] MISSING facet F07
- Files: src/components/placements/college-company-create.tsx
- Legacy: Industry optional length100, example IT Services (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:491-493`)
- Expected fix: Restore industry editing in authorized company-identity workflow.

## G2-9-004-032 [P1] MISSING facet F07
- Files: src/components/placements/college-company-create.tsx
- Legacy: Contact person max150, email max150, phone regex max30 (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:498-505`)
- Expected fix: Reinstate college-scoped contact details or privileged edit; preserve exact validation.

## G2-9-004-039 [P1] MISSING facet F08
- Files: src/components/placements/placement-employer-relationships.tsx
- Legacy: Detail history network error has Retry and message (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:246-268`)
- Expected fix: Restore history-specific error retry.

## G2-9-004-041 [P1] MISSING facet F09
- Files: src/components/placements/college-company-create.tsx
- Legacy: Dirty cancel nested Discard unsaved changes?/Keep editing (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:451-466`)
- Expected fix: Add dirty change confirmation.

## Lane-3 verification triage

Fast triage (2026-10-22): OK: G2-8-5-001, G2-8-5-037 (legacy rules bookmark redirects to /learn/my-placements/placement#rules). DEFERRED: remaining 23 rows require deeper persistence, migration, permission, or UI verification; no implementation parity claimed.
