# Work packet: edit src/components/academics/college-cohort-management.tsx (part 3 of 3)

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-batches-component.md, docs/audit/gap2/lane-9/superadmin-batches.md

## G2-9-029-031  [P3] GAP  facet F07  effort S
- Legacy: End date cannot be before start date `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:85-92`
- vNext now: End date cannot be before start date. includes final period `src/components/academics/college-cohort-management.tsx:61-69` `src/modules/academics/college-cohort-mutation-model.ts:12-17`
- Fix: Match punctuation/location and disabled date state

## G2-9-029-036  [P3] GAP  facet F08  effort S
- Legacy: Updated batch NAME success toast `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:427-428`
- vNext now: Same wording in inline notice `src/components/academics/college-cohort-management.tsx:232-240`
- Fix: Match toast placement/duration

## G2-9-023-031  [P3] GAP  facet F07  effort S
- Legacy: End date cannot be before start date `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:85-92`
- vNext now: End date cannot be before start date. includes final period `src/components/academics/college-cohort-management.tsx:61-69` `src/modules/academics/college-cohort-mutation-model.ts:12-17`
- Fix: Match punctuation/location and disabled date state

## G2-9-023-036  [P3] GAP  facet F08  effort S
- Legacy: Updated batch NAME success toast `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:427-428`
- vNext now: Same wording in inline notice `src/components/academics/college-cohort-management.tsx:232-240`
- Fix: Match toast placement/duration
