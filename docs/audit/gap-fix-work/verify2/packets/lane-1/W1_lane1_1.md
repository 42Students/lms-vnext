# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-1-026-012 [P1] GAP facet F03
- Files: src/app/(authenticated)/college/profile/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/profile.js:143-151: warning Alert with icon and small Retry on refresh failure.
- Expected fix: Preserve stale profile and retry without blanking page.

## G2-1-031-026 [P1] GAP facet F07
- Files: src/app/(authenticated)/learn/profile/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/learn/profile.js:139: exact 'We couldn't load your profile. Please try again.'.
- Expected fix: Add matching fatal error with Retry and preserve stale profile.

## G2-15-028-008 [P1] GAP facet F04
- Files: src/components/projects/mentor-sprint-details-edit.tsx
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:26-69,82-88 — dueLabel, title, goal, releaseKey, description and generated key.
- Expected fix: Provide legacy dueLabel/key mapping and readable release selection.

## G2-15-028-048 [P1] GAP facet F20
- Files: src/components/projects/mentor-sprint-details-edit.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/sprints.js:81-96 — sprintsToken prevents cross-editor lost updates.
- Expected fix: Implement plan-level optimistic guard for atomic reorder/replace.

## G2-15-028-051 [P1] GAP facet F22
- Files: src/components/projects/mentor-sprint-details-edit.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/sprints.js:92-96 — updateProject accepts whole sprint array token.
- Expected fix: Preserve all fields and bulk ordering or archive legacy plan representations.

## G2-10-004-017 [P1] GAP facet F04
- Files: src/app/(authenticated)/admin/companies/page.tsx
- Legacy: Old college record has industry, logo, private contacts, notes, drive count and last active `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:242-295` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:140-150`
- Expected fix: Restore need-to-know private contact and notes access only under college scope

## G2-10-010-004 [P1] GAP facet F01
- Files: src/app/(authenticated)/admin/academics/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/dashboard.js:53-65` /superadmin/dashboard is Overview/Dashboard landing target with SuperAdminLayout
- Expected fix: Make unscoped super admins land on global dashboard, not a blocked academic management view

## G2-10-014-081 [P1] GAP facet F23
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:145-193 — Visible Close/Open and Danger zone.
- Expected fix: Rebuild visible controls and keep stronger modern delete protection.

## G2-10-020-097 [P1] GAP facet F20
- Files: src/app/(authenticated)/admin/programs/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:83-99 — departmentSeq separate guard prevents stale selectors.
- Expected fix: Split retries and reject late department response after scope switch.

## G2-10-028-007 [P1] GAP facet F03
- Files: src/components/projects/project-admin-workspace-list.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:219-235 — gold clickable No template — attach one tag.
- Expected fix: Add click and keyboard attach-template action.

## G2-10-023-098 [P1] GAP facet F21
- Files: src/app/(authenticated)/admin/tenants/setup/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:70-112 — Branding upload uses backend media/storage.
- Expected fix: Use existing signed URL workflow in embedded editor

## G2-11-003-041 [P1] GAP facet F07
- Files: src/app/(authenticated)/hr/drives/page.tsx
- Legacy: List failure warning Could not load your drives with Retry `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:117`
- Expected fix: Show retryable warning without dropping view

## G2-11-005-085 [P1] GAP facet F12
- Files: src/app/(authenticated)/tpo/announcements/page.tsx
- Legacy: Audience reach recomputed on each change after debounce `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:57`
- Expected fix: Restore live debounced audience preview

## G2-11-012-010 [P1] GAP facet F02
- Files: src/app/(authenticated)/tpo/placements/lifecycle/page.tsx
- Legacy: TpoDataTable inside .tpo-drives__table with column headers, selection, sorting. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:438`
- Expected fix: Use old table grid, sortable columns, column picker.

## G2-12-004-012 [P1] GAP facet F10
- Files: src/app/(authenticated)/mentor/courses/page.tsx
- Legacy: SSR redirect issued by getServerSideProps with permanent:false `docs/legacy-source/frontend/src/pages/mentor/courses/[courseId]/index.js:1-7`
- Expected fix: Implement Next redirect in dynamic route with temporary semantics

## G2-17-23-036 [P1] GAP facet F07 Not-own application
- Files: (none, new feature)
- Legacy: JS:1186–1189 treats missing/foreign application as "Application not found" to avoid enumeration; LC:49–51 maps IllegalArgumentException to 404
- Expected fix: Ensure denial for foreign offer uses indistinguishable response timing/status from nonexistent offer and no app ID leaks

## G2-17-028-008 [P1] MISSING facet F03 Proof metric
- Files: (none, new feature)
- Legacy: LR:23-28 counts completed resolvedTasks with nonempty submissionUrl; LO:33-38 `Proof coverage X / Y completed tasks` or `No completed tasks yet`
- Expected fix: Add scoped per-task evidence coverage read (completed tasks with submission URL) to service/DTO and legacy-labeled metric with zero-completion special text

## G2-18-019-014 [P1] GAP facet F05 Latest active OTP lookup
- Files: (none, new feature)
- Legacy: LR:12-14 `ORDER BY updated_at DESC LIMIT 1` filtered by phone/is_deleted/is_expired only
- Expected fix: Migrate caller to attemptId; clear old challenge on new start and ensure stale OTP cannot authenticate

## G2-18-030-002 [P1] GAP facet F01 No scope
- Files: (none, new feature)
- Legacy: L:26-29/68-93 when no collegeId, fetches `getDepartments()` globally and loads `getColleges()` dropdown
- Expected fix: Document product decision: Super Admin all-college view intentionally removed for safety; offer explicit selected-college scope UX, not silent empty list

## G2-19-029-042 [P1] GAP facet F12 Readiness gate semantics
- Files: (none, new feature)
- Legacy: LB:243 readyForDomainLogin = blockers.isEmpty, blockers from domain only LB:183-212
- Expected fix: Separate `domainLoginReady` and `tenantSetupComplete`; prevent label `login blocked` for failed TPO/program requirements

## G2-13-002-074 [P1] GAP facet F20
- Files: src/app/(authenticated)/hr/home/page.tsx
- Legacy: Old needsYou counts only tasks with actionable label (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:178-183`)
- Expected fix: Only count persisted verified work, never speculative tasks.

## G2-18-021-039 [P1] GAP facet F20
- Files: (none, new feature)
- Legacy: Old DATE `parseImportantDate` uses PlacementDateTimeUtils.parseUtcDateTime (JobServiceImpl:1576-1580)
- Expected fix: Define UTC storage→IST day mapping; test +05:30 boundary and naive date strings

## G2-14-002-041 [P1] GAP facet F07
- Files: src/app/(authenticated)/admin/students/page.tsx
- Legacy: Legacy failed classes/programs warning but roster stays accessible; vNext register unavailable page-level error — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1472-1480`
- Expected fix: Keep directory visible and disable only affected register/edit actions

## G2-18-028-026 [P1] GAP facet F10
- Files: src/components/projects/workspace-brief-editor.tsx, src/app/api/projects/[projectId]/brief/route.ts
- Legacy: Legacy PUT /api/v1/admin/projects/{id}?collegeId sends detailsToken and merged overview including unknown facts; overview.js:78-97;AdminService.js:361-362
- Expected fix: Guard unknown-key preservation and template inheritance across update

## G2-18-028-037 [P1] MISSING facet F17
- Files: src/components/projects/workspace-brief-editor.tsx
- Legacy: Old dirty editor warns browser unload and client link navigation; useUnsavedFormGuard.js:17-56
- Expected fix: Focus-managed confirmation on tab/sidebar/back/Cancel/keyboard close
