# Work packet (wave 2): edit src/modules/permissions/policy.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/cross-02-authorization-roles.md

## G2-2-036-012  [P2] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/security/RecruiterFenceFilter.java:70-82 recruiter selected college in session
- vNext now: src/modules/permissions/policy.ts:100-119 company-relationship grant scoped college
- Fix: Map legacy recruiter college-grant IDs and expiry to vNext schema.

## G2-2-036-016  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/configuration/WebSecurityConfig.java:174-193 admin-only POST/PUT/PATCH/DELETE path rules
- vNext now: src/modules/permissions/policy.ts:243-254 COLLEGE_ADMIN write permissions
- Fix: Map old FACULTY ADMIN rights to new college-admin role.

## G2-2-036-038  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/security/RecruiterFenceFilter.java:72-82 hub denial/mismatch 403 or 404
- vNext now: src/modules/permissions/policy.ts:100-119 invalid recruiter grant returns false
- Fix: Differentiate expired grant, no college selected, and foreign college.

## G2-2-036-052  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/security/RecruiterFenceFilter.java:61-85 early deny before controller
- vNext now: src/modules/permissions/policy.ts:100-119 grant lookup per resource
- Fix: Add global recruiter early path deny for high-volume invalid paths.
