# DB-004 — technical field evidence complete; release remains gated

Verified on `42Students/lms-vnext` using registered PostgreSQL acceptance
<https://github.com/42Students/lms-vnext/actions/runs/40698092913>
for implementation commit `ba4a916244e65abd59ecc1ca738b1926ef26e2d6`.

- **195 of 195 source-owned fields** have bounded registered-schema runtime,
  composite replacement, or safe retirement implementation evidence.
- **137** fields have direct physical/runtime semantic witnesses, **24**
  have explicitly bounded composite/first-party service replacements, and
  **34** have technically implemented secure retirement.
- The 7 legacy `email_verification_token` columns are replaced by
  `identity_email_verification_links`, `identity_email_ownership_proofs`,
  and the internal HMAC email-link service. Tests cover actual
  same-college placement application ownership, single-use redemption,
  expiry, email changes, revocation and failed send.
- The 3 final learner/faculty account-verification fields are backed by
  canonical same-college membership scope, profile roll lookup, role-specific
  one-time challenges and denial of login-session conversion.

## Engineering DONE — final organizational acceptance deferred by owner (2026-10-28)

**DB-004 is DONE for engineering purposes** on the authoritative `docs/tracker.json`.
Evidence on `470eb18e798f9df769220255a703c720c8e3feb1`:

- Registered PostgreSQL DB-004 acceptance: <https://github.com/42Students/lms-vnext/actions/runs/40718638979> (PASSED).
- Full CI: <https://github.com/42Students/lms-vnext/actions/runs/40718639073> (PASSED).
- The 195 field witnesses, 7 requester-approved product policies, 34 requester-approved retirements, and authenticated HMAC email proof routes are implemented.
- No historical old-LMS production data is imported: greenfield product policy.

**Deferred until after engineering for the requester's personal final review — NOT
signed, PASSED or waived:**

1. Seven independent security/retention/release-owner attestations (D01–D07).
2. Final security/retention attestations for the 34 legacy-field retirements.
3. Browser end-to-end verification and full exact-final-commit CI/security review.
4. Requester-managed Exotel and ZeptoMail live delivery smoke before production activation.

These are RELEASE-stage obligations, not a reason for an AI agent to reopen DB-004.
The authoritative receipt is `docs/planning/db004-closure-decision-register.json`;
`approvalStatus`, `retirementApproved`, and provider `liveVerified` remain
truthful and PENDING. **Proceed directly to DB-005**. Revisit DB-004 code only
on a real regression or owner-directed change; the database phase itself is not
yet certified.

## 28 October 2026 — authenticated scoped-account proof entry points

Added `POST /api/auth/account-proof/start` and
`POST /api/auth/account-proof/verify` for the current live device session
and its single active learner/faculty role only. The server derives UUID
user, college membership and persisted role from live request context, enforces
Host/Origin and bounded strict JSON, and never accepts a client-supplied
userId, membershipId or role. Real device-session validation prevents an E2E
identity fixture from issuing an external proof challenge. Provider adapters
require Exotel/ZeptoMail acceptance and the role-proof secret; unapproved
development delivery fails closed. Verification cannot mint LOGIN,
device credentials or roles.

This closes a bounded integration gap for the distinct role proof; it is
not a public contact-verification or a first-party login replacement.
24-hour email ownership link delivery remains server-internal until an
approved application-bound ZeptoMail template/deep link and owner disposition
are available. Authorization tests, negative delivery PostgreSQL witnesses
and route safety checks accompany this integration.

Do not infer live-provider acceptance, historical import authorization, D01–D07
approvals or `DB-004.done=true` from this work.

## 28 October 2026 — seven product decisions approved by project requester

The project requester explicitly selected **all seven recommended policies**
(D01–D07) in the conversation on 2026-10-28. Each selected product disposition
is recorded verbatim in the existing
`db004-closure-decision-register.json` under `productDecision`.
The selected policies are:

- D01: First-party OTP/device sessions; no legacy password/token handoff.
- D02: Canonical user and persisted membership roles; distinct scoped role
  proofs only for workflows that need them.
- D03: **Greenfield vNext; no historical production-data migration**.
  Source-schema/behavior reconciliation remains obligatory, but source IDs,
  timestamp rows, production data import and import receipts are not in scope.
- D04: Safe archive, retained audit, reserved domain tombstones until
  separately authorized reuse.
- D05: Persisted typed role grants only; unknown historic roles confer nothing.
- D06: 24-hour, single-use HMAC email ownership links for scoped workflows.
- D07: Real authorized email/SMS provider checks, current-SHA registered
  migration replay/CI, security and release signoff; no legacy import receipts.

This is **explicit product direction**, not an independently verified signature
from a security, retention or release officer. The existing per-decision
`approvalStatus` remains PENDING until the required signers attest.
No existing old-LMS data or credentials were copied or deleted, and no
legacy database was contacted. The 34 retired fields are handled under
the same product policy but require separately recorded final security review.

## 28 October 2026 — all 34 obsolete fields disposed by requester

The requester also explicitly approved retirement of **all 34** legacy-only
fields under the already selected D01/D02/D05 architecture policies. Every
one of the 34 identified original source fields is now individually annotated
with `retirementProductDisposition.status=APPROVED_BY_REQUESTER`, mapped to a
selected decision and verified for exact scope by the DB-004 evidence tests.

This concludes **34/34 product disposition choices** (and 195/195 bounded
technical implementation evidence), without touching production legacy data.
The per-field `retirementApproved` final-security flag remains `false` until
actual independent security/retention attestation, source-specific
negative/security tests, and applicable provider/release acceptance are
available. Such attestations are not fabricated from the product instruction.

## 28 October 2026 — provider execution transferred to requester

The requester explicitly confirmed they will handle **Exotel and ZeptoMail**
configuration and authorized real send/receipt checks themselves, and requested
the provider matter be closed **for DB-004**. Accordingly:

- **DB-004 provider dependency:** CLOSED BY OWNER HANDOFF; external delivery
  is no longer required to certify *database/identity field* parity.
- **Deployment/release responsibility:** remains with the requester. Real
  authorized Exotel SMS and ZeptoMail email receipts are **NOT YET VERIFIED**
  and remain a hard gate to enabling live transactional send functionality.
- **App security continues to fail closed:** no credentials or source secrets
  entered; no simulated delivery, shared OTP, or bypass was enabled.
- **Independent DB-004 gates still open:** seven formal cross-role/security
  attestations, 34 final security/retention retirements, approved
  application-bound email-link path as applicable, current-SHA CI/browser and
  the remaining applicable security evidence.

Canonical receipt: `docs/planning/db004-closure-decision-register.json`
`releaseEvidence.providerOwnerHandoff`, with unverified live tests separately
recorded in `releaseEvidence.providerAcceptance`.

## 28 October 2026 — application-bound email ownership link API and UI

Added **authenticated, same-host** issue/redeem endpoints for the existing
24-hour, single-use HMAC email ownership proof. A browser never selects the
recipient, user, college, membership, template, or redirect. It can select only
its own currently scoped placement application, which PostgreSQL rechecks
for active tenant/learner ownership. Redemption additionally checks the
signed-in device's canonical user and selected membership; a forwarded bearer
cannot be replayed against a different account.

The verification URL carries the 256-bit bearer in a **fragment**, not a
request query string; the confirmation page clears that fragment before
posting to the same-host endpoint. Neither successful proof nor link issue
creates a session, grants a role, approves a placement, or echoes a token.

The transport uses a **dedicated explicitly provisioned**
`ZEPTOMAIL_TEMPLATE_EMAIL_OWNERSHIP_LINK` with `verificationUrl` and
`expiryHours` merge variables, never the 6-digit OTP template. Missing
provider config/authorization fails closed and revokes the issued challenge
if the provider rejects delivery. The requester owns real inbox delivery
evidence during RELEASE; this integration does not claim actual delivery.
