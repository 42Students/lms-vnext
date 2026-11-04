# Security implementation packet — streamed-body controls and privileged global skill imports

**Date:** 2026-11-04
**Repository:** `42Students/lms-vnext`, committed to `main`
**Evidence state:** Source changes committed; targeted regression suites authored. GitHub Actions results below failed before exposing any executed job steps. **No unit/TypeScript/DB PASS is claimed.**
**Tracking:** This is a handoff/evidence packet, **not** a second execution tracker. Link any acceptance decision to `docs/tracker.json` and the existing SEC control catalogue.

## Threats addressed

1. **Unbounded input allocation:** several authenticated action routes called `request.text()` and only then compared the decoded JS character count. Missing/forged `Content-Length`, chunked transfer and multi-byte UTF-8 could defeat the intended body cap and permit unnecessary allocation before authentication/resource checks. The existing `readBoundedUtf8Body` streams with a byte budget and strict UTF-8 decoding.
2. **Cross-operation administrative privileges:** global canonical skill import and curated synonym seed previously checked the request's Super Admin context before opening their write transaction. The role might have been revoked before the catalog is changed. Both now recheck `admin-scope.select` against persisted roles with transaction-held locks before touching catalog rows.
3. **Sensitive action freshness and scope:** both global imports now require `requireRecentDeviceAuthentication(context.user.id)`; a valid but old device cookie cannot apply an administrative catalog mutation. Curated seed also rejects college/organization-scoped Super Admin contexts, consistent with canonical skill import.

## Source changes

| Area | Paths | Boundary |
|---|---|---|
| Self-identity profile | `src/app/api/auth/profile/route.ts` | Replace unbounded `request.text()` with `readBoundedAuthJson(request, 8192)`; explicit 413/400 and no-store errors |
| Mentor preference/attention | `src/app/api/mentor/preferences/email/route.ts`, `src/app/api/mentor/attention/later/route.ts` | Strict streamed 256/1024-byte caps |
| Mentor/TPO notification acknowledgement | `src/app/api/mentor/notifications/read-all/route.ts`, `src/app/api/tpo/notifications/read-all/route.ts` | Streamed 512-byte cap before owner-context/service calls |
| Mentor project activity marker | `src/app/api/projects/[projectId]/activity/seen/route.ts` | Strict 256-byte empty-body validation |
| TPO CGPA policy | `src/app/api/placements/tpo/settings/cgpa-rule/route.ts` | Streamed 1000-byte cap before privileged policy update |
| Global skill source import | `src/app/api/admin/skills/import/route.ts`, `src/modules/skills/skill-source-import-service.ts` | Streamed 210000-byte cap, recent OTP-backed session, live persisted Super Admin transaction guard |
| Global curated synonyms | `src/app/api/admin/skills/curated-seed/route.ts`, `src/modules/skills/curated-synonym-seed-service.ts` | Recent OTP-backed session, global-only admin scope, persisted Super Admin transaction guard |

## Authored regression suites

- `tests/unit/db004-self-profile-http-boundary.test.ts`: new multi-byte byte-budget, streamed oversized, missing body, malformed UTF-8 denial cases alongside pre-existing positive/negative profile contracts.
- `tests/unit/security-streamed-mutation-body-boundaries.test.ts`: byte-cap negatives for six named routes plus project seen, malformed UTF-8 denial, positive bounded workflows, streamed missing-length overlimit.
- `tests/unit/security-superadmin-skill-import-authority.test.ts`: both catalog services deny revoked actor before SQL, disabled actor, tenant-scoped platform actor, and ordinary college account.
- `tests/unit/security-superadmin-skill-import-stepup.test.ts`: both HTTP routes deny stale authentication and cross-origin requests without service calls, preserve fresh-authorized paths; curated route denies tenant-scoped platform actors.
- `.github/workflows/authz-critical-boundary.yml` now includes the first-party profile regression.
- `.github/workflows/security-streamed-mutation-bodies.yml` watches the touched route/service/test paths and runs the affected Vitest suites plus TypeScript typecheck.

## Source revision and runner evidence

Important commits in this slice:

- `4133167809cd73b7c707d4a0a01457d46c9a992f` — self-profile streaming JSON bound.
- `43d6c7adccc13744c0f939430cd5007575efc456` through `e671787763b229f743e9f8cc261bd17bdc33276f` — seven streamed Mentor/TPO/admin mutations.
- `84eddf494f53a8a19978ca07d7030ab3a1fca2f1`, `b429af4afca0a5376f2adc5d1369d62d5c57b39e` — persisted actor guards on the two catalog services.
- `1435a4fbf0bc29e3a2796de7bca688ef9dcc4255`, `1330e28e071209c0a2cbfff90da7c91abcacbc23` — recent-auth route requirements.
- `cdea2767edd54b0b348c679afe7aae071a726ab4`, `956052295c9f70ffc40ac7d818b6fc1989e9e770` — global-only curated seed.
- `62465bb3f330c47bc144ccdd0921e1351a79bebc` — expanded CI workflow for new suites.

GitHub Actions `Security - streamed staff mutation body limits` run [41838220485](https://github.com/42Students/lms-vnext/actions/runs/41838220485) reported `failure` for `62465bb3f330...`, but GitHub's job response showed **0 steps**. The `Critical authentication and authorization boundary` run [41838164351](https://github.com/42Students/lms-vnext/actions/runs/41838164351) also reported failure with 0 steps. Neither is evidence that the assertions executed or failed. Do not label the suites PASS, and do not infer an application test failure from empty steps.

## Required closure follow-up

1. Restore working GitHub Actions execution or run on a trusted checkout; run the four targeted Vitest suites, mandatory TypeScript check and source integrity tools at the same pinned revision.
2. Execute disposable PostgreSQL integration tests for concurrent removal of `SUPER_ADMIN` while each global import transaction is pending. Verify no catalog writes if the revocation committed first; verify the transaction lock serializes a later revocation.
3. Confirm byte caps on chunked requests through the real Next.js server and proxy, not only an in-process `Request` fixture; include memory/latency sanity checks for rejected oversized uploads.
4. Confirm operational recent-auth UX for stale administrative sessions, including a clear sign-in-again path. This implementation uses a newly authenticated device session within the existing freshness TTL; it does not implement a new standalone phishing-resistant step-up challenge.
5. Do not mark full RLS, tenant-isolation, the 1,322-method API review, CI governance or penetration testing complete based on these focused controls.

**Security posture:** fewer unbounded request-body and stale-admin mutation paths in source, with negative suites awaiting a real runner. Not deployment certification.
