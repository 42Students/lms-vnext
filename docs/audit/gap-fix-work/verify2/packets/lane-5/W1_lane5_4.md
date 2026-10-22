# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-19-017-002 [P1] GAP facet F01
- Files: src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx
- Legacy: Legacy repo fetches project-scoped and meeting-key-scoped edit history `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectMeetingHistoryRepository.java:20-24`
- Expected fix: Implement typed meeting revision query or prove general event materialization equivalent.

## G2-19-001-010 [P1] GAP facet F04
- Files: src/components/admin/admin-scoped-read-page.tsx, src/modules/admin-ui/super-admin-scoped-people-service.ts
- Legacy: Table columns `Name`, `Roll No.`, `Mobile`, `Email`, `Class`, `Gender`, `Status`, `Actions` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:928-962`
- Expected fix: Render legacy seven data columns and Actions with matching field mapping; retain accessible mobile fallback.

## G2-19-001-015 [P1] GAP facet F04
- Files: src/components/admin/admin-scoped-read-page.tsx
- Legacy: Legacy `Visible now` counts all client-filtered students `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1096-1101`
- Expected fix: Show total matching records rather than current page length, or label `On this page`.

## G2-19-001-021 [P1] GAP facet F05
- Files: src/components/admin/admin-scoped-read-page.tsx, src/modules/admin-ui/super-admin-people-filter-options.ts
- Legacy: Legacy filters program→batch→class cascade and clear dependents `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:896-909`,1504-1511
- Expected fix: Filter Batch options by selected Program and Class options by selected Batch; reset stale children.

## G2-19-001-045 [P1] GAP facet F09
- Files: src/components/admin/admin-scoped-read-page.tsx, src/modules/admin-ui/super-admin-scoped-people-service.ts
- Legacy: Legacy `Profile — <name>` modal width 860 renders 20 profile sections `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1763-1777`
- Expected fix: Restore deep learner profile sections or direct to a complete equivalent with identical sections.

## G2-2-006-039 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LS:247-272 submitted assignment cannot disable or modify except title
- Expected fix: Align admin title-only edit with existing faculty model.

## G2-2-008-045 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: LC:63-133 dedicated atomic caller contract for all assignment grades
- Expected fix: Preserve whole-assignment scope or explicitly approve Section-by-Section segmentation.

## G2-2-011-030 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: LC:112-120 College Admin + class belongs to chosen college; super-admin permitted with correct scope
- Expected fix: Support selected-college Super Admin route under central requirePermission for recurring create.

## G2-2-014-009 [P1] MISSING facet F04
- Files: (none, new feature)
- Legacy: LC:63-70 active,enabled,allowedForDisplay independent nullable fields
- Expected fix: Implement status/visibility bulk flags or document intentionally different feature.

## G2-2-016-116 [P1] GAP facet F10
- Files: src/app/(authenticated)/college/placements/retention/page.tsx
- Legacy: GET retention report olderThanDays default365, read-only `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:951-969`
- Expected fix: Restore configurable 365-day default or document approved retention threshold change

## G2-2-021-014 [P1] GAP facet F04
- Files: src/modules/projects/template-rollback-service.ts
- Legacy: AdminProjectTemplateController.java:436-459 `impact` returns blast-radius map for rollback
- Expected fix: Provide trustworthy pre-rollback impact including affected project counts before confirmation.

## G2-2-021-031 [P1] GAP facet F09
- Files: src/modules/projects/template-rollback-service.ts
- Legacy: AdminProjectTemplateController.java:436-459 impact preview before rollback
- Expected fix: Require blast-radius review/impact dialog prior to rollback.

## G2-2-021-036 [P1] GAP facet F10
- Files: src/modules/projects/template-rollback-service.ts
- Legacy: AdminProjectTemplateController.java:470-483 rollback rewrites legacy virtual sections for attached workspaces (comments:436-443)
- Expected fix: Decide target parity explicitly: attach/materialize snapshot vs legacy dynamic virtual sections; disclose before rollback.

## G2-2-021-044 [P1] GAP facet F12
- Files: src/modules/projects/template-rollback-service.ts
- Legacy: AdminProjectTemplateController.java:436-483 rollback preflight and restore old version affecting virtual sections
- Expected fix: Clearly state no immediate attached-workspace updates and audit difference.

## G2-2-021-070 [P1] GAP facet F23
- Files: src/modules/projects/template-rollback-service.ts
- Legacy: AdminProjectTemplateController.java:436-443 attached cohorts resolve virtual sections dynamically
- Expected fix: Document and review intentional snapshot divergence before fixes.

## G2-2-030-009 [P1] GAP facet F03
- Files: src/modules/placements/tpo-coding-profile-model.ts
- Legacy: ChoicesController.java:61-67 coding platform options include key,label,urlPrefix,pattern,hint,value.
- Expected fix: Return platform-specific regex, hint and URL prefix for all six supported legacy options or document deprecation.

## G2-2-030-019 [P1] GAP facet F05
- Files: src/modules/placements/tpo-coding-profile-model.ts
- Legacy: ChoicesController.java:61-67 loops CodingPlatforms.ALL order LEETCODE,HACKERRANK,CODECHEF,CODEFORCES,GFG,HACKEREARTH.
- Expected fix: Preserve legacy platform options/order or explicitly scope GitHub as addition and GFG/HackerEarth removal.

## G2-2-030-021 [P1] GAP facet F06
- Files: src/modules/placements/tpo-coding-profile-model.ts
- Legacy: useChoices.js:59-64 validates pasted coding username against regex from option metadata.
- Expected fix: Accept username-only or pasted legacy profile link and apply per-platform patterns with same error guidance.

## G2-2-030-069 [P1] GAP facet F23
- Files: src/modules/placements/tpo-coding-profile-model.ts
- Legacy: ChoicesController.java:61-67 exposes SIX coding platforms with hint/pattern and username compatibility.
- Expected fix: Explicit business decision and migration for GFG/HackerEarth vs GitHub, preserve stored profile links.

## G2-14-025-004 [P1] GAP facet F01
- Files: src/modules/placements/hr-job-read-service.ts, src/modules/placements/hr-round-editor-service.ts
- Legacy: RecruiterDriveController.java:117-180 drives/rounds/applicants/pipeline/ZIP/results/slots/selections
- Expected fix: Maintain explicit contract mapping for each named drive action.

## G2-14-025-012 [P1] GAP facet F04
- Files: src/modules/placements/hr-job-read-service.ts
- Legacy: RecruiterDriveController.java:46 applicantIds,roleOption,ctcLpa,kind
- Expected fix: Preserve selection candidate IDs, role selection and decimal LPA.

## G2-14-025-060 [P1] GAP facet F22
- Files: src/modules/placements/hr-job-read-service.ts
- Legacy: RecruiterDriveController.java:38-47 integer college/job IDs, applicant string IDs
- Expected fix: Provide durable legacy ID to scoped UUID migration map.

## G2-15-030-038 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: L:39 collegeId nullable switches org/college read
- Expected fix: Owner decision on org-wide reports.

## G2-18-026-048 [P1] GAP facet F19
- Files: src/components/admin/admin-program-directory.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:229-245 server paging clamps size1..100 default20
- Expected fix: Add server filter/page 20 default and bounded college directory loading

## G2-2-001-038 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LS:133-193 every mutation emits event with actor/from/to/note and detail response
- Expected fix: Persist assignee/severity/commit old/new values and commit JSON for lossless history.
