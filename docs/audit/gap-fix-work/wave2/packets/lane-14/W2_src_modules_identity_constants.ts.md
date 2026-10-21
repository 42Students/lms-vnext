# Work packet (wave 2): edit src/modules/identity/constants.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/role.md

## G2-13-016-006  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/config/roles.js:24-32` front-end labels 'College Admin','TPO','Mentor','Faculty','Learner','Recruiter'
- vNext now: `src/modules/identity/constants.ts:17-27` enum names uppercase, `src/modules/people/validation.ts:29` validation has no display labels
- Fix: Use role display label catalogue while keeping backend enum canonical names

## G2-13-016-038  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:23-26` integer ID; `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Role.java:12-15` examples ID4 and5, not FK-stable role semantics
- vNext now: `src/db/schema/memberships.ts:55` UUID assignment IDs, `src/modules/identity/constants.ts:17-27` code enums
- Fix: Map role IDs to names first, normalize case and reject duplicate/missing seed roles

## G2-13-016-042  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/config/roles.js:49-68` frontend determines page routing from userType/facultyType/id
- vNext now: `src/modules/identity/context-service.ts:39-55` request context activeRole and membership choice; `src/modules/identity/constants.ts:17-27` enum roles
- Fix: Verify session switch/route identity parity across every role, especially faculty admin and TPO

## G2-13-016-011  [P3] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Role.java:12-15` insert order and IDs 4,5 are comments only, not enforced
- vNext now: `src/modules/identity/constants.ts:17-27` stable enum list order with learner first
- Fix: Define display ordering for role selector; never depend on legacy numeric seed ordering

## G2-13-016-027  [P3] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Role.java:28` description is free text, no restrictions
- vNext now: `src/modules/identity/constants.ts:17-27` permissions based on fixed enum; display metadata separate
- Fix: Capture role descriptions only for documentation, never privilege policy

## G2-13-016-035  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/config/roles.js:24-32` 'Admin' role displayed 'College Admin'
- vNext now: `src/modules/identity/constants.ts:21` COLLEGE_ADMIN backend enum; `src/app/api/people/[membershipId]/roles/route.ts:48` returns bare role values
- Fix: Keep existing 'College Admin' display in app shell and people roles, not machine enum
