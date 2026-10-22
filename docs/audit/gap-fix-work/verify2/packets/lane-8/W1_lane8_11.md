# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-9-002-078 [P1] MISSING facet F20
- Files: src/app/api/academics/batch-promotion/execute/route.ts
- Legacy: Graduation in-flight ref prevents double submit (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:129-169`)
- Expected fix: Wire separate idempotent graduation action with pending guard.

## G2-9-002-079 [P1] GAP facet F21
- Files: src/modules/academics/college-batch-promotion-execute.ts
- Legacy: Java teaching assignment service deactivation (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:154-187`)
- Expected fix: Reconcile downstream class/course assignment effects before enabling.

## G2-9-003-010 [P1] GAP facet F03
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Row actions Edit, Students, Delete visible with icons (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:464-506`)
- Expected fix: Expose Students action and legacy row action affordances.

## G2-9-003-026 [P1] GAP facet F06
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Academic year starts in preference keyed by college; July default (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:42-62`)
- Expected fix: Restore selectable academic year start month and generated year behavior where required.

## G2-9-003-030 [P1] GAP facet F06
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Academic Year maxLength 7, YYYY-YY, fill from start date (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:108-128`)
- Expected fix: Align accepted/displayed academic year format or document supported extended form.

## G2-9-003-031 [P1] MISSING facet F06
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Status editable in legacy edit modal (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:111-130`)
- Expected fix: Expose legacy ACTIVE/INACTIVE/COMPLETED transitions under safe backend rules.

## G2-9-003-035 [P1] GAP facet F07
- Files: src/modules/academics/college-cohort-mutation-model.ts
- Legacy: DTO academic year max7 YYYY-YY exact Pattern message (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/BatchRequestDTO.java:13-29`)
- Expected fix: Confirm and align legacy constraints, preserve round-trip normalization.

## G2-9-003-040 [P1] MISSING facet F08
- Files: src/components/academics/college-academic-directory.tsx
- Legacy: Moved student to selected class; failures detailed (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:349-363`)
- Expected fix: Rebuild student move workflow with toast and retry.

## G2-9-003-044 [P1] MISSING facet F09
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Move student modal class choice, capacity/full warning, no cross-batch transfer (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:658-694`)
- Expected fix: Add safe same-batch SECTION move modal respecting capacity.

## G2-9-003-045 [P1] GAP facet F09
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Delete Popconfirm if no linked classes/students (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:493-505`)
- Expected fix: Preserve appropriate delete eligibility and dependency messaging; do not hard delete if data retention mandated.

## G2-9-003-049 [P1] MISSING facet F10
- Files: src/components/academics/college-academic-directory.tsx
- Legacy: Learner move class controller endpoint (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:1-1146`)
- Expected fix: Add action wired to existing vNext class-transfer service if available.

## G2-9-003-052 [P1] MISSING facet F11
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Move targets only SECTION in same batch+program (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:318-353`)
- Expected fix: Enforce SECTION type/same batch/program in transfer API.

## G2-9-003-054 [P1] GAP facet F12
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Edit: program immutable, dates/status editable (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:127-154`)
- Expected fix: Reconcile editability against legacy policy and dependency guard.

## G2-9-003-055 [P1] GAP facet F12
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Delete only disabled when known child records and server validates (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:465-506`)
- Expected fix: Document intentionally narrower deletion eligibility; ensure inactive historical batch handling.

## G2-9-003-056 [P1] MISSING facet F12
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Roster move blocks full class using live capacity counts (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:336-355`)
- Expected fix: Implement read/check destination capacity, prevent overfill.

## G2-9-003-057 [P1] GAP facet F12
- Files: src/modules/academics/college-cohort-mutation-service.ts
- Legacy: Batch create defaults status ACTIVE, semester 1 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:68-120`)
- Expected fix: Map default state and semester progression on create.

## G2-9-003-062 [P1] MISSING facet F13
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: No classes in batch, roster loading, class load Retry (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:605-641`)
- Expected fix: Implement roster loading/empty/offline/error independently.

## G2-9-003-084 [P1] MISSING facet F20
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Move class confirmation disables if capacity full (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:332-355`)
- Expected fix: Implement idempotent transfer with live capacity CAS.

## G2-9-003-088 [P1] GAP facet F22
- Files: src/modules/academics/college-cohort-mutation-model.ts
- Legacy: BatchRequestDTO name/program required, academic year max7 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/BatchRequestDTO.java:12-29`)
- Expected fix: Reconcile required fields, defaults and year format.

## G2-9-003-092 [P1] MISSING facet F23
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Legacy Students roster + transfer modals (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:601-695`)
- Expected fix: Restore per-batch class roster and safe same-batch transfer.

## G2-9-006-042 [P1] GAP facet F12
- Files: src/modules/departments/college-department-mutation-service.ts
- Legacy: Delete blocked when linked program/course/faculty, known 3-counts (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:201-223`)
- Expected fix: Compare archival safety rule: vNext stricter than displayed active-only count; explain mismatch.

## G2-9-006-076 [P1] GAP facet F22
- Files: src/modules/departments/college-department-mutation-service.ts
- Legacy: Legacy delete removes department after dependency check (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:210-250`)
- Expected fix: Confirm retention policy and visibility impacts, do not silently hard delete.

## G2-9-007-004 [P1] MISSING facet F01
- Files: src/components/academics/college-structure-directory.tsx
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:193-200` — Slot opens a drawer preserving list page
- Expected fix: Implement correct slot detail destination or integrated drawer

## G2-9-007-018 [P1] GAP facet F05
- Files: src/components/academics/college-structure-directory.tsx
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:202-210` — Search name/program/description; select Semester 1-12 and includeArchived
- Expected fix: Search description and add exact quick filters

## G2-9-007-028 [P1] GAP facet F06
- Files: src/components/electives/college-slot-manager.tsx
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:303-311` — Pick bounds max10; max pick tooltip explains limit
- Expected fix: Restore max10 bounds and tooltip subject to policy decision
