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

## Still explicitly NOT accepted

These are technical *field implementation* witnesses, not final release
sign-off. Do not mark DB-004 or its dependent DB-005 milestone done before:

1. All seven owner decision groups in
   `docs/planning/db004-closure-decision-register.json` have signed,
   source-backed approvals.
2. All 34 technically retired credential/metadata fields receive documented
   security, migration and retention approval.
3. Real historical data import and source-ID/timestamp reconciliation,
   exceptions/quarantine and migration receipts are reviewed.
4. The first-party email-link and scoped-account-proof issuing/consuming
   operations are exposed only through deliberately permission-checked routes,
   with authorized real email/SMS transport evidence; no public issue route or
   external provider certification is provided by these tests.
5. The latest production-targeted full CI, browser, provider and release
   acceptance gates pass, or are explicitly exempted by authorized owners.

**Tracker state is intentionally `DB-004.done=false`.** A green technical
coverage figure is not permission to enable legacy bearer tokens, bypass
tenant checks, or invent retrospective owner approvals.

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
