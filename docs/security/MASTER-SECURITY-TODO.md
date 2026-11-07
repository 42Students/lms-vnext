# MASTER SECURITY TODO (ask me: "master security todo")

Generated 2026-11-07 from `docs/tracker.json` (the only status source) and `control-catalog.md`. Regenerate with `node scratch/gen-master-todo.cjs` (copy kept at `scripts/security/gen-master-todo.cjs`). A box is ticked only when the tracker says VERIFIED: test proof, deployed proof and an independent reviewer.

Totals: UNASSESSED 448, PARTIAL_EVIDENCE 38, IMPLEMENTED_UNVERIFIED 6, GAP_CONFIRMED 1. Release sign-off: NOT approved.

## Work order

1. Close the route layer (done 2026-11-07): every API route on the central wrapper.
2. Server actions gated by guardAction + guard rule (done 2026-11-07); proxy reviewed; health/ready left outside on purpose (see architecture doc).
3. Independent audit of the central layer (`audit-brief-2026-11-07.md`), fix findings.
4. Assess the unassessed controls, group by group, starting with SEC-03, 05, 06, 08 (access, tenant, RLS, API).
5. Owner-gated: dev switches (tenant scope, shared store, RLS), credential rotation, branch protection and second code owner (SEC-18-002, SEC-18-004), pen test (SEC-24).

## Summary by group

| Group | Title | Controls | Verified | Assessed | Unassessed |
|---|---|---|---|---|---|
| SEC-01 | Authentication and identity security | 18 | 0 | 0 | 18 |
| SEC-02 | Session and device security | 16 | 0 | 1 | 15 |
| SEC-03 | RBAC — Role-Based Access Control | 27 | 0 | 4 | 23 |
| SEC-04 | Role-by-role scope model | 8 | 0 | 0 | 8 |
| SEC-05 | Multi-tenant isolation | 23 | 0 | 6 | 17 |
| SEC-06 | PostgreSQL Row-Level Security | 26 | 0 | 4 | 22 |
| SEC-07 | Database privilege and integrity security | 19 | 0 | 1 | 18 |
| SEC-08 | API authorization and object-level security | 24 | 0 | 3 | 21 |
| SEC-09 | Secrets, API keys, and cryptographic security | 18 | 0 | 0 | 18 |
| SEC-10 | Encryption and sensitive data protection | 16 | 0 | 1 | 15 |
| SEC-11 | File uploads, documents, and storage | 20 | 0 | 2 | 18 |
| SEC-12 | Browser and frontend security | 19 | 0 | 2 | 17 |
| SEC-13 | Application and business-logic security | 18 | 0 | 0 | 18 |
| SEC-14 | LMS-specific attack scenarios | 24 | 0 | 4 | 20 |
| SEC-15 | Integrations, webhooks, and third-party services | 17 | 0 | 1 | 16 |
| SEC-16 | Background jobs, queues, and internal services | 15 | 0 | 0 | 15 |
| SEC-17 | Cloud, network, and infrastructure security | 23 | 0 | 0 | 23 |
| SEC-18 | Secure development and software supply chain | 21 | 0 | 9 | 12 |
| SEC-19 | Security logging, audit trails, and detection | 21 | 0 | 0 | 21 |
| SEC-20 | Incident response and breach containment | 19 | 0 | 0 | 19 |
| SEC-21 | Backup, disaster recovery, and resilience | 15 | 0 | 0 | 15 |
| SEC-22 | Privacy and data governance | 15 | 0 | 0 | 15 |
| SEC-23 | Automated security testing | 25 | 0 | 4 | 21 |
| SEC-24 | Independent security testing | 14 | 0 | 0 | 14 |
| SEC-25 | Security governance and organizational controls | 16 | 0 | 1 | 15 |
| SEC-26 | Advanced controls for particularly sensitive operations | 16 | 0 | 2 | 14 |

## Every control, by group

`[ ]` open. State in brackets. Assessed controls show the next proof needed.

### SEC-01 - Authentication and identity security

- [ ] **SEC-01-001** [UNASSESSED] Maintain one authoritative internal user identity independent of email addresses, phone numbers, and legacy IDs.
- [ ] **SEC-01-002** [UNASSESSED] Enforce verified ownership of login email and phone numbers.
- [ ] **SEC-01-003** [UNASSESSED] Prevent account enumeration through login, recovery, and registration responses.
- [ ] **SEC-01-004** [UNASSESSED] Introduce passkeys/WebAuthn for strong authentication.
- [ ] **SEC-01-005** [UNASSESSED] Require phishing-resistant MFA for Super Admin accounts.
- [ ] **SEC-01-006** [UNASSESSED] Require strong MFA for College Admin and other privileged accounts.
- [ ] **SEC-01-007** [UNASSESSED] Enforce secure authenticator enrollment, replacement, removal, and recovery.
- [ ] **SEC-01-008** [UNASSESSED] Require recent authentication before adding or replacing an authenticator.
- [ ] **SEC-01-009** [UNASSESSED] Introduce risk-based authentication for suspicious sign-ins.
- [ ] **SEC-01-010** [UNASSESSED] Protect against credential stuffing, OTP guessing, and authentication flooding.
- [ ] **SEC-01-011** [UNASSESSED] Use distributed rate limits, not exclusively per-instance counters.
- [ ] **SEC-01-012** [UNASSESSED] Apply per-account, per-device, per-network, and global abuse limits.
- [ ] **SEC-01-013** [UNASSESSED] Prevent OTP replay and enforce atomic, single-use verification.
- [ ] **SEC-01-014** [UNASSESSED] Ensure failed authentication cannot inadvertently activate sessions.
- [ ] **SEC-01-015** [UNASSESSED] Implement tamper-resistant identity and authentication audit events.
- [ ] **SEC-01-016** [UNASSESSED] Regularly test disabled users, archived tenants, and revoked memberships against authentication flows.
- [ ] **SEC-01-017** [UNASSESSED] Add managed enterprise SSO using OIDC or SAML where colleges require it.
- [ ] **SEC-01-018** [UNASSESSED] Implement secure SSO account linking and protection against identity confusion.

### SEC-02 - Session and device security

- [ ] **SEC-02-013** [PARTIAL_EVIDENCE] Require fresh step-up authentication for sensitive actions.
  - Next proof: Implement independent phishing-resistant step-up challenge and recovery UX; cover all privileged operations and production sessions.
- [ ] **SEC-02-001** [UNASSESSED] Use opaque, unpredictable, server-revocable session identifiers.
- [ ] **SEC-02-002** [UNASSESSED] Store only cryptographic digests of session credentials.
- [ ] **SEC-02-003** [UNASSESSED] Keep session cookies `HttpOnly`, `Secure`, and appropriately `SameSite` restricted.
- [ ] **SEC-02-004** [UNASSESSED] Add inactivity timeouts as well as absolute session expiration.
- [ ] **SEC-02-005** [UNASSESSED] Enforce shorter privileged-session lifetimes.
- [ ] **SEC-02-006** [UNASSESSED] Rotate session credentials after login, reauthentication, and significant privilege changes.
- [ ] **SEC-02-007** [UNASSESSED] Invalidate or restrict sessions after account suspension.
- [ ] **SEC-02-008** [UNASSESSED] Revoke affected sessions immediately following role or membership removal.
- [ ] **SEC-02-009** [UNASSESSED] Implement logout from all devices.
- [ ] **SEC-02-010** [UNASSESSED] Provide device/session visibility to account owners.
- [ ] **SEC-02-011** [UNASSESSED] Detect suspicious simultaneous sessions and unusual session behavior.
- [ ] **SEC-02-012** [UNASSESSED] Protect against session fixation and replay.
- [ ] **SEC-02-014** [UNASSESSED] Prevent cached privileged information from surviving logout or account switching.
- [ ] **SEC-02-015** [UNASSESSED] Separate normal college workspaces from privileged platform administration sessions.
- [ ] **SEC-02-016** [UNASSESSED] Ensure every workspace and role switch triggers fresh server-side authorization.

### SEC-03 - RBAC — Role-Based Access Control

- [ ] **SEC-03-015** [PARTIAL_EVIDENCE] Check that role assignments themselves were granted by an authorized actor.
  - Next proof: Prove every system, college, company and delegated grant uses persisted actor permission and row-lock negative tests.
- [ ] **SEC-03-016** [PARTIAL_EVIDENCE] Define who can grant, revoke, delegate, and transfer each role.
  - Next proof: Verify full grant/revoke/delegation matrix for every membership/system/recruiter role and concurrency.
- [ ] **SEC-03-019** [PARTIAL_EVIDENCE] Require elevated authorization for changing roles or permissions.
  - Next proof: Validate production-grade independent step-up, per-role server policy and revocation-aware SQL on the actual DB principal.
- [ ] **SEC-03-026** [PARTIAL_EVIDENCE] Test every unauthorized role/action combination.
  - Next proof: Exhaustively test all seven accounts and every role/resource/action combination with persisted tenant data.
- [ ] **SEC-03-001** [UNASSESSED] RBAC: What is this role allowed to do?
- [ ] **SEC-03-002** [UNASSESSED] ABAC: Under which conditions can it do that?
- [ ] **SEC-03-003** [UNASSESSED] Relationship authorization: Does this user actually have access to this specific course, learner, project, company, or college?
- [ ] **SEC-03-004** [UNASSESSED] Define a complete central permission catalogue.
- [ ] **SEC-03-005** [UNASSESSED] Define explicit role-to-permission assignments.
- [ ] **SEC-03-006** [UNASSESSED] Make every permission deny by default.
- [ ] **SEC-03-007** [UNASSESSED] Enforce permissions on the server, never only through UI visibility.
- [ ] **SEC-03-008** [UNASSESSED] Prevent conflicting roles from automatically combining their privileges.
- [ ] **SEC-03-009** [UNASSESSED] For users holding multiple roles, require explicit selection before entering privileged roles.
- [ ] **SEC-03-010** [UNASSESSED] Remove the current tendency to fall back to the highest-priority role when no valid selection exists.
- [ ] **SEC-03-011** [UNASSESSED] Keep Super Admin privileges isolated from ordinary membership sessions.
- [ ] **SEC-03-012** [UNASSESSED] Create a single reusable policy-decision interface.
- [ ] **SEC-03-013** [UNASSESSED] Separate permission decisions from resource discovery and trusted ownership resolution.
- [ ] **SEC-03-014** [UNASSESSED] Evaluate college, organization, resource, ownership, assignment, and grant relationships.
- [ ] **SEC-03-017** [UNASSESSED] Prevent self-promotion and unauthorized peer promotion.
- [ ] **SEC-03-018** [UNASSESSED] Prevent privilege escalation through bulk operations.
- [ ] **SEC-03-020** [UNASSESSED] Enforce immediate revocation of sensitive permissions.
- [ ] **SEC-03-021** [UNASSESSED] Prevent role creation or editing from bypassing the canonical permission catalogue.
- [ ] **SEC-03-022** [UNASSESSED] Implement separation of duties for especially sensitive operations.
- [ ] **SEC-03-023** [UNASSESSED] Reevaluate role authorization at the point of protected database writes.
- [ ] **SEC-03-024** [UNASSESSED] Verify the role actually selected by the user remains persisted and active.
- [ ] **SEC-03-025** [UNASSESSED] Maintain audit trails for every role and permission change.
- [ ] **SEC-03-027** [UNASSESSED] Make additions to the role and permission model require security review.

### SEC-04 - Role-by-role scope model

- [ ] **SEC-04-001** [UNASSESSED] Role: Learner — Own data, own enrollments, authorized lessons and assignments
- [ ] **SEC-04-002** [UNASSESSED] Role: Faculty — Assigned classes, deliveries, learners, and assessments
- [ ] **SEC-04-003** [UNASSESSED] Role: Mentor — Explicitly assigned learners, cohorts, and permitted mentoring resources
- [ ] **SEC-04-004** [UNASSESSED] Role: TPO — Own college's authorized placement resources
- [ ] **SEC-04-005** [UNASSESSED] Role: Recruiter — Verified company relationships, explicit college grants, permitted placement operations
- [ ] **SEC-04-006** [UNASSESSED] Role: College Admin — Authorized administrative resources within assigned college
- [ ] **SEC-04-007** [UNASSESSED] Role: Super Admin — Explicit platform administrative privileges, with independent step-up and auditing
- [ ] **SEC-04-008** [UNASSESSED] Deny horizontal access: one user may not view another user's private records solely because both are in the same college.

### SEC-05 - Multi-tenant isolation

- [ ] **SEC-05-005** [PARTIAL_EVIDENCE] Verify every object belongs to the authorized tenant.
  - Next proof: Enumerate every object-serving API and storage boundary; verify authoritative tenant ancestry and same-tenant object ownership with disposable PostgreSQL adversarial tests.
- [ ] **SEC-05-008** [PARTIAL_EVIDENCE] Prevent cross-tenant mutations even when the IDs are valid.
  - Next proof: Extend cross-tenant mutation negative tests to all route methods and background effects; prove zero database, queue, storage and notification side effects using valid foreign IDs.
- [ ] **SEC-05-014** [PARTIAL_EVIDENCE] Scope file storage and signed URLs by tenant and resource.
  - Next proof: Audit all storage namespaces, tenant-scoped grants and revocation
- [ ] **SEC-05-015** [PARTIAL_EVIDENCE] Scope notifications, reports, exports, and analytics.
  - Next proof: Review all counts, reports, exports, analytics and cache keys across tenants
- [ ] **SEC-05-020** [PARTIAL_EVIDENCE] Revoke access immediately when college membership ends.
  - Next proof: Prove immediate suspension, removal and role-revocation enforcement for every privileged writer and reader with real concurrent transactions and multi-replica sessions.
- [ ] **SEC-05-021** [PARTIAL_EVIDENCE] Verify college archival removes operational access.
  - Next proof: Prove archived college and organization cannot access all operational data, grants, host routing, scheduled jobs or exports using real restricted PostgreSQL and deployed configuration.
- [ ] **SEC-05-001** [UNASSESSED] Establish authoritative tenant ownership for every tenant-owned table.
- [ ] **SEC-05-002** [UNASSESSED] Define organization-level versus college-level tenancy.
- [ ] **SEC-05-003** [UNASSESSED] Make the active tenant server-validated.
- [ ] **SEC-05-004** [UNASSESSED] Reject tenant identity taken solely from request parameters or JSON.
- [ ] **SEC-05-006** [UNASSESSED] Verify nested objects preserve tenant ancestry.
- [ ] **SEC-05-007** [UNASSESSED] Prevent cross-tenant joins that expose unauthorized data.
- [ ] **SEC-05-009** [UNASSESSED] Prevent unauthorized access through filters, pagination, sorting, and aggregate queries.
- [ ] **SEC-05-010** [UNASSESSED] Prevent existence leaks through error messages and record counts.
- [ ] **SEC-05-011** [UNASSESSED] Scope search indexes to the same authorization rules.
- [ ] **SEC-05-012** [UNASSESSED] Scope caches and cache keys by tenant and, where necessary, user and role.
- [ ] **SEC-05-013** [UNASSESSED] Scope background jobs and queues by verified tenant.
- [ ] **SEC-05-016** [UNASSESSED] Enforce tenant isolation across WebSocket, polling, and real-time channels if used.
- [ ] **SEC-05-017** [UNASSESSED] Prevent a tenant-domain or Host-header mismatch from widening access.
- [ ] **SEC-05-018** [UNASSESSED] Test users with multiple college memberships.
- [ ] **SEC-05-019** [UNASSESSED] Test users who are administrators in one college and learners in another.
- [ ] **SEC-05-022** [UNASSESSED] Require explicit, time-limited authority for legitimate cross-college functions.
- [ ] **SEC-05-023** [UNASSESSED] Ensure backups, support tools, and administrative scripts respect tenant confidentiality.

### SEC-06 - PostgreSQL Row-Level Security

- [ ] **SEC-06-001** [PARTIAL_EVIDENCE] Inventory all database tables, owners, grants, and current RLS settings.
  - Next proof: Run authorized read-only catalogue against actual production application principal
- [ ] **SEC-06-004** [PARTIAL_EVIDENCE] Design and review RLS policies for each protected table.
  - Next proof: Review every production policy predicate and table lineage independently
- [ ] **SEC-06-006** [PARTIAL_EVIDENCE] Use `USING` policies to restrict which rows can be read or modified.
  - Next proof: Prove SELECT/UPDATE/DELETE for production-equivalent schema and actual runtime role
- [ ] **SEC-06-010** [PARTIAL_EVIDENCE] Ensure the ordinary app runtime cannot use `BYPASSRLS`.
  - Next proof: Inspect live runtime grant/ownership and prove BYPASSRLS absent
- [ ] **SEC-06-002** [UNASSESSED] Classify every table as tenant-owned, user-owned, globally shared, or internal infrastructure.
- [ ] **SEC-06-003** [UNASSESSED] Identify tables whose tenant ownership comes through a parent relationship.
- [ ] **SEC-06-005** [UNASSESSED] Enable RLS on eligible tenant and user data tables.
- [ ] **SEC-06-007** [UNASSESSED] Use `WITH CHECK` policies to prevent unauthorized inserted or updated rows.
- [ ] **SEC-06-008** [UNASSESSED] Verify behavior independently for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
- [ ] **SEC-06-009** [UNASSESSED] Use `FORCE ROW LEVEL SECURITY` wherever table-owner behavior requires it.
- [ ] **SEC-06-011** [UNASSESSED] Ensure the app runtime is not a superuser.
- [ ] **SEC-06-012** [UNASSESSED] Separate runtime ownership from migration ownership.
- [ ] **SEC-06-013** [UNASSESSED] Restrict elevated database functions and `SECURITY DEFINER` routines.
- [ ] **SEC-06-014** [UNASSESSED] Prevent unsafe `search_path` behavior in privileged functions.
- [ ] **SEC-06-015** [UNASSESSED] Define trustworthy tenant context for every protected transaction.
- [ ] **SEC-06-016** [UNASSESSED] Ensure connection pooling cannot carry tenant context from one request into another.
- [ ] **SEC-06-017** [UNASSESSED] Never trust an arbitrary client-provided tenant ID as database authority.
- [ ] **SEC-06-018** [UNASSESSED] Recognize that a client-writable PostgreSQL setting is not sufficient by itself to defend against arbitrary SQL execution or SQL injection.
- [ ] **SEC-06-019** [UNASSESSED] Test SQL-level attempts to read another tenant's rows.
- [ ] **SEC-06-020** [UNASSESSED] Test SQL-level attempts to modify another tenant's rows.
- [ ] **SEC-06-021** [UNASSESSED] Test inserts that reference another tenant's records.
- [ ] **SEC-06-022** [UNASSESSED] Test tenant-context absence and malformed context.
- [ ] **SEC-06-023** [UNASSESSED] Test ownership changes and tenant transfers.
- [ ] **SEC-06-024** [UNASSESSED] Test privileged workers and migration scripts separately.
- [ ] **SEC-06-025** [UNASSESSED] Verify query performance and policy behavior before production rollout.
- [ ] **SEC-06-026** [UNASSESSED] Roll out RLS incrementally with compatibility tests and rollback plans.

### SEC-07 - Database privilege and integrity security

- [ ] **SEC-07-019** [PARTIAL_EVIDENCE] Continuously detect database privilege and RLS-policy drift.
  - Next proof: Schedule and alert on authoritative production RLS/grant drift
- [ ] **SEC-07-001** [UNASSESSED] Create separate database identities for application runtime, migrations, scheduled jobs, external workers, and emergency administration.
- [ ] **SEC-07-002** [UNASSESSED] Grant only required schema, table, sequence, and function privileges.
- [ ] **SEC-07-003** [UNASSESSED] Remove unnecessary schema ownership and DDL privileges from application runtime.
- [ ] **SEC-07-004** [UNASSESSED] Remove dangerous default privileges.
- [ ] **SEC-07-005** [UNASSESSED] Restrict database network access to authorized workloads.
- [ ] **SEC-07-006** [UNASSESSED] Require encrypted database connections with certificate validation.
- [ ] **SEC-07-007** [UNASSESSED] Enforce tenant-aware foreign-key relationships.
- [ ] **SEC-07-008** [UNASSESSED] Use composite tenant-aware constraints where needed.
- [ ] **SEC-07-009** [UNASSESSED] Prevent child records from attaching to another tenant's parent.
- [ ] **SEC-07-010** [UNASSESSED] Define safe cascading-deletion behavior.
- [ ] **SEC-07-011** [UNASSESSED] Add integrity checks for membership, role, grant, and enrollment relationships.
- [ ] **SEC-07-012** [UNASSESSED] Enforce uniqueness under the correct tenant scope.
- [ ] **SEC-07-013** [UNASSESSED] Avoid raw SQL where reviewed query builders or parameterized SQL suffice.
- [ ] **SEC-07-014** [UNASSESSED] Audit all dynamic SQL.
- [ ] **SEC-07-015** [UNASSESSED] Prevent mass assignment and unsafe model updates.
- [ ] **SEC-07-016** [UNASSESSED] Apply strict transactional checks around security-sensitive writes.
- [ ] **SEC-07-017** [UNASSESSED] Handle concurrent role revocation and mutation races.
- [ ] **SEC-07-018** [UNASSESSED] Use migration checks, rollback procedures, and production-safe sequencing.

### SEC-08 - API authorization and object-level security

- [ ] **SEC-08-014** [PARTIAL_EVIDENCE] Enforce maximum pagination, batch, and export sizes.
  - Next proof: Audit every paginated, bulk and export operation for bounded memory and rate limits
- [ ] **SEC-08-019** [PARTIAL_EVIDENCE] Use consistent authorization failure semantics.
  - Next proof: Audit error semantics and leak prevention for all protected API methods
- [ ] **SEC-08-021** [PARTIAL_EVIDENCE] Protect less-obvious endpoints such as counts, autocomplete, previews, and download links.
  - Next proof: Audit all preview, counts, autocomplete, signed and download endpoints
- [ ] **SEC-08-001** [UNASSESSED] Inventory every API route and exported HTTP method.
- [ ] **SEC-08-002** [UNASSESSED] Classify every endpoint as public, authenticated, privileged, service-to-service, or webhook.
- [ ] **SEC-08-003** [UNASSESSED] Define required roles, permissions, and resource scopes.
- [ ] **SEC-08-004** [UNASSESSED] Require authentication on every nonpublic endpoint.
- [ ] **SEC-08-005** [UNASSESSED] Require explicit permission checks for every protected action.
- [ ] **SEC-08-006** [UNASSESSED] Require persisted resource ownership checks for every resource ID.
- [ ] **SEC-08-007** [UNASSESSED] Prevent broken object-level authorization (BOLA/IDOR).
- [ ] **SEC-08-008** [UNASSESSED] Prevent broken function-level authorization.
- [ ] **SEC-08-009** [UNASSESSED] Prevent unauthorized field-level reads and writes.
- [ ] **SEC-08-010** [UNASSESSED] Reject unsafe mass assignment.
- [ ] **SEC-08-011** [UNASSESSED] Validate inputs using strict schemas.
- [ ] **SEC-08-012** [UNASSESSED] Remove or reject unrecognized security-sensitive fields.
- [ ] **SEC-08-013** [UNASSESSED] Enforce maximum request body sizes.
- [ ] **SEC-08-015** [UNASSESSED] Apply rate limits and abuse controls per endpoint risk.
- [ ] **SEC-08-016** [UNASSESSED] Protect cookie-authenticated mutations against CSRF.
- [ ] **SEC-08-017** [UNASSESSED] Validate Origin/Host/proxy assumptions.
- [ ] **SEC-08-018** [UNASSESSED] Avoid leaking internal errors, SQL details, and secrets.
- [ ] **SEC-08-020** [UNASSESSED] Protect asynchronous export and report endpoints.
- [ ] **SEC-08-022** [UNASSESSED] Ensure authorization applies to background processing initiated by an API.
- [ ] **SEC-08-023** [UNASSESSED] Fail CI when a new route lacks security classification.
- [ ] **SEC-08-024** [UNASSESSED] Require negative tests for every sensitive API method.

### SEC-09 - Secrets, API keys, and cryptographic security

- [ ] **SEC-09-001** [UNASSESSED] Inventory every application secret, API key, database credential, webhook secret, and signing key.
- [ ] **SEC-09-002** [UNASSESSED] Establish clear ownership and purpose for each secret.
- [ ] **SEC-09-003** [UNASSESSED] Ensure no production secrets remain in source code, Git history, images, documentation, or test fixtures.
- [ ] **SEC-09-004** [UNASSESSED] Rotate every known or suspected exposed credential.
- [ ] **SEC-09-005** [UNASSESSED] Implement continuous secret scanning across commits and pull requests.
- [ ] **SEC-09-006** [UNASSESSED] Scan historical Git commits, not only the latest source tree.
- [ ] **SEC-09-007** [UNASSESSED] Use a managed secret store rather than application configuration files containing raw production secrets.
- [ ] **SEC-09-008** [UNASSESSED] Prefer workload identity and short-lived credentials over static keys.
- [ ] **SEC-09-009** [UNASSESSED] Use different credentials for development, staging, and production.
- [ ] **SEC-09-010** [UNASSESSED] Scope each third-party key to minimum required privileges.
- [ ] **SEC-09-011** [UNASSESSED] Apply expiration and regular rotation where supported.
- [ ] **SEC-09-012** [UNASSESSED] Support overlapping keys for safe zero-downtime rotation.
- [ ] **SEC-09-013** [UNASSESSED] Restrict access to production secrets by operator and service identity.
- [ ] **SEC-09-014** [UNASSESSED] Keep secrets out of request logs, exception logs, telemetry, and traces.
- [ ] **SEC-09-015** [UNASSESSED] Protect cryptographic keys with a managed KMS; consider HSM-backed controls for particularly sensitive signing operations.
- [ ] **SEC-09-016** [UNASSESSED] Use established, reviewed cryptographic libraries and algorithms.
- [ ] **SEC-09-017** [UNASSESSED] Manage encryption key versions and revocation.
- [ ] **SEC-09-018** [UNASSESSED] Define emergency key-revocation and compromised-credential procedures.

### SEC-10 - Encryption and sensitive data protection

- [ ] **SEC-10-012** [PARTIAL_EVIDENCE] Require elevated authorization for bulk personal-data exports.
  - Next proof: Validate strong privileged reauthentication, export approvals, audit and UX across all roles
- [ ] **SEC-10-001** [UNASSESSED] Enforce TLS for all external application traffic.
- [ ] **SEC-10-002** [UNASSESSED] Enforce TLS between internal services and databases where appropriate.
- [ ] **SEC-10-003** [UNASSESSED] Encrypt databases, storage buckets, and backups at rest.
- [ ] **SEC-10-004** [UNASSESSED] Apply field-level encryption to selected highly sensitive values when justified by the threat model.
- [ ] **SEC-10-005** [UNASSESSED] Classify student identity, contact, assessment, academic, placement, and employment information by sensitivity.
- [ ] **SEC-10-006** [UNASSESSED] Minimize data stored in the first place.
- [ ] **SEC-10-007** [UNASSESSED] Restrict personal data returned from APIs to explicitly required fields.
- [ ] **SEC-10-008** [UNASSESSED] Define approved data handling rules for each role.
- [ ] **SEC-10-009** [UNASSESSED] Prevent exposing sensitive data through error responses.
- [ ] **SEC-10-010** [UNASSESSED] Protect personal data in analytics and reporting systems.
- [ ] **SEC-10-011** [UNASSESSED] Use pseudonymization or aggregation for suitable analytics workloads.
- [ ] **SEC-10-013** [UNASSESSED] Prevent sensitive information from being included in browser-accessible application state unnecessarily.
- [ ] **SEC-10-014** [UNASSESSED] Prevent sensitive responses from being cached inappropriately.
- [ ] **SEC-10-015** [UNASSESSED] Test cryptographic key-loss and rotation procedures.
- [ ] **SEC-10-016** [UNASSESSED] Verify that development and test environments do not contain unprotected production student data.

### SEC-11 - File uploads, documents, and storage

- [ ] **SEC-11-003** [PARTIAL_EVIDENCE] Use short-lived signed download URLs when appropriate.
  - Next proof: Prove every storage access and expiry/revocation at actual provider boundary
- [ ] **SEC-11-005** [PARTIAL_EVIDENCE] Verify that signed URLs cannot be reused outside their intended scope.
  - Next proof: Prove non-transferability and storage expiry with provider-backed tests
- [ ] **SEC-11-001** [UNASSESSED] Keep private files in nonpublic storage buckets.
- [ ] **SEC-11-002** [UNASSESSED] Authorize each file against its owning tenant, user, and resource.
- [ ] **SEC-11-004** [UNASSESSED] Avoid long-lived publicly accessible document links.
- [ ] **SEC-11-006** [UNASSESSED] Use opaque storage keys, not user-controlled filesystem paths.
- [ ] **SEC-11-007** [UNASSESSED] Validate file types using content inspection rather than extensions alone.
- [ ] **SEC-11-008** [UNASSESSED] Scan uploaded files for malware.
- [ ] **SEC-11-009** [UNASSESSED] Reject executable or dangerous content not required by a workflow.
- [ ] **SEC-11-010** [UNASSESSED] Enforce file-size, file-count, and total-storage limits.
- [ ] **SEC-11-011** [UNASSESSED] Defend against archive bombs and decompression attacks.
- [ ] **SEC-11-012** [UNASSESSED] Sanitize filenames and downloadable metadata.
- [ ] **SEC-11-013** [UNASSESSED] Prevent path traversal.
- [ ] **SEC-11-014** [UNASSESSED] Prevent insecure direct access to another learner's submission.
- [ ] **SEC-11-015** [UNASSESSED] Isolate file conversion and preview workers.
- [ ] **SEC-11-016** [UNASSESSED] Use sandboxed processing for untrusted files and document conversions.
- [ ] **SEC-11-017** [UNASSESSED] Prevent dangerous HTML/SVG/PDF content from becoming an application-origin script execution path.
- [ ] **SEC-11-018** [UNASSESSED] Apply retention and deletion policies to submitted documents.
- [ ] **SEC-11-019** [UNASSESSED] Revoke access to shared documents when membership or permissions end.
- [ ] **SEC-11-020** [UNASSESSED] Audit bulk downloads and sensitive document access.

### SEC-12 - Browser and frontend security

- [ ] **SEC-12-010** [IMPLEMENTED_UNVERIFIED] Use appropriate HSTS and other security response headers.
  - Next proof: Fetch the headers from the deployed dev host and confirm they are served unchanged by the ingress
- [ ] **SEC-12-011** [IMPLEMENTED_UNVERIFIED] Restrict browser permissions through Permissions-Policy.
  - Next proof: Fetch the header from the deployed dev host and confirm no product feature needs a denied capability
- [ ] **SEC-12-001** [UNASSESSED] Implement a strict Content Security Policy.
- [ ] **SEC-12-002** [UNASSESSED] Remove avoidable `unsafe-inline` script allowances through a tested nonce/hash strategy.
- [ ] **SEC-12-003** [UNASSESSED] Prevent stored and reflected XSS.
- [ ] **SEC-12-004** [UNASSESSED] Sanitize rich-text course and assessment content.
- [ ] **SEC-12-005** [UNASSESSED] Treat Markdown, HTML, code previews, and embedded lesson content as untrusted.
- [ ] **SEC-12-006** [UNASSESSED] Protect against DOM-based XSS.
- [ ] **SEC-12-007** [UNASSESSED] Avoid dangerous HTML injection and unchecked rendering shortcuts.
- [ ] **SEC-12-008** [UNASSESSED] Implement protection against clickjacking.
- [ ] **SEC-12-009** [UNASSESSED] Configure secure frame and embedding rules.
- [ ] **SEC-12-012** [UNASSESSED] Restrict cross-origin access and credentialed CORS.
- [ ] **SEC-12-013** [UNASSESSED] Avoid broad wildcard CORS configurations.
- [ ] **SEC-12-014** [UNASSESSED] Prevent sensitive data from entering URLs and browser history.
- [ ] **SEC-12-015** [UNASSESSED] Audit browser storage for credentials and personal information.
- [ ] **SEC-12-016** [UNASSESSED] Ensure logout clears privileged local application state.
- [ ] **SEC-12-017** [UNASSESSED] Protect against cross-origin information leaks.
- [ ] **SEC-12-018** [UNASSESSED] Audit third-party scripts, analytics widgets, and embedded content.
- [ ] **SEC-12-019** [UNASSESSED] Verify that client-side checks never substitute for server-side authorization.

### SEC-13 - Application and business-logic security

- [ ] **SEC-13-001** [UNASSESSED] Create threat models for all major workflows.
- [ ] **SEC-13-002** [UNASSESSED] Model malicious users who have valid accounts.
- [ ] **SEC-13-003** [UNASSESSED] Enforce server-side state-machine transitions.
- [ ] **SEC-13-004** [UNASSESSED] Prevent unauthorized workflow skipping.
- [ ] **SEC-13-005** [UNASSESSED] Prevent duplicate actions and replayed mutations.
- [ ] **SEC-13-006** [UNASSESSED] Use idempotency keys where repeated requests can cause harmful effects.
- [ ] **SEC-13-007** [UNASSESSED] Protect concurrent writes against race conditions.
- [ ] **SEC-13-008** [UNASSESSED] Enforce optimistic or pessimistic concurrency control as appropriate.
- [ ] **SEC-13-009** [UNASSESSED] Prevent self-approval of privileged requests.
- [ ] **SEC-13-010** [UNASSESSED] Apply dual approval to particularly sensitive administrative operations.
- [ ] **SEC-13-011** [UNASSESSED] Prevent unauthorized changes to historical academic records.
- [ ] **SEC-13-012** [UNASSESSED] Protect published assessments, scores, and evaluations from unauthorized modification.
- [ ] **SEC-13-013** [UNASSESSED] Enforce submission ownership and permitted submission windows.
- [ ] **SEC-13-014** [UNASSESSED] Ensure withdrawn, expired, suspended, and archived entities cannot continue operating.
- [ ] **SEC-13-015** [UNASSESSED] Validate monetary or billing-related workflows if integrated into vNext.
- [ ] **SEC-13-016** [UNASSESSED] Review business logic for circumvention through bulk endpoints.
- [ ] **SEC-13-017** [UNASSESSED] Make security decisions deterministic and testable.
- [ ] **SEC-13-018** [UNASSESSED] Default to denial on inconsistent or missing security state.

### SEC-14 - LMS-specific attack scenarios

- [ ] **SEC-14-008** [PARTIAL_EVIDENCE] Module: Recruiter portal — Company impersonation, forged college grants, unauthorized candidate access
  - Next proof: Validate real recruiter company/college grants, target ownership, object-level candidate read restrictions, malicious invites and active revocation against PostgreSQL.
- [ ] **SEC-14-011** [PARTIAL_EVIDENCE] Module: College Admin — Changing another college's academic or administrative records
  - Next proof: Audit and adversarially test every College Admin action (profiles, academics, placements and exports), including active roles, foreign tenant IDs and concurrent privilege revocation.
- [ ] **SEC-14-020** [PARTIAL_EVIDENCE] Protect recruiter access to resumes, profiles, and placement decisions.
  - Next proof: Review recruiter search, profile reads, offers and all access modes
- [ ] **SEC-14-024** [PARTIAL_EVIDENCE] Test every bulk upload, import, approval, and export path.
  - Next proof: Enumerate and adversarially test every bulk upload, import, approval and export
- [ ] **SEC-14-001** [UNASSESSED] Module: Courses — Unauthorized enrollment, course edits, hidden content exposure
- [ ] **SEC-14-002** [UNASSESSED] Module: Lessons — Accessing paid or restricted lessons without entitlement
- [ ] **SEC-14-003** [UNASSESSED] Module: Assignments — Reading another learner's submissions or modifying grades
- [ ] **SEC-14-004** [UNASSESSED] Module: Quizzes — Accessing unreleased questions, manipulating attempts and scores
- [ ] **SEC-14-005** [UNASSESSED] Module: Exams — Answer leakage, impersonation, replay, bypassing time restrictions
- [ ] **SEC-14-006** [UNASSESSED] Module: Projects — Cross-team data exposure, forged approvals, unauthorized evaluations
- [ ] **SEC-14-007** [UNASSESSED] Module: Placements — Unauthorized student shortlist access, employer data exposure
- [ ] **SEC-14-009** [UNASSESSED] Module: Faculty — Modifying learners outside assigned course sections
- [ ] **SEC-14-010** [UNASSESSED] Module: Mentor — Accessing learners who are not assigned to the mentor
- [ ] **SEC-14-012** [UNASSESSED] Module: Super Admin — Platform privilege escalation and unrestricted unaudited access
- [ ] **SEC-14-013** [UNASSESSED] Protect assessment publication and release times.
- [ ] **SEC-14-014** [UNASSESSED] Prevent direct-answer API calls from exposing unreleased assessment material.
- [ ] **SEC-14-015** [UNASSESSED] Enforce per-learner attempt limits transactionally.
- [ ] **SEC-14-016** [UNASSESSED] Protect score calculation integrity.
- [ ] **SEC-14-017** [UNASSESSED] Make grade changes and overrides attributable and auditable.
- [ ] **SEC-14-018** [UNASSESSED] Prevent unauthorized certificate issuance or credential forgery.
- [ ] **SEC-14-019** [UNASSESSED] Use verifiable certificate identifiers and revocation status if certificates are issued.
- [ ] **SEC-14-021** [UNASSESSED] Enforce consent and eligibility before exposing learner profiles to recruiters.
- [ ] **SEC-14-022** [UNASSESSED] Check legitimate company-to-college relationships at the time of access.
- [ ] **SEC-14-023** [UNASSESSED] Prevent fraudulent attendance, assessment completion, and placement record updates.

### SEC-15 - Integrations, webhooks, and third-party services

- [ ] **SEC-15-010** [PARTIAL_EVIDENCE] Validate outbound destinations and defend against SSRF.
  - Next proof: Audit all outbound HTTP clients, DNS, redirects, credentials and egress policies
- [ ] **SEC-15-001** [UNASSESSED] Inventory every external provider and integration.
- [ ] **SEC-15-002** [UNASSESSED] Document the data shared with each provider.
- [ ] **SEC-15-003** [UNASSESSED] Use separate credentials for every provider and environment.
- [ ] **SEC-15-004** [UNASSESSED] Validate webhook signatures with provider-specific rules.
- [ ] **SEC-15-005** [UNASSESSED] Enforce timestamp and replay protection where supported.
- [ ] **SEC-15-006** [UNASSESSED] Verify webhook events against the expected organization and resource.
- [ ] **SEC-15-007** [UNASSESSED] Restrict webhook endpoint methods and payload sizes.
- [ ] **SEC-15-008** [UNASSESSED] Reject malformed or unexpected callback fields.
- [ ] **SEC-15-009** [UNASSESSED] Prevent callbacks from mutating another tenant's resources.
- [ ] **SEC-15-011** [UNASSESSED] Restrict requests to cloud metadata and internal network addresses.
- [ ] **SEC-15-012** [UNASSESSED] Add safe retry and idempotency behavior.
- [ ] **SEC-15-013** [UNASSESSED] Prevent untrusted provider responses from overriding authorization decisions.
- [ ] **SEC-15-014** [UNASSESSED] Encrypt integration tokens at rest.
- [ ] **SEC-15-015** [UNASSESSED] Revoke integration grants when tenant access ends.
- [ ] **SEC-15-016** [UNASSESSED] Log security-relevant integration failures without leaking secrets.
- [ ] **SEC-15-017** [UNASSESSED] Isolate compromised providers and support emergency disablement.

### SEC-16 - Background jobs, queues, and internal services

- [ ] **SEC-16-001** [UNASSESSED] Give workers independent service identities.
- [ ] **SEC-16-002** [UNASSESSED] Limit each worker to its required database and service permissions.
- [ ] **SEC-16-003** [UNASSESSED] Avoid giving queue workers automatic Super Admin-equivalent authority.
- [ ] **SEC-16-004** [UNASSESSED] Sign or authenticate internal job requests.
- [ ] **SEC-16-005** [UNASSESSED] Propagate verified tenant context into every job.
- [ ] **SEC-16-006** [UNASSESSED] Recheck authorization when delayed work executes.
- [ ] **SEC-16-007** [UNASSESSED] Handle revoked membership and expired grants before worker execution.
- [ ] **SEC-16-008** [UNASSESSED] Prevent job payload tampering and cross-tenant substitution.
- [ ] **SEC-16-009** [UNASSESSED] Validate messages at queue boundaries.
- [ ] **SEC-16-010** [UNASSESSED] Implement replay and duplicate-job protections.
- [ ] **SEC-16-011** [UNASSESSED] Use dead-letter queues and safe failure handling.
- [ ] **SEC-16-012** [UNASSESSED] Avoid disclosing sensitive job payloads through dashboards or logs.
- [ ] **SEC-16-013** [UNASSESSED] Restrict manual job triggering to authorized operators.
- [ ] **SEC-16-014** [UNASSESSED] Isolate scheduler, mail, storage, and analytics worker privileges.
- [ ] **SEC-16-015** [UNASSESSED] Audit emergency job reprocessing.

### SEC-17 - Cloud, network, and infrastructure security

- [ ] **SEC-17-001** [UNASSESSED] Keep production databases off the public internet.
- [ ] **SEC-17-002** [UNASSESSED] Restrict inbound network access.
- [ ] **SEC-17-003** [UNASSESSED] Restrict sensitive outbound connectivity.
- [ ] **SEC-17-004** [UNASSESSED] Apply least-privilege service identities.
- [ ] **SEC-17-005** [UNASSESSED] Use workload identity for cloud-to-cloud authentication where supported.
- [ ] **SEC-17-006** [UNASSESSED] Harden operating-system and runtime configurations.
- [ ] **SEC-17-007** [UNASSESSED] Keep container images minimal and patched.
- [ ] **SEC-17-008** [UNASSESSED] Use non-root application containers.
- [ ] **SEC-17-009** [UNASSESSED] Restrict filesystem and container privileges.
- [ ] **SEC-17-010** [UNASSESSED] Apply resource and process limits.
- [ ] **SEC-17-011** [UNASSESSED] Configure production-grade DDoS protection.
- [ ] **SEC-17-012** [UNASSESSED] Implement WAF rules and bot protections where appropriate.
- [ ] **SEC-17-013** [UNASSESSED] Verify load-balancer and reverse-proxy header trust.
- [ ] **SEC-17-014** [UNASSESSED] Enforce HTTPS and certificate lifecycle monitoring.
- [ ] **SEC-17-015** [UNASSESSED] Secure DNS and domain ownership.
- [ ] **SEC-17-016** [UNASSESSED] Protect production administration behind strong identity controls.
- [ ] **SEC-17-017** [UNASSESSED] Separate development, staging, and production environments.
- [ ] **SEC-17-018** [UNASSESSED] Define infrastructure using reviewed, version-controlled configuration.
- [ ] **SEC-17-019** [UNASSESSED] Detect infrastructure configuration drift.
- [ ] **SEC-17-020** [UNASSESSED] Run regular vulnerability and configuration scans.
- [ ] **SEC-17-021** [UNASSESSED] Restrict access to operational dashboards and monitoring systems.
- [ ] **SEC-17-022** [UNASSESSED] Remove unused services, ports, and development endpoints.
- [ ] **SEC-17-023** [UNASSESSED] Test service isolation when a workload is compromised.

### SEC-18 - Secure development and software supply chain

- [ ] **SEC-18-002** [GAP_CONFIRMED] Require passing security and correctness checks before merging.
  - Next proof: Repository administrator must enforce protected main with required exact-SHA checks and review; re-query branch protection.
- [ ] **SEC-18-004** [IMPLEMENTED_UNVERIFIED] Define ownership rules for critical security files.
  - Next proof: Enforce code-owner review through branch protection and confirm a review is requested on a security-path pull request
- [ ] **SEC-18-010** [IMPLEMENTED_UNVERIFIED] Generate and maintain a Software Bill of Materials (SBOM).
  - Next proof: Attach the SBOM to each release and add the container image SBOM
- [ ] **SEC-18-011** [IMPLEMENTED_UNVERIFIED] Run software composition analysis for vulnerable dependencies.
  - Next proof: Triage the 12 moderate dev-tooling advisories (eslint-config-next, drizzle-kit, esbuild chain) with an owner exception or upgrades
- [ ] **SEC-18-015** [IMPLEMENTED_UNVERIFIED] Use lockfiles and reproducible dependency installation.
  - Next proof: Run the same check on every pull request touching package files and confirm Docker builds use npm ci
- [ ] **SEC-18-005** [PARTIAL_EVIDENCE] Keep GitHub permissions least privileged.
  - Next proof: Review repository default workflow permissions, collaborator roles, deploy keys and the schema-drift workflow that pushes to main
- [ ] **SEC-18-018** [PARTIAL_EVIDENCE] Establish patch deadlines for critical vulnerabilities.
  - Next proof: Owner confirms the proposed deadlines and exception process; track a first critical advisory (next RCE fixed 2026-11-06) against them
- [ ] **SEC-18-019** [PARTIAL_EVIDENCE] Audit transitive dependencies and supply-chain changes.
  - Next proof: Review transitive dependency changes in each Dependabot pull request and pin third-party GitHub Actions by commit SHA (currently 0 of 502 uses are pinned)
- [ ] **SEC-18-020** [PARTIAL_EVIDENCE] Block known dangerous dependencies and insecure package versions.
  - Next proof: Add an explicit deny list for known-bad packages and extend the gate to development tooling
- [ ] **SEC-18-001** [UNASSESSED] Enforce branch protection on `main`.
- [ ] **SEC-18-003** [UNASSESSED] Require review for authentication, authorization, database, and infrastructure changes.
- [ ] **SEC-18-006** [UNASSESSED] Enforce MFA for developers and repository administrators.
- [ ] **SEC-18-007** [UNASSESSED] Use short-lived, narrowly scoped CI credentials.
- [ ] **SEC-18-008** [UNASSESSED] Avoid exposing production secrets to pull-request jobs.
- [ ] **SEC-18-009** [UNASSESSED] Pin and review third-party GitHub Actions.
- [ ] **SEC-18-012** [UNASSESSED] Run static application security testing.
- [ ] **SEC-18-013** [UNASSESSED] Run secret scanning.
- [ ] **SEC-18-014** [UNASSESSED] Review container and infrastructure-as-code security.
- [ ] **SEC-18-016** [UNASSESSED] Protect release artifacts from unauthorized modification.
- [ ] **SEC-18-017** [UNASSESSED] Introduce signed build artifacts and provenance where practical.
- [ ] **SEC-18-021** [UNASSESSED] Require explicit security review for new external libraries handling identity or cryptography.

### SEC-19 - Security logging, audit trails, and detection

- [ ] **SEC-19-001** [UNASSESSED] Create a standardized security event schema.
- [ ] **SEC-19-002** [UNASSESSED] Record successful and failed authentications.
- [ ] **SEC-19-003** [UNASSESSED] Record MFA changes and account recovery.
- [ ] **SEC-19-004** [UNASSESSED] Record permission grants, revocations, and role switching.
- [ ] **SEC-19-005** [UNASSESSED] Record privileged administrative actions.
- [ ] **SEC-19-006** [UNASSESSED] Record sensitive data exports and bulk downloads.
- [ ] **SEC-19-007** [UNASSESSED] Record tenant and membership changes.
- [ ] **SEC-19-008** [UNASSESSED] Record blocked cross-tenant and object-access attempts.
- [ ] **SEC-19-009** [UNASSESSED] Record security-sensitive configuration changes.
- [ ] **SEC-19-010** [UNASSESSED] Keep audit logs separate from ordinary debugging logs.
- [ ] **SEC-19-011** [UNASSESSED] Protect audit logs against unauthorized editing or deletion.
- [ ] **SEC-19-012** [UNASSESSED] Use centralized, access-controlled log collection.
- [ ] **SEC-19-013** [UNASSESSED] Define reliable time synchronization and correlation IDs.
- [ ] **SEC-19-014** [UNASSESSED] Detect impossible or unusual administrative activity.
- [ ] **SEC-19-015** [UNASSESSED] Detect unusual authentication failure patterns.
- [ ] **SEC-19-016** [UNASSESSED] Detect suspicious API request volumes and object enumeration.
- [ ] **SEC-19-017** [UNASSESSED] Detect unexpectedly large data exports.
- [ ] **SEC-19-018** [UNASSESSED] Detect secret misuse and abnormal service-to-service access.
- [ ] **SEC-19-019** [UNASSESSED] Establish alert severity and on-call ownership.
- [ ] **SEC-19-020** [UNASSESSED] Test whether alerts are actually delivered and acted upon.
- [ ] **SEC-19-021** [UNASSESSED] Apply retention, minimization, and privacy controls to all logs.

### SEC-20 - Incident response and breach containment

- [ ] **SEC-20-001** [UNASSESSED] Write an incident-response plan.
- [ ] **SEC-20-002** [UNASSESSED] Identify who can declare a security incident.
- [ ] **SEC-20-003** [UNASSESSED] Define severity levels and escalation procedures.
- [ ] **SEC-20-004** [UNASSESSED] Maintain an emergency contact roster.
- [ ] **SEC-20-005** [UNASSESSED] Create playbooks for compromised administrator accounts.
- [ ] **SEC-20-006** [UNASSESSED] Create playbooks for exposed API keys.
- [ ] **SEC-20-007** [UNASSESSED] Create playbooks for unauthorized database access.
- [ ] **SEC-20-008** [UNASSESSED] Create playbooks for cross-college data exposure.
- [ ] **SEC-20-009** [UNASSESSED] Create playbooks for compromised storage objects.
- [ ] **SEC-20-010** [UNASSESSED] Create playbooks for malicious third-party integrations.
- [ ] **SEC-20-011** [UNASSESSED] Implement rapid credential revocation and rotation.
- [ ] **SEC-20-012** [UNASSESSED] Implement account and tenant emergency lockout controls.
- [ ] **SEC-20-013** [UNASSESSED] Support emergency disabling of vulnerable integrations and features.
- [ ] **SEC-20-014** [UNASSESSED] Preserve security evidence appropriately.
- [ ] **SEC-20-015** [UNASSESSED] Define secure forensic investigation procedures.
- [ ] **SEC-20-016** [UNASSESSED] Determine contractual and legal incident-notification obligations.
- [ ] **SEC-20-017** [UNASSESSED] Run tabletop exercises and incident simulations.
- [ ] **SEC-20-018** [UNASSESSED] Review root causes and close follow-up issues.
- [ ] **SEC-20-019** [UNASSESSED] Track detection time, containment time, and recovery time.

### SEC-21 - Backup, disaster recovery, and resilience

- [ ] **SEC-21-001** [UNASSESSED] Define recovery point and recovery time objectives.
- [ ] **SEC-21-002** [UNASSESSED] Enable automated production database backups.
- [ ] **SEC-21-003** [UNASSESSED] Protect backups with separate identities and encryption.
- [ ] **SEC-21-004** [UNASSESSED] Maintain isolated or immutable backups where practical.
- [ ] **SEC-21-005** [UNASSESSED] Test recovery against a disposable environment.
- [ ] **SEC-21-006** [UNASSESSED] Verify backup data integrity.
- [ ] **SEC-21-007** [UNASSESSED] Protect backup encryption keys.
- [ ] **SEC-21-008** [UNASSESSED] Test accidental deletion and database corruption recovery.
- [ ] **SEC-21-009** [UNASSESSED] Test ransomware-style recovery scenarios.
- [ ] **SEC-21-010** [UNASSESSED] Document restoration sequencing across databases, storage, and queues.
- [ ] **SEC-21-011** [UNASSESSED] Establish availability monitoring.
- [ ] **SEC-21-012** [UNASSESSED] Use safe retry and graceful degradation.
- [ ] **SEC-21-013** [UNASSESSED] Test regional or infrastructure outages where relevant.
- [ ] **SEC-21-014** [UNASSESSED] Prevent a failed dependency from causing an insecure authorization fallback.
- [ ] **SEC-21-015** [UNASSESSED] Verify recovery does not restore revoked permissions or compromised credentials without reconciliation.

### SEC-22 - Privacy and data governance

- [ ] **SEC-22-001** [UNASSESSED] Maintain a personal-data inventory.
- [ ] **SEC-22-002** [UNASSESSED] Classify student and employee data by sensitivity.
- [ ] **SEC-22-003** [UNASSESSED] Document the lawful basis and purposes for processing.
- [ ] **SEC-22-004** [UNASSESSED] Define retention periods by data category.
- [ ] **SEC-22-005** [UNASSESSED] Implement authorized data correction and deletion workflows.
- [ ] **SEC-22-006** [UNASSESSED] Respect applicable privacy rights.
- [ ] **SEC-22-007** [UNASSESSED] Track data-sharing relationships with colleges and recruiters.
- [ ] **SEC-22-008** [UNASSESSED] Apply consent and visibility rules to candidate discovery.
- [ ] **SEC-22-009** [UNASSESSED] Restrict unnecessary data sharing with external vendors.
- [ ] **SEC-22-010** [UNASSESSED] Evaluate children's and minors' data requirements where applicable.
- [ ] **SEC-22-011** [UNASSESSED] Prevent test accounts from exposing real student data.
- [ ] **SEC-22-012** [UNASSESSED] Implement secure data disposal.
- [ ] **SEC-22-013** [UNASSESSED] Review cross-border transfers and data residency requirements.
- [ ] **SEC-22-014** [UNASSESSED] Validate applicable Indian and international privacy obligations with qualified counsel.
- [ ] **SEC-22-015** [UNASSESSED] Assess whether specific customers trigger additional contractual, educational, or sector-specific obligations.

### SEC-23 - Automated security testing

- [ ] **SEC-23-012** [PARTIAL_EVIDENCE] Run SSRF tests.
  - Next proof: Complete SSRF coverage for all server-side HTTP paths
- [ ] **SEC-23-015** [PARTIAL_EVIDENCE] Run RLS tests using the real restricted application database role.
  - Next proof: Run actual production-equivalent principal READ/WRITE RLS tests across schema
- [ ] **SEC-23-017** [PARTIAL_EVIDENCE] Run file-upload and signed-URL authorization tests.
  - Next proof: Complete malware upload, file format, expiry and authorization suites
- [ ] **SEC-23-023** [PARTIAL_EVIDENCE] Keep dedicated disposable PostgreSQL fixtures for adversarial tests.
  - Next proof: Cover seven-account schemas with disposable PG fixtures and CI gating
- [ ] **SEC-23-001** [UNASSESSED] Run authentication regression tests.
- [ ] **SEC-23-002** [UNASSESSED] Run permission-matrix tests for every role.
- [ ] **SEC-23-003** [UNASSESSED] Run role-switching tests.
- [ ] **SEC-23-004** [UNASSESSED] Run account-disable and membership-revocation tests.
- [ ] **SEC-23-005** [UNASSESSED] Run cross-college tests.
- [ ] **SEC-23-006** [UNASSESSED] Run cross-organization tests.
- [ ] **SEC-23-007** [UNASSESSED] Run same-college, different-user isolation tests.
- [ ] **SEC-23-008** [UNASSESSED] Run direct-object-ID manipulation tests.
- [ ] **SEC-23-009** [UNASSESSED] Run forbidden-field and mass-assignment tests.
- [ ] **SEC-23-010** [UNASSESSED] Run CSRF tests.
- [ ] **SEC-23-011** [UNASSESSED] Run XSS and injection tests.
- [ ] **SEC-23-013** [UNASSESSED] Run authentication and OTP replay tests.
- [ ] **SEC-23-014** [UNASSESSED] Run session revocation and concurrent-request tests.
- [ ] **SEC-23-016** [UNASSESSED] Run database migration and privilege-drift tests.
- [ ] **SEC-23-018** [UNASSESSED] Run webhook signature and replay tests.
- [ ] **SEC-23-019** [UNASSESSED] Run cache and background-job isolation tests.
- [ ] **SEC-23-020** [UNASSESSED] Run concurrency and transaction-race tests.
- [ ] **SEC-23-021** [UNASSESSED] Test behavior under partial provider failures.
- [ ] **SEC-23-022** [UNASSESSED] Require security tests to run automatically for relevant changes.
- [ ] **SEC-23-024** [UNASSESSED] Fail the release when critical security tests fail.
- [ ] **SEC-23-025** [UNASSESSED] Prevent test skips or weakened assertions from falsely satisfying acceptance.

### SEC-24 - Independent security testing

- [ ] **SEC-24-001** [UNASSESSED] Commission architecture and threat-model reviews.
- [ ] **SEC-24-002** [UNASSESSED] Conduct authenticated and unauthenticated penetration testing.
- [ ] **SEC-24-003** [UNASSESSED] Test every major account type.
- [ ] **SEC-24-004** [UNASSESSED] Perform multi-tenant authorization testing.
- [ ] **SEC-24-005** [UNASSESSED] Include source-assisted testing for complex RBAC and RLS rules.
- [ ] **SEC-24-006** [UNASSESSED] Conduct cloud configuration assessments.
- [ ] **SEC-24-007** [UNASSESSED] Conduct external attack-surface assessments.
- [ ] **SEC-24-008** [UNASSESSED] Review database privilege design independently.
- [ ] **SEC-24-009** [UNASSESSED] Review administrator recovery and MFA bypass risks.
- [ ] **SEC-24-010** [UNASSESSED] Test provider compromise scenarios.
- [ ] **SEC-24-011** [UNASSESSED] Conduct independent testing after major security architecture changes.
- [ ] **SEC-24-012** [UNASSESSED] Retest every critical or high-severity remediation.
- [ ] **SEC-24-013** [UNASSESSED] Establish coordinated vulnerability disclosure.
- [ ] **SEC-24-014** [UNASSESSED] Consider a managed bug bounty after the system is mature enough to support one.

### SEC-25 - Security governance and organizational controls

- [ ] **SEC-25-013** [PARTIAL_EVIDENCE] Define vulnerability response deadlines.
  - Next proof: Owner approval of the deadlines and a named person accountable for meeting them
- [ ] **SEC-25-001** [UNASSESSED] Assign accountable owners for application, infrastructure, data, and incident security.
- [ ] **SEC-25-002** [UNASSESSED] Maintain an authoritative security risk register.
- [ ] **SEC-25-003** [UNASSESSED] Track security findings with evidence-based closure.
- [ ] **SEC-25-004** [UNASSESSED] Define a secure coding standard.
- [ ] **SEC-25-005** [UNASSESSED] Require threat modeling for high-risk changes.
- [ ] **SEC-25-006** [UNASSESSED] Establish formal access-review schedules.
- [ ] **SEC-25-007** [UNASSESSED] Remove unnecessary developer and production access.
- [ ] **SEC-25-008** [UNASSESSED] Separate production operations from ordinary development access.
- [ ] **SEC-25-009** [UNASSESSED] Require MFA for source control and production infrastructure.
- [ ] **SEC-25-010** [UNASSESSED] Require security reviews for new vendors.
- [ ] **SEC-25-011** [UNASSESSED] Maintain written change-management procedures.
- [ ] **SEC-25-012** [UNASSESSED] Review security policies regularly.
- [ ] **SEC-25-014** [UNASSESSED] Train people with privileged operational access.
- [ ] **SEC-25-015** [UNASSESSED] Track security exceptions with owners and expiration dates.
- [ ] **SEC-25-016** [UNASSESSED] Build an evidence collection process for future ISO 27001 or SOC 2 assessment.

### SEC-26 - Advanced controls for particularly sensitive operations

- [ ] **SEC-26-003** [PARTIAL_EVIDENCE] Time-limited access grants with automatic expiration.
  - Next proof: Verify all privileged time-limited grants, replay/revocation and independent context
- [ ] **SEC-26-015** [PARTIAL_EVIDENCE] Production policy-drift detection.
  - Next proof: Continuously compare actual production policy and privileges with reviewed baseline
- [ ] **SEC-26-001** [UNASSESSED] Hardware-backed, phishing-resistant authentication for the most powerful administrators.
- [ ] **SEC-26-002** [UNASSESSED] Just-in-time privileged access rather than permanently elevated operational access.
- [ ] **SEC-26-004** [UNASSESSED] Two-person approval for especially high-impact platform operations.
- [ ] **SEC-26-005** [UNASSESSED] Independent approval for changes to Super Admin assignments.
- [ ] **SEC-26-006** [UNASSESSED] A tightly controlled emergency-access procedure with mandatory review.
- [ ] **SEC-26-007** [UNASSESSED] Tamper-evident security audit storage.
- [ ] **SEC-26-008** [UNASSESSED] Automated detection of abnormal data movement.
- [ ] **SEC-26-009** [UNASSESSED] Contextual risk scoring for sensitive administrator operations.
- [ ] **SEC-26-010** [UNASSESSED] Stronger cryptographic signing for important issued credentials and certificates.
- [ ] **SEC-26-011** [UNASSESSED] Periodic red-team exercises.
- [ ] **SEC-26-012** [UNASSESSED] Continuous attack-surface monitoring.
- [ ] **SEC-26-013** [UNASSESSED] Security chaos testing: intentional failure of dependencies and controls in isolated environments.
- [ ] **SEC-26-014** [UNASSESSED] Security regression suites based on previous real incidents.
- [ ] **SEC-26-016** [UNASSESSED] Independent verification of the most critical controls.
