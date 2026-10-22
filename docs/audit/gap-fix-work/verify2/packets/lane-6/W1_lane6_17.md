# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-6-010-006 [P1] GAP facet F04
- Verification: DEFERRED — one-pass source inspection cannot prove the cross-scope or lifecycle contract.
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Old key includes nullable organizationId and collegeId/learner hierarchy IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobVisibilityCache.java:60-67`
- Expected fix: Document precise schema ID translation and edge cases

## G2-6-010-008 [P1] GAP facet F05
- Verification: DEFERRED — one-pass source inspection cannot prove the cross-scope or lifecycle contract.
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Old visible jobs loaded org-wide active, then hierarchy filter in memory `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:246-259`
- Expected fix: Test org-wide jobs targeting all colleges and cross-college visibility explicitly

## G2-6-010-010 [P1] GAP facet F05
- Verification: DEFERRED — one-pass source inspection cannot prove the cross-scope or lifecycle contract.
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Old visibility list deadline filter excludes passed deadline entirely `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:329-334`
- Expected fix: Decide expired-card visibility versus old list exclusion, preserve apply block

## G2-6-010-034 [P1] GAP facet F22
- Verification: DEFERRED — one-pass source inspection cannot prove the cross-scope or lifecycle contract.
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Old Job entity and targeting relies on orgId,collegeId,classId,batchId,programId `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobVisibilityCache.java:60-67` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:340-360`
- Expected fix: Record migration mapping class/batch/program to cohort/section and verify all targeting policies

## G2-11-020-012 [P1] GAP facet F04
- Verification: DEFERRED — feature discovery requires a wider route/model search.
- Files: (none, new feature)
- Legacy: Status derived LEAD/INVITED/JOINED from recruiterId and inviteStatus (index.js:74-76,430-433).
- Expected fix: Derive exact LEAD/INVITED/JOINED statuses and status label/badge.

## G2-11-026-011 [P1] MISSING facet F06
- Verification: DEFERRED — feature discovery requires a wider route/model search.
- Files: (none, new feature)
- Legacy: Presign request fileName<=255, contentType<=100, contentLength 1..8388608 (BugTrackerAttachmentPresignRequest.java:11-24).
- Expected fix: Add authorized upload negotiation with exact field validation.

## G2-11-026-022 [P1] GAP facet F11
- Verification: DEFERRED — one-pass source inspection cannot prove the cross-scope or lifecycle contract.
- Files: src/app/api/placements/tpo/companies/detail/route.ts
- Legacy: Public /api/v1/public path excluded from JwtAuthenticationFilter; manager mutations explicitly moved away (PublicBugTrackerController.java:54-56).
- Expected fix: Preserve new security; provide reporter tokens/short-lived sessions rather than unauthenticated public exposure.

## G2-12-011-010 [P1] MISSING facet F04
- Verification: DEFERRED — feature discovery requires a wider route/model search.
- Files: (none, new feature)
- Legacy: Change request variants exact Asked for a change/Declined your request/Accepted/Answered (RecruiterNotificationService.java:107-116).
- Expected fix: Map company requests statuses including REPLIED as declined.

## G2-15-024-014 [P1] MISSING facet F12
- Verification: DEFERRED — feature discovery requires a wider route/model search.
- Files: (none, new feature)
- Legacy: Seeding creates college A/B and consistent learner+faculty cross-tenant fixtures (E2eSeedService.java:170-190,217-223).
- Expected fix: Seed scoped tenant/membership matrices and isolation fixtures.

## G2-17-030-072 [P1] GAP facet F19
- Verification: DEFERRED — one-pass source inspection cannot prove the cross-scope or lifecycle contract.
- Files: src/components/placements/super-admin-drive-quick-search.tsx
- Legacy: Legacy fetch active page size 60 and all page size 1 for counts. `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:98`
- Expected fix: Server-bound data query to 60 for landing, count all separately; avoid unbounded heavy joins.

## G2-6-016-052 [P1] MISSING facet F20
- Verification: DEFERRED — feature discovery requires a wider route/model search.
- Files: (none, new feature)
- Legacy: Legacy atomic usageCount increments on select (SkillRepository.java:77-91).
- Expected fix: Idempotent/rate-limited concurrent write path with independent counters and request auth.

## G2-6-006-015 [P1] MISSING facet F10
- Verification: DEFERRED — feature discovery requires a wider route/model search.
- Files: (none, new feature)
- Legacy: Old Next getServerSideProps redirects on GET, no POST/mutation `docs/legacy-source/frontend/src/pages/teacher/fileExplorer.js:1-8`
- Expected fix: Add GET-only redirect without DB writes or audit side effects

## G2-12-027-010 [P1] GAP facet F04
- Verification: DEFERRED — feature discovery requires a wider route/model search.
- Files: (none, new feature)
- Legacy: LBE/service/impl/FacultyTeachingAssignmentServiceImpl.java:199-265: missing faculty/course/class/batch metadata remains visible and `metadataIncomplete=true`.
- Expected fix: Surface orphan references as degraded records with explicit error indicator, not silently drop from results.

## G2-13-023-031 [P1] GAP facet F12
- Verification: DEFERRED — feature discovery requires a wider route/model search.
- Files: (none, new feature)
- Legacy: LBE/service/tpo/TpoScheduleService.java:316-337 reschedule only if round assignment row exists and no PENDING request.
- Expected fix: Require specific booked slot where legacy does, align duplicate messaging with separate same/different payload semantics.

## G2-14-030-049 [P1] GAP facet F20
- Verification: DEFERRED — feature discovery requires a wider route/model search.
- Files: (none, new feature)
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:25-36 snapshot trims strings and formats date/minute, used to detect dirty cancel.
- Expected fix: Add dirty-state comparison including whitespace and original timezone precision.

## G2-17-031-017 [P1] GAP facet F06
- Verification: DEFERRED — feature discovery requires a wider route/model search.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:47-91 touched-only Save and tasksToken with sibling refresh.
- Expected fix: Preserve no-op untampered save, section-level token and no stale sibling overwrite.

## G2-19-027-085 [P1] GAP facet F19
- Verification: DEFERRED — feature discovery requires a wider route/model search.
- Files: (none, new feature)
- Legacy: LFE/pages/superadmin/sections/Courses.js:18-19 persists pageSize in localStorage and can select 100.
- Expected fix: Fix wrong pageSize view/query contract, prevent page count mismatch.

## G2-7-002-022 [P1] GAP facet F05
- Verification: DEFERRED — feature discovery requires a wider route/model search.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/audit/index.js:313-418: table Action, Entity, Actor, When; day-divider rows and expandable extra details.
- Expected fix: Render four-column table, dates and expandable details.

## G2-7-004-044 [P1] GAP facet F11
- Verification: DEFERRED — feature discovery requires a wider route/model search.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:244-255: restores workspace by URL even if not on current paged choices.
- Expected fix: Validate project by college directly and load selection beyond list limit.

## G2-7-007-015 [P1] GAP facet F05
- Verification: DEFERRED — feature discovery requires a wider route/model search.
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:149-159: 10 rows per page, fixed, paged total `a–b of N matching changes`.
- Expected fix: Page resource history at 10, and show exact result range and total.

## G2-7-009-028 [P1] GAP facet F23
- Verification: DEFERRED — feature discovery requires a wider route/model search.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/index.js:11-13: from= at-risk/submissions, openTemplate=1 state intentionally intact.
- Expected fix: Critical: preserve context query to prevent broken attach-template and review-return paths.

## G2-7-011-047 [P1] GAP facet F12
- Verification: DEFERRED — feature discovery requires a wider route/model search.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:15-19: trim each line and discard blank lines; all array values may be cleared except deliverables fails validation.
- Expected fix: Align deliverables validation while preserving clearable DoD/personas.

## G2-7-013-048 [P1] GAP facet F12
- Verification: DEFERRED — feature discovery requires a wider route/model search.
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:144, resource.js:50-57: generated stable slug key unique among siblings
- Expected fix: Preserve stable identifiers and detect duplicate legacy keys

## G2-7-014-075 [P1] GAP facet F22
- Verification: DEFERRED — feature discovery requires a wider route/model search.
- Files: (none, new feature)
- Legacy: LFE/model/ProjectSprint.java:87-114 startedBy/At and completedBy/At persisted
- Expected fix: Retain start/completion attribution via activity rows with migration and view

## G2-7-015-072 [P1] MISSING facet F18
- Verification: DEFERRED — feature discovery requires a wider route/model search.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:518-537 detailed destructive template warning and checkbox label
- Expected fix: Reproduce exact replacement warning and default reapply behavior
