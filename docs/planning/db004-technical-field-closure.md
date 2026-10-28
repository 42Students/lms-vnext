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

## Release/security gates still NOT accepted after product decisions

**Product scope is resolved:** D01–D07 have approved requester-level dispositions,
and all 34 original-field retirements have corresponding requester disposition.
The application is **greenfield**: no production legacy records, tokens, identifiers
or timestamps will be imported. Source-schematic/behavior comparisons and
synthetic PostgreSQL witnesses remain required, but historical data-import,
source-ID migration, and migration-receipt demands are **NOT APPLICABLE**.
Nothing authorizes access to or deletion from the old production LMS.

This approval does **not** mean DB-004 has independent security/release
signatures. Keep `docs/tracker.json` DB-004 `done:false` until:

1. Required security/data-retention/release owners sign the seven formal
   decisions (the register deliberately distinguishes product disposition
   from formal `approvalStatus`).
2. The 34 requester-approved retirements receive independently evidenced
   final security/retention signoff; no blanket assertion that legacy
   production records have been erased or scanned.
3. The enabled email-link flow is approved and validated with an authorized
   sending template and application-bound issuing/consuming contract. Distinct
   learner/faculty role proof routes are already wired and tested.
4. Authorized provider send/receipt acceptance (or a specifically approved
   not-applicable exemption) and current-commit registered migration,
   browser, security, integration and release checks pass.

**Do not infer full DB-004 release from 195/195 technical fields, 7/7 product
choices or 34/34 requester retirement choices.**

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
