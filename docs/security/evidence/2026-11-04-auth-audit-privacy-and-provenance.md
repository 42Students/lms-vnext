# Auth event correlation privacy and INFO-log provenance — scoped evidence

**Date:** 2026-11-04  
**Branch:** `main`  
**Status:** SOURCE HARDENED; LOCAL EXACT-BLOB PURE TESTS PASS; REPOSITORY CI AND DEPLOYED-CONFIG VALIDATION STILL OPEN.

## Security defects addressed

1. **Enumerable IP correlation identifiers.** `src/modules/auth/http.ts::ipTag` previously logged an unkeyed, truncated SHA-256 of the IP. The IPv4 address space is enumerable: the old value was not a strong privacy-preserving pseudonym. The same tag is used for the persisted per-address OTP-send budget.
2. **Unrestricted login audit metadata.** `auditLogin` merged every caller-supplied metadata field into the security event, with only the final route/component/tag protected. A future call site could accidentally send contacts, codes, raw headers or token values to the audit stream.
3. **Dropped auth audit evidence.** `src/observability/logger.ts::privacySafeInfoLogFields` did not recognize `ipTag`, `userTag`, `channel` or the static auth route slugs; normal INFO writes discarded correlation evidence despite upstream auth audit calls constructing it.

## Implementation

- `src/modules/auth/auth-audit-privacy.ts`: purpose-separated HMAC-SHA256, 24 lowercase hexadecimal characters (96-bit truncated tag), keyed with the configured `AUTH_SECRET`. Missing/short secret returns `unavailable`, never a raw identifier or guessable fallback hash. The registered `identity_auth_attempts.ip_tag` width is 24, so there is no column migration for this change.
- `src/modules/auth/http.ts`: IP correlation now uses that keyed tag. `auditLogin` only passes explicitly allowlisted security fields, with bounded numeric values and fixed enums; user IDs are emitted only as keyed `userTag`.
- `src/observability/auth-info-field-policy.ts`: validates the auth-audit component, static route format, keyed identifiers, booleans, timing metrics, request counts and request IDs. Unapproved fields are removed.
- `src/observability/logger.ts`: dispatches INFO auth-audit events through the narrowly scoped security policy while leaving generic INFO policy unchanged.
- `tests/unit/auth-audit-privacy.test.ts` and `tests/unit/auth-audit-logger-fields.test.ts`: keyed identity, purpose/key isolation, invalid-secret, no-PII, metadata allowlist, and generic logging non-regression checks.
- `tests/unit/chat6-auth-http-guard.test.ts` and `tests/unit/chat17-auth-http-hardening.test.ts`: existing authentication audit tests updated for keyed 96-bit IDs and injection-negative assertions.
- `.github/workflows/authz-critical-boundary.yml`: auth audit code/observability edits trigger and run the relevant focused suites.

## Git changes

- [Keyed audit privacy helper](https://github.com/42Students/lms-vnext/commit/77d108938f037d21a17bf0bb6d713238db338d26)
- [Integration with authentication event handling](https://github.com/42Students/lms-vnext/commit/a2fed0be75e7c3fa031793080196cb4f6276bc75)
- [Existing auth HTTP regression update](https://github.com/42Students/lms-vnext/commit/66c5641407e804069bcb21326ef9b047119f191e)
- [Auth HTTP privacy test update](https://github.com/42Students/lms-vnext/commit/df9dd81a3be4b0dcbf5802a33570f7e964a13672)
- [Dedicated privacy regression suite](https://github.com/42Students/lms-vnext/commit/f442ff38e69735f77cc302c31269079f34dab83b)
- [Auth INFO sanitizer](https://github.com/42Students/lms-vnext/commit/bd0ace9cf80734e9170bf4bb1a66bda99237bd5b)
- [Logger dispatch fix](https://github.com/42Students/lms-vnext/commit/c7e156046a4feb4ff38cfffee2f942cfa64657f4)
- [Logger regression tests](https://github.com/42Students/lms-vnext/commit/a687d22c88003221b6d9fe2e7068c9363efe004a)
- [Focused CI wiring](https://github.com/42Students/lms-vnext/commit/0a99dd75182963240cefd254280c0726c3698ccd)

## Executed tests and limits

Standalone local Node 22 `--experimental-strip-types` checks exercised both exact-blobs `src/modules/auth/auth-audit-privacy.ts` (blob `302fc22226e042e8cf8297185674aeb92a81bac5`) and `src/observability/auth-info-field-policy.ts` (blob `26b1101ab4064304e6c324d715b99ae8a85dd077`). The local file blob IDs were verified to match GitHub exactly. The checks covered keyed-tag shape, HMAC reference equality, cross-key/purpose separation, invalid-key non-disclosure, field allowlisting, invalid field rejection, and a positive end-to-end pure-function path preserving legitimate auth facts without raw IP/ID/code/contact values. These pure checks passed.

The [focused authorization workflow on the final CI-wiring commit](https://github.com/42Students/lms-vnext/actions/runs/41837810077) **failed with zero executed steps**. This is not an assertion failure or a passing test; no full repository Vitest, typecheck, disposable PostgreSQL, deployed logging pipeline or live incident query was executed in this session.

## Acceptance boundary and follow-ups

- Run the four focused Vitest suites on a checkout of a pinned source SHA; run typecheck and actual `writeStructuredLog` output assertions.
- Validate production audit storage/query consumers do not rely on raw `userId` or legacy 12-hex IP tag fields; update alert filters before cutover. Existing old IP tag windows will not correlate with new HMAC tags during rollout; monitor first-window OTP budget changes.
- Verify `AUTH_SECRET` has appropriately strong randomness and is consistent across application replicas; rotating it changes pseudonyms. Protect the secret, logs and audit retention settings.
- Run multi-replica OTP abuse tests and deployment ingress validation. HMAC does not provide RLS, distributed quotas, proxy authentication or role authorization.
- Do not mark security controls VERIFIED, or claim runtime security certification, from local/source tests alone. `docs/tracker.json` remains the sole status authority.
