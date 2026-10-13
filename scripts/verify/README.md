# End-to-end verification scripts

Plain Node scripts that drive a **running** vNext over HTTP. They are not unit
tests (they need a server and a seeded database) and they exist because CI is
not always available. All of them use the fictitious accounts from
`scripts/seed-test-tenants.ts` and the dev-only fixed code, so they only work
against a deployment with `APP_ENV=development` and those contacts listed in
`AUTH_TEST_PHONES` / `AUTH_TEST_EMAILS`.

| Script | Against | What it proves |
| --- | --- | --- |
| `login-local.mjs` | local server (`BASE_URL`, default `http://127.0.0.1:3000`) | every role signs in; wrong-code budget; replay; logout revocation; college-host isolation; unknown host; origin guard |
| `login-live.mjs` | the dev hosts over HTTPS (paced for the per-IP throttle) | the same, through the real load balancer, plus the spoofed `X-Forwarded-For` check |
| `onboarding-e2e.mjs` | `BASE_URL` | super admin creates org + college + college admin; the admin onboards staff and a learner; cross-college denial; suspend / reactivate |
| `branding-e2e.mjs` | local (`LIVE=1` for the dev hosts) | branding validation, permissions, isolation, and effect on the sign-in page |
| `devices-e2e.mjs` | `BASE_URL` | device list, revoke one, sign out everywhere else, ownership |

`onboarding-e2e.mjs` uses fixed phone numbers, so it is clean only on a
database where those people do not already exist (reseed first). Set
`PACE_MS=7000` against a live host to stay under the per-minute IP limit.
