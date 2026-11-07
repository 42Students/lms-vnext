# SEC-03 RBAC, SEC-04 role scope model, SEC-08 API authorization: assessment (2026-11-08)

Method: code read of `policy.ts`, `context.ts`, `route.ts`; the dev probes in `evidence/` (unauthenticated sweep, cross-college probe, role-by-route matrix, same-college horizontal probe); the committed baseline `docs/security/role-matrix-baseline.json`. Nothing VERIFIED.

## Model as built

- One request context = one user, at most one active membership in one college, and exactly one selected role (`hasMembershipRole` requires `roles.length === 1`; a two-role context grants nothing and the API answers 401 until a role is chosen). Super Admin acts as platform only when no membership is selected (`isSuperAdmin` requires `membership === null`), inside an explicit, expiring (4 hours), audited organization or college scope.
- Every API route runs through `route()`: origin check, authentication, a central permission (33 named permissions, 118 handlers name one), step-up, rate limit, bounded body, then the handler inside the actor's database scope. 1,086 handlers declare `service-enforced` (their service decides) and 14 `actor-owned`.
- The database is the second wall: row-level security on 245 of 278 tables narrows every query to the actor's college (or platform / named system scope).
- Authorization is re-read from the database on every request (membership, roles, college status, user status), so revocation takes effect on the next request.

## Findings and states

| Control | Finding | Proposed state |
|---|---|---|
| SEC-03 central permission names | 33 permissions for about 1,200 handlers: coarse. Only 43 of the `service-enforced` handlers call exactly one literal `requirePermission` in their route file (easy to convert); the other roughly 1,040 check roles and ownership inside services | PARTIAL |
| SEC-03 role matrix | Role-by-route baseline committed (learner 23, faculty 15, mentor 18, college admin 72, TPO 51 readable static GET routes on dev); the script fails when a role gains a route. It found and closed one real gap (learner could read the staff dashboard) | IMPLEMENTED_UNVERIFIED |
| SEC-03 deny by default | 733 of 782 mutating and 520 of 533 GET route pairs answer 401 unauthenticated; the rest are the intended public routes | IMPLEMENTED_UNVERIFIED |
| SEC-03 wrong-role errors | Wrong-role refusals thrown as plain errors answered 500; now 403 centrally. Foreign-id lookups that threw plain not-found errors answered 500; four fixed to 404 | IMPLEMENTED_UNVERIFIED |
| SEC-04 scope per role | Learner, faculty, mentor, TPO, college admin each reach a distinct, role-shaped set of routes (see matrix). Faculty and mentor scope to assigned sections or projects is enforced in services; not re-probed with seeded assignments | PARTIAL |
| SEC-08 object-level (cross-college) | 120 GET routes called with another college's ids by a college admin: no foreign data returned; 59 x 404, 37 x 403 | IMPLEMENTED_UNVERIFIED |
| SEC-08 object-level (same college) | 144 requests for other learners' ids by a learner: 108 x 403, 28 x 400, 4 x 404, no foreign data | IMPLEMENTED_UNVERIFIED |
| SEC-08 mutating methods | Not probed with foreign ids (risk of changing data); the database policies refuse cross-college writes (update, delete, insert and moving a row were shown on dev) | PARTIAL |
| SEC-08 mass assignment | Zod `strictObject` bodies are the pattern; not measured | PARTIAL |
| SEC-08 enumeration | Foreign ids answer 404 (RLS) and the per-user 404 tripwire flags walks of ids; ids are UUIDs, not sequences | IMPLEMENTED_UNVERIFIED |

Next steps without the owner: seed assignments (faculty to section, mentor to project) and extend the matrix to mutating checks inside a disposable database in CI; convert the 43 easy `service-enforced` routes to named permissions; add the role matrix script to a dev-only workflow.
