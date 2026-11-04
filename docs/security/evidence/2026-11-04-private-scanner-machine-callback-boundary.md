# 2026-11-04 — Private-storage scanner machine-callback security

**Repository:** `42Students/lms-vnext`; changes committed on `main`.
**Disposition:** Narrow security implementation and regression tests committed; `main` security/release acceptance remains open. This is evidence for the canonical `docs/tracker.json`, **not** a second tracker.
**Applicable scope:** SEC-10/11 storage and malware scanner, SEC-01/03 service identity, SEC-15 audit/integration abuse resistance.

## Risk

The internal scanner callback is a highly privileged state-transition boundary. Once an external worker attests a scan verdict, the application may release an assignment, project resource or lesson video for downstream consumption. Prior behavior used the scanner header secret but accepted same-origin browser requests, normalized deployment credentials with `.trim()`, did not require JSON media type, and allowed resource access parameters to be smuggled in ambiguous HTTP metadata. A long header secret remains the authorization factor, but should be checked against **exact** deployment bytes with no browser session or URL-derived target authority.

## Applied source changes

1. `src/modules/storage/scan-verdict-request-guard.ts`: new pure, independently testable, fail-closed machine request validator. Denies any `Origin`, URL query parameters, non-JSON media type, invalid/oversized declared payload length, missing/weak/malformed credentials, and nonidentical secrets. Uses constant-time comparison after byte-length equality. Header normalization by the Fetch/HTTP stack is outside what the helper can prove.
2. `src/app/api/internal/storage/scan-verdict/route.ts`: invokes the validator before JSON parsing or storage/database side effects. Preserves no-store and sanitized 403/400/503/409 response semantics and bounded actual-body decoding.
3. `src/modules/storage/production-scan-verdict-service.ts`: scanner deployment readiness now requires the same exact validated configuration secret, instead of silently trimming a padded value.
4. `tests/unit/security-storage-scanner-boundary.test.ts`: adversarial requests exercise unauthorized browser/opaque origins, exact credential validation, missing credentials, invalid queries and media types, invalid Content-Length, actual 2 KiB cap, malformed JSON/UTF-8, readiness failure, successful mock callback, and error redaction. Asserts that unauthorized calls do not invoke the state-changing verdict writer.
5. `.github/workflows/security-storage-scanner-boundary.yml`: isolated test plus TypeScript gate on affected files.
6. `docs/operations/private-storage-scanner.md`: revised worker integration contract to match the stricter HTTP requirements.

**Selected implementation commits:** [34eede86](https://github.com/42Students/lms-vnext/commit/34eede868d307c49e5a370c54b0204431498a2a2), [b45647dc](https://github.com/42Students/lms-vnext/commit/b45647dc33bf3086c865f03c9478f9c67e030073), [26637319](https://github.com/42Students/lms-vnext/commit/2663731903104e0258cdeca80544b78eefeb65cf), [79faf6c9](https://github.com/42Students/lms-vnext/commit/79faf6c9c1ac1ee65a106febce28dc3cad1074b4), [9c67a6f5](https://github.com/42Students/lms-vnext/commit/9c67a6f5d726fff1b47483a55cab3b102a1fa962), [41f23d81](https://github.com/42Students/lms-vnext/commit/41f23d81c84c340e96bacfafef4de87663906b0a).

## Validation evidence and limits

An **independent Node 22 local smoke harness** using a verbatim local copy of the pure callback validator exercised 11 small allow/deny assertions and passed. That is a scoped source-behavior check, **not an exact-commit repository test** or production integration proof. The new [GitHub Actions run 41835719683](https://github.com/42Students/lms-vnext/actions/runs/41835719683) concluded **failure with zero steps, runner_id=0**. No Vitest or TypeScript validation executed in that run. Rerun on a functioning approved CI runner:

```sh
npx vitest run tests/unit/security-storage-scanner-boundary.test.ts
npm run typecheck
```

The scanner implementation is not supplied by this change; no live R2 provider, malware engine, deployed secret or upload lifecycle has been tested here. Do not set `PRIVATE_STORAGE_SCANNER_READY=PROD_VERIFIED` based only on this code.

## Still required for high-assurance acceptance

- Run the exact-commit Vitest and TypeScript gates with an operational runner and capture failure-free evidence.
- Revalidate the **real isolated scanner service** with the updated JSON/header contract, including secret rotation and fully scanned entire objects; reject any production readiness claim before that.
- Test same-college and foreign-college file grants, object overwrites/re-scans, replay/conflicting verdicts, revoked grants, scanner crash/retry, invalid generations, and concurrent state changes against production-like PostgreSQL/R2.
- Review the long-lived bearer secret and scanner identity model for scoped signed requests, replay-window guarantees, egress controls, provider IAM and secret storage; changing the wire protocol requires a coordinated worker migration.
- Preserve the existing upload-expiry-plus-skew safety check and do not turn scanner or provider outages into `CLEAN`.

**Security verdict:** Smaller abuse surface and deterministic pre-I/O machine guard committed. No complete storage security certification and no canonical task marked accepted.


## Follow-up hardening at latest scanner source revision

- [f4898f9d](https://github.com/42Students/lms-vnext/commit/f4898f9d074d0c21a987abfead9f60fea9f75f32): authenticate the exact scanner secret *before* reporting request-shape errors, to avoid exposing payload-schema behavior to unauthenticated callers.
- [6a083f93](https://github.com/42Students/lms-vnext/commit/6a083f937a0290d019ab8b592ce8009eae447a64): regression for authorization-before-input checks; use a concrete `ArrayBuffer` for invalid UTF-8 fixture to stay compatible with TypeScript BodyInit typing.
- The [updated scanner workflow run 41836202489](https://github.com/42Students/lms-vnext/actions/runs/41836202489) again reported failure with `runner_id=0` and `steps=[]`. This is not executed-test evidence. No storage or scanner production certification is claimed.
