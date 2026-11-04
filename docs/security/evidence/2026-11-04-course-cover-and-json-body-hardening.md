# 42LMS vNext — course cover URL and write-body boundary hardening

**Date:** 2026-11-04. **Repository:** `42Students/lms-vnext`.  
**Scope:** Course cover media across authoring and Learner rendering, and three specific course write endpoints.  
**State:** Implemented and committed to `main`, with authored regression suites and a local isolated URL-policy smoke check; **not yet CI-accepted or production-assured**.  
**Canonical status:** `docs/tracker.json` remains the only execution tracker. This file is a dated evidence packet, **not a second tracker** and not a claim of completed catalogue controls.

## Implemented protection

1. **One shared public-image URL policy.** `src/modules/courses/course-thumbnail-url-policy.ts` rejects HTTP, embedded credentials, fragments, custom ports, literal IPv4/IPv6 (including alternate numeric IPv4 notation), local/internal DNS suffixes, single-label names, malformed host labels and control characters. It normalizes HTTPS public-looking destinations with the WHATWG URL parser. **Limit:** it does not resolve DNS; DNS rebinding/public-domain-to-private-address protection requires browser, ingress and CSP/infrastructure controls. No claim of comprehensive SSRF prevention is made.
2. **Consistent authoring validation.** `src/modules/courses/validation.ts` and `src/modules/courses/course-display-validation.ts` apply that shared policy. Display content also permits the strictly shaped authenticated `/api/courses/<uuid>/image` route. The course image service separately requires the correct course's prior stored, scanned image before persisting that local route and enforces tenant checks on retrieval.
3. **Consistent learner image selection.** `src/modules/courses/learner-course-card-media-model.ts` uses the same public URL rule; it also supports the verified first-party course image route instead of incorrectly falling back to an illustration. Other local paths still fail closed.
4. **Streaming body caps, before JSON deserialization.** Reused the canonical shared `src/lib/bounded-json-request.ts` (created by a parallel contributor) for:
   - `POST /api/courses/[courseId]/image`: **4,096 bytes**.
   - `POST /api/courses/[courseId]/image/complete`: **2,048 bytes**.
   - `PUT /api/courses/[courseId]/display`: **262,144 bytes**, retaining valid rich-text payload space.
   The reader checks the actual streamed bytes, not just the claimed `Content-Length`. Failures return generic HTTP 400 with private no-store headers at these routes. Existing same-origin checks, session/context logic, Zod/service validation, resource authorization and storage attestation remain in place. A full body can no longer be buffered with `request.json()` at these three routes.

## Main commits in this batch

| Change | Commit |
| --- | --- |
| Shared URL trust policy | `50913c17e32e51e78daafc7987c3bc361019f668` |
| Display URL validator | `88084b5e2f16f0d6db347ec0df1eaf524983fd58` |
| Course metadata validator | `f0a699c31ff99c091a0296a08a63795db681ca96` |
| Learner image model | `fb6c6695ea5ce2f1d5c2eb31380e891f873e26c4` |
| Cross-layer malicious URL tests | `8e27c9a873b6d66a722bcbd16fa2c2aefa9276f6` |
| Image grant HTTP body cap | `424d6431e885f2f3f7a0dc9ea54d65fe0cbddb91` |
| Image completion HTTP body cap | `ffe6bdc5301b868a9fd44d308f197adc627c9575` |
| Course display HTTP body cap | `ecfbaaf85225e8a5cab0298cb03aaf640054fe87` |
| Image grant/completion direct route tests | `2c9bf8a22e1b0fde2310a33b151b9d5f0cb5b74c` |
| Display PUT direct route tests | `5ddac7fb5657591b94b002bf0360ae33143cd165` |
| Focused main/PR CI security gate | `6298cbcffe0fc2f6cf21916264faa5527f9d0aeb` |

## Proof already obtained

- Local isolated Node 22 smoke script, using the URL policy logic reproduced from the committed source: **3 valid HTTPS examples accepted, 30 malicious/ambiguous examples rejected, 4 local-course-path checks passed (37 checks)**. This **is not a GitHub checkout or execution of Vitest against `main`**.
- The above source and test files were created/updated on `main`; targeted readback of commits/files is a source verification only.
- Newly authored, but **not yet executed as repository tests**: `tests/unit/course-thumbnail-url-security.test.ts`, `tests/unit/course-image-bounded-http-security.test.ts`, `tests/unit/course-display-bounded-http-security.test.ts`.
- A security workflow is configured at `.github/workflows/course-media-security.yml`. No successful Actions run or full TypeScript/Playwright result is claimed. Repo-wide Actions may be unavailable because of billing, so run the same commands locally in a checked-out source tree if necessary.

## Remaining acceptance

1. Run on an exact clean `main` SHA: `npx vitest run tests/unit/course-thumbnail-url-security.test.ts tests/unit/learner-course-card-media-model.test.ts tests/unit/course-display-content.test.ts tests/unit/course-image-bounded-http-security.test.ts tests/unit/course-display-bounded-http-security.test.ts`, `npm run typecheck`, and affected build/lint.
2. Run authenticated browser tests: upload/scan/complete/serve a legitimate course image, verify Learner and Faculty cards, ensure revoked or foreign-college accounts cannot access internal image bytes, and check unknown course UUIDs.
3. Verify the trusted private R2 scanner and signed object-generation attestation in staging; perform a controlled cross-college negative test and content-type sniffing test.
4. Verify edge controls for browser requests to external image URLs, and decide if organizationally allowlisted CDN domains should replace generic public HTTPS hosts.
5. Attach an exact executed test SHA/run receipt to the canonical tracker using existing security integration rules before claiming scoped acceptance. Do not mark SEC-08-011 (schema validation), SEC-08-013 (body limits), SEC-08-024 (negative coverage), or related storage/tenant controls `VERIFIED` from these code changes alone.

**Release verdict:** scoped implementation complete; independent suite/CI/real-tenant/scanner acceptance remains open.
