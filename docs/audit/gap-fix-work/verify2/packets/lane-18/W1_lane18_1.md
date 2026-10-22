# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-12-022-031 [P1] GAP facet F10
- Files: src/modules/placements/tpo-round-apply-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoResultsService.java:74-145 — applyRound one transaction, locks round and marks status completed if zero skips
- Expected fix: Decide atomicity and round completion workflow; preserve partial results without falsely completing round

## G2-12-022-062 [P1] GAP facet F23
- Files: src/modules/placements/tpo-round-apply-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoResultsService.java:74-145 — one call can mark round completed and report unchanged terminal applicants
- Expected fix: Write product decision on intentional workflow change and full round completion semantics

## G2-13-027-042 [P1] GAP facet F22
- Files: src/modules/courses/assignment-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonContentsDTO.java:11-48 — one legacy LessonContents model for assignment and other content
- Expected fix: Provide migration mapping and linked lesson sequence/curriculum parity.

## G2-1-009-022 [P1] MISSING facet F05
- Files: src/app/(authenticated)/learn/profile/data-access/page.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/LearnerPlacementProfileService.java:48-49`: download timestamp earliest DOWNLOADED_LIST or DOWNLOADED_ZIP.
- Expected fix: Expose `downloadedAt` or explicit Never downloaded for each share.

## G2-12-029-047 [P1] MISSING facet F20
- Files: src/components/projects/super-admin-template-resource-editor.tsx
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/useUnsavedFormGuard.js:17-55 — unsaved guard beforeunload and routeChangeStart.
- Expected fix: Add dirty-state guard for tabs/back/reload.

## G2-10-003-020 [P1] GAP facet F05
- Files: src/app/(authenticated)/activity/page.tsx
- Legacy: Old category choice Important by default, everything explicit `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:23-30` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:60-61`
- Expected fix: Default importance to HIGH/CRITICAL Important unless user explicitly selects Everything

## G2-10-009-120 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: `drizzle/0068_inbound_mail_messages.sql:1-19` registered PG 0068 schema includes source unique/check/index
- Expected fix: Plan import and signed provider cutover, not just schema table creation

## G2-10-016-072 [P1] GAP facet F19
- Files: src/modules/placements/tpo-operations-service.ts, src/modules/placements/admin-drive-directory-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:250-269 — Server-side page and sort by posted date avoids loading all jobs.
- Expected fix: Move filter/order/page to indexed SQL.

## G2-10-017-045 [P1] GAP facet F10
- Files: src/modules/placements/tpo-operations-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:115-126 — Two GET /api/v1/admin/jobs/search requests, active(size60) and all(size1) separately, sort by postedDate DESC.
- Expected fix: Preserve bounded latest 60 active query and counts.

## G2-10-017-046 [P1] GAP facet F10
- Files: src/modules/placements/tpo-operations-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:136-153 — GET /admin/jobs/needs-attention returns category counts and item samples independently.
- Expected fix: Separate failure boundary and honor selected-college category count semantics.

## G2-10-017-075 [P1] GAP facet F19
- Files: src/modules/placements/tpo-operations-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:104-126 — Bounded active 60 rows and one count query for all; no unbounded materialization.
- Expected fix: Separate early card query and aggregate counts for scale.

## G2-10-017-081 [P1] GAP facet F21
- Files: src/modules/placements/tpo-operations-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:6-16,104-153 — Legacy searchAdminJobs + needs attention independently, model Job/isActive.
- Expected fix: Make field and count mapping explicit across modules.

## G2-10-017-085 [P1] GAP facet F22
- Files: src/modules/placements/tpo-operations-service.ts, src/components/placements/super-admin-needs-attention.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:20-27,210-215 — Old needs attention summary counts per individual candidate/drive and sample limits.
- Expected fix: Project counts and samples separately, avoid conflating them.

## G2-10-014-038 [P1] MISSING facet F08
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:123-135 — Load error Retry; dismissible mutation errors with specific title.
- Expected fix: Add error recovery and preserve draft.

## G2-10-019-058 [P1] GAP facet F11
- Files: src/app/(authenticated)/admin/module-access/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/module-access.js:7-23 — No selected college disallows hierarchy display entirely.
- Expected fix: Preserve strict college-scoped editor; directory is separate.

## G2-10-029-035 [P1] GAP facet F10
- Files: src/app/api/projects/templates/[templateId]/route.ts
- Legacy: docs/legacy-source/frontend/src/api/Services/AdminService.js:399-400,421-422 and docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectTemplateController.java:95-111,223-243 — GET and PUT /api/v1/admin/project-templates/:id?collegeId.
- Expected fix: Match edit fields while preserving atomic version control/audit.

## G2-10-023-067 [P1] GAP facet F13
- Files: src/app/(authenticated)/admin/tenants/setup/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:584-590 — Colleges and organizations have separate error banners.
- Expected fix: Split panel error/retry states

## G2-17-030-026 [P1] GAP facet F07
- Files: src/modules/placements/tpo-operations-service.ts
- Legacy: Attention fetch error exact `Couldn't check for anything that needs attention.`; DrivesLanding.js:136-154
- Expected fix: Isolate attention failure with Retry state and preserve active drives.

## G2-17-030-034 [P1] GAP facet F10
- Files: src/modules/placements/tpo-operations-service.ts
- Legacy: Two paginated jobs searches active size60/newest and all size1; one needs-attention summary; lazy retention GET; DrivesLanding.js:98-155,174-189
- Expected fix: Replace full-scoped job/application/round fanout on dashboard with bounded/count-specific queries, cache by college.

## G2-17-030-041 [P1] GAP facet F12
- Files: src/modules/placements/tpo-operations-service.ts
- Legacy: Missing-offer-letter category includes OFFERED and HIRED on unfiltered ALL; DrivesLanding.js:21-27
- Expected fix: Verify HIRED/joined applicants remain counted and stage=ALL deep-link; don't underreport.

## G2-17-030-056 [P1] GAP facet F22
- Files: src/modules/placements/tpo-operations-service.ts
- Legacy: Legacy response active content/totalElements and attention count/items; DrivesLanding.js:115-125,145-148
- Expected fix: Implement explicit metrics/source crosswalk, especially accepted/offer-letter and definition of active.

## G2-11-003-004 [P1] GAP facet F01
- Files: src/app/(authenticated)/hr/drives/page.tsx
- Legacy: Only college change clears q/tab; initial load preserves `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:79`
- Expected fix: Reset filters on actual college change, preserve on first visit

## G2-11-004-084 [P1] GAP facet F13
- Files: src/app/(authenticated)/hr/drives/new/page.tsx
- Legacy: Overview suggestions failure alert with Retry suggestions `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:349`
- Expected fix: Allow manual eligibility with warning and retry

## G2-11-008-048 [P1] GAP facet F10
- Files: src/app/(authenticated)/tpo/drive-day/[roundId]/page.tsx
- Legacy: GET `/api/v1/tpo/drive-day/{roundId}/roster` refreshes every 20s. `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:123`
- Expected fix: Provide guarded 20s refresh for TPO with stale-previous-data state.

## G2-12-020-029 [P1] GAP facet F10
- Files: src/modules/placements/tpo-company-domain-service.ts
- Legacy: Legacy domain row unique company global, verified state stored per row `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:14-35`
- Expected fix: Make TPO mutation insert matching child row transactionally.
