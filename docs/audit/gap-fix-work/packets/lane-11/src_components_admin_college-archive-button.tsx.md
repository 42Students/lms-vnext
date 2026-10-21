# Work packet: edit src/components/admin/college-archive-button.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-colleges.md, docs/audit/gap2/lane-3/college-controller.md

## G2-9-032-038  [P1] GAP  facet F08  effort M
- Legacy: Delete success College deleted `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:331-335`
- vNext now: College archived + no longer active `src/components/admin/college-archive-button.tsx:108-115`
- Fix: Clarify archival instead of claiming physical deletion

## G2-9-032-047  [P1] GAP  facet F10  effort M
- Legacy: DELETE /api/v1/college/delete/{id} physical delete when empty `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:323-341`
- vNext now: DELETE /api/colleges/{uuid} calls archiveCollege and clears active scope cookie `src/components/admin/college-archive-button.tsx:74-115` `src/app/api/colleges/[collegeId]/route.ts:57-99`
- Fix: Document retained archived record and session scope invalidation

## G2-9-032-077  [P1] GAP  facet F22  effort L
- Legacy: Legacy delete physical empty college `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:323-341`
- vNext now: New archives and clears scoped session cookie `src/components/admin/college-archive-button.tsx:74-115` `src/app/api/colleges/[collegeId]/route.ts:57-99`
- Fix: Document status lifecycle/restoration and dependent record rules

## G2-3-028-036  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:224-239`
- vNext now: `src/components/admin/college-archive-button.tsx:81-118`
- Fix: Legacy delete dependency names shown to caller; vNext Archive blocked toast may lose exact reason.

## G2-9-032-035  [P2] GAP  facet F07  effort S
- Legacy: Delete failure Failed to delete college: SERVER_MESSAGE `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:335-340`
- vNext now: Archive blocked and dependency summary `src/components/admin/college-archive-button.tsx:94-117`
- Fix: Keep actionable dependency detail and label archive correctly

## G2-3-028-040  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:323-341`
- vNext now: `src/components/admin/college-archive-button.tsx:74-119`
- Fix: Legacy College deleted vs vNext College archived; error prefix Failed to delete college vs Archive blocked.
