# Work packet: edit src/modules/placements/job-service.ts (part 2 of 5)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/placement-job-service.md, docs/audit/gap2/lane-19/job-auto-expiry-service.md, docs/audit/gap2/lane-2/admin-job-controller.md

## G2-17-012-034  [P1] GAP  facet F11  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:169-183 — Organization scope derived from authenticated context, not client.
- vNext now: src/modules/placements/job-service.ts:90-95 — Requires college manage scope; no org aggregate.
- Fix: Implement requirePermission for selected org+colleges, never trust path org ID.

## G2-17-012-035  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:113-136 — Company must be linked to job college or org college before creation.
- vNext now: src/modules/placements/job-service.ts:40-72 — Requires active college-company relationship.
- Fix: Map org-wide relationship rule where collegeId is null.

## G2-17-012-036  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:52-58 — Legacy Boolean active means open/closed.
- vNext now: src/modules/placements/job-service.ts:417-760 — vNext DRAFT/PUBLISHED/CLOSED/CANCELLED/ARCHIVED lifecycle.
- Fix: Record explicit legacy active→state mapping, validate no illegal reopen.

## G2-17-012-056  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:3-5 — Relies Job, JobApplication, JobApplicationStatusHistory JPA entities.
- vNext now: src/modules/placements/job-service.ts:86-150 — Drizzle placementJobs and normalized application tables.
- Fix: Map all status columns, history, scoring, NULL-org shared jobs.

## G2-17-012-057  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:191-199 — Organization direct FK scope permits org-wide jobs.
- vNext now: src/modules/placements/job-service.ts:86-95 — CollegeId required input and role guard.
- Fix: Schema review for nullable college scope and migration decision.

## G2-19-011-003  [P1] GAP  facet F01  effort L
- Legacy: Legacy scheduling invoked automatically, no actor login `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:33-47`
- vNext now: vNext manual close requires placement manager context `src/modules/placements/job-service.ts:616-628`
- Fix: Do not substitute actor-driven close for system scheduled action.

## G2-19-011-027  [P1] GAP  facet F10  effort L
- Legacy: Legacy worker saves `isActive=false` for all matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:53-69`
- vNext now: vNext direct close changes status/closedAt and also issues activity+offer side effects `src/modules/placements/job-service.ts:616-649` `src/modules/placements/job-service.ts:668-694`
- Fix: Do not blindly call manual-close service from scheduled expiry.

## G2-19-011-029  [P1] GAP  facet F11  effort L
- Legacy: Legacy global system job has no principal check `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:33-53`
- vNext now: vNext close requires requirePlacementManageScope(context,college) `src/modules/placements/job-service.ts:616-628`
- Fix: Use auditable system actor and scoped DB write for scheduled closure.

## G2-19-011-032  [P1] GAP  facet F12  effort L
- Legacy: Legacy expiry sets inactive only; existing recruitment stages/issued offers untouched `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:59-63`
- vNext now: vNext manual close withdraws ISSUED offers `src/modules/placements/job-service.ts:592-613` `src/modules/placements/job-service.ts:668-694`
- Fix: Separate application intake closure from entire-drive stop/offer revocation.

## G2-19-011-049  [P1] GAP  facet F19  effort L
- Legacy: Legacy entire loop under `@Transactional` with per-row catch `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:43-47` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:59-69`
- vNext now: vNext closePlacementJob runs one transactional status+event `src/modules/placements/job-service.ts:630-695`
- Fix: Design idempotent per-job transaction and retry marker for automated processing.

## G2-2-016-002  [P1] MISSING  facet F01  effort M
- Legacy: Get job by slug supports legacy public external job URL (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2242-2278`)
- vNext now: Job service getPlacementJob expects UUID job ID, no old external slug resolver (`src/modules/placements/job-service.ts:136-149`)
- Fix: Add safe legacy public slug resolver for approved external job access; don't expose tenant data

## G2-2-016-017  [P1] GAP  facet F06  effort L
- Legacy: Target hierarchy validates class→batch/program→department and college (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2018-2137`)
- vNext now: VNext validation and roster-scoped eligibility policies (`src/modules/placements/validation.ts:557-630; src/modules/placements/job-service.ts:150-205`)
- Fix: Verify exact hierarchy/archival/tenant validation against courses/groups schema

## G2-2-016-027  [P1] GAP  facet F10  effort L
- Legacy: Legacy deleteJob soft-deletes and notifies affected applicants after commit (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:998-1079`)
- vNext now: VNext archive plus cancel/close have distinct downstream cleanup effects (`src/modules/placements/job-service.ts:616-766`)
- Fix: Preserve learner notification and application safety on any destructive action

## G2-2-016-067  [P1] GAP  facet F03  effort L
- Legacy: Before Delete job returns application/learner/open interview impact `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:1019-1048`
- vNext now: Archive rejects PUBLISHED until closed and withdraws issued offers; separate cancellation preview exists `src/modules/placements/job-service.ts:735-763`
- Fix: Show an impact breakdown before archive and reconcile interview and learner impacts

## G2-2-016-074  [P1] GAP  facet F05  effort L
- Legacy: GET /search defaults page0, size20, status all, sort postedDate descending `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:135-164`
- vNext now: New service returns unpaginated jobs sorted title ascending `src/modules/placements/job-service.ts:86-133`
- Fix: Implement paged server search 20/page with posted-date-desc default, status and sort controls

## G2-2-016-084  [P1] GAP  facet F06  effort L
- Legacy: Legacy update PUT may modify existing active job subject to version `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:236-284`
- vNext now: New update rejects non-DRAFT jobs (PLACEMENT_JOB_NOT_EDITABLE) `src/modules/placements/job-service.ts:272-287`
- Fix: Restore authorized published-drive edit workflow under explicit safe field rules

## G2-2-016-104  [P1] GAP  facet F09  effort M
- Legacy: Delete impact preview is a pre-confirmation GET `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:1019-1047`
- vNext now: New archive is a mutating service with close-before-archive guard `src/modules/placements/job-service.ts:735-764`
- Fix: Require impact preview before confirm and forbid deleting without acknowledged impact

## G2-2-016-106  [P1] GAP  facet F10  effort L
- Legacy: Legacy exposes GET all (unbounded) plus GET search (paged) separately `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:110-165`
- vNext now: New listPlacementJobs unpaged, no direct counterpart for search filters `src/modules/placements/job-service.ts:86-135`
- Fix: Add paged API with explicit sort/search and secure admin scope

## G2-2-016-108  [P1] GAP  facet F10  effort L
- Legacy: PUT update uses ID, college, Job body; has clean 409 JPA version conflicts `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:236-286`
- vNext now: New update service requires Draft; vNext token handling in other service `src/modules/placements/job-service.ts:272-287`
- Fix: Provide published-edit endpoint and optimistic version token for allowed fields

## G2-2-016-149  [P1] GAP  facet F19  effort L
- Legacy: Legacy GET all unbounded and GET search paginated 20 default `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:110-165`
- vNext now: New list queries all college non-archived jobs sorted title `src/modules/placements/job-service.ts:86-135`
- Fix: Use server page/sort for large historical job lists and keep past archives selectable
