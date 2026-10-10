# DB01 tenant-domain verification — persisted state and transition contract

**Worker:** Chat 2 · **Task:** DB-004 · **Phase:** DATABASE · **State:** SOURCE-REVIEWED, NOT DB-VERIFIED  
**Legacy BE oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**vNext inspected on main:** `src/db/schema/tenant-domains.ts`, `src/modules/tenant-domains/{service,repository,dns-verifier}.ts`, `src/modules/identity/context-service.ts`.  
**Safety:** Neither this contract nor the staged DB01 SQL is a registered migration. API implementation waits for the global API phase except separately recorded urgent security corrections.

## Persisted semantics

| Feature | Legacy source behavior | Current vNext source behavior | DB01 disposition |
| --- | --- | --- | --- |
| Custom domain belongs to college | `TenantDomain.collegeId` | `tenant_domains.college_id` FK restrict; host lowercased unique index; primary partial unique | Candidate equivalence. Test forged-host and cross-tenant ID denial |
| Verified status | `is_verified`, `verified_at`; service `verify()` refreshes diagnostics; failed check does not automatically erase verified state | `is_verified`, `verified_at`; repository preserves `current.isVerified || input.verified` | Candidate equivalence of persistence; API service currently refuses to recheck already verified domains |
| First token issuance | `ensureToken` issues missing token without removing existing verified status | New row gets token; successful verification sets token to NULL | Lifecycle diverges; decide secure token re-issue/recheck without downgrade |
| DNS diagnostic values | `last_found_values` is truncated to 500 chars; values from TXT records may be untrusted | `last_check_result` and `last_checked_at` only, no found-values storage | **Source-confirmed persistence omission.** Proposed `last_found_values varchar(500)` in staged SQL; restrict reader, redact untrusted TXT |
| Verification result categories | `VERIFIED`, `NO_RECORD`, `WRONG_VALUE`, `TIMEOUT_OR_ERROR` | `VERIFIED`, `TXT_RECORD_MISSING`, `DNS_LOOKUP_FAILED` | Deliberate taxonomy mapping required. Missing vs wrong TXT should remain distinguishable to admin or be documented redesign |
| Domain deletion | Legacy `is_deleted` is filterable and `TenantDomainRepository.findActive*` uses active records | vNext `deleteDomain` hard-deletes with SQL DELETE | **History/undo decision:** removal of active routing is correct, but audit/retention parity unproven; preserve history without letting deleted host resolve |
| Primary invariant | UI expects one primary, verified for launching in default policy | Unique partial index on college + primary and `tenant_domains_primary_verified_ck` | Safe strengthening, but test set-primary racing with domain verification/deletion |
| Tenant host bootstrap | `PublicTenantController.bootstrap` resolves domain and returns canonicalHost and branding fields | `resolveVerifiedHost` returns college/org/host; public API route listing inspected has no tenant-bootstrap route | API/UI phase consumer contract remains OPEN; DB must preserve required data |
| College archive | Host resolver should not grant access to absent/deleted college | `resolveVerifiedHost` joins colleges+organizations and requires both ACTIVE | Source-supported stronger isolation candidate, execute DB negative test |
| Recruiter grant expiry | `RecruiterCollegeAccess.isActiveAt(now)` checks `valid_until` | `context-service.findRecruiterContext` filters ACTIVE grants and company/college, but no expiry predicate; current grants schema has no `valid_until` | Confirmed source-level authorization gap; **DB09 owner** must add expiry/revocation contract or justified equivalent |

## State transitions requiring explicit database witnesses

| Operation | Expected persisted effect | Negative/race witness |
| --- | --- | --- |
| Register domain | Unique normalized hostname, owner college FK, unverified, nonprimary | Concurrent same-host creation across colleges: at most one succeeds |
| Issue verification token | Opaque, high entropy, not publicly leaked; first issuance must not downgrade already verified proof | Stale session / wrong college cannot inspect or rotate token |
| Check DNS successfully | Verified timestamp recorded, diagnosis `VERIFIED`; token lifecycle intentional | Forged TXT for another tenant's token not accepted |
| Recheck verified domain | Update lastCheckedAt and diagnostic status without silently removing proof on lookup failure | Recheck after successful verification must actually query DNS and preserve verified status on transient failure |
| Change hostname | Invalidate old verification and ensure primary cannot remain unverified | Concurrent hostname change + verification + set-primary must not bypass constraint |
| Promote primary | Exactly one verified primary per college | Concurrent promotions serialize; cross-tenant primary ID rejected |
| Remove domain | Immediately stop host resolution while preserving compliance/audit decision | Cached host/membership cannot reattach a removed domain; race with resolver and DNS verification |
| Archive college / organization | No hostname resolves inactive tenant | Wrong-tenant college archive/host alias cannot authorize login |
| Read branding publicly | Only allowlist display fields for resolved active tenant; support fallback | Cross-tenant college ID injection and stored XSS/unsafe URL validation |

## Source-grounded code observations

1. Legacy `TenantDomainVerificationService.verify` evaluates TXT from `_42lms-verify.<host>` and from the host root, updates `last_found_values` and differentiates wrong TXT from lookup error. `ensureToken` deliberately does not clear a pre-existing verified state.
2. Current vNext `tenant-domains/service.ts` returns the domain immediately if `domain.isVerified`, so an admin's recheck does not perform a DNS lookup. For a verified record, the vNext repository normally nulls `verificationToken` on success; any future recheck implementation needs safe re-issuance or another proof method.
3. Current vNext `tenant-domains/repository.ts` does a hard SQL `DELETE` by domain ID. This differs from legacy soft-delete record semantics; the active host must be removed, but history retention/undo should be decided independently.
4. Current vNext `dns-verifier.ts` only returns a coarse status and does not carry the TXT values required for the staged diagnostic column. Do not expose raw arbitrary DNS strings in public or security logs.
5. Legacy `TenantResolutionService.isVerifiedDomainRequired` defaults TRUE and is reused in the legacy onboarding readiness check. Current vNext resolver is always verified-only and checks active college/org — defensible stronger default. Treat an exception permitting unverified hosts as an explicit security decision.
6. Current vNext `context-service.ts` does *not* check a recruiter grant expiration timestamp because the inspected `placement_recruiter_college_grants` table lacks one. This is a DB09 cross-domain authorization gap, not merely a cosmetic field-mapping mismatch.

## Global-phase handoff and blockers

- **DATABASE (now):** Chat 1 only registers new Drizzle migration and schema barrel, after reviewing `docs/planning/sql/db01-tenant-branding-domain-diagnostics-staging.sql` and `src/db/schema/db01-tenant-branding.staged.ts`. DB09 owner must resolve recruiter `valid_until`, capability and revocation history. Confirm domain archive/history strategy before altering live schema.
- **API (locked):** Add verified-domain recheck flow, correct token/diagnostic lifecycle, branded bootstrap with explicit public allowlist, and provider-backed session parity. API contract tests must include same-college authorization and negative tenant-role race.
- **UI (locked):** Clone tenant-onboarding readiness dialog, public tenant branding and recheck diagnosis without adding unverified security behavior.
- **No accepted executed database evidence yet.** No migrations were applied, no real DB integration / CI / browser tests were run in this source audit. Leave DB-004 IN_PROGRESS.
