# Threat models for the major workflows, including the malicious valid user (SEC-13-001, SEC-13-002)

Written 2026-11-08, needs review. For each workflow: the asset, the hostile actor who already holds a valid account, the attack, and the control that stops it (named so a reviewer can check it).

| Workflow | Hostile valid user | Attack | Stopped by |
|---|---|---|---|
| Sign-in | Anyone with a phone or email | Guess codes, flood sends, enumerate accounts | Per-contact, per-address and per-challenge budgets, lockout, shared rate limits, tripwire `login_probing`; account enumeration through the 404 on unknown contacts remains (owner decision) |
| Session | A signed-in user | Keep a session after being removed, reuse a stolen cookie | Status re-read from the database each request, server-side revocation, 5-day cap, 30-minute idle for Super Admin, `auth.new_device` |
| Tenant isolation | A learner or staff of college A | Read or change college B's rows by id, filter, join or aggregate | Forced row-level policies on 245 tables, actor-derived scope, 404 for foreign ids, id-walk tripwire |
| Role escalation | A faculty or admin | Grant themselves or a peer a stronger role, use two roles at once | One selected role per request, `membership.role.manage` re-checked inside the write, self-lockout guard, step-up |
| Learner records | Another learner in the same college | Read or change a peer's submissions, grades or profile | Owner checks in services, same-college probe (144 requests), grade history |
| Assessments | A learner | Read answers, retake past the limit, submit after the deadline, tamper with the score | Server-side scoring, attempt limit under an advisory lock, deadline and publication checks on the server clock |
| Placements | A learner, TPO, recruiter | See other candidates, forge a grant, skip a round | Relationship grants (ACTIVE, VERIFIED, unexpired), persisted actor re-check, round and status transitions in services |
| Files | Any uploader | Upload active content, read another's file, traverse paths | Type allowlist and magic bytes, opaque scope-prefixed keys, 5-minute signed links bound to college and owner, audited |
| Exports and imports | A staff user | Pull bulk personal data or poison an import | Step-up, `confirmed: true`, rate limits, `api.export` audit and the export tripwire |
| Machine routes | An internet caller | Call schedulers, forge inbound mail, replay a captured call | Per-route secret (constant time), no Origin or query, optional timestamp and nonce, signature on inbound mail, `internal.denied` audit |
| Super Admin | A stolen Super Admin session | Act across all colleges | Two-code sign-in, 30-minute idle, 4-hour college scope, step-up, audit; hardware-backed MFA is the deferred owner item |
| Audit trail | A privileged insider | Delete or edit evidence | Append-only trigger, runtime role cannot change rows, hash chain with a verifier, head only movable by the insert trigger |

Updated whenever a workflow or role is added (`secure-development-standard.md`, threat-modelling step).
