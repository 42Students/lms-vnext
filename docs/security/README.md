# 42LMS vNext — High-Assurance Security Program

**Established:** 2026-11-04  
**Applies to:** `42Students/lms-vnext`, all seven user account types, shared internal services, workers, infrastructure, production operations and third-party integrations.  
**Classification:** Security-sensitive engineering requirements. Do not put credentials, secrets, raw production row dumps, unredacted incident artifacts or exploit instructions in Git.  
**Status:** **Target architecture / execution guidance — NOT certification.** Code already contains meaningful controls. Specific implementation and testing status must be read from evidence at an identified revision, never inferred from this document.

## Read this first

1. [Original conversation and maximum-security blueprint, preserved unedited](../audit/security/2026-11-04-maximum-security-blueprint-source.md) — history, rationale, 26 domains, threat examples and release gates.
2. [493-ID security control catalogue](control-catalog.md) — item-by-item traceability: `SEC-01-001` through the relevant domain's final number. This is **requirements**, not a second task tracker.
3. [Security verification matrix and release gates](acceptance-matrix.md) — adversarial fixtures, seven-account access model, evidence format, and hard stop criteria.
4. [Existing source-level technical audit and remediation evidence](../audit/security/2026-11-04-auth-authorization-tenant-hardening.md) — observed code findings, commits, certain exact-SHA CI results, and limitations.
5. [Canonical execution tracker](../tracker.json) — **the sole active task/status tracker**. For each implementation slice, reference security control IDs and attach evidence to an existing appropriate canonical task or a properly reviewed new canonical task. Do not mark these Markdown pages as a parallel source of status truth.

The archive is a snapshot of a conversation on 2026-11-04; its statements about what was "currently" implemented or missing may age. The technical audit itself is explicitly incomplete and must not be marketed as penetration testing or production sign-off.

## North star and non-negotiable guarantees

Security is **an independently verifiable property of every operation**, not a login state or a hidden UI control.

- **Tenant isolation:** College A cannot read, infer, list, download, update, or indirectly expose College B's private records; the same applies across organizations, within a college between unrelated learners, and to storage, search, analytics and jobs.
- **Role isolation:** A principal acts under exactly the explicitly selected, live and permitted role, tenant and resource relationship for that request. Holding a second powerful role must not implicitly combine its privileges. The `SUPER_ADMIN` system context stays separate from the normal workspace.
- **Defense in depth:** Server policy + trusted target lookup + transactional authorization + database grants/RLS/integrity constraints + storage/worker boundaries + monitored audit signals. No single check, filter, session, or secret is assumed infallible.
- **Evidence-backed release:** Meaningful negative tests, real restricted PostgreSQL roles, live-configuration inspection, enforceable deployment gates, independent assessment and operational drills. A code commit, green source-pattern check or authored-but-unexecuted test is not closure.
- **Privacy and least privilege:** Student, academic, placement, recruiter and administrative data disclosed only for legitimate purpose, minimum fields, retention and authorized sharing.

**Aim:** adopt OWASP ASVS 5.0 L2 as an app-wide requirements baseline; apply appropriate L3 controls for high-risk functions, NIST SP 800-63B-4 identity guidance, OWASP API Security Top 10, NIST CSF 2.0 and OWASP SAMM. ISO 27001/SOC 2 are longer-term organizational assessment ambitions, **not certifications claimed here**. Relevant payment-security obligations must be separately scoped if payment-card data enters scope.

## Canonical authorization design contract

Every protected handler and asynchronous mutation must resolve and retain this chain:

```text
Verified identity + opaque active device session
    -> selected role and independently verified active college/organization/company grant
    -> explicit action/permission (RBAC)
    -> conditions: state, timing, context, privileged step-up (ABAC)
    -> persisted ownership/relationship: course, learner, cohort, project, employer, placement (ReBAC)
    -> transaction-safe live recheck + constrained app database principal + eligible RLS
    -> minimum necessary response / allowed mutation
    -> tamper-resistant, privacy-minimized security event where material
```

**Deny by default** when actor state, selected role, resource ancestry, grant, tenant, or required auth freshness is absent, ambiguous, expired, inactive or inconsistent. Resolve target ownership from trusted persisted data, not a browser-supplied UUID/tenant field. Recheck live memberships and grants inside the same protected write transaction; address concurrent revocation. An authorized page is not evidence of an authorized API request.

RBAC alone is insufficient: `courses.read` does not authorize *every* course, and Faculty status does not authorize *every* learner. Request roles must not automatically union. Recruiter authorization must include live, explicit company–college grants and candidate sharing/eligibility conditions. Cross-college administration requires a deliberate, bounded privileged purpose and auditing, not a silent bypass.

### PostgreSQL decision rule

Do **not** enable blanket RLS merely to satisfy a checkbox. First inspect live app roles and table ownership; determine actual tenant ancestry; separate runtime/migration/worker principals; design a server-authenticated tenant execution context with safe pool transaction boundaries. The regular runtime must not own protected relations or have `BYPASSRLS`/superuser privileges. `USING` and `WITH CHECK` must be tested independently for SELECT/INSERT/UPDATE/DELETE using the same restricted runtime identity. A SQL session variable that arbitrary injected SQL can change is **not** a stand-alone security principal. Use phased domain rollouts, performance checks and reversible migration plans.

## Ten implementation programs

Program IDs `SP-01` through `SP-10` organize work; individual requirement IDs live in the catalogue. These are **execution groupings, not separate tracker tickets**.

| Program | Priority | Catalogue coverage | Completion contract |
|---|---|---|---|
| **SP-01 Identity and access** | P0/P1 | SEC-01, 02, 03, 04, 26 | Every role and action matrix verified, no blended roles, secure enrollment/recovery, strong admin MFA and step-up, revocation and device/session tests |
| **SP-02 Tenant and resource isolation** | P0 | SEC-05, 13, 14 | Complete tenant/resource ancestry inventory; every high-risk same-tenant and cross-tenant read/write has negative tests and no unauthorized side effects |
| **SP-03 PostgreSQL hardening** | P0 | SEC-06, 07 | Read-only production privilege/RLS audit, least-privilege runtime principals, reviewed policies and real-role adversarial SQL, pool-context safety, drift alarms |
| **SP-04 API security** | P0 | SEC-08, 12 | Every HTTP method classified and reviewed for action, object, tenant, fields, CSRF, validation, exports and asynchronous side effects; unclassified additions fail CI |
| **SP-05 Secrets and data protection** | P0/P1 | SEC-09, 10, 11, 22 | Active exposed keys rotated, history and artifacts scanned, encrypted/minimized data, private authorized uploads/downloads, consent and retention enforced |
| **SP-06 Integrations and workers** | P1 | SEC-15, 16 | Provider signatures, replay/SSRF limits, narrowly scoped workers, tenant-safe queues and revocation during deferred execution |
| **SP-07 Application infrastructure and supply chain** | P0/P1 | SEC-17, 18 | Network/deploy isolation, enforceable main protection, approved critical-file changes, scanning and reliable builds, guarded secrets/artifacts |
| **SP-08 Detection and operations** | P1/P2 | SEC-19, 20, 21 | Durable audit trail, tested alerts and incident response, emergency containment, restricted backups and measured restore drills |
| **SP-09 Verification and external review** | P0/P2 | SEC-23, 24 | Positive/negative suites run on trusted exact SHA and disposable PG; independent assessment and retest of material findings |
| **SP-10 Governance and continuous assurance** | P2 | SEC-25 and cross-cutting | Risk/exception ownership, access recertification, privacy and secure SDLC review, lasting policy/config drift checks |

Each program must enumerate all of its catalogue IDs while planning work. Do not close an entire program merely because one representative control passes.

## Security-first execution sequence

### Phase 0 — Establish the trustworthy baseline (P0, no risky live DB change)

1. Pin `main` SHA and reproduce selected auth, TypeScript, PostgreSQL, migration and route census checks; collect actual job names/results and failures.
2. Capture read-only, authorized runtime PostgreSQL catalog and privilege inventory. Store sensitive outputs in restricted evidence storage outside Git.
3. Build per-table trusted tenant ownership/ancestry and role/grant matrices, including all global/shared exceptions; explicitly classify unknowns.
4. Inventory active credentials, rotate suspected exposures with provider-side evidence and least-privilege replacement; verify old tokens disabled. Do not echo values.
5. Verify actual protection of `main`, review requirements and required checks with repository administrators. Workflow YAML alone is not branch enforcement.
6. Align/insert atomic scoped tasks into `docs/tracker.json` under its existing policy, with links to control IDs. Coordinate with other chats before touching overlapping code or the canonical tracker.

### Phase 1 — Close exploitable permission boundaries (P0)

1. Create reviewed permission-to-role/action matrix across all seven accounts and the platform/worker contexts.
2. Census every App Router exported method and its indirect services, classify legitimate public/webhook/worker exceptions, and require explicit object/tenant checks for each endpoint.
3. Prove selected-role isolation; forbid privileged fallback, self-promotion, stale grants and cross-role blending.
4. Resolve ownership relationships for nested resources, bulk endpoints, counts/autocomplete, reports/exports, joins and private files.
5. Add positive and negative integration fixtures for two organizations, two colleges, two unrelated users within one college, multiple memberships and revoked/archived entities.
6. Protect especially sensitive mutations with server-side recent authentication and phishing-resistant MFA for platform administrators where feasible; harden factor recovery.

### Phase 2 — Enforce independent data boundaries (P0)

1. Separate database runtime, migrations, scheduler, outbound workers and emergency operator identities; validate real least-privilege effective grants.
2. Stage transaction-scoped verified tenant database context, robust pooling invariants and protected-table RLS on an audited, bounded domain family at a time.
3. Exercise SQL SELECT/INSERT/UPDATE/DELETE plus foreign-key ancestry, owner/BYPASSRLS, missing/malformed context, privilege escalation, revocation races and backfill/migration compatibility.
4. Roll out only after compatibility, performance, observability, rollback and data-integrity acceptance.

### Phase 3 — Close remaining high-risk surfaces (P1)

Harden sessions, OTP/passkeys/recovery, anti-bot distributed limits, XSS/CSP/CSRF/CORS, file upload malware and preview isolation, signed downloads, private exports, webhook signatures and replay, integration grants, SSRF/outbound restrictions, background-worker identity, secrets rotation, encryption/data minimization and audit event integrity.

### Phase 4 — Establish durable assurance (P1/P2)

Make mandatory build/test/security/secret/dependency checks enforceable on `main`; validate cloud/network/IaC boundaries; implement alerts, runbooks, recovery tests and privacy operations; undertake independent pentesting with all account types and source-assisted RLS/RBAC review; fix/retest high-severity findings. Re-run critical negative suites whenever auth, identity, tenant, database, API, worker, storage or provider trust boundaries change.

## Exact-SHA source findings — historical baseline, not live certification

The existing audit (2026-11-04) reports fixes for selected-role persistence, tenant suspension/lifecycle rechecks, recruiter permission classification, role-cookie cleanup, live role-grant transactional checks and selected privileged reauth. It records certain focused auth and disposable PostgreSQL test successes at **specific commits**. It also reports:

- **1,001 API route files / 1,322 exported HTTP methods** at a prior census. Every method remains listed **unreviewed for full object/tenant access** in that audit. The 143 methods lacking a direct session call and 36 unsafe methods without direct origin check are *triage signals*, not confirmed exploitable flaws. Regenerate the census after source changes.
- **Live production RLS and effective app database privileges have not been certified.** Source-code presence or absence of policies is not enough.
- **Production branch protection was not proven enforceable** at audit time.
- Some selected CI suites were successful at exact SHAs, but passing one workflow does not prove the entire system safe.
- Full seven-account adversarial matrix, all method-level object checks, broad privileged step-up, independent penetration test, and operational security evidence remain release-significant until independently verified.

Do not propagate stale counts, release status, or a generic percentage as if they were live measurements.

## Working contract for parallel chats and engineers

- **Claim before coding:** Pin `main` SHA; identify precise canonical tracker scope and catalogue IDs. Avoid overlapping other agents' in-progress files. Keep new docs or tests in isolated paths where possible.
- **Threat model:** For each operation document actor, selected role, tenant, resource, authorization source, negative case, concurrent revocation, expected side effects, and failure semantics.
- **Implement:** Prefer a shared consistent guard/policy abstraction, but never trade away trusted object-specific lookup. Preserve migration immutability and correct already deployed state via registered forward migrations.
- **Test:** Execute exact-SHA positive and negative tests including race/no-side-effect checks; use a disposable PostgreSQL instance and the **restricted runtime role**, not just a database owner. Never test attacks on production data.
- **Verify:** Review live config/privileges separately; run targeted tests and full affected CI; do not weaken tests to gain green.
- **Record:** Add implementation links, commit SHA, test command, run URL, relevant DB configuration receipt stored securely, reviewer and exception/rollback details to the **canonical tracker**. Document residual risks rather than marking complete.

### Evidence levels

| Level | Meaning | May it close a security control alone? |
|---|---|---|
| Planned | A requirement and test strategy exist | **No** |
| Code authored/committed | Implementation or tests exist in source | **No** |
| Executed unit/integration | Identified SHA + real test result, negative assertions included | Only the exact scoped boundary |
| Staging/deployed config | Verified actual runtime role, RLS policy, infra, and rollout behavior | Required where relevant; only scoped boundary |
| Independent reviewed | Security reviewer or independent assessor confirms the critical path | Required for final material-risk sign-off |
| Operationally sustainable | Monitoring, response, rotation, restore and enforcement proven | Required for production security sign-off |

## 12 release-blocking acceptance gates

1. Verify effective live PostgreSQL RLS policies, grants and runtime identities.
2. Prove organization/college/user row ownership and independent tenant isolation at database and application boundaries.
3. Eliminate privileged default-role fallback and role blending.
4. Verify full role/permission/relationship matrix for all seven accounts.
5. Classify **100% of current exported HTTP methods** and prove object/resource/tenant enforcement.
6. Run cross-tenant and same-tenant unauthorized-object/adversarial tests, including zero side effects.
7. Require the chosen high-assurance MFA and fresh step-up for sensitive operations.
8. Verify session/factor/recovery expiry, revocation, hijacking and replay protections.
9. Audit secret exposure across current code/history/builds and prove provider-side revocations.
10. Verify file/storage, webhooks, queues, workers and exports independently.
11. Enforce security CI checks, protected releases and critical-change review on `main`.
12. Pass restricted-real-role PostgreSQL security suite, external critical-path review, and relevant response/restore drills.

The [acceptance matrix](acceptance-matrix.md) specifies test cases and proof. **Do not declare READY or report a fraction complete from the existence of these 12 lines.** The canonical tracker, actual CI logs, runtime evidence and independent sign-off determine status.

## Stop-ship rule

Release is blocked if any critical tenant isolation, privileged access, secret exposure, restricted-DB/RLS, authorization method, or enforcement assertion is unproven or has an unresolved critical exploit. High-severity residual risks need explicit owner, compensating controls and approved time-limited exception; some are unacceptable. Operational failure of production safety mechanisms also blocks release. A claimed “banking-grade” or certified label is prohibited without applicable independently validated assurance.

## Changes to this document

Keep stable control IDs in `control-catalog.md`. When adding controls, append IDs without renumbering. Use this document for **design and working method**, [the existing audit](../audit/security/2026-11-04-auth-authorization-tenant-hardening.md) for dated findings, and `docs/tracker.json` for sole live ownership and completion state. Update evidence and applicability with each material release.