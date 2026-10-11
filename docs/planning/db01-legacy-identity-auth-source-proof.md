# DB01 P0 legacy identity source proof: role deletion, tenant deletion and password

**Worker:** Chat 2 · **Task:** DB-004 · **Global phase:** DATABASE  
**Pinned legacy backend:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Evidence class:** actual legacy Java source inspection, **not** vNext runtime/DB/provider verification.

## Resolved source-evidence gaps

| Legacy field | Named current source proof | Classification | vNext decision |
|---|---|---|---|
| `role.is_deleted` | `model/Role.java` extends `BaseModel`, which maps `is_deleted`. `service/impl/UserServiceImpl.java` obtains `user.getRoles()` and unconditionally creates `ROLE_...` authorities. `service/impl/RoleServiceImpl.java` resolves a role by name without checking the deletion flag. | **Source-confirmed security exception:** deleted-role authority can still be honored by this active consumer. The existence of an active role-delete *writer* is not proven. | **Do not clone.** vNext's effective roles must be derived from current, scoped, nonrevoked normalized grants. Revocations must invalidate any cached session/role snapshot as required by authorization. |
| `tenant_domain.is_deleted` | `model/TenantDomain.java` inherits `BaseModel.isDeleted`. `repository/TenantDomainRepository.java` explicitly filters `isDeleted=false` on active hostname, verified hostname, college domain and primary hostname queries. `controller/TenantAdminController.java` uses these queries in list/readiness. | **Active read/filter behavior proven.** Physical deletion/tombstone migration in vNext is not proved. | Keep deletion fail-closed while considering unregistered `tenant_domains.deleted_at` tombstone proposal, including DNS recheck races and all-time hostname uniqueness. |
| `user.password` | `model/User.java` maps password; `service/impl/UserServiceImpl.java` saves `bcryptEncoder.encode(user.getPassword())` and `loadUserByUsername` passes `user.getPassword()` to Spring Security `UserDetails`. | **Active legacy password producer/consumer proven.** | **No raw/hashed legacy password column in vNext.** Verify real managed-provider sign-in, account recovery and session revocation separately; source proof alone is not replacement acceptance. |

### Pinned Java Git blob SHAs

- `model/BaseModel.java`: `71ce29fa6d6b5082a58c4cfffb01e54de976d30d`.
- `model/Role.java`: `6953e76dc222d835e424a9bbaa29713c437cf0d0`.
- `model/User.java`: `eba5c9607238c06d9cccae50cdfdac1c56d9f51c`.
- `model/TenantDomain.java`: `530ecd12e36f39f13dc08587af85239f807e4cae`.
- `service/impl/UserServiceImpl.java`: `45e1c992e53be0c7e0f7cdd8f074ffc7fd2363ed`.
- `service/impl/RoleServiceImpl.java`: `ea254558e1cde9681e5d16841d406901a9516746`.
- `repository/TenantDomainRepository.java`: `0fccbb083c7ce3348a379751adf60fee80b27aef`.
- `controller/TenantAdminController.java`: `8273eb87ebef09e4c0585becc1f98f92498f6a01`.

All eight cited Java files were fetched again using the exact pinned commit ref; each matched the previously observed branch blob SHA. The evidence rows are updated in `docs/planning/db01-auth-security-p0-field-crosswalk.json`.

## Adversarial acceptance — required before DB01 semantic closeout

1. **Deleted role:** authenticate a legacy user whose role record is marked deleted, check actual authority behavior in an isolated legacy test, then prove vNext's normalized grant revocation denies stale/cached authorities. The source evidence indicates a probable legacy bypass; do not claim an exploit was executed here.
2. **Tenant tombstone:** a deleted, formerly verified primary host must not resolve, be reverified, or become primary again. Hostname reuse policy must be explicit; lock/serialize archive vs verification and host reassignment.
3. **Provider-only password replacement:** prove every intended user category can sign in/recover without vNext storing password hashes, secrets or old JWT tokens. Test disabled user, ended/suspended membership and deleted role/revoked grant denial.

**Accounting:** 3/3 previously *unnamed* P0 source paths now resolved; 38/38 P0 field policy decisions still source-only; **0 newly runtime-verified, 0 approved retirements, 0 registered migrations**. The older frozen 312-field triage and 173 no-target queue remain separate and have not been silently reclassified as implemented.
