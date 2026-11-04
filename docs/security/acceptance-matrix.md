# vNext Security — Adversarial Acceptance Matrix and Release Gates

**Purpose:** This document tells implementers and reviewers **what to prove** for every security boundary. It is a test and evidence specification, not a report of tests already run and **not another active status tracker**. Use [the 493-control catalogue](control-catalog.md) for requirements, [the execution program](README.md) for sequencing, and [docs/tracker.json](../tracker.json) for all live ownership and status. Existing audit: [2026-11-04 findings](../audit/security/2026-11-04-auth-authorization-tenant-hardening.md).

## Test principle and pass/fail semantics

Every protected operation has at least one permitted scenario and a negative adversarial scenario for **tenant, selected role, resource/object owner, field, authentication freshness, lifecycle state and concurrent revocation** as applicable. Do not count a negative test as passing only because the API returns 401/403/404; prove **no unauthorized side effects** in the database, queue, storage, notifications, audit metadata and provider calls.

- Denied reads: no private fields, identity hints, row counts, search facets, timing-based existence hints when sensitive, pre-signed URLs or cached previous-tenant data.
- Denied writes: zero mutated rows, grades, assignments, role records, grants, messages, exports, queued jobs, emails, webhook dispatches, audit misattribution or uploaded objects.
- Denied bulk operations: cannot include foreign IDs, nested records, relationship replacements, forged parent IDs or unrecognized sensitive fields; do not partially apply an unauthorized subset unless semantics explicitly define fully audited atomic behavior.
- For genuinely public endpoints, document allowed anonymous fields and enforce that public scope; “no direct session check” by itself is **not** a vulnerability, and a session function name by itself is **not** proof of security.
- On unavailable identity/DB/policy dependencies, fail **closed** rather than falling back to broad privileges.
- Run on disposable test identities and data with an explicitly authorized environment. Do not direct attack cases at production or live college/student records.

## Fixture graph — create once, reuse across suites

```text
Organization O1
  College A (active)
    Learner A1 and Learner A2 (distinct owners, same college)
    Faculty F1 -> Section S1 -> A1 enrolled; A2 not assigned
    Mentor M1 -> explicit A1/cohort grant; no A2 grant
    TPO T1 -> placement resources in College A only
    College Admin C1 -> College A only
    Course X / private lesson / assignment / submission / quiz / score / project /
    placement job / candidate profile / resume / certificate / notification / export / file
  College B (active)
    Learner B1; Faculty F2; TPO T2; College Admin C2; unrelated resources
Organization O2
  College C (active) with Learner C1 and separate data
Company R1
  Recruiter R1-user; active explicit grant to College A only (later revoke/expire)
Company R2
  Recruiter R2-user; no authorization to College A/B
Platform
  Super Admin SA1 with elevated platform assignment
Special actors
  Multi-role U1 = Learner + College Admin in College A, Learner role selected
  Multi-membership U2 = Learner in A and B, A currently selected
  Suspended/removed/expired/archived tenants, users, grants and sessions
Service actors
  Scheduler / outbound dispatch / integration callback / storage converter
```

Write fixture factories and cleanup so tenant identity, resource ancestry, grants and timestamps are explicit, reproducible and referentially valid. Do not reuse elevated DB test accounts for RLS acceptance. Use independent tenant and same-tenant object IDs whose formats are valid; invalid UUID rejection is not a BOLA test.

## Account-by-account scope contracts

| Account or principal | Authorized positive case | Mandatory negative case |
|---|---|---|
| **Learner** | Own enrollment, own released lessons, own submissions and scores | Another learner's private content (same college or other college), early question/answer release, forged attempt owner |
| **Faculty** | Assigned sections, learners, material and grade actions within granted teaching scope | Same-college unassigned learners/sections; grade override outside assignment; cross-college records |
| **Mentor** | Explicitly assigned learners/cohorts/projects | Unassigned learner/project, another mentor's private notes, removed cohort grant |
| **TPO** | Own college's authorized placement records, postings and offers | Another college's candidates, posting, shortlist, exports or placement administration |
| **Recruiter** | Verified company identity and active college/company relationship grant, with candidate eligibility/consent | Foreign company, expired/revoked/forged college grant, unshared candidate resume/profile, cross-company application |
| **College Admin** | Explicit college administration within granted scope | Another college/organization, unauthorized role grant, self-promotion, user data outside approved administrative purpose |
| **Super Admin** | Explicitly elevated, recent-authenticated platform operation with audit evidence | Ordinary Learner/college workspace silently inheriting platform authority; stale MFA; unapproved cross-tenant bulk access |

Also test **same actor, multiple roles/memberships**: selected Learner must not gain College Admin or Super Admin powers merely because those roles exist in persisted state. Switching a workspace must force live authorization. `SUPER_ADMIN` is a separate system authority, and recruiter company–college grants are not normal college memberships.

## Cross-boundary scenario families

| Scenario family | Required negatives | Primary catalogue |
|---|---|---|
| Organization and college isolation | O1/A tries O1/B and O2/C; valid foreign IDs in GET/POST/PATCH/PUT/DELETE; no enumeration, aggregate, autocomplete or export leaks | SEC-05, 07, 08 |
| Same-college horizontal access | Learner A1 requests A2's submissions, quiz answers, certificates, private project files, grades and notifications | SEC-03, 04, 05, 14 |
| Relationship-based boundaries | F1 asks for A2's grades; M1 reads an unassigned learner; TPO from A edits B; recruiter R2 views R1's shared candidates | SEC-03, 04, 14 |
| Role switching/escalation | Forged role cookie/header, ambiguous selection, stale role, admin+learner combination, platform context contamination, self/peer promotion | SEC-01, 02, 03, 26 |
| Membership and grant lifecycle | Concurrent suspension/removal with read/write; tenant disabled; recruiter grant expires while job in flight; logout/all-device revocation | SEC-02, 03, 05, 13, 15, 16 |
| Tenant-aware database relations | Child points to another tenant's parent; update foreign key across tenants; inconsistent org/college ancestry; bulk upsert | SEC-05, 06, 07 |
| Assessment integrity | Question visibility before release; attempt count/time bypass; forged score; unauthorized grade or certificate issuance | SEC-08, 13, 14 |
| Storage and downloads | Valid foreign signed URL, reused expired link, private bucket read, archive traversal/zip bomb, dangerous preview | SEC-10, 11, 12 |
| Search/cache/reporting | Cache key collision across tenants; pagination/filters/counts; aggregate reporting; delayed report job after revocation | SEC-05, 08, 10, 16 |
| Webhooks and integrations | Bad signature/timestamp, replay event, wrong tenant/company resource, forged provider response, SSRF/internal target | SEC-09, 15 |
| Workers and queues | Forged tenant in payload, scheduler overprivilege, revoked permission at execution time, duplicate replay, DLQ visibility | SEC-05, 15, 16 |
| Frontend/browser security | Stored/reflected/DOM XSS, rich-text sanitization, CSRF, CORS/Host/proxy trust, unsafe caches, clickjacking | SEC-08, 12 |
| Secrets and incident containment | Known exposed token rejected after rotation; scanning of history/artifacts; compromised service identity isolation | SEC-09, 18, 19, 20 |
| Failure and recovery | DB/policy dependency unavailable => deny; restore doesn't revive revoked credentials; emergency disablement; immutable backup recovery | SEC-17, 19, 20, 21 |
| Privacy and approvals | Candidate opted out; unauthorized bulk PII export; missing retention; single actor self-approving a critical action | SEC-10, 13, 22, 26 |

## The 1,322-method API authorization review

**Historical census, not a current measurement:** The existing dated audit recorded **1,001 route files / 1,322 exported HTTP methods**. It observed 143 methods without direct session-call evidence and 36 unsafe methods without a direct origin-check call; that is a priority list, not confirmed vulnerability count. A fresh head must regenerate the count and each method's source evidence.

For **every single exported method**, the review record must contain:

| Field | Required value |
|---|---|
| Route and HTTP method | Concrete code location and exported handler |
| Classification | Anonymous/public, authenticated user, privileged, signed worker, webhook, health/internal |
| Identity/session | Validated principal source, cookie/token signature/session state, effective role and host restrictions |
| Permission contract | Exact action/capability and server decision function; why this endpoint is legitimately public if exempt |
| Tenant and resource | Trusted persisted target resolver, college/organization lineage and relationship/owner predicates |
| Input and output | Strict schema; security-sensitive fields; reject unknown keys; safe minimum response fields |
| Mutation and CSRF | Transactional live reauthorization, concurrency/revocation race behavior; Origin/CSRF method appropriate to auth style |
| Abuse limits | Body, pagination, batch, export, cost and rate constraints |
| Downstream effects | SQL, file access, cache, queue, webhook, email, report, signed link and audit event |
| Evidence | Exact SHA, positive test, foreign-tenant negative, same-tenant negative if applicable, expected side effects and peer review |
| Decision | Reviewed/needs remediation with linked canonical tracker item; no “safe” from static regex alone |

Enforce CI failure for **new** unclassified methods. Work down existing methods by high-risk route groups (admin/role, learner grades, assessment content, placements/recruiters, exports, storage, cross-tenant administration), ensuring complete eventual census and runtime negative tests. An endpoint with a valid role guard but no object check remains **unverified**.

## PostgreSQL RLS and least privilege — executable gate

First collect the authorized **read-only catalogue**, privately: `current_user` and inherited roles, owners, superuser and `BYPASSRLS`, schema/table/sequence/function grants, `pg_policies`, `relrowsecurity`, `relforcerowsecurity`, unsafe privileged function ownership/`search_path`. In the repo the existing audit mentions `scripts/security/pg-rls-readonly-audit.mjs` and `scripts/sql/vnext-readonly-integrity.sql`; check their current presence/behavior before using.

For each **eligible** tenant/user-owned table, require:

1. Documented trustworthy tenant ancestry (direct column or parent join), shared/global exceptions and cross-tenant administrative purpose.
2. Tested `USING` and `WITH CHECK` under a restricted app runtime identity, for SELECT, INSERT, UPDATE and DELETE.
3. Tests for empty, invalid, stale, switched and wrong tenant/actor context plus owner/role/BYPASSRLS edge cases.
4. Verification that connection pooling, transactions, retries and error paths cannot leak or reuse tenant context.
5. Denial of cross-tenant foreign-key attachment, mass assignment and tenant ownership transfer.
6. Separate authorized migration/worker identities; no unnecessary runtime DDL, owner or bypass grants.
7. Migration and data compatibility; query plans/performance; incremental deployment and rollback evidence.
8. Runtime deployment proof: SQL catalog and effective grants **at deployment**, not merely a migration file in source.

Do not blindly `ENABLE ROW LEVEL SECURITY` everywhere; doing so without an app principal/context and coverage plan can break valid behavior or offer false protection.

## Fresh authentication and privileged mutations

For sensitive actions (platform/system roles, college/role administration, factor/contact changes, credential rotation, private mass exports, grants, security configuration, destructive tenant changes):

- Require recent **server-recorded** authentication/step-up with a policy-specific TTL and phishing-resistant MFA when applicable.
- Reject stale, forged, replayed, disabled or already-revoked sessions, factor removal without recent proof and downgrade through recovery.
- Recheck live membership/role/tenant state **inside** protected mutations.
- Distinguish already implemented fresh-auth guards from untested operations by method inventory; one protected route does not cover every role mutation.
- Log actor, approval and request correlation without storing OTPs or raw keys.

## Test execution and release enforcement

Minimum critical CI suites should cover:

- Auth/session/MFA/recovery, permission policy and role switching with negative cases.
- PostgreSQL 17 or supported version migrations, tenant/authorization integrations, concurrency races, RLS with restricted role, selected DDL/grants drift.
- Full generated API-method classification, dangerous-field rejection, CSRF/schema/body/pagination controls.
- Private storage/signed URL, files, webhook signing/replay, job reauthorization, cache/report/export isolation.
- Secure SDLC: typecheck, lint/build, secret history scanning, SCA/SAST and dependency/Action/IaC supply-chain checks.
- A protected `main` release gate with **enforced** required checks and review rules, not a passive green workflow.

For release acceptance, also verify staging/live runtime settings, restricted database role, private provider-side token revocation, WAF/network deployment config, backup restoration, monitoring/alerts, security incident escalation and independent source-assisted penetration testing.

## Evidence packet — minimum form

For every critical control bundle attach to **the canonical tracker**, not this document:

```text
Control IDs:
Scope: API method(s) / DB table(s) / resource(s) / integration(s)
Threat/asset/tenant relationships:
Repository and exact commit SHA:
Implementation file(s):
Test name(s), command(s), runner, exit result, CI/job URL:
Positive actor/resource scenario:
Negative cross-org/cross-college scenario:
Negative same-college foreign user/role scenario:
Revocation/concurrency/zero-side-effect proof:
Actual restricted PostgreSQL role and RLS-policy evidence (reference to protected storage):
Cloud/secret/integration evidence location (reference only):
Code owner and independent reviewer:
Affected release / rollout / rollback procedure:
Known residual risks and explicit exceptions with expiry:
Acceptance decision and timestamp:
```

Evidence levels: planned → authored → run on an identified SHA → deployed config verified → independently reviewed → monitored/operationally sustained. Only claim the level that genuinely occurred. Never paste secret material or real row-level personal data into a pull request.

## Final no-go conditions

Stop release when any critical cross-tenant, horizontal access, privilege escalation, production DB identity/RLS, active exposed secret, auth-recovery bypass, unsafe privileged export or protected CI/deployment boundary remains **unverified or broken**. No broad “banking-grade secure” claim is warranted by a checklist alone. Exact acceptance depends on source, executed adversarial tests, actual deployed configuration, operational response and independent review.

Detailed original requirement wording remains in [the full archived blueprint](../audit/security/2026-11-04-maximum-security-blueprint-source.md); any catalog item not explicitly covered by this matrix still requires individual acceptance evidence.