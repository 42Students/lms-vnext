# Work packet: edit src/modules/academics/college-section-mutation-service.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/class-controller.md, docs/audit/gap2/lane-5/u003-college-admin-classes.md, docs/audit/gap2/lane-5/u008-superadmin-classes.md, docs/audit/gap2/lane-5/u010-classes-shared-component.md

## G2-2-031-054  [P1] GAP  facet F12  effort L
- Legacy: ClassServiceImpl.java:64-76 uniqueness by batch (or program without batch).
- vNext now: college-section-mutation-service.ts:97-119 uniqueness by cohort+period, and code.
- Fix: Reconcile repeated section name across periods with legacy global-to-batch uniqueness for import.

## G2-5-003-026  [P1] GAP  facet F06 Forms  effort L
- Legacy: Edit allows changing Program and Batch with scope validation. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:33-48; docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:71-78)
- vNext now: Batch and academic period immutable in edit; code required; name/capacity editable. (src/components/academics/college-section-management.tsx:195-207; src/modules/academics/college-section-mutation-service.ts:180-221)
- Fix: Provide sanctioned reassignment flow with dependency guard or document intentional immutability.

## G2-5-003-043  [P1] GAP  facet F10 Actions/side effects  effort L
- Legacy: PUT /api/v1/class/update/:id allows reassignment with college/program validation. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:274-285; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:181-216)
- vNext now: PATCH /api/college/classes/:uuid prohibits changing cohort/period. (src/components/academics/college-section-management.tsx:164-183; src/modules/academics/college-section-mutation-service.ts:180-236)
- Fix: Add explicit safe migration/reassignment pathway if parity required.

## G2-5-008-028  [P1] GAP  facet F06 Forms  effort L
- Legacy: Edit can change Program, Batch and lowerLimit preserved (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:33-48)
- vNext now: Cohort/period immutable on edit; name/code/capacity instead (src/components/academics/college-section-management.tsx:195-210; src/modules/academics/college-section-mutation-service.ts:180-236)
- Fix: Safe Program/Batch reassignment with validation or explicit intentional departure.

## G2-5-010-018  [P1] GAP  facet F04 Data formatting  effort M
- Legacy: Lower limit preserved on edit, max>=min invariant (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:91-105)
- vNext now: No lower field in update UI, separate minSize in section schema (src/modules/academics/college-section-mutation-model.ts:4-9; src/modules/academics/college-section-mutation-service.ts:180-236)
- Fix: Preserve legacy lowerLimit and cross-field invariant.

## G2-5-010-028  [P1] GAP  facet F06 Forms  effort L
- Legacy: Edit allows Program/Batch reassignment (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:33-48)
- vNext now: Cannot edit cohort/period (src/components/academics/college-section-management.tsx:195-210; src/modules/academics/college-section-mutation-service.ts:180-236)
- Fix: Implement safe reassignment with dependency validation.

## G2-2-031-032  [P2] GAP  facet F07  effort S
- Legacy: ClassController.java:94-101 `Batch not found` 400 and `Batch must belong to selected program` 403.
- vNext now: college-section-mutation-service.ts:45-70 checks cohort scope, status and parent relation.
- Fix: Map concrete parent-not-found/mismatch messages without exposing tenant data.

## G2-2-031-033  [P2] GAP  facet F07  effort M
- Legacy: ClassServiceImpl.java:68-77 duplicate name case-insensitive scoped to batch else program.
- vNext now: college-section-mutation-service.ts:97-119 checks name/code within cohort+period; academics.ts:218-236 DB unique.
- Fix: Document changed uniqueness scope (per period) and new code collision error.

## G2-2-031-034  [P2] GAP  facet F07  effort S
- Legacy: ClassServiceImpl.java:141-147 rejects lowering upperLimit below active student count with detailed count message.
- vNext now: college-section-mutation-service.ts:211-220 requires proposed capacity >= enrolled count.
- Fix: Use precise active enrollment count and `Move students out first` guidance.
