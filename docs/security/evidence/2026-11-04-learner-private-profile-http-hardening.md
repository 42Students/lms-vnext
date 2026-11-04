# 2026-11-04 — Learner own-profile HTTP privacy and body limits

**Scope:** `src/app/api/profile/me/route.ts` GET, PUT and legacy section redirects. Merged via [PR #226](https://github.com/42Students/lms-vnext/pull/226) at exact merge SHA [`09446c1`](https://github.com/42Students/lms-vnext/commit/09446c1111959c58589e7f3bb176b2cb1bd98848).  
**Status:** Implementation, unit tests and scoped CI workflow committed; **test execution, ingress and live PostgreSQL assurance pending**. This evidence packet is not a second tracker and cannot close ASVS or tenant/RLS controls by itself.

## Before

- The authenticated own-profile GET returned identity, education and job-preference data without an explicit response no-store policy.
- The full-document PUT called `request.json()` with no streamed byte limit before schema/service validation.
- The legacy `legacySection` selector used `URLSearchParams.get()`, silently choosing the first of repeated query values.
- Legacy section redirects did not explicitly set a no-referrer/no-store response policy.

## Implementation

- [Source change](https://github.com/42Students/lms-vnext/commit/769a0182e028c6db131dc8ecd89cc43f2a0454cc): authenticated GET returns `private, no-store`; allowed legacy link redirects receive `private, no-store` and `no-referrer`. Invalid/unauthorized section responses are no-store. Duplicate/blank `legacySection` is HTTP 400 before private-profile service calls.
- PUT continues to require an existing same-origin guard and authenticated request context. It now parses at most **2 MiB of actual streamed UTF-8 JSON**, independent of caller-supplied `Content-Length`, returning 413 for oversized and 400 for malformed content before invoking the profile writer. Successful writes return `private, no-store`.
- No authorization/tenant permission was bypassed or moved into browser logic: `getOwnLearnerProfileWithRuntime` and `updateOwnLearnerProfileDocument` retain their original server-side ownership checks and expected-document compare-and-swap.
- [Authored HTTP regression suite](https://github.com/42Students/lms-vnext/blob/main/tests/unit/security-learner-profile-http-boundaries.test.ts) covers sensitive read cache policy, ambiguous links, wrong-role denial, no-referrer redirects, forged-length overflow, malformed payloads, positive authorized saves and cross-origin rejection.
- [Scoped workflow](https://github.com/42Students/lms-vnext/actions/workflows/security-learner-private-profile.yml) requests no secrets, checks exact source SHA, executes Vitest and full TypeScript. GitHub execution receipt is not yet available here.

## Assurance outstanding

1. Validate the max legitimately supported serialized learner profile including education, experiences, projects, certifications and Unicode. Keep the bounded cap aligned with the product contract, without accepting browser-side base64 document bodies.
2. Confirm production reverse proxy, CDN and browser cache behavior; verify no profile contents appear in logs or shared caches.
3. Run the authored workflow and integration tests on an exact-SHA trusted runner. Prior unrelated workflows failing with no job steps are not unit test evidence.
4. Verify current selected Learner role, active membership and database ownership under the real restricted runtime principal, including cross-college mutation attempts and concurrent membership revocation.
5. Attach actual verified evidence to matching entries in the canonical `docs/tracker.json -> security` only after live proof. Do not modify that shared tracker concurrently with other security chats.

## Post-merge CI receipt

[Run 41838045469](https://github.com/42Students/lms-vnext/actions/runs/41838045469) targeted merge SHA `09446c1111959c58589e7f3bb176b2cb1bd98848`, and GitHub reported `conclusion=failure`. The sole job `learner-private-profile` returned **no step records** (`steps=null`). This is not an executed Vitest assertion, TypeScript pass, or application failure trace. Its runner/startup cause must be determined by an authorized GitHub Actions operator. Repeat tests at the exact source SHA on a functioning runner, and only then update canonical security proof status.
