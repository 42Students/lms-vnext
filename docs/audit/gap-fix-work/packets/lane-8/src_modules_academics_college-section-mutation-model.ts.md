# Work packet: edit src/modules/academics/college-section-mutation-model.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/class-controller.md, docs/audit/gap2/lane-5/u003-college-admin-classes.md, docs/audit/gap2/lane-5/u008-superadmin-classes.md, docs/audit/gap2/lane-5/u010-classes-shared-component.md

## G2-2-031-016  [P1] GAP  facet F04  effort L
- Legacy: ClassDTO.java:11-24 uses snake_case program_id,batch_id,upper_limit,lower_limit plus description/startDate/endDate.
- vNext now: college-section-mutation-model.ts:12-19 uses UUID cohortId, academicPeriodId, name, code, capacity,description.
- Fix: Implement field/ID translation and decisions for legacy minSize/start/end lifecycle metadata.

## G2-5-003-075  [P1] GAP  facet F22 Data model/migrations  effort L
- Legacy: Legacy _Class programId, batchId, name, description, lower/upper limit. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:33-48; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:75-106)
- vNext now: sections cohortId+academicPeriodId, name, code, capacity, minSize, status. (src/db/schema/academics.ts:184-251; src/modules/academics/college-section-mutation-model.ts:4-19)
- Fix: Document numeric→UUID migration including legacy lowerLimit and academic period link.

## G2-5-008-033  [P1] GAP  facet F07 Validation/errors  effort M
- Legacy: Max whole number 1–200 and max >= min (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:93-100)
- vNext now: Range 1–200 on create, edits accept 10k; generic message (src/components/academics/college-section-management.tsx:123-126; src/modules/academics/college-section-mutation-model.ts:4-9)
- Fix: Use exact cross-field messages and both create/edit max200.

## G2-5-008-076  [P1] GAP  facet F22 Data/migrations  effort L
- Legacy: Class entity programId,batchId,lower/upperLimit,description (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:33-48)
- vNext now: Section UUID+cohortId+periodId+code/capacity/minSize/status (src/modules/academics/college-section-mutation-service.ts:156-236; src/modules/academics/college-section-mutation-model.ts:4-9)
- Fix: Document migration lower limit, ID mapping, period inference.

## G2-5-010-020  [P1] GAP  facet F05 Tables/lists  effort M
- Legacy: Page size options 10/25/50/100, default25 preference saved (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:499-505)
- vNext now: College directory defaults10 (label25), no persistent size (src/components/academics/college-structure-directory.tsx:448-459; src/modules/academics/college-section-mutation-model.ts:4-9)
- Fix: Set default 25, fix label and persist size.

## G2-2-031-037  [P3] GAP  facet F07  effort S
- Legacy: ClassServiceImpl.java:164-166 message `Class name is required`.
- vNext now: college-section-mutation-model.ts:4 trim min1 default Zod error.
- Fix: Surface explicit `Class name is required` inline.
