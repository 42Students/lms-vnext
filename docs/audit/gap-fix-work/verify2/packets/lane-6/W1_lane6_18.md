# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-7-017-005 [P1] GAP facet F02
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/WorkspaceTeamOverview.jsx:51-76 Team at a glance Card, intro, four metrics
- Expected fix: Rebuild introductory Team at a glance summary before roster

## G2-7-017-077 [P1] GAP facet F20
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:252-272 remove confirm names exact affected members
- Expected fix: List removed names and ensure confirmation matches actual selected diff

## G2-7-018-066 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LBE/model/ProjectWorkspace.java:15-20,93-105 workspace has is_deleted via BaseModel and recoverableContent boolean
- Expected fix: Add explicit deleted state and recoverable-content marker or proven migration plan

## G2-7-020-055 [P1] GAP facet F10
- Files: src/app/api/projects/route.ts
- Legacy: AdminService.js:343-345 POST /api/v1/admin/projects AdminProjectCreateDTO
- Expected fix: Crosswalk create contract including status, slug, class and membership IDs

## G2-7-034-009 [P1] MISSING facet F03
- Files: src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx
- Legacy: SuperAdminTemplateShell.jsx:46-52 Back to templates and Use this template primary actions
- Expected fix: Restore primary Use this template with templateId handoff

## G2-8-012-002 [P1] MISSING facet F01
- Files: src/modules/placements/job-service.ts
- Legacy: Get job by slug supports legacy public external job URL (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2242-2278`)
- Expected fix: Add safe legacy public slug resolver for approved external job access; don't expose tenant data

## G2-8-012-014 [P1] GAP facet F06
- Files: src/modules/placements/validation.ts
- Legacy: EXTERNAL_ONLY rejects all targeting fields (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:512-526`)
- Expected fix: Explicitly enforce no hidden LMS targeting for external-only public applications if retained

## G2-8-012-017 [P1] GAP facet F06
- Files: src/modules/placements/validation.ts, src/modules/placements/job-service.ts
- Legacy: Target hierarchy validates class→batch/program→department and college (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2018-2137`)
- Expected fix: Verify exact hierarchy/archival/tenant validation against courses/groups schema

## G2-8-012-027 [P1] GAP facet F10
- Files: src/modules/placements/job-service.ts
- Legacy: Legacy deleteJob soft-deletes and notifies affected applicants after commit (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:998-1079`)
- Expected fix: Preserve learner notification and application safety on any destructive action

## G2-8-021-036 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: Legacy removeAbsence performs soft delete (isDeleted true) and can later revive same row (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java:570-602,633-646).
- Expected fix: Retain immutable correction history with original row identity or explicit historical event migration.

## G2-8-019-042 [P1] GAP facet F18
- Files: src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:68-75 fallback APPLIED/REJECTED
- Expected fix: Map historical labels correctly across lifecycle and recruiting stages.

## G2-8-019-046 [P1] GAP facet F20
- Files: src/modules/placements/application-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:29-52 unchanged no-op, failed record swallowed
- Expected fix: Add idempotent duplicate transition handling while preserving atomicity.

## G2-11-018-028 [P1] GAP facet F12
- Files: src/modules/activity/tpo-notifications-model.ts, src/modules/activity/tpo-notifications-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/tpo/notifications.js:17-18 max200 feed; unread count includes old.
- Expected fix: Owner decision: either historical unread remains actionable or mark as archived/read explicitly on expiry with notification policy.

## G2-12-028-017 [P1] GAP facet F06
- Files: src/components/projects/college-project-student-roster-dialog.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:389-392,452-462 replaceExisting unchecked by default; append supported
- Expected fix: Offer append-vs-replace mode with equivalent selection UX

## G2-12-028-018 [P1] GAP facet F06
- Files: src/components/projects/college-project-student-roster-dialog.tsx, src/modules/projects/college-project-roster-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:437-447 multi Select maxCount 500 and live remote search
- Expected fix: Raise roster capacity to 500 with virtualized options and correct total cap checks

## G2-12-028-021 [P1] GAP facet F07
- Files: src/modules/projects/college-project-roster-model.ts, src/components/projects/college-project-student-roster-dialog.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:410-435 required Students and detailed cap error 'This would exceed the 500-learner limit...'
- Expected fix: Use 500 effective total cap and legacy computed inline error

## G2-12-028-029 [P1] GAP facet F10
- Files: src/components/projects/college-project-student-roster-dialog.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:264-269 POST /api/v1/admin/projects/{workspaceId}/learners with learnerIds,replaceExisting,roleLabel
- Expected fix: Support append mode in API and retain optimistic conflict guard

## G2-12-028-034 [P1] GAP facet F12
- Files: src/modules/projects/college-project-roster-model.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/AdminProjectLearnerAssignDTO.java:14-17 max500, replaceExisting defaults true in DTO; client default checkbox false
- Expected fix: Adopt max500 business cap and default-append client behaviour for parity

## G2-13-024-041 [P1] GAP facet F15
- Files: src/modules/placements/recruiter-message-email-inbound-service.ts, src/modules/inbound-mail/admin-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicInboundEmailController.java:28-33 public signed worker receiver only accepts shared secret
- Expected fix: Provide authenticated, deduplicated generic inbox ingest for all 42lms.com addresses, not recruiter replies alone

## G2-15-026-002 [P1] GAP facet F01
- Files: src/modules/placements/job-service.ts, src/app/(authenticated)/admin/placements/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:139-163 GET job list and 169-199 individual job endpoint
- Expected fix: Provide scoped legacy Jobs -> Drives mapping and direct job detail link

## G2-15-026-012 [P1] GAP facet F05
- Files: src/modules/placements/job-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:139-163 list all jobs (including drafts, closed) for org
- Expected fix: Restore cross-college org view and explicit draft/closed filters without exposing archived

## G2-15-026-017 [P1] GAP facet F06
- Files: src/modules/placements/validation.ts, src/modules/placements/job-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:119-125 isActive default true, isDraft default false
- Expected fix: Map default draft/published state to legacy flags; don't silently publish new jobs

## G2-15-026-031 [P1] GAP facet F10
- Files: src/modules/placements/job-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:250-288 POST org job with actor from session
- Expected fix: Implement explicit org-approved job creation or document mandatory selected-college conversion

## G2-15-026-035 [P1] GAP facet F11
- Files: src/modules/placements/job-service.ts, src/app/(authenticated)/admin/placements/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:76-81 feature flag placements enabled required on all endpoints
- Expected fix: Verify placement module toggle at every job read/write endpoint and active tenant lock

## G2-15-026-045 [P1] GAP facet F14
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:757-791 applications/export CSV optional jobId and org-wide, filename applications-export.csv
- Expected fix: Restore authorized org-wide CSV with jobId optional or document no-global export security decision
