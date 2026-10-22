# Verification packet (P1 round 2): 15 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-8-017-072 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LBE/model/ProjectTemplate.java:37-38 status VARCHAR(40) default 'IN_PROGRESS'
- Expected fix: Introduce separate workflowStatus if legacy status is used independently of lifecycleStatus.

## G2-8-029-050 [P1] GAP facet F23
- Files: src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx
- Legacy: Old rollback restores all historical data to new version incl lifecycle state docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:115-121.
- Expected fix: Record owner decision on lifecycle parity, avoid implying matches.

## G2-8-028-009 [P1] GAP facet F03
- Files: src/components/projects/project-create-control.tsx
- Legacy: Old status options Active, In progress, Ready, Blocked, Archived(disabled) docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:422-441.
- Expected fix: Keep full historical status choices and disabled Archive exception or record intentional deprecation.

## G2-8-028-026 [P1] GAP facet F06
- Files: src/components/projects/project-create-control.tsx
- Legacy: Old initial Status ACTIVE, ARCHIVED disabled (archive separate), forms for IN_PROGRESS/READY/BLOCKED docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:205-213,422-441.
- Expected fix: Map legacy status semantics to PLANNED/ACTIVE or preserve legacy statuses in state.

## G2-8-028-062 [P1] GAP facet F22
- Files: src/modules/projects/instance-service.ts
- Legacy: Old workspace payload project template numericId, classId and mentorId plus learnerIds docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:298-307.
- Expected fix: Map numeric legacy IDs to scoped memberships and template version on import.

## G2-8-023-021 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: Legacy internal rejection reason is optional but stays private (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoApplicantService.java:41-45; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:47-49).
- Expected fix: Provide separate required candidate message versus private internal note with exact use.

## G2-8-022-037 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Legacy seasons are filters, may overlap; starting next never closes prior (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:12-15,32-41).
- Expected fix: Remove exclusive-active rule or explicitly implement a distinct selection field separate from active.

## G2-9-005-040 [P1] GAP facet F11
- Files: src/app/(authenticated)/college/page.tsx
- Legacy: No college shows warning and Quick Actions still render (`docs/legacy-source/frontend/src/pages/college-admin/dashboard.js:53-63`)
- Expected fix: Keep accessible non-scoped navigation or document owner security decision.

## G2-9-008-077 [P1] GAP facet F21
- Files: src/app/(authenticated)/college/hiring-dashboard/page.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:920-941` — Company report fetch is independent HTTP read after filter change
- Expected fix: Split report query error handling while sharing cached base rows

## G2-9-016-044 [P1] GAP facet F07
- Files: src/app/(authenticated)/college/placements/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:145-153` — Attention failures Couldn't check for anything that needs attention. shows own retry, independent of jobs.
- Expected fix: Isolate attention failure and leave drives/operations working.

## G2-9-011-056 [P1] GAP facet F19
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:51-54` — Job and metrics fetched concurrently allSettled, attention later separately
- Expected fix: Use Promise.allSettled with independent fallback and stream main header early

## G2-9-014-032 [P1] MISSING facet F06
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1077-1125` — Assessment modal URL optional http(s), maxLength2048; Save to Job checkbox defaults true.
- Expected fix: Restore assessment URL form, default checkbox and conditional warning.

## G2-9-017-065 [P1] GAP facet F13
- Files: src/app/(authenticated)/college/lecture-halls/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:302-310` — Colleges and departments error isolated, create department remains optional.
- Expected fix: Use isolated results and degraded create mode.

## G2-9-028-022 [P1] GAP facet F06
- Files: src/app/(authenticated)/admin/batch-promotion/page.tsx
- Legacy: Optional academic-year override string max length 7, e.g. 2026-27 `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:501-514`
- Expected fix: Support YYYY-YY entry and convert to yearStart for backend

## G2-9-034-065 [P1] GAP facet F03
- Files: src/app/(authenticated)/admin/companies/page.tsx
- Legacy: Row actions Verify, Edit, Domains, Other names, Merge visible together `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:70-80`
- Expected fix: Expose full action strip on each distinct global company row.
