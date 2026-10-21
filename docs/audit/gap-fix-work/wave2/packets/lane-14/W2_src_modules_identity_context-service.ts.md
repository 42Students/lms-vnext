# Work packet (wave 2): edit src/modules/identity/context-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/role.md, docs/audit/gap2/lane-2/cross-02-authorization-roles.md, docs/audit/gap2/lane-3/college-org-domain-workspace-scope.md, docs/audit/gap2/lane-1/user.md

## G2-13-016-042  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/config/roles.js:49-68` frontend determines page routing from userType/facultyType/id
- vNext now: `src/modules/identity/context-service.ts:39-55` request context activeRole and membership choice; `src/modules/identity/constants.ts:17-27` enum roles
- Fix: Verify session switch/route identity parity across every role, especially faculty admin and TPO

## G2-2-036-033  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/security/RecruiterFenceFilter.java:97-129 recruiter hub and college mismatch restrictions
- vNext now: src/modules/identity/context-service.ts:84-170 recruiter grants resolved per user
- Fix: Constrain HR grant to chosen college per request.

## G2-2-036-037  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/configuration/WebSecurityConfig.java:115-131 public login and OTP; protected app authenticated
- vNext now: src/modules/identity/context-service.ts:212-277 inactive/missing identity produces explicit errors
- Fix: Map invalid session and suspended role to legacy redirects and support state.

## G2-2-036-062  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/security/RecruiterFenceFilter.java:70-85 recruiter selected college in session
- vNext now: src/modules/identity/context-service.ts:84-170 recruiter grant read
- Fix: Migrate recruiter grants and expiry fields safely.

## G2-3-032-040  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/access/ScopeResolutionService.java:45-94`
- vNext now: `src/modules/identity/context-service.ts:39-55`
- Fix: Legacy tenant authorization traverses course/class/program/department to college; vNext explicit collegeMemberships and offering/section IDs.

## G2-1-021-018  [P3] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:65-69: findAll returns all User entities unpaginated.
- vNext now: src/modules/identity/context-service.ts:57-79: scoped context lookup by UID, not full directory; people lists in dedicated services.
- Fix: Ensure admin user directory has pagination, tenant scope and filters, not unbounded old endpoint.
