# Verification packet (P1 sample): 15 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-10-011-033 [P1] GAP facet F07
- Files: src/app/api/placements/college/jobs/[jobId]/pipeline/route.ts, src/modules/placements/college-application-stage-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:637-694 — Status writes reject absent applicationStatus and concurrent changes with clean 400/409 responses.
- Expected fix: Preserve actionable stale-edit conflict/error response with retry/read-back.

## G2-14-007-013 [P1] GAP facet F05
- Files: src/app/(authenticated)/college/groups/[groupId]/page.tsx
- Legacy: Legacy path :id ignored and not validated, redirects all old ids; vNext canonical group detail validates groupId and notFound() on invalid — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:6-12`
- Expected fix: Ensure old-id links always redirect, not pass legacy numeric IDs into UUID group lookup

## G2-15-007-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/college/groups/page.tsx
- Legacy: Legacy detail `/college-admin/student-groups/[id]` redirects to People too (`student-groups/[id].js:6-15`)
- Expected fix: Ensure legacy detail bookmark redirects to People; don't expose old groups by alias

## G2-19-011-033 [P1] GAP facet F12
- Files: src/modules/placements/tpo-drive-lifecycle-list-model.ts
- Legacy: Legacy expires job even if interview rounds continue (worker no stage checks) `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:53-63`
- Expected fix: Allow rounds/offers to continue while applications are closed.

## G2-19-005-013 [P1] GAP facet F05
- Files: src/modules/placements/learner-career-calendar-url-model.ts
- Legacy: Old landing always opens Schedule `view=month` `docs/legacy-source/frontend/src/pages/learn/my-placements/calendar.js:4-6`
- Expected fix: Default legacy calendar address to Month/Calendar, not agenda.

## G2-2-009-063 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: LF:238-278 one modal with radio reason and loading/error states
- Expected fix: Restore live record read/verification before allowing writes and exact modal UI.

## G2-20-029-053 [P1] GAP facet F13
- Files: src/app/(authenticated)/admin/programs/page.tsx
- Legacy: Scoped reload failure keeps last loaded data with warning 'Couldn't refresh programs' (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:301-311`)
- Expected fix: Preserve verified last-known data on same-scope read failures where safe

## G2-7-005-053 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LBE/model/ProjectTemplate.java:12-45,68-90: project_template numeric id, slug80/title160, lifecycleStatus, publishedAt, four JSON blocks.
- Expected fix: Define template migration/model adapter for ID, lifecycle timestamp and all JSON section fields.

## G2-7-021-003 [P1] GAP facet F01
- Files: src/modules/projects/admin-reassign-mentor-query-model.ts
- Legacy: reassign-mentor.js:89-100 ?fromMentorId numeric bookmark, prefilters rows
- Expected fix: Map old numeric IDs to UUID and preserve bookmarked mentor filters

## G2-7-027-033 [P1] GAP facet F06
- Files: src/components/projects/project-meeting-controls.tsx
- Legacy: PDC:10346-10598 meeting form title,status,ceremony,date,times,link,sprint,task,agenda,notes,outcome,retro,followups
- Expected fix: Restore or intentionally retire individual fields and validation, with schema mapping

## G2-8-018-033 [P1] GAP facet F09
- Files: src/components/activity/notification-list.tsx
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:68-110: Take Assessment / View Interview / View in My Applications / View Course
- Expected fix: Use type-specific button labels/routes and safe assessment external href.

## G2-8-022-013 [P1] MISSING facet F04
- Files: (none, new feature)
- Legacy: Legacy JSON blockedDates array of date,label pairs (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/PlacementSeason.java:55-58).
- Expected fix: Map season-scoped blocked dates to explicit schedule blackout rows/UI.

## G2-9-001-043 [P1] GAP facet F12
- Files: src/modules/activity/college-activity-service.ts
- Legacy: Category filters based on action key patterns (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminAuditLogService.java:124-150`)
- Expected fix: Reconcile important/setup/people/teaching/projects action classification.

## G2-9-004-083 [P1] GAP facet F21
- Files: src/modules/placements/college-company-directory-service.ts
- Legacy: Stats API yields per-company job history counts (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:242-268`)
- Expected fix: Add secure stats projection and job history screen.

## G2-9-014-023 [P1] GAP facet F05
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:112-117` — Shortlist defaults ASSESSMENT status tab, with tabs for ASSESSMENT, INTERVIEW, OFFERED and other statuses.
- Expected fix: Filter by placement *stage*, default ASSESSMENT; preserve stage switches.
