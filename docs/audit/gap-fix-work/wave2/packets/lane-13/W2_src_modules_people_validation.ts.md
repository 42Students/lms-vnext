# Work packet (wave 2): edit src/modules/people/validation.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/role.md

## G2-13-016-005  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Role.java:12-15` inline seed example 'admin' and 'user' with description labels
- vNext now: `src/modules/people/validation.ts:29`,50-54 accepted membership enums; UI labels belong to member management
- Fix: Document historical seed 'admin'/'user' mapping and visually check role picker labels in people pages

## G2-13-016-006  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/config/roles.js:24-32` front-end labels 'College Admin','TPO','Mentor','Faculty','Learner','Recruiter'
- vNext now: `src/modules/identity/constants.ts:17-27` enum names uppercase, `src/modules/people/validation.ts:29` validation has no display labels
- Fix: Use role display label catalogue while keeping backend enum canonical names

## G2-13-016-034  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Role.java:12-15` comments 'Admin role' and 'User role'
- vNext now: `src/modules/people/validation.ts:52` exact 'At least one membership role is required' for onboarding; `src/modules/people/membership-service.ts:61-65` MEMBERSHIP_ENDED
- Fix: Define human-readable role name/help text distinct from enum and validation codes
