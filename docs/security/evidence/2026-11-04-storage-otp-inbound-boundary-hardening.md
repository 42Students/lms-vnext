# 2026-11-04 — Storage, legacy OTP and signed inbound-mail request boundaries

**Repository:** `42Students/lms-vnext` / `main`  
**Evidence type:** implementation and authored adversarial tests; **NOT executed test or production certification**.  
**Status:** `IMPLEMENTED_UNVERIFIED` for the narrow changes listed here. This file is an immutable engineering receipt, **not** another task tracker. The canonical status/coverage source is `docs/tracker.json.security`.

## Engineering changes, exact commits and narrow scope

### 1. Shared private storage/video JSON parser

- Implementation: [`1cd3f8f11d3b2031d31b4d332735c8caad874326`](https://github.com/42Students/lms-vnext/commit/1cd3f8f11d3b2031d31b4d332735c8caad874326).
- Regression source: [`0b1eefd5e789dd3c3b80404994f7e8864bffbfd7`](https://github.com/42Students/lms-vnext/commit/0b1eefd5e789dd3c3b80404994f7e8864bffbfd7).
- `src/lib/storage-route.ts` no longer uses unbounded `Request.json()` / `Request.text()`. It streams through `readBoundedUtf8Body` with an exact **65,536-byte** cap, rejects invalid UTF-8, and retains object-only JSON and optional-empty-body compatibility.
- Oversized metadata raises existing typed `StorageFileError("STORAGE_FILE_TOO_LARGE")` (HTTP **413**) through the existing `apiErrorResponse` contract.
- Direct consumers found by source search: eight `readJsonBody` file/video/upload/assignment routes plus two `readOptionalJsonBody` private-download-grant routes; future consumers of the helper inherit the same cap. This does **not** cap private R2 object bytes; those remain subject to separate upload limits.
- Test `tests/unit/storage-route-bounded-json-security.test.ts` contains nine cases: authorized-compatible objects, boundary bytes, forged declared length, multibyte UTF-8, invalid UTF-8, optional empty input, primitive/array rejection, malformed JSON, and typed 413.

### 2. Legacy authentication OTP adapter

- Implementation: [`6428e1b1402e67a4b4a7119838debd91638076e5`](https://github.com/42Students/lms-vnext/commit/6428e1b1402e67a4b4a7119838debd91638076e5).
- Regression source: [`5d3b3fe90a6301e72d39ae6707a68086d69d77e0`](https://github.com/42Students/lms-vnext/commit/5d3b3fe90a6301e72d39ae6707a68086d69d77e0).
- `src/app/api/auth/legacy/otp/start/route.ts` now rejects foreign/missing Origin **before** parsing. It uses the existing `readBoundedAuthJson` **8,192-byte** UTF-8 limit instead of unbounded `Request.json()` and returns existing private, no-store auth errors (400/403/413).
- Reconstructed canonical login requests deliberately drop stale Content-Length, Transfer-Encoding and Content-Encoding, set JSON content type and preserve the original Host/Origin for independent canonical authentication, tenant resolution, IP/rate throttling and delivery.
- Test `tests/unit/legacy-otp-start-boundary-security.test.ts` contains eight cases: foreign/missing Origin, declared/actual size mismatch, excessive declared size, malformed bytes and schema, ambiguous contact, email compatibility, phone compatibility.
- **Important boundary:** the canonical handler retains enforcement of the OTP rate limit. This source-only change does not prove multi-replica distributed throttling or delivery-provider abuse resistance.

### 3. Signed inbound email worker callback

- Implementation: [`a1207daa49a5528c3a9177158ed61c0364c00b99`](https://github.com/42Students/lms-vnext/commit/a1207daa49a5528c3a9177158ed61c0364c00b99).
- Regression source: [`f83eb869e3015aaa2f5255a401e015707bc69852`](https://github.com/42Students/lms-vnext/commit/f83eb869e3015aaa2f5255a401e015707bc69852).
- `src/app/api/internal/inbound-mail/route.ts` rejects browser Origin and URL query selectors; validates the expected 64-character hex HMAC **format before reading request bytes**, while leaving HMAC **authenticity**, signed tenant/recipient payload validation and idempotence with `ingestVerifiedInboundMail`.
- Existing 20,000-byte body cap, fatal UTF-8 decoding, safe error responses, and private ACK containing only `accepted`/`replayed` remain in place.
- Test `tests/unit/inbound-mail-callback-boundary-security.test.ts` contains seven cases: forbidden Origin, malformed signature header, query parameters, authorized delegate behavior, forged Content-Length, invalid UTF-8, and recipient/routing response minimization.
- **Important boundary:** a correct-length HMAC signature is not considered authentic until the service verifies it. This change does **not** establish timestamp/replay-expiration controls, production provider provenance or cross-tenant isolation after deferred mailbox routing.

## Security catalogue references

- `SEC-08-011` input schema validation; `SEC-08-013` maximum body size; `SEC-08-017` Origin/Host/proxy checks; `SEC-08-018` internal error/secret minimization.
- `SEC-09-014` secret avoidance in logs and responses.
- `SEC-15-004` provider HMAC; `SEC-15-007` webhook size/method discipline; `SEC-15-008` unexpected callback data.
- These are **partial slices**, not acceptance of every route or control. Do not change controls to `VERIFIED` based solely on this document.

## Mandatory remaining verification

1. Run targeted tests **on the recorded exact HEAD** (not merely on a local excerpt):
   ```bash
   npx vitest run tests/unit/storage-route-bounded-json-security.test.ts tests/unit/legacy-otp-start-boundary-security.test.ts tests/unit/inbound-mail-callback-boundary-security.test.ts
   npm run typecheck
   npm run lint
   ```
2. Run existing storage, legacy login, inbound-mail and negative-route regression suites; check no assumption about >64-KiB metadata or old OTP framing is broken.
3. On disposable identities and test tenant data: demonstrate denied malformed requests cause **zero** storage grants, OTP challenges, persisted mail rows or provider sends; prove authorized end-to-end flows still work.
4. Check the actual inbound worker signs the same exact UTF-8 body and supplies no browser Origin/query parameters. Verify key rotation, worker IAM/source authentication, replay/idempotence and tenant-safe routing separately.
5. Review production ingress, provider/body limits, multi-replica abuse controls, callback network restrictions and deployment configuration. No live secrets or recipient records are permitted in published test receipts.
6. Record job URLs/exit status/exact SHA in the canonical security control evidence only after the runs actually execute; independent signoff remains separate.

**Execution result in this conversation:** source and test files committed and re-fetched; **no Vitest/typecheck/lint/PostgreSQL/prod configuration runs performed**. GitHub Actions was intentionally not triggered; CI may be unavailable under the project's billing constraint. None of the 493 control IDs is certified here.
