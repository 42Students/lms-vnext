# Security change receipt — private R2 transport boundaries (2026-11-04)

**Status: code committed; focused CI did not execute; NOT VERIFIED.**

This is an implementation receipt, **not** a certification of the affected controls or a production test. The canonical source for the 493-control security progress remains `docs/tracker.json`. Do not change controls from UNASSESSED to VERIFIED or PARTIAL_EVIDENCE solely because this document or a failing workflow exists.

## Implemented security fixes

- **No signed-request redirects:** In `src/modules/storage/s3-client.ts`, signed HEAD/DELETE/GET/COPY requests now set `redirect: "error"`, preventing credential-bearing SigV4 requests or private-object reads from following a provider/proxy 3xx to a different host. `src/modules/colleges/admin-branding-logo-service.ts` also rejects redirects for server-side signed PUT of the college logo.
- **Signature header ownership:** The signing layer rejects caller-controlled `Host`, `Authorization`, `X-Amz-Date`, or `X-Amz-Content-Sha256` overrides, ambiguous case-insensitive duplicate signed headers, bad header names, control characters and excessive header sizes. Signed URL generation still binds legitimate headers and retains existing AWS SigV4 vector coverage.
- **Signature query and object prefixes:** Externally supplied extra query values cannot inject SigV4-reserved `X-Amz-*` parameters (including a second `X-Amz-Signature`), ambiguous case-insensitive duplicates, CRLF or excessive values. Private storage key prefixes and header-authenticated paths also reject path escapes/double separators before signing.
- **R2 endpoint and bucket namespace:** Credentials are only sent to a plain HTTPS configured origin without embedded credentials, path, query or fragment. `R2_ACCOUNT_ID` and the private bucket name cannot include URL authority/path injection or invalid traversal. The generic S3 signer also validates path-style bucket components while retaining virtual-hosted signed URLs when `bucket=""`.
- **Server-side signed request path:** Direct `signedFetch` rejects relative paths, dot segments, query/fragment injection, backslashes, C0 controls and excessive lengths.
- **Ranged reads:** `getObjectStream` rejects a full `200` when the service explicitly requested a partial byte range. It requires `206`, a consistent `Content-Range`, numeric total and an exact `Content-Length`. Invalid responses are canceled rather than exposed to private-file readers.
- **Actual streaming bytes:** A bounded streaming reader now enforces the provider's declared byte count, rejecting both truncated bodies and larger-than-declared bodies. Even a missing, malformed or oversized `Content-Length` fails closed. A malicious proxy cannot turn a small private-object metadata/range attestation into an unlimited transfer.

## Added negative and positive test coverage

`tests/unit/security-s3-transport-boundary.test.ts` includes malicious host/headers/query-parameter spoofing, CRLF splitting, bucket/account/prefix/path injection, redirect refusal, invalid or mismatched ranges, missing/bogus HEAD lengths, extra/truncated streaming bytes and valid request/control paths. The dedicated workflow `.github/workflows/security-private-r2-transport.yml` also invokes existing `s3-client`, private-prefix and private storage tests and TypeScript compilation.

- [First triggered workflow](https://github.com/42Students/lms-vnext/actions/runs/41837936215) concluded **failure before any step started** (job had no steps and completed in roughly two seconds). Other unrelated jobs at the same time also failed before any step started. This does not establish any assertion failure **or** any passing test.
- The source/test commits made after the first attempted run require a new exact-SHA focused run. Never count that earlier job as proof for them.
- Until a real exact-SHA test run with its logs passes, **do not promote** security control states on the basis of this batch.

## Remaining proof and residual risks

1. Restore GitHub Actions runner/execution availability, then run the R2 transport workflow on the current commit; require unit, SigV4 vector, private-storage and TypeScript passes. Check any full CI failures separately.
2. Execute provider-backed tests against an isolated *private* R2 bucket with an intentionally redirecting mock server and an oversized/malformed range responder; never send real credentials to test HTTP hosts.
3. Prove production storage network egress is restricted to approved R2 endpoints, and inspect private bucket policy, key rotation and audit logs independently.
4. Independently verify tenant/owner read grants, malicious upload scanner attestations, revocation, signed URL expiry and same-college horizontal access.
5. Do not confuse these transport fixes with resolving the historical credential findings, unprotected `main`, production RLS or all 493 controls.

**Scope:** storage transport hardening only. No production database, R2 credentials, secret values or tenant objects were accessed.
