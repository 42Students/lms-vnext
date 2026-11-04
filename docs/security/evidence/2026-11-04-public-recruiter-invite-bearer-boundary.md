# Public recruiter invitation bearer-boundary hardening — 2026-11-04

**Evidence status: IMPLEMENTED / TESTS AUTHORED / NOT VERIFIED.** This is an engineering receipt, not a parallel status tracker. The authoritative 493-control status source remains `docs/tracker.json.security.controls`. No production tokens or personal records are recorded here.

## Threat and scope

`GET /api/public/recruiter-invite/[token]` returns recruiter name/email and college/company metadata to the holder of a valid bearer link. Previously its successful response lacked explicit cache protection. The public invite actions also had inconsistent no-store headers and unvalidated optional inputs. This batch reduces accidental browser/CDN caching, indexing, referrer disclosures, hidden field injection and abusive request bodies, without changing the existing persisted token/OTP/tenant checks.

## Committed implementation

- Preview API: `private, no-store`, no-referrer, noindex/nofollow, dynamic rendering, token-shape check — `bce3df65c560594ca4fe382a5ba400c1258acda2`.
- Error helper: private no-store on known and generic errors — `def108323d1272be4f36e3f501b11b9b12995dea`.
- Tokenized landing page: dynamic, noindex/noarchive, no-referrer metadata — `34ba02683dd8ab0277f16626a034cf3c66ab22c4`.
- Shared no-argument validator: 256-byte streamed cap, strict empty JSON, reject query/extra fields, preserve legacy `{}` — `b63e2c10869f2751e5d4af895cababb8771cc185`.
- Public opened and unsubscribe callbacks: no-argument validation and private cache headers — `663dc580dd509dcc2dbd72bc6dfd4068ba1653eb`, `8009c5fa541a237d36f29ff7ad01999846e4f349`.
- Public not-hiring callback: fatal UTF-8 2048-byte stream cap, strict note-only JSON, query/content-type rejection, no-store — `ad485edc7d2bbb6fc479bd666ba72dd9a6d08802`.
- OTP accept/send-code: reject query fields, private no-store responses on positive/negative paths — `f317ea6a26fc7ead56e93f9e06347e2e684c8261`, `2fa1078dff2536db2759c0fdc51bcb59847658cd`.

## Test additions and pending gates

`tests/unit/public-recruiter-invite-request-security.test.ts` (6 cases, `98869cd19036a2390206975ab8c071547ff00c1f`): valid empty/legacy requests; rejected foreign query fields, mass assignment, unsupported content type, malformed JSON/UTF-8, oversized streamed body with forged Content-Length.

`tests/unit/public-recruiter-invite-cache-security.test.ts` (7 cases, `3a59e395f2f8b46ecbcdd196d3ed33f89b2a1896`): successful sensitive preview not cached/indexed, malformed link avoids DB, legitimate first-open/unsubscribe/decline, rejection before side effect, no-store on origin and readiness denials.

Run on the identified latest clean SHA:

```bash
npx vitest run tests/unit/public-recruiter-invite-request-security.test.ts \
  tests/unit/public-recruiter-invite-cache-security.test.ts \
  tests/unit/chat16-public-recruiter-invite-route-matrix-37.test.ts \
  tests/unit/recruiter-public-invitation-note-route.test.ts
npm run typecheck
npm run lint
```

Then verify on isolated staging with real authorized fixtures: email code delivered only to the persisted eligible mailbox; positive join, decline, unsubscribe and repeated/expired token transitions; zero unauthorized writes/emails; browser/CDN `Cache-Control`, landing referrer/robots metadata, no bearer-token leakage in access logs/analytics; ingress rate limits and same-tenant/cross-tenant isolation. Test any legacy non-JSON decline client because an unsupported nonempty body now fails closed (415). Attach actual test-run URL/SHA and independent review before any control closure.

Related *partial* scope: `SEC-08-010/011/012/013/016/017/021/024`, `SEC-10-014`. This slice does **not** certify these broad controls. GitHub Actions, runtime coverage and production edge configuration are not verified here. Branch protection is a separate outstanding governance control.
