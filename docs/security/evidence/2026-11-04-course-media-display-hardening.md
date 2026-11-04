# 2026-11-04 — Course thumbnail, display, upload-body and private-response hardening

**Repository:** `42Students/lms-vnext` (`main`)  
**Scope:** Course display metadata and image-read/upload endpoints only. Seven-account, whole-app authorization, live Cloud SQL, scanner and CSP release gates remain separate.  
**Status:** Implemented and committed; **PARTIAL_EVIDENCE** only. This is an immutable dated evidence packet, **not** a second live progress tracker. `docs/tracker.json` remains the sole status and ownership authority. Do not mark any control or phase done from this source-only batch.

## Concrete defects addressed

1. **Inconsistent thumbnail URL trust.** The old course-display mutation allowed arbitrary HTTPS destinations, including credential-bearing URLs, private IPs and short-lived signed capabilities; a different learner-side filter rejected some of these and silently fell back. `src/modules/courses/course-thumbnail-url-policy.ts` now supplies a common restrictive policy, used by both authored URL write contracts and learner media rendering. The only relative exception is the authenticated, scanned `/api/courses/<uuid>/image` read path; the existing course display service independently enforces exact-course and already-attested image matching. Browser requests to arbitrary public-looking DNS remain a residual privacy/edge-security consideration; this validator is not network-level SSRF or DNS-rebinding defense.
2. **Unbounded JSON allocation in three course mutations.** `PUT /api/courses/:courseId/display` uses `readBoundedJsonRequest(...,262144)`; `POST /api/courses/:courseId/image` uses a 4,096-byte cap; and `POST /api/courses/:courseId/image/complete` uses a 2,048-byte cap. The shared reader checks streamed bytes, not merely `Content-Length`; existing CSRF, session, permission and Zod validation are retained. The course display schema now rejects extraneous fields (`.strict()`).
3. **Response caching ambiguity.** Authenticated course display GET/PUT, course metadata GET, private image GET/upload/delete, image scan-status GET and completion POST now explicitly set `Cache-Control: private, no-store` and `Vary: Cookie` on success, denial, invalid input and service-error paths. The image GET retains `nosniff` and sandbox CSP.

## Code commits in this batch

| Purpose | Commit SHA |
| --- | --- |
| Shared thumbnail URL security policy | `50913c17e32e51e78daafc7987c3bc361019f668` |
| Course display strict image URL write checks | `88084b5e2f16f0d6db347ec0df1eaf524983fd58` |
| Course metadata cover write checks | `f0a699c31ff99c091a0296a08a63795db681ca96` |
| Learner image read filtering and authenticated relative image support | `fb6c6695ea5ce2f1d5c2eb31380e891f873e26c4` |
| Course image upload grant JSON stream cap | `424d6431e885f2f3f7a0dc9ea54d65fe0cbddb91` |
| Course image completion JSON stream cap | `ffe6bdc5301b868a9fd44d308f197adc627c9575` |
| Course rich display JSON stream cap and validation | `ecfbaaf85225e8a5cab0298cb03aaf640054fe87` |
| Scoped course display private responses | `7c0eeff672e9b304a83881d63cec39b61c0c9014`, `1796ef94f5685814ce31bedce13ff15fd68d2dbc` |
| Metadata read private responses | `58a42acb7c4dfe5a83a69248f210b0db98dab51c` |
| Private course image read/grant/scan-status/completion error responses | `c1effe73784282ac57555f006486b6c09c8a5911`, `32766d8077d81ddd9e709970961506824d06f562`, `4755891a00e56d4b73cec2240b2be7bf1d19bda5` |
| Refuse signed and sensitive image query parameters | `bedef3647a4cd690e042d3f46c8beb93cc216953` |
| Strict display mass-assignment denial | `6e9b2bcd170c662ec9d0ba8aac6f4d45cd572178` |
| DOM-API compatible signed-query inspection | `ca53ed89d9e91ac80b3b8b6a340337189882d891` |

**Negative/positive regression files committed:** `tests/unit/course-thumbnail-url-security.test.ts`, `tests/unit/course-image-bounded-http-security.test.ts`, `tests/unit/course-display-bounded-http-security.test.ts`, `tests/unit/course-display-private-cache-security.test.ts`, `tests/unit/course-image-private-response-security.test.ts`. Existing course-display, learner media fallback and cover-link safety tests remain in the consolidated `.github/workflows/course-media-security.yml`.

## Verification evidence — distinguish test authoring from execution

- **Executed locally (isolated, reconstructed pure policy source only):** 37/37 ordinary and adversarial image destination assertions PASS; additional 10/10 signed-capability query denials and 1/1 benign cache-busting query PASS. Standalone TypeScript `--strict --noEmit` on the pure policy source PASS after changing `URLSearchParams.keys()` to the compatible `forEach` form. These runs did **not** load the full repo, validate Next.js route imports, or use Vitest.
- **GitHub Actions:** push commit `edc05adb7b274591a7cc687a83727a1f0e568fff` triggered workflow `Course media and content security boundary` run [41836859086](https://github.com/42Students/lms-vnext/actions/runs/41836859086), which concluded **failure**, with unavailable job logs and no usable passed-step evidence. A second overlapping course-media workflow was detected and consolidated into `.github/workflows/course-media-security.yml` at `64f4ecab681fba1b7a36f19fbcedb7db3dd36844`; duplicate `.github/workflows/course-media-security-boundary.yml` was removed at `17e4f281acbf613b68d1af0ebe6b26a63183b1d1`.
- **Not executed / not proven:** complete Vitest suite, Next.js TypeScript compile, browser/cache behavior, CI gate enforceability, restricted PostgreSQL tenant tests, role/revocation races, private scanner attestation and production network/CDN edge settings.

## Follow-up acceptance (never auto-close)

1. With checkout pinned to an exact fresh `main` SHA, execute `npx vitest run tests/unit/course-thumbnail-url-security.test.ts tests/unit/course-image-bounded-http-security.test.ts tests/unit/course-display-bounded-http-security.test.ts tests/unit/course-display-private-cache-security.test.ts tests/unit/course-image-private-response-security.test.ts tests/unit/course-display-content.test.ts tests/unit/learner-course-card-media-model.test.ts tests/unit/chat3-course-cover-link-safety.test.ts` and `npm run typecheck`. Save successful exact-SHA run output/URL; resolve any failures without removing assertions.
2. Exercise a real authorized learner/faculty/admin path plus wrong-college, wrong-role, revoked membership and missing-session denials; prove that image requests and verified storage generations are inaccessible across tenants. Browser-test CSP/media loading and correct cache headers through the deployed ingress/CDN.
3. Verify production image scanner readiness, object-generation binding, runtime DB principal and restricted RLS grants independently; document any user-visible rejection of previously allowed public image hosts.

**Control references:** `SEC-08-011`/012/013/024 (strict input, mass assignment, byte bounds, negative HTTP tests), `SEC-10-014` (private response caching), `SEC-11-003`/004 (signed URLs and public file references), `SEC-12-014` (sensitive URL exposure), and `SEC-23-009`/017/019/022 (adversarial and automatic testing). **These are linked partial slices, not completed controls.**
