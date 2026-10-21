# Work packet (wave 2): edit src/modules/academics/college-section-mutation-model.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/class-controller.md, docs/audit/gap2/lane-5/u010-classes-shared-component.md

## G2-2-031-026  [P2] GAP  facet F06  effort M
- Legacy: ClassDTO.java:14-23 requires nonblank name and positive programId, optional batchId.
- vNext now: college-section-mutation-model.ts:12-19 requires cohortId and academicPeriodId UUID, name, code and capacity.
- Fix: Make new required fields clear and preserve legacy error affordances.

## G2-2-031-028  [P2] GAP  facet F06  effort M
- Legacy: Classes.js:90-102 enforces max 1..200, at least lowerLimit.
- vNext now: college-section-mutation-model.ts:8 create capacity 1..200, update capacity nullable max10000.
- Fix: Explain intentional different update max/nullable capacity policy; ensure UI copy matches.

## G2-2-031-029  [P2] GAP  facet F06  effort M
- Legacy: ClassServiceImpl.java:173-180 accepts optional lifecycle startDate/endDate with date-order check.
- vNext now: college-section-mutation-model.ts:12-27 has no dates; periodId provides academic period.
- Fix: Preserve date snapshots in migration and display period-derived dates if legacy fields retired.

## G2-2-031-088  [P2] GAP  facet F23  effort M
- Legacy: ClassDTO.java:17-18 dates with legacy class description.
- vNext now: college-section-mutation-model.ts:12-27 replaces dates with academic period, adds code/capacity.
- Fix: Document intentional class data model change on detail page.

## G2-5-010-015  [P2] GAP  facet F04 Data formatting  effort S
- Legacy: Max Students 0 -> No limit (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:395-397)
- vNext now: Capacity nullable, shows Not configured, 0 not explicit unlimited (src/components/academics/college-structure-directory.tsx:393; src/modules/academics/college-section-mutation-model.ts:4-9)
- Fix: Migrate zero-limit sentinel and display No limit.

## G2-2-031-027  [P3] GAP  facet F06  effort S
- Legacy: Classes.js:80-83 validates class name with `Enter the class or section name`.
- vNext now: college-section-mutation-model.ts:3-4 uses trimmed .min(1) without custom message.
- Fix: Restore exact validation message and max length when provided.
