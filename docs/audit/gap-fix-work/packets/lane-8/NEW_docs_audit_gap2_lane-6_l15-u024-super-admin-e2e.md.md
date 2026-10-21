# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/l15-u024-super-admin-e2e.md

9 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/l15-u024-super-admin-e2e.md

## G2-15-024-006  [P1] GAP  facet F06  effort M
- Legacy: @PreAuthorize hasRole('SUPER_ADMIN') plus explicit requireSuperAdmin (SuperAdminE2eController.java:38-46).
- vNext now: E2E resolver requires APP_ENV development, enabled true, secret >=32 and UID regex (src/auth/e2e-identity.ts:24-47).
- Fix: Require both strict environment opt-in and Super Admin authorization on any seed writer.

## G2-15-024-011  [P1] MISSING  facet F10  effort M
- Legacy: seed() transactional, idempotent-ish lookups by stable unique keys (E2eSeedService.java:82-89,164-189,311-337).
- vNext now: e2eIdentityDirectory deterministically SHA256 derives synthetic UID by contact, not DB seeding (src/modules/people/e2e-identity-directory.ts:27-33,85-100).
- Fix: Implement transactionally idempotent fixtures keyed by stable identifiers and tenant.

## G2-15-024-012  [P1] GAP  facet F11  effort M
- Legacy: SuperAdmin role required, no trust in route alone (SuperAdminE2eController.java:38-46).
- vNext now: Identity override does not require Super Admin role in resolveE2eIdentityUid (src/auth/e2e-identity.ts:21-50).
- Fix: Never use identity override as seed authorization; explicit privileged server policy.

## G2-15-024-014  [P1] MISSING  facet F12  effort M
- Legacy: Seeding creates college A/B and consistent learner+faculty cross-tenant fixtures (E2eSeedService.java:170-190,217-223).
- vNext now: e2eIdentityDirectory only supplies unique UID, no colleges or memberships (src/modules/people/e2e-identity-directory.ts:85-100).
- Fix: Seed scoped tenant/membership matrices and isolation fixtures.

## G2-15-024-023  [P1] MISSING  facet F20  effort M
- Legacy: @Transactional seed() all-or-nothing unless helper external writes (E2eSeedService.java:164-168).
- vNext now: No seed transaction; e2eIdentityDirectory createUser returns synthetic user without DB write (src/modules/people/e2e-identity-directory.ts:85-100).
- Fix: Guarantee transaction rollback on partial seed failure and retryability.

## G2-15-024-024  [P1] MISSING  facet F21  effort M
- Legacy: SeedResult returns stable E2E login phones with faculty/learner/admin roles (E2eSeedService.java:303-307).
- vNext now: Synthetic UID by contact and optional lookup, no assignment/role provisioning (src/modules/people/e2e-identity-directory.ts:50-100).
- Fix: Provision test users plus memberships; limit to sandbox numbers.

## G2-15-024-026  [P1] GAP  facet F23  effort M
- Legacy: Legacy explicitly opt-in APP_E2E_SEED_ENABLED in each deployment; no Spring profile gate (SuperAdminE2eController.java:26-36).
- vNext now: New E2E UID override has strict APP_ENV dev and secret but no deterministic seed endpoint (src/auth/e2e-identity.ts:21-50).
- Fix: Preserve defense in depth, forbid prod seeding, document manual setup if intentionally retired.

## G2-15-024-008  [P2] GAP  facet F07  effort M
- Legacy: Disabled seeding throws 'E2E seeding is disabled. Set app.e2e.seed.enabled=true to allow seeding.' (E2eSeedService.java:164-168).
- vNext now: resolveE2eIdentityUid silently returns null on disabled/invalid env (src/auth/e2e-identity.ts:24-39).
- Fix: Provide equivalent nonleaky dev diagnostics and explicit enabled-state error for seed setup.

## G2-15-024-009  [P2] MISSING  facet F08  effort M
- Legacy: Successful HTTP200 Response {status:'OK',message:'OK',data:SeedResult} (SuperAdminE2eController.java:44-47).
- vNext now: Only identity UID resolution, no successful seed HTTP response (src/auth/e2e-identity.ts:21-50).
- Fix: Return success manifest and existing/reused count.
