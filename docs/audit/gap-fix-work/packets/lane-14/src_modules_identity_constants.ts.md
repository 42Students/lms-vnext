# Work packet: edit src/modules/identity/constants.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/role.md

## G2-13-016-003  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/config/roles.js:14-32` frontend account roles includes SUPER_ADMIN,ADMIN,TPO,MENTOR,FACULTY,LEARNER,RECRUITER
- vNext now: `src/modules/identity/constants.ts:17-27` membership roles LEARNER/FACULTY/COLLEGE_ADMIN/MENTOR/TPO, system SUPER_ADMIN; `src/modules/identity/context-service.ts:84-111` recruiter profile separate
- Fix: Write exact account-role mapping (ADMIN→COLLEGE_ADMIN; RECRUITER→profile/grants) with stable routing labels

## G2-13-016-025  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Role.java:12-15` seed roles lowercase admin,user as comments
- vNext now: `src/modules/identity/constants.ts:17-27` uppercase role enums without generic USER
- Fix: Write explicit admin/user fallback mapping and reject UNKNOWN roles instead of silently assigning LEARNER
