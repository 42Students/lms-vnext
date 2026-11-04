# 2026-11-04 — Applicant-share and project-template boundary hardening

**Repository:** `42Students/lms-vnext` — commits to `main` on 2026-11-04.  
**Status:** **IMPLEMENTED + AUTHORED TESTS; EXECUTED VERIFICATION BLOCKED.** Do not count as fully verified or certified.  
**Owner lane:** Independent application/API boundary hardening, separate from privileged-role authentication, MFA and the live RLS program.

## Actual committed changes

1. [`05c8131`](https://github.com/42Students/lms-vnext/commit/05c81312a21cb17e8de6aec024ae3febc37b1660) — `src/app/company-share/[token]/access/route.ts`
   - Caps the anonymous code-submission body at 2,048 actual streamed bytes, **without trusting Content-Length**.
   - Parses only bounded URL-encoded / multipart native forms; rejects invalid UTF-8, oversized bodies, unsupported media types, and ambiguous duplicate code fields before the share-code verification service.
   - Preserves browser 303 success/invalid-code redirects and the existing persistent lockout mechanism on valid-shaped attempts.
   - Adds no-store and no-referrer on rejection responses as well as redirects. Successful proof remains HttpOnly, SameSite=Strict, with the original expiry policy.
2. [`9cfa36b`](https://github.com/42Students/lms-vnext/commit/9cfa36b0763ba82e6c497d6addb58662932ea507) — `tests/unit/security-company-share-code-form.test.ts`: eight authored checks for oversized / forged-length / wrong-origin / duplicate / malformed / unsupported / ordinary and proof-issuing input. **Not executed**.
3. [`d6c54a3`](https://github.com/42Students/lms-vnext/commit/d6c54a35f45990441c2a1f5bab420bfdbc6994ef) — `src/app/api/projects/templates/[templateId]/route.ts`: caps PATCH and PUT JSON at 8 MiB, handles too-large/malformed payloads before template-version lookup/writer, adds private no-store to success paths.
4. [`b1df78a`](https://github.com/42Students/lms-vnext/commit/b1df78af4d8ed2a063127616206246d08f77bcae) — `src/app/api/projects/templates/route.ts`: same JSON cap for POST; GET refuses repeated, empty or invalid `collegeId` hints rather than falling through to unscoped listing; returns private no-store for list/create.
5. [`4644f5b`](https://github.com/42Students/lms-vnext/commit/4644f5b5dc19aeef9803ae97409b582cb21b6330) — template detail GET upgrades college-hint syntax checking to strict UUID and marks denial responses no-store; existing per-context permission and persisted target lookup remain untouched.
6. [`45c3a81`](https://github.com/42Students/lms-vnext/commit/45c3a8129a5ff72b8b011007c5a9f92fa8e1c89f) and [`ba98486`](https://github.com/42Students/lms-vnext/commit/ba9848682a56a1887bee9001627fbb6e92d935d2) — `tests/unit/security-project-template-boundaries.test.ts`: fifteen authored unit cases for tenant selector denial, 8 MiB overflow, malformed JSON, CSRF denial, existing authorized collection and mutation paths. **Not executed**.
7. [`125d1ab`](https://github.com/42Students/lms-vnext/commit/125d1ab1209700641cafd93c5121c12345596851) — `.github/workflows/security-share-template-boundaries.yml`: exact-SHA check + scoped 23-case Vitest suite + TypeScript, with minimal permissions and push/PR triggers.

## CI status (do not overstate)

- Initial exact workflow at [run 41835405360](https://github.com/42Students/lms-vnext/actions/runs/41835405360) had `conclusion=failure`, but its job provided **no steps**, no runner name, and downloading the job log failed with a storage 404.
- Later focused [run 41835743640](https://github.com/42Students/lms-vnext/actions/runs/41835743640), exact SHA `ba9848682a56a1887bee9001627fbb6e92d935d2`, also reported `conclusion=failure` with no steps in the job result.
- A job with **zero steps is not evidence that tests ran or failed assertions**. Root cause of scheduling/environment failure remains undetermined here; do **not** claim passing tests or GitHub billing as a proven cause.
- Local clone and test execution were unavailable in this connector environment (the container could not resolve github.com).

## Threats addressed and limits of evidence

- Public share code endpoint: bounded memory consumption and unambiguous browser code field, with privacy-preserving response headers. Its DB-backed wrong-code lockout and proof verification are unchanged. **Not a public share penetration test**.
- Platform-managed template APIs: bounded streamed JSON before expensive schema/service processing, no implicit global list when a tenant hint is malformed or ambiguous, and private response cache policy. **Not evidence of full row-level access or correct production tenancy**.
- No database migration, privilege widening, RLS policy change, secret material, test assertion weakening or access-token logging introduced.

## Next verification / closure actions

1. Resolve the GitHub Actions infrastructure failure, then collect an exact-commit successful scoped test and TypeScript receipt for this workflow. Fix any true test/code failures if they arise.
2. Add browser E2E for native company-share form, invalid duplicated field, locked challenge, proof cookie and a cross-tenant applicant-share denial.
3. Add live restricted-PostgreSQL permission checks on project-template collection/detail/update/archive and company-share proof/revocation, including concurrent revocation and another college's share/assignment. The present mocked unit suites prove no database behavior.
4. Attach verified evidence only to the appropriate existing controls in `docs/tracker.json -> security`, the **sole** active tracker. Do not merge or increment a second tally. Coordinate with concurrent chat lanes before editing shared files.
