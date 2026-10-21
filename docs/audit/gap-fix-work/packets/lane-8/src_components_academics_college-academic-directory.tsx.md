# Work packet: edit src/components/academics/college-academic-directory.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-batches.md, docs/audit/gap2/lane-9/college-admin-semesters.md

## G2-9-003-040  [P1] MISSING  facet F08  effort M
- Legacy: Moved student to selected class; failures detailed (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:349-363`)
- vNext now: No Students modal and no move action (`src/components/academics/college-academic-directory.tsx:284-331`)
- Fix: Rebuild student move workflow with toast and retry.

## G2-9-003-043  [P1] MISSING  facet F09  effort M
- Legacy: Students modal width720 class selector, roster search/table (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:601-658`)
- vNext now: Only batch row actions, no Students modal (`src/components/academics/college-academic-directory.tsx:293-331`)
- Fix: Restore class-roster drill-in panel.

## G2-9-003-049  [P1] MISSING  facet F10  effort M
- Legacy: Learner move class controller endpoint (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:1-1146`)
- vNext now: No move class call from batch page (`src/components/academics/college-academic-directory.tsx:291-330`)
- Fix: Add action wired to existing vNext class-transfer service if available.

## G2-9-003-073  [P1] MISSING  facet F17  effort M
- Legacy: Roster columns Name/Roll No./Email/Move, meaningful move aria-label (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:633-654`)
- vNext now: No roster (`src/components/academics/college-academic-directory.tsx:283-331`)
- Fix: Add semantic roster table and move button aria label.

## G2-9-019-019  [P1] GAP  facet F05  effort S
- Legacy: Default pagination 10 Ant Table, page size changer and range `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:529-544`
- vNext now: Server pageSize defaults 10 but pagination says 25 per page fixed `src/modules/academics/college-academic-directory-model.ts:13-18` `src/components/academics/college-academic-directory.tsx:317-322`
- Fix: Fix static 25 per page label to reflect query.pageSize; expose size changer.
