# First-party login (phone / email one-time codes)

**Status:** implemented and locally verified; supersedes the Identity
Platform / Firebase session design for browser sign-in.

## Why

The legacy LMS signs people in with a one-time code sent by SMS (Exotel) or
email (ZeptoMail). vNext keeps that exact product behaviour, but as one
account per human (the `users` row) with college memberships chosen after
sign-in. There is no external identity provider and no per-SMS provider
fee beyond Exotel.

## Flow

1. `POST /api/auth/login/start` `{channel: PHONE|EMAIL, contact}`
   - looks the person up by phone or case-insensitive email
   - refuses unknown (`NOT_REGISTERED`), disabled and, on a college host,
     people with no active membership or recruiter grant there
   - at most 5 sends per contact per 10 minutes
   - creates one `identity_auth_attempts` row and sends a 6-digit code
2. optional `POST /api/auth/login/email` sends the code by email instead
   (30 s gap between sends)
3. `POST /api/auth/login/verify` `{attemptId, code}`
   - one atomic budget of 5 tries shared by SMS and email
   - single use; authorization is re-checked when the code is consumed
   - creates an opaque device session and sets the `lms_session` cookie

## Security properties (all covered by tests)

- codes are stored only as keyed HMAC and compared in constant time
- a challenge lives at most 5 minutes (database CHECK + `expires_at`)
- a challenge is bound to the host it was started on (`WRONG_TENANT`)
- sessions are random 256-bit tokens; only a keyed digest is stored;
  logout and suspension revoke them server-side
- per-IP throttle on every unauthenticated endpoint, plus same-origin check
- no phone number, code, credential or response body is ever logged
- test codes exist only when `APP_ENV=development`; production configuration
  cannot accept them even if the variables are set

## Multi-tenant hosts

`resolveRequestTenant` maps the `Host` header (never `X-Forwarded-Host`):
platform host -> no college; verified college domain -> that college only;
anything else -> fail closed. A college host only signs in people who belong
to that college (or recruiters granted access to it) and selects their
membership. Super admins sign in on a platform host.

## Environment

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | >= 32 chars; keys codes, contact fingerprints, sessions |
| `APP_ENV` | `development` enables dev-only test codes; default `production` |
| `AUTH_TEST_OTP`, `AUTH_TEST_PHONES`, `AUTH_TEST_EMAILS` | dev-only fixed code for listed QA contacts (nothing is sent) |
| `PLATFORM_HOSTS` | comma list of hosts that imply no college |
| `EXOTEL_API_KEY`, `EXOTEL_API_TOKEN` | SMS (DLT ids default to the legacy registered values) |
| `ZEPTOMAIL_TOKEN` | email |

## Test scenario

`scripts/seed-test-tenants.ts` (guarded by `ALLOW_TEST_SEED=I_ACCEPT`) seeds
one organization, two colleges with verified hosts, and an account for every
role (learner, faculty, mentor, college admin, TPO, an HR recruiter granted at
both colleges, a super admin, and a faculty member in both colleges). All
contacts are fictitious.

## Known follow-ups

- legacy Firebase modules (`src/auth/firebase-admin.ts`, GCS receipts) are
  still present but no longer on the sign-in path
- cross-host account handoff (`identity_auth_handoffs`) is not built
- device list / revoke-one UI is not built (service functions exist)
