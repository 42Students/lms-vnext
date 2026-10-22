# Verification packet (P1 round 2): 8 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-9-013-085 [P1] GAP facet F18
- Verification: DEFERRED — Needs deeper mutation/service validation; no safe small edit confirmed.
- Files: src/components/placements/placement-draft-edit-form.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:901-1025` — Legacy Target Audience and Candidate Preferences (informational — not enforced).
- Expected fix: Use separate section headings and explanatory contrast.

## G2-9-013-091 [P1] GAP facet F20
- Verification: DEFERRED — Needs deeper mutation/service validation; no safe small edit confirmed.
- Files: src/components/placements/placement-draft-edit-form.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:560-571` — On 409 optimistic version failure, reload before continuing.
- Expected fix: Wire 409 to Reload/Dismiss conflict recovery.

## G2-9-014-037 [P1] MISSING facet F07
- Verification: DEFERRED — Needs deeper mutation/service validation; no safe small edit confirmed.
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1130-1162` — Bulk preflight rejects invalid status targets before mutation with counts.
- Expected fix: Expose stage-aware preflight, skipped IDs and no-op warning.

## G2-9-014-050 [P1] GAP facet F10
- Verification: DEFERRED — Needs deeper mutation/service validation; no safe small edit confirmed.
- Files: src/modules/placements/college-drive-applications-service.ts
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:785-795` — GET /api/v1/admin/jobs/{jobId}/applications?collegeId&page=0&size=20&applicationStatus=ASSESSMENT by default.
- Expected fix: Map legacy assessment pipeline default onto vNext stage query.

## G2-9-018-047 [P1] GAP facet F11
- Verification: DEFERRED — Needs deeper mutation/service validation; no safe small edit confirmed.
- Files: src/app/(authenticated)/college/programs/page.tsx
- Legacy: No-college page renders warning, not mutation options `docs/legacy-source/frontend/src/pages/college-admin/programs.js:19-33`
- Expected fix: Render warning and explain next administrative action.

## G2-18-023-069 [P1] GAP facet F22
- Verification: DEFERRED — Needs deeper mutation/service validation; no safe small edit confirmed.
- Files: src/modules/placements/eligibility-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:100-108,277-292 JobEligibility JSON and LearnerAcademicRecord/marks verification
- Expected fix: Map PG/gender/CGPA conversion, original criteria, and override precedence to new normalized schema.

## G2-9-022-019 [P1] GAP facet F05
- Verification: DEFERRED — Needs deeper mutation/service validation; no safe small edit confirmed.
- Files: src/app/(authenticated)/admin/batch-promotion/page.tsx
- Legacy: Initial active-only list, switch reveals all other statuses `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:30-32,114-119`
- Expected fix: Use strict ACTIVE default filter

## G2-9-034-096 [P1] GAP facet F11
- Verification: DEFERRED — Needs deeper mutation/service validation; no safe small edit confirmed.
- Files: src/modules/placements/super-admin-company-identities-service.ts, src/modules/placements/super-admin-company-edit-service.ts
- Legacy: Legacy global list is superadmin-only independent of college scope `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminCompanyController.java:20-24`
- Expected fix: Treat 42 global catalogue as independent platform scope even if header has a selected college, with safe scoping.
