# UX-G049 · Retired E2E Super Admin sign-in — scoped UX acceptance

**Scope:** `src/app/e2e/superadmin-login/{page,error,loading}.tsx` — legacy E2E bookmark recovery, not a login path.

## Behavior and safety
- The legacy bookmark does not mint a session. A supplied `phone` query parameter is not echoed or used to authenticate.
- Guidance takes the user to the normal secure `/login` route, with a `/home` escape link.
- Production render is informational; only a development-only E2E flag plus existing authenticated Super Admin context can change diagnostic guidance. Neither code path creates a session.
- Metadata is `noindex` and `no-referrer`; error recovery does not disclose exception text or digests.
- Both desktop and mobile layouts avoid horizontal overflow, and error/loading surfaces keep accessible recovery.

## Executed acceptance
- **Source SHA:** [`ccddb5e191b389387da821503fd87f3c84a4f2ce`](https://github.com/42Students/lms-vnext/commit/ccddb5e191b389387da821503fd87f3c84a4f2ce).
- **Workflow:** [Run 42392546252](https://github.com/42Students/lms-vnext/actions/runs/42392546252), pinned to that SHA. Scoped ESLint and full TypeScript passed. Five Vitest files / **32 tests passed**, including retired sign-in non-escalation, error and loading source regression.
- **Chromium:** Both UX-G049 cases passed — desktop **1280×800** and mobile **390×844** — testing the real rendered public bookmark, no session creation, `/login` navigation, `noindex`, non-disclosure of `phone`, lack of JS page errors, and no horizontal overflow.
- **Important limitation:** The *shared workflow overall failed* because the separate **UX-G048/G122** anonymous tracker-navigation scenarios raised `net::ERR_ABORTED`. Their failure does not mean G049 failed, and this document must **not** be used to mark G048 or G122 complete. The G049-specific two browser tests passed as confirmed in the original workflow job logs.
- This is **scoped UX evidence only**, not an approval of production E2E credentials, global security, or release gates.

## Acceptance result
**DONE — UX-G049 only** on 2026-11-08. Existing authentication, authorization and tenant controls were not altered by this documentation.
