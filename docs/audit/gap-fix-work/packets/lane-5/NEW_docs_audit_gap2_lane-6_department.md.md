# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/department.md

15 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/department.md

## G2-6-020-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy GET /fetchAll permitted global SA all orgs, scoped SA org or college (DepartmentController.java:95-125).
- vNext now: vNext listDepartments requires a single collegeId and department.read (departments/service.ts:221-250).
- Fix: Add super-admin cross-college/organization department reader with authenticated scope if global list is required.

## G2-6-020-010  [P1] MISSING  facet F04  effort M
- Legacy: Legacy deptChairId optional Integer (Department.java:17-18; DepartmentDTO.java:14-16).
- vNext now: vNext departments has no chair id (departments.ts:12-23).
- Fix: Decide intentional removal vs retain optional leadership relation in normalized role-assignment table.

## G2-6-020-011  [P1] MISSING  facet F04  effort M
- Legacy: Legacy deptViceChairId optional Integer (Department.java:19-20; DepartmentDTO.java:17-20).
- vNext now: vNext departments has no vice-chair id (departments.ts:12-23).
- Fix: Add optional vice-chair association or document product decision to drop.

## G2-6-020-015  [P1] GAP  facet F05  effort M
- Legacy: Legacy repo query for org departments joins college org_id (DepartmentRepository.java:28-31).
- vNext now: vNext listDepartments only college query (departments/service.ts:221-251).
- Fix: Implement org/global listing when superadmin scope requires it.

## G2-6-020-020  [P1] GAP  facet F06  effort M
- Legacy: Legacy create DTO name NotBlank/Size255, collegeId required and leadership IDs optional min1 (DepartmentDTO.java:10-24).
- vNext now: vNext create input only collegeId and name (departments/validation.ts:12-15).
- Fix: Preserve chair/vice options if product decides data parity; otherwise record intentional omission.

## G2-6-020-022  [P1] MISSING  facet F06  effort M
- Legacy: Legacy optional chair and vice chair validated for same college (DepartmentServiceImpl.java:97-115).
- vNext now: vNext department mutation only name, no leadership validation (departments/service.ts:253-291,293-343).
- Fix: When leadership returns, require faculty record active and college match on both roles.

## G2-6-020-028  [P1] MISSING  facet F07  effort M
- Legacy: Legacy DTO invalid chair not found / wrong-college error messages (DepartmentServiceImpl.java:106-114).
- vNext now: vNext no corresponding validation path (departments/service.ts:253-291).
- Fix: If chair fields restored, use exact field-level errors.

## G2-6-020-038  [P1] GAP  facet F11  effort M
- Legacy: Legacy GET /fetchAll global SA can read all departments (DepartmentController.java:95-124).
- vNext now: vNext listDepartments requires collegeId and permission (departments/service.ts:221-251).
- Fix: Provide authorized global admin collection view or explicit scope-selection workflow.

## G2-6-020-040  [P1] GAP  facet F12  effort M
- Legacy: Legacy deletion guarded by any linked program/faculty/course query (DepartmentServiceImpl.java:69-84).
- vNext now: vNext usage resolver counts ACTIVE programs/courses and non-ENDED faculty then archive check (departments/service.ts:50-121,345-360).
- Fix: Compare linked but archived child semantics; block if referentially unsafe or orphaning historical associations.

## G2-6-020-054  [P1] GAP  facet F22  effort L
- Legacy: Legacy Department int PK, name nullable, chair/vice IDs, primitive collegeId, BaseModel soft delete/timestamps (Department.java:9-23; BaseModel.java:22-37).
- vNext now: vNext departments uuid PK/college FK/name NOT NULL/archivedAt/timestamptz, no leadership columns (departments.ts:12-31).
- Fix: Write field mapping for leadership IDs and archived status; preserve prior source data if migration ever happens.

## G2-6-020-058  [P1] MISSING  facet F23  effort M
- Legacy: Legacy optional chair/vice fields persisted even though UI may no longer expose them (Department.java:17-20).
- vNext now: vNext drops leadership columns (departments.ts:12-23).
- Fix: Record owner decision about leadership data parity; only add fields if still required in vNext.

## G2-6-020-025  [P2] GAP  facet F07  effort S
- Legacy: Legacy deletion dependent programs exact Cannot delete department: it has programs linked to it. Delete/move the programs first. (DepartmentServiceImpl.java:69-75).
- vNext now: vNext DepartmentHasDependenciesError generic Department still has active dependencies (departments/archive-policy.ts:7-17).
- Fix: Preserve separate programs message and actionable dependency list.

## G2-6-020-026  [P2] GAP  facet F07  effort S
- Legacy: Legacy deletion dependent faculty exact Cannot delete department: it has faculty assigned to it. Reassign the faculty first. (DepartmentServiceImpl.java:76-77).
- vNext now: vNext generic grouped conflict and counts (department-actions.tsx:95-129).
- Fix: Map faculty conflict to original exact message.

## G2-6-020-027  [P2] GAP  facet F07  effort S
- Legacy: Legacy deletion dependent courses exact Cannot delete department: it has courses linked to it. Delete/move the courses first. (DepartmentServiceImpl.java:79-80).
- vNext now: vNext generic grouped conflict and counts (department-actions.tsx:103-129).
- Fix: Map course conflict to original exact message.

## G2-6-020-030  [P2] GAP  facet F08  effort S
- Legacy: Legacy delete returns Department deleted successfully (DepartmentController.java:207-212).
- vNext now: vNext toast Department archived with secondary description (department-actions.tsx:132-140).
- Fix: Align delete/archive vocabulary and exact toast copy.
