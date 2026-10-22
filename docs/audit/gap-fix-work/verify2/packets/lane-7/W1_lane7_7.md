# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-7-015-004 [P1] MISSING facet F01
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:285-307 `?openTemplate=1` opens attach modal only when no template, then shallow removes query
- Expected fix: Implement attach-template deep link and safe, cleaned query

## G2-7-015-077 [P1] GAP facet F20
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:285-306 rechecks template before auto-opening destructive dialog
- Expected fix: Prevent destructive replacement on stale deep link

## G2-7-017-006 [P1] MISSING facet F02
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/WorkspaceTeamOverview.jsx:78-85 no-primary-mentor warning
- Expected fix: Show warning to admin when no primary mentor

## G2-7-017-080 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LBE/model/ProjectMember.java:14-47 project_id, user_id, user_type triple hard unique incl soft-deleted; roleLabel max80 and JPA version
- Expected fix: Define migration of role labels, historical reactivation and membership identity without duplicates

## G2-7-018-067 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LBE/dto/projects/ProjectWorkspaceDTO.java:9-25,43-55 includes numericId, slug, mentor, recoverableContent
- Expected fix: Map legacy identifiers, mentor and recoverable snapshot into deleted DTO

## G2-7-021-016 [P1] GAP facet F04
- Files: src/modules/projects/mentor-reassignment-workload-service.ts
- Legacy: reassign-mentor.js:127-153 list contains every nonarchived project and workload active counts
- Expected fix: Include completed-but-not-archived projects in workload or clarify legacy Active definition

## G2-7-021-055 [P1] GAP facet F12
- Files: src/modules/projects/mentor-reassignment-workload-service.ts
- Legacy: reassign-mentor.js:109 excludes only ARCHIVED, includes READY and other nonarchived
- Expected fix: Make workload and table use consistent nonarchived status set

## G2-7-021-059 [P1] GAP facet F12
- Files: src/modules/projects/mentor-reassignment-workload-service.ts
- Legacy: reassign-mentor.js:127-153 workload count from all nonarchived projects
- Expected fix: Match legacy workload denominator and at-risk grouping

## G2-7-021-081 [P1] GAP facet F19
- Files: src/components/projects/project-admin-reassign-mentor-page.tsx
- Legacy: reassign-mentor.js:51-82 searches faculty by remote query, no hard 100 cap
- Expected fix: Allow all eligible mentors through reliable search/pagination

## G2-7-032-022 [P1] GAP facet F05
- Files: src/modules/projects/college-readiness-releases-service.ts
- Legacy: readiness/index.js:491-510 workspace list backend page25 with search
- Expected fix: Allow searching all workspaces beyond 1000 and page via API

## G2-7-032-026 [P1] GAP facet F06
- Files: src/components/projects/project-readiness-override-form.tsx
- Legacy: readiness/index.js:657-674 Override required, no default when no previous override
- Expected fix: Start unset until explicit choice; don't preselect meaningless CLEAR

## G2-7-032-032 [P1] GAP facet F07
- Files: src/components/projects/project-readiness-override-form.tsx
- Legacy: readiness/index.js:657 Choose an override state
- Expected fix: Block submit until a real state is chosen; exact error copy

## G2-7-032-051 [P1] GAP facet F12
- Files: src/modules/projects/college-readiness-releases-service.ts, src/components/projects/project-admin-readiness-page.tsx
- Legacy: readiness/index.js:155-169 archived removed from picker but included when currently selected
- Expected fix: Keep archived override manageable from active overrides list

## G2-7-032-071 [P1] GAP facet F19
- Files: src/modules/projects/college-readiness-releases-service.ts
- Legacy: readiness/index.js:57-64 25-row server paging for both overrides and workspaces
- Expected fix: Add bounded server paging for workspace choice and overrides, prevent long page

## G2-7-034-010 [P1] GAP facet F04
- Files: src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx
- Legacy: templates/[templateId]/index.js:11-12 templateId from dynamic route and rest params
- Expected fix: Provide migration ID bridge before typed route

## G2-7-036-038 [P1] GAP facet F10
- Files: src/app/api/people/student-import/route.ts
- Legacy: Students.js:842-847 bulkRegisterLearners POST with college/program/class and learners
- Expected fix: Map all old payloads/results and preserve two-stage contract

## G2-8-021-042 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Legacy percentage counts all held schedules minus absent records, including schedules without attendance taken in some service paths (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java:848-861).
- Expected fix: Pick one policy for eligibility and reports, reconcile historical percentages visibly.

## G2-8-027-001 [P1] GAP facet F01
- Files: src/modules/placements/tpo-interview-slot-service.ts
- Legacy: Legacy all interview operations under /api/v1/interviews, GET list and POST create (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:44-48,227-230,333-340).
- Expected fix: Map old interview IDs/endpoints to canonical job+round+slot endpoints.

## G2-8-027-030 [P1] GAP facet F10
- Files: src/modules/placements/tpo-interview-slot-service.ts, src/modules/placements/learner-round-confirmation-service.ts
- Legacy: Legacy POST schedule, PUT update, POST cancel, POST complete, POST feedback and learner POST confirm/reschedule/cancel (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:227-291,635-676,686-721,731-793,799-835,842-906,912-991,1001-1050).
- Expected fix: Publish operation-by-operation endpoint adapter with status, audit, notice and retry behavior.

## G2-8-027-054 [P1] GAP facet F22
- Files: src/modules/placements/tpo-interview-slot-service.ts
- Legacy: Legacy feedback stored per interview and reschedule_request_json, previous date/changed date (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:108-159).
- Expected fix: Preserve history and evidence; add equivalent feedback/previous-slot fields or link to immutable audit.

## G2-8-019-059 [P1] GAP facet F23
- Files: src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:60-77 synthetic initial history generated for older apps
- Expected fix: Restore history baseline for legacy existing applications.

## G2-12-012-015 [P1] GAP facet F12
- Files: src/modules/placements/public-join/domain-model.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:123-141 uses Guava public suffix list for registrable domain
- Expected fix: Replace handcrafted registrable-domain list with maintained public suffix logic

## G2-12-012-031 [P1] GAP facet F23
- Files: src/modules/placements/public-join/domain-model.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:123-141 uses complete public-suffix registry
- Expected fix: Replace abbreviated list with public suffix registry and tests for co.in/com.au/unknown suffix

## G2-15-026-020 [P1] GAP facet F06
- Files: src/modules/placements/screening-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:671-725 single status accepts newStatus/rejectionReason/assessmentUrl
- Expected fix: Map single status transitions and reason/assessment URL fields to specialized services

## G2-15-026-034 [P1] GAP facet F10
- Files: src/modules/placements/screening-service.ts, src/modules/placements/tpo-bulk-application-stage-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:509-573 notes,579-665 bulk statuses,671-753 single statuses
- Expected fix: Create service dispatch for notes/status/bulk flows, actor audit, per-item failure


## Fast verification triage — chat-4
- OK (direct source inspection): none conclusively verified in this pass.
- DEFERRED (not validated or fixed; needs deeper parity review): G2-7-015-004, G2-7-015-077, G2-7-017-006, G2-7-017-080, G2-7-018-067, G2-7-021-016, G2-7-021-055, G2-7-021-059, G2-7-021-081, G2-7-032-022, G2-7-032-026, G2-7-032-032, G2-7-032-051, G2-7-032-071, G2-7-034-010, G2-7-036-038, G2-8-021-042, G2-8-027-001, G2-8-027-030, G2-8-027-054, G2-8-019-059, G2-12-012-015, G2-12-012-031, G2-15-026-020, G2-15-026-034.
- This is a triage disposition, not an assertion of feature parity. Deferred facets remain open for implementation and independent comparison.
