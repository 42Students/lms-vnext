# Work packet (wave 2): edit src/components/academics/college-promotion-confirmation.tsx

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-batch-promotion.md, docs/audit/gap2/lane-9/superadmin-batch-promotion-component.md, docs/audit/gap2/lane-9/superadmin-batch-promotion.md

## G2-9-002-010  [P2] GAP  facet F03  effort M
- Legacy: Promote up arrow and graduated check-circle row icons (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:315-342`)
- vNext now: Only shared Promote button; no icon (`src/components/academics/college-promotion-confirmation.tsx:67-73`)
- Fix: Render icons in row actions.

## G2-9-002-038  [P2] GAP  facet F09  effort M
- Legacy: Modal heading Promote "<batch name>" (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:455-466`)
- vNext now: ConfirmDialog generic Promote Batch (`src/components/academics/college-promotion-confirmation.tsx:68-73`)
- Fix: Use dynamic batch name in title.

## G2-9-002-039  [P2] GAP  facet F09  effort M
- Legacy: Impact shows semester, deactivated assignments, student/class count, year rollover, max semester (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:481-509`)
- vNext now: Short version/academic year and count explanation (`src/components/academics/college-promotion-confirmation.tsx:71-80`)
- Fix: List each impact explicitly before confirmation.

## G2-9-002-045  [P2] GAP  facet F10  effort M
- Legacy: POST /api/v1/batch/{id}/promote body target_semester and new_academic_year (`docs/legacy-source/frontend/src/api/Services/AdminService.js:151-158`)
- vNext now: POST /api/academics/batch-promotion/execute version+count snapshots (`src/components/academics/college-promotion-confirmation.tsx:27-47`)
- Fix: Document changed POST contract and preserve revalidation.

## G2-9-028-010  [P2] GAP  facet F03  effort M
- Legacy: Inline small primary Promote with up-arrow icon `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:354-364`
- vNext now: Preview link and subsequent Promote Batch button `src/app/(authenticated)/admin/batch-promotion/page.tsx:98-104` `src/components/academics/college-promotion-confirmation.tsx:62-68`
- Fix: Restore row-level Promote button and icon

## G2-9-028-024  [P2] MISSING  facet F06  effort M
- Legacy: Dirty academic-year override triggers Discard promotion changes confirm `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:269-283`
- vNext now: ConfirmDialog has no editable override and no dirty state `src/components/academics/college-promotion-confirmation.tsx:62-80`
- Fix: Move editable override into dialog and protect dirty close

## G2-9-028-033  [P2] GAP  facet F09  effort S
- Legacy: Modal Promote NAME, Yes Promote / Cancel, mask not closable `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:453-471`
- vNext now: Generic ConfirmDialog Promote Batch without batch name `src/components/academics/college-promotion-confirmation.tsx:68-79`
- Fix: Use batch-specific modal heading and dismiss rules

## G2-9-028-036  [P2] MISSING  facet F09  effort M
- Legacy: Dirty override discard confirmation Keep reviewing `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:269-283`
- vNext now: No matching dirty dismissal dialog `src/components/academics/college-promotion-confirmation.tsx:68-80`
- Fix: Restore discard confirmation

## G2-9-022-010  [P2] GAP  facet F03  effort M
- Legacy: Inline small primary Promote with up-arrow icon `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:354-364`
- vNext now: Preview link and subsequent Promote Batch button `src/app/(authenticated)/admin/batch-promotion/page.tsx:98-104` `src/components/academics/college-promotion-confirmation.tsx:62-68`
- Fix: Restore row-level Promote button and icon

## G2-9-022-024  [P2] MISSING  facet F06  effort M
- Legacy: Dirty academic-year override triggers Discard promotion changes confirm `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:269-283`
- vNext now: ConfirmDialog has no editable override and no dirty state `src/components/academics/college-promotion-confirmation.tsx:62-80`
- Fix: Move editable override into dialog and protect dirty close

## G2-9-022-033  [P2] GAP  facet F09  effort S
- Legacy: Modal Promote NAME, Yes Promote / Cancel, mask not closable `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:453-471`
- vNext now: Generic ConfirmDialog Promote Batch without batch name `src/components/academics/college-promotion-confirmation.tsx:68-79`
- Fix: Use batch-specific modal heading and dismiss rules

## G2-9-022-036  [P2] MISSING  facet F09  effort M
- Legacy: Dirty override discard confirmation Keep reviewing `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:269-283`
- vNext now: No matching dirty dismissal dialog `src/components/academics/college-promotion-confirmation.tsx:68-80`
- Fix: Restore discard confirmation

## G2-9-028-039  [P3] GAP  facet F10  effort M
- Legacy: POST /api/v1/batch/{id}/promote target_semester,new_academic_year `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:243-249` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/BatchController.java:158-184`
- vNext now: POST /api/academics/batch-promotion/execute expectedVersion,target,year,confirm `src/components/academics/college-promotion-confirmation.tsx:34-43` `src/app/api/academics/batch-promotion/execute/route.ts:8-25`
- Fix: Document required CAS payload and response

## G2-9-022-039  [P3] GAP  facet F10  effort M
- Legacy: POST /api/v1/batch/{id}/promote target_semester,new_academic_year `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:243-249` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/BatchController.java:158-184`
- vNext now: POST /api/academics/batch-promotion/execute expectedVersion,target,year,confirm `src/components/academics/college-promotion-confirmation.tsx:34-43` `src/app/api/academics/batch-promotion/execute/route.ts:8-25`
- Fix: Document required CAS payload and response
