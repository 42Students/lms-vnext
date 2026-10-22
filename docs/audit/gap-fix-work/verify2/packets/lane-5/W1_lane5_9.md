# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-9-015-007 [P1] GAP facet F02
- Files: src/app/(authenticated)/college/placements/drives/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:670-718` — Jobs header/title, inline company scope/select, search/status, Create Job.
- Expected fix: Recreate header/action/toolbar order, add Create Job.

## G2-9-012-005 [P1] GAP facet F02
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:750-777` — Header Interviews, descriptive subtitle, This drive only scope chip and Refresh; four metrics below
- Expected fix: Build legacy header and four-count summary strip

## G2-9-013-014 [P1] MISSING facet F03
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:628-663` — Company AutoComplete offers existing companies and tooltip, with info alert for unmatched company.
- Expected fix: Add scoped company relationship display/edit flow and unmatched-company guidance.

## G2-9-014-039 [P1] GAP facet F07
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1531-1548` — API fetch failure warning with Retry and Close while keeping existing job.
- Expected fix: Add scoped retry/error boundary and keep last successful results.

## G2-9-017-007 [P1] GAP facet F02
- Files: src/components/admin/lecture-hall-manager.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:305-381` — Create New Lecture Hall / Room Card always visible with fields.
- Expected fix: Show creation form persistently in left card.

## G2-9-017-034 [P1] GAP facet F06
- Files: src/components/admin/lecture-hall-manager.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:366-368` — Capacity default 50, min1,max1000.
- Expected fix: Reduce max to1000 for exact legacy constraint.

## G2-9-017-036 [P1] GAP facet F06
- Files: src/components/admin/lecture-hall-manager.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:428-510` — Edit modal duplicate fields, Update and Cancel; unsaved warning on cancel.
- Expected fix: Add dirty edit confirmation modal with exact copy.

## G2-9-017-041 [P1] GAP facet F07
- Files: src/components/admin/lecture-hall-manager.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:366-367` — Capacity limit 1–1000.
- Expected fix: Use legacy limit and field-level error copy.

## G2-9-017-049 [P1] MISSING facet F09
- Files: src/components/admin/lecture-hall-manager.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:176-188` — Dirty edit cancel confirm Discard edits to “NAME”? with Your unsaved changes will be lost, Discard edits.
- Expected fix: Restore exact dirty-cancel confirm.

## G2-9-017-061 [P1] GAP facet F12
- Files: src/components/admin/lecture-hall-manager.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:351-366` — Room type must be explicitly chosen, Capacity max1000.
- Expected fix: Align defaults and capacity policy.

## G2-9-017-089 [P1] GAP facet F20
- Files: src/components/admin/lecture-hall-manager.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:154-167` — Edit prefill + snapshot prevents discard of changed draft.
- Expected fix: Restore normalized draft change tracking.

## G2-9-017-095 [P1] GAP facet F22
- Files: src/components/admin/lecture-hall-manager.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LectureHallDTO.java:8-23` — Legacy DTO @NotBlank @Size(max255) name, capacity @Min1, description @Size(max255), room type @NotNull.
- Expected fix: Reconcile DTO limits with new schema/server validation.

## G2-9-019-048 [P1] GAP facet F11
- Files: src/app/(authenticated)/college/semesters/page.tsx
- Legacy: Unassigned college warning `docs/legacy-source/frontend/src/pages/college-admin/semesters.js:18-29`
- Expected fix: Show explicit legacy access scope warning.

## G2-9-036-029 [P1] GAP facet F06
- Files: src/components/admin/college-feature-rule-editor.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:263-275` binary immediate enable/disable switch
- Expected fix: Create simple toggle mode and separate advanced rule editor

## G2-9-036-050 [P1] GAP facet F10
- Files: src/components/admin/college-feature-rule-editor.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:126-134` refetch effective state before successful toast
- Expected fix: Await effective resolver read before final success indication

## G2-9-036-116 [P1] GAP facet F09
- Files: src/components/admin/college-feature-rule-editor.tsx
- Legacy: Legacy modal project zero count warns zero isn't safety `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:168-177`
- Expected fix: Restore zero/unavailable impact caution with exact wording.

## G2-15-017-025 [P1] MISSING facet F10
- Files: src/modules/projects/resource-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:845-854 require admin scope & projects feature gate
- Expected fix: Apply same college and feature permission to history endpoint

## G2-15-017-026 [P1] GAP facet F10
- Files: src/modules/projects/resource-service.ts
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V80__project_resource_audit.sql:1-20 durable project_resource_audit SQL table
- Expected fix: Append detailed history in same transaction as create/edit/archive

## G2-15-017-028 [P1] GAP facet F10
- Files: src/modules/projects/resource-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectResourceAudit.java:39-41 resource order captured
- Expected fix: Audit each reordered resource with before/after position

## G2-9-022-022 [P1] GAP facet F06
- Files: src/app/(authenticated)/admin/batch-promotion/page.tsx
- Legacy: Optional academic-year override string max length 7, e.g. 2026-27 `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:501-514`
- Expected fix: Support YYYY-YY entry and convert to yearStart for backend

## G2-9-033-020 [P1] GAP facet F07
- Files: src/components/admin/super-admin-college-company-actions.tsx
- Legacy: Old logo and website require HTTPS with Must be a valid URL and HTTPS-specific messages `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:483-490`
- Expected fix: Require HTTPS and restore logo field validation in college modal

## G2-9-033-069 [P1] MISSING facet F06
- Files: src/components/admin/super-admin-college-company-actions.tsx
- Legacy: Logo URL field maxLength=500 placeholder 'https://...' `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:484-486`
- Expected fix: Restore HTTPS-only logo field and max500 rule.

## G2-9-033-070 [P1] GAP facet F06
- Files: src/components/admin/super-admin-college-company-actions.tsx
- Legacy: Website max500, HTTPS regex; one-per-domain helper `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:487-489`
- Expected fix: Cap 500, require HTTPS and restore helper text.

## G2-9-033-074 [P1] MISSING facet F06
- Files: src/components/admin/super-admin-college-company-actions.tsx
- Legacy: Contact email max150, email validator, 'recruiter@company.com' `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:502-503`
- Expected fix: Restore scoped contact email and email validator.

## G2-9-033-085 [P1] MISSING facet F12
- Files: src/components/admin/super-admin-college-company-actions.tsx
- Legacy: Once verified by 42, only superadmin can edit public details `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:255-257,311-316`
- Expected fix: Restore authorization-preserving editable public/private field split.
