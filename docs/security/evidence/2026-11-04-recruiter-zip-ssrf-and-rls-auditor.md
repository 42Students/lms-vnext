# 2026-11-04 — Recruiter ZIP SSRF and RLS policy-auditor hardening

**Repo:** 42Students/lms-vnext / main  
**Accepted code revision:** 24d241d84acba5861ce816a7cfb52cfdd0318915 (both slices included).  
**Disposition:** Two scoped security implementation/test batches verified; NOT production RLS certification, not complete API authorization review, and not security release approval. This is evidence, not another task tracker. The canonical execution tracker remains docs/tracker.json.

## Slice 1 — Public recruiter resume ZIP download

**Risk:** The recruiter applicant-share ZIP endpoint was willing to server-fetch an arbitrary HTTPS link from an otherwise authorized share projection. HTTPS alone does not prevent SSRF to external hosts, internal services, or a misdirected signed object path.

**Changes:**
- src/modules/placements/company-share/signed-resume-guard.ts validates the exact configured private R2 origin, private bucket/prefix, UUID-scoped placement-document key, short-lived current SigV4 grant shape, credential identity, and no redirects, fragments, duplicate signing parameters, or userinfo.
- src/app/api/placements/company-share/[token]/export/route.ts enforces that guard BEFORE fetch. It retains a 10-second fetch timeout, no-store and redirect denial, a 12 MiB per-resume cap, a 20-file attempt cap, and now a **48 MiB aggregate resume-data cap** per ZIP.
- src/modules/placements/company-share/public-service.ts corrects the historical /resume/ namespace mismatch to the registered /placement-document/ private-storage namespace. The existing service continues to validate token+PIN, explicit shortlisted applicant selection, college/membership ownership, CLEAN scanner attestation and signed grant creation before projection.
- tests/unit/security-recruiter-share-zip-ssrf.test.ts exercises malicious destination denial without any fetch, signed origin/path/bucket/credential/expiry checks, missing R2 configuration, resume-column denial, valid ZIP behavior, per-file size rejection and the aggregate budget.
- .github/workflows/security-recruiter-share-zip.yml runs adversarial tests, existing company-share privacy/UX tests and TypeScript on these changes.

**Executed evidence:**
- [SSRF suite run 41808925458](https://github.com/42Students/lms-vnext/actions/runs/41808925458), SHA 9f7b3315baf9c64ac30d561cb7f0e5cab8f48fc7 — COMPLETED SUCCESS: 9 initial new tests, 6 existing share tests, full TypeScript.
- [Extended ZIP budget run 41809577504](https://github.com/42Students/lms-vnext/actions/runs/41809577504), SHA 680624121806434c7a41aae7396814007138823a — COMPLETED SUCCESS: additional 48 MiB bound test, existing share tests and TypeScript.

**Limits:** Mocked R2/provider in unit tests; no claim of real production provider/network egress proof, no claim of immediate signed-URL invalidation on share revocation, and no full penetration test. Applicable controls SEC-05-014, SEC-08-014, SEC-11-003, SEC-11-005, SEC-15-010, SEC-23-012 remain partially satisfied rather than fully certified.

## Slice 2 — RLS detector and live restricted-role witness

**Risk:** PostgreSQL can report RLS enabled and a nonzero policy count while a permissive SELECT USING(true) policy still exposes every tenant's rows. PostgreSQL combines permissive policies with OR; RESTRICTIVE USING(true) provides no meaningful restriction.

**Changes:**
- scripts/security/pg-rls-readonly-audit.mjs now measures applicable unconditional permissive SELECT policies for the connected application role and ignores no-op constant-true restrictive policies. It emits critical code APP_UNSCOPED_PERMISSIVE_SELECT for direct tenant-key tables readable by the app role when no substantive restrictive SELECT policy exists. Existing superuser/BYPASSRLS, owner-bypass, DDL, no-RLS and missing-policy checks remain.
- tests/security-pg-rls-catalog.test.mjs adds pure classifier coverage.
- tests/security-pg-rls-live-readonly.test.mjs provisions an explicit disposable localhost PostgreSQL 17 fixture with four direct tenant-key tables and an actual nonowner application login. It proves foreign-college reads through both intentionally defective policies, denies foreign reads through properly scoped/restrictive policies, and verifies fixture table/grant/role cleanup.
- .github/workflows/security-rls-policy-auditor.yml runs 5 unit tests and a real PostgreSQL witness using only a local test database.

**Executed evidence:** [RLS auditor run 41809840139](https://github.com/42Students/lms-vnext/actions/runs/41809840139), SHA 24d241d84acba5861ce816a7cfb52cfdd0318915 — COMPLETED SUCCESS: 5/5 classifier tests, 1/1 live PG17 app-role cross-tenant witness; cleanup verified.

**Limits:** This makes RLS auditing stronger; it does not turn on RLS in production or prove all policy predicates. Nontrivial expressions, indirect tenant ownership, application INSERT/UPDATE/DELETE WITH CHECK, SECURITY DEFINER, pool tenant-context behavior, production DB grants/identity, and independent review remain open. Applicable controls SEC-06-001, SEC-06-004, SEC-06-010, SEC-07-019, SEC-23-015 and SEC-23-016 remain partial.

## Verified repository-governance release blocker

On November 4, 2026, the GitHub branch endpoint returned **main protected:false** and required-check enforcement off with zero checks. The branch-protection endpoint returned 403 (Resource not accessible by integration); the ruleset endpoint returned 403 with an eligible-plan message for a private repository. The available connector does not expose a write action for enforcing branch protection.

**Required before production sign-off:** an eligible repository/organization plan, protected main, mandatory PR review, required exact-SHA security checks, restricted direct/force pushes and deletion, independent approvals for sensitive changes, and re-verification of actual enforcement. Merely passing Actions does not prevent unreviewed pushes.

## Remaining release blockers

- Live production application DB principal, grants, table lineage, tenant context, row policies and data-access adversarial tests.
- Full current API method-by-method object/field/role authorization review (historic inventory: 1,322 methods, not certified).
- All-seven-account cross-tenant and same-college horizontal privacy, concurrent revocation, storage/integration/workers and privileged step-up assurance.
- Full lint/build/browser CI, enforced repository/deployment governance, secrets response, incident readiness and independent penetration assessment.

**Status:** Two narrow, high-impact security patches with reproducible exact-SHA evidence. No overall security completion percentage, RELEASE sign-off or new done:true tracker task is claimed.
