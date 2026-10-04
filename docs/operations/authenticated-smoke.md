# Authenticated production smoke

The public smoke script proves liveness, readiness and baseline security headers. This authenticated smoke adds the session/tenant checks that cannot be exercised until a real Identity Platform session exists.

It **does not bypass login** and must never enable `E2E_AUTH_ENABLED` in production.

## Obtain the test session

Use an approved non-human or launch-test identity to sign in through the real production Identity Platform flow.

Capture the resulting cookie header securely for the duration of the smoke run. It normally includes the server session cookie and, for membership-scoped users, the active membership cookie.

Do not paste the cookie into source control, shell history that is retained/shared, launch documents, CI logs, or chat.

## Run

Basic authenticated session + dashboard check:

```bash
SMOKE_AUTH_COOKIE='lms_session=...; lms_membership=...' \
npm run smoke:authenticated -- https://your-production-host
```

Stronger College Admin tenant-isolation check:

```bash
SMOKE_AUTH_COOKIE='lms_session=...; lms_membership=...' \
SMOKE_EXPECT_MEMBERSHIP_ID='<approved membership uuid>' \
SMOKE_COLLEGE_ID='<own college uuid>' \
SMOKE_FORBIDDEN_COLLEGE_ID='<different college uuid>' \
npm run smoke:authenticated -- https://your-production-host
```

The smoke verifies:

- the Identity Platform-backed server session resolves;
- membership choices load;
- an expected membership is present when supplied;
- `/dashboard` renders without an auth redirect;
- the own-college Department API succeeds when `SMOKE_COLLEGE_ID` is supplied;
- a different-college Department API returns `403 FORBIDDEN` when `SMOKE_FORBIDDEN_COLLEGE_ID` is supplied.

The script emits only the host, check names and membership count. It never prints the supplied cookie.

## Launch evidence

For launch evidence record:

- launch SHA;
- identity role/profile used (not credentials);
- smoke timestamp;
- host;
- enabled assertions;
- pass/fail.

The actual interactive phone-OTP sign-in still needs direct validation after Identity Platform is configured. Passing this script is not a substitute for checking the login UI/provider itself.
