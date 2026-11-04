# 42LMS vNext — High-Assurance Security Control Catalogue

> **Requirement baseline, not an execution/status tracker.** Source snapshot: 2026-11-04 maximum security blueprint supplied by the product owner. All requirements below are proposed verification/engineering targets; **do not mark them implemented without source, test, deployed-configuration and review evidence**. Track live work ONLY in [docs/tracker.json](../tracker.json), consistent with the existing project policy. The original source is preserved [verbatim](../audit/security/2026-11-04-maximum-security-blueprint-source.md). For execution policy and gates, see [the security program](README.md).

Stable IDs are `SEC-<domain>-<ordinal>`. Do not renumber existing IDs; append later requirements and link their IDs from the canonical tracker task. Each requirement requires both a positive authorized case (where applicable) and an unauthorized/adversarial case, using an independent boundary where feasible. Tables and surrounding prose from the source also remain authoritative context in the archived copy.

## SEC-01 — Authentication and identity security

- **SEC-01-001** — Maintain one authoritative internal user identity independent of email addresses, phone numbers, and legacy IDs.
- **SEC-01-002** — Enforce verified ownership of login email and phone numbers.
- **SEC-01-003** — Prevent account enumeration through login, recovery, and registration responses.
- **SEC-01-004** — Introduce passkeys/WebAuthn for strong authentication.
- **SEC-01-005** — Require phishing-resistant MFA for Super Admin accounts.
- **SEC-01-006** — Require strong MFA for College Admin and other privileged accounts.
- **SEC-01-007** — Enforce secure authenticator enrollment, replacement, removal, and recovery.
- **SEC-01-008** — Require recent authentication before adding or replacing an authenticator.
- **SEC-01-009** — Introduce risk-based authentication for suspicious sign-ins.
- **SEC-01-010** — Protect against credential stuffing, OTP guessing, and authentication flooding.
- **SEC-01-011** — Use distributed rate limits, not exclusively per-instance counters.
- **SEC-01-012** — Apply per-account, per-device, per-network, and global abuse limits.
- **SEC-01-013** — Prevent OTP replay and enforce atomic, single-use verification.
- **SEC-01-014** — Ensure failed authentication cannot inadvertently activate sessions.
- **SEC-01-015** — Implement tamper-resistant identity and authentication audit events.
- **SEC-01-016** — Regularly test disabled users, archived tenants, and revoked memberships against authentication flows.
- **SEC-01-017** — Add managed enterprise SSO using OIDC or SAML where colleges require it.
- **SEC-01-018** — Implement secure SSO account linking and protection against identity confusion.

## SEC-02 — Session and device security

- **SEC-02-001** — Use opaque, unpredictable, server-revocable session identifiers.
- **SEC-02-002** — Store only cryptographic digests of session credentials.
- **SEC-02-003** — Keep session cookies `HttpOnly`, `Secure`, and appropriately `SameSite` restricted.
- **SEC-02-004** — Add inactivity timeouts as well as absolute session expiration.
- **SEC-02-005** — Enforce shorter privileged-session lifetimes.
- **SEC-02-006** — Rotate session credentials after login, reauthentication, and significant privilege changes.
- **SEC-02-007** — Invalidate or restrict sessions after account suspension.
- **SEC-02-008** — Revoke affected sessions immediately following role or membership removal.
- **SEC-02-009** — Implement logout from all devices.
- **SEC-02-010** — Provide device/session visibility to account owners.
- **SEC-02-011** — Detect suspicious simultaneous sessions and unusual session behavior.
- **SEC-02-012** — Protect against session fixation and replay.
- **SEC-02-013** — Require fresh step-up authentication for sensitive actions.
- **SEC-02-014** — Prevent cached privileged information from surviving logout or account switching.
- **SEC-02-015** — Separate normal college workspaces from privileged platform administration sessions.
- **SEC-02-016** — Ensure every workspace and role switch triggers fresh server-side authorization.

## SEC-03 — RBAC — Role-Based Access Control

- **SEC-03-001** — RBAC: What is this role allowed to do?
- **SEC-03-002** — ABAC: Under which conditions can it do that?
- **SEC-03-003** — Relationship authorization: Does this user actually have access to this specific course, learner, project, company, or college?
- **SEC-03-004** — Define a complete central permission catalogue.
- **SEC-03-005** — Define explicit role-to-permission assignments.
- **SEC-03-006** — Make every permission deny by default.
- **SEC-03-007** — Enforce permissions on the server, never only through UI visibility.
- **SEC-03-008** — Prevent conflicting roles from automatically combining their privileges.
- **SEC-03-009** — For users holding multiple roles, require explicit selection before entering privileged roles.
- **SEC-03-010** — Remove the current tendency to fall back to the highest-priority role when no valid selection exists.
- **SEC-03-011** — Keep Super Admin privileges isolated from ordinary membership sessions.
- **SEC-03-012** — Create a single reusable policy-decision interface.
- **SEC-03-013** — Separate permission decisions from resource discovery and trusted ownership resolution.
- **SEC-03-014** — Evaluate college, organization, resource, ownership, assignment, and grant relationships.
- **SEC-03-015** — Check that role assignments themselves were granted by an authorized actor.
- **SEC-03-016** — Define who can grant, revoke, delegate, and transfer each role.
- **SEC-03-017** — Prevent self-promotion and unauthorized peer promotion.
- **SEC-03-018** — Prevent privilege escalation through bulk operations.
- **SEC-03-019** — Require elevated authorization for changing roles or permissions.
- **SEC-03-020** — Enforce immediate revocation of sensitive permissions.
- **SEC-03-021** — Prevent role creation or editing from bypassing the canonical permission catalogue.
- **SEC-03-022** — Implement separation of duties for especially sensitive operations.
- **SEC-03-023** — Reevaluate role authorization at the point of protected database writes.
- **SEC-03-024** — Verify the role actually selected by the user remains persisted and active.
- **SEC-03-025** — Maintain audit trails for every role and permission change.
- **SEC-03-026** — Test every unauthorized role/action combination.
- **SEC-03-027** — Make additions to the role and permission model require security review.

## SEC-04 — Role-by-role scope model

- **SEC-04-001** — Role: Learner — Own data, own enrollments, authorized lessons and assignments
- **SEC-04-002** — Role: Faculty — Assigned classes, deliveries, learners, and assessments
- **SEC-04-003** — Role: Mentor — Explicitly assigned learners, cohorts, and permitted mentoring resources
- **SEC-04-004** — Role: TPO — Own college's authorized placement resources
- **SEC-04-005** — Role: Recruiter — Verified company relationships, explicit college grants, permitted placement operations
- **SEC-04-006** — Role: College Admin — Authorized administrative resources within assigned college
- **SEC-04-007** — Role: Super Admin — Explicit platform administrative privileges, with independent step-up and auditing
- **SEC-04-008** — Deny horizontal access: one user may not view another user's private records solely because both are in the same college.

## SEC-05 — Multi-tenant isolation

- **SEC-05-001** — Establish authoritative tenant ownership for every tenant-owned table.
- **SEC-05-002** — Define organization-level versus college-level tenancy.
- **SEC-05-003** — Make the active tenant server-validated.
- **SEC-05-004** — Reject tenant identity taken solely from request parameters or JSON.
- **SEC-05-005** — Verify every object belongs to the authorized tenant.
- **SEC-05-006** — Verify nested objects preserve tenant ancestry.
- **SEC-05-007** — Prevent cross-tenant joins that expose unauthorized data.
- **SEC-05-008** — Prevent cross-tenant mutations even when the IDs are valid.
- **SEC-05-009** — Prevent unauthorized access through filters, pagination, sorting, and aggregate queries.
- **SEC-05-010** — Prevent existence leaks through error messages and record counts.
- **SEC-05-011** — Scope search indexes to the same authorization rules.
- **SEC-05-012** — Scope caches and cache keys by tenant and, where necessary, user and role.
- **SEC-05-013** — Scope background jobs and queues by verified tenant.
- **SEC-05-014** — Scope file storage and signed URLs by tenant and resource.
- **SEC-05-015** — Scope notifications, reports, exports, and analytics.
- **SEC-05-016** — Enforce tenant isolation across WebSocket, polling, and real-time channels if used.
- **SEC-05-017** — Prevent a tenant-domain or Host-header mismatch from widening access.
- **SEC-05-018** — Test users with multiple college memberships.
- **SEC-05-019** — Test users who are administrators in one college and learners in another.
- **SEC-05-020** — Revoke access immediately when college membership ends.
- **SEC-05-021** — Verify college archival removes operational access.
- **SEC-05-022** — Require explicit, time-limited authority for legitimate cross-college functions.
- **SEC-05-023** — Ensure backups, support tools, and administrative scripts respect tenant confidentiality.

## SEC-06 — PostgreSQL Row-Level Security

- **SEC-06-001** — Inventory all database tables, owners, grants, and current RLS settings.
- **SEC-06-002** — Classify every table as tenant-owned, user-owned, globally shared, or internal infrastructure.
- **SEC-06-003** — Identify tables whose tenant ownership comes through a parent relationship.
- **SEC-06-004** — Design and review RLS policies for each protected table.
- **SEC-06-005** — Enable RLS on eligible tenant and user data tables.
- **SEC-06-006** — Use `USING` policies to restrict which rows can be read or modified.
- **SEC-06-007** — Use `WITH CHECK` policies to prevent unauthorized inserted or updated rows.
- **SEC-06-008** — Verify behavior independently for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
- **SEC-06-009** — Use `FORCE ROW LEVEL SECURITY` wherever table-owner behavior requires it.
- **SEC-06-010** — Ensure the ordinary app runtime cannot use `BYPASSRLS`.
- **SEC-06-011** — Ensure the app runtime is not a superuser.
- **SEC-06-012** — Separate runtime ownership from migration ownership.
- **SEC-06-013** — Restrict elevated database functions and `SECURITY DEFINER` routines.
- **SEC-06-014** — Prevent unsafe `search_path` behavior in privileged functions.
- **SEC-06-015** — Define trustworthy tenant context for every protected transaction.
- **SEC-06-016** — Ensure connection pooling cannot carry tenant context from one request into another.
- **SEC-06-017** — Never trust an arbitrary client-provided tenant ID as database authority.
- **SEC-06-018** — Recognize that a client-writable PostgreSQL setting is not sufficient by itself to defend against arbitrary SQL execution or SQL injection.
- **SEC-06-019** — Test SQL-level attempts to read another tenant's rows.
- **SEC-06-020** — Test SQL-level attempts to modify another tenant's rows.
- **SEC-06-021** — Test inserts that reference another tenant's records.
- **SEC-06-022** — Test tenant-context absence and malformed context.
- **SEC-06-023** — Test ownership changes and tenant transfers.
- **SEC-06-024** — Test privileged workers and migration scripts separately.
- **SEC-06-025** — Verify query performance and policy behavior before production rollout.
- **SEC-06-026** — Roll out RLS incrementally with compatibility tests and rollback plans.

## SEC-07 — Database privilege and integrity security

- **SEC-07-001** — Create separate database identities for application runtime, migrations, scheduled jobs, external workers, and emergency administration.
- **SEC-07-002** — Grant only required schema, table, sequence, and function privileges.
- **SEC-07-003** — Remove unnecessary schema ownership and DDL privileges from application runtime.
- **SEC-07-004** — Remove dangerous default privileges.
- **SEC-07-005** — Restrict database network access to authorized workloads.
- **SEC-07-006** — Require encrypted database connections with certificate validation.
- **SEC-07-007** — Enforce tenant-aware foreign-key relationships.
- **SEC-07-008** — Use composite tenant-aware constraints where needed.
- **SEC-07-009** — Prevent child records from attaching to another tenant's parent.
- **SEC-07-010** — Define safe cascading-deletion behavior.
- **SEC-07-011** — Add integrity checks for membership, role, grant, and enrollment relationships.
- **SEC-07-012** — Enforce uniqueness under the correct tenant scope.
- **SEC-07-013** — Avoid raw SQL where reviewed query builders or parameterized SQL suffice.
- **SEC-07-014** — Audit all dynamic SQL.
- **SEC-07-015** — Prevent mass assignment and unsafe model updates.
- **SEC-07-016** — Apply strict transactional checks around security-sensitive writes.
- **SEC-07-017** — Handle concurrent role revocation and mutation races.
- **SEC-07-018** — Use migration checks, rollback procedures, and production-safe sequencing.
- **SEC-07-019** — Continuously detect database privilege and RLS-policy drift.

## SEC-08 — API authorization and object-level security

- **SEC-08-001** — Inventory every API route and exported HTTP method.
- **SEC-08-002** — Classify every endpoint as public, authenticated, privileged, service-to-service, or webhook.
- **SEC-08-003** — Define required roles, permissions, and resource scopes.
- **SEC-08-004** — Require authentication on every nonpublic endpoint.
- **SEC-08-005** — Require explicit permission checks for every protected action.
- **SEC-08-006** — Require persisted resource ownership checks for every resource ID.
- **SEC-08-007** — Prevent broken object-level authorization (BOLA/IDOR).
- **SEC-08-008** — Prevent broken function-level authorization.
- **SEC-08-009** — Prevent unauthorized field-level reads and writes.
- **SEC-08-010** — Reject unsafe mass assignment.
- **SEC-08-011** — Validate inputs using strict schemas.
- **SEC-08-012** — Remove or reject unrecognized security-sensitive fields.
- **SEC-08-013** — Enforce maximum request body sizes.
- **SEC-08-014** — Enforce maximum pagination, batch, and export sizes.
- **SEC-08-015** — Apply rate limits and abuse controls per endpoint risk.
- **SEC-08-016** — Protect cookie-authenticated mutations against CSRF.
- **SEC-08-017** — Validate Origin/Host/proxy assumptions.
- **SEC-08-018** — Avoid leaking internal errors, SQL details, and secrets.
- **SEC-08-019** — Use consistent authorization failure semantics.
- **SEC-08-020** — Protect asynchronous export and report endpoints.
- **SEC-08-021** — Protect less-obvious endpoints such as counts, autocomplete, previews, and download links.
- **SEC-08-022** — Ensure authorization applies to background processing initiated by an API.
- **SEC-08-023** — Fail CI when a new route lacks security classification.
- **SEC-08-024** — Require negative tests for every sensitive API method.

## SEC-09 — Secrets, API keys, and cryptographic security

- **SEC-09-001** — Inventory every application secret, API key, database credential, webhook secret, and signing key.
- **SEC-09-002** — Establish clear ownership and purpose for each secret.
- **SEC-09-003** — Ensure no production secrets remain in source code, Git history, images, documentation, or test fixtures.
- **SEC-09-004** — Rotate every known or suspected exposed credential.
- **SEC-09-005** — Implement continuous secret scanning across commits and pull requests.
- **SEC-09-006** — Scan historical Git commits, not only the latest source tree.
- **SEC-09-007** — Use a managed secret store rather than application configuration files containing raw production secrets.
- **SEC-09-008** — Prefer workload identity and short-lived credentials over static keys.
- **SEC-09-009** — Use different credentials for development, staging, and production.
- **SEC-09-010** — Scope each third-party key to minimum required privileges.
- **SEC-09-011** — Apply expiration and regular rotation where supported.
- **SEC-09-012** — Support overlapping keys for safe zero-downtime rotation.
- **SEC-09-013** — Restrict access to production secrets by operator and service identity.
- **SEC-09-014** — Keep secrets out of request logs, exception logs, telemetry, and traces.
- **SEC-09-015** — Protect cryptographic keys with a managed KMS; consider HSM-backed controls for particularly sensitive signing operations.
- **SEC-09-016** — Use established, reviewed cryptographic libraries and algorithms.
- **SEC-09-017** — Manage encryption key versions and revocation.
- **SEC-09-018** — Define emergency key-revocation and compromised-credential procedures.

## SEC-10 — Encryption and sensitive data protection

- **SEC-10-001** — Enforce TLS for all external application traffic.
- **SEC-10-002** — Enforce TLS between internal services and databases where appropriate.
- **SEC-10-003** — Encrypt databases, storage buckets, and backups at rest.
- **SEC-10-004** — Apply field-level encryption to selected highly sensitive values when justified by the threat model.
- **SEC-10-005** — Classify student identity, contact, assessment, academic, placement, and employment information by sensitivity.
- **SEC-10-006** — Minimize data stored in the first place.
- **SEC-10-007** — Restrict personal data returned from APIs to explicitly required fields.
- **SEC-10-008** — Define approved data handling rules for each role.
- **SEC-10-009** — Prevent exposing sensitive data through error responses.
- **SEC-10-010** — Protect personal data in analytics and reporting systems.
- **SEC-10-011** — Use pseudonymization or aggregation for suitable analytics workloads.
- **SEC-10-012** — Require elevated authorization for bulk personal-data exports.
- **SEC-10-013** — Prevent sensitive information from being included in browser-accessible application state unnecessarily.
- **SEC-10-014** — Prevent sensitive responses from being cached inappropriately.
- **SEC-10-015** — Test cryptographic key-loss and rotation procedures.
- **SEC-10-016** — Verify that development and test environments do not contain unprotected production student data.

## SEC-11 — File uploads, documents, and storage

- **SEC-11-001** — Keep private files in nonpublic storage buckets.
- **SEC-11-002** — Authorize each file against its owning tenant, user, and resource.
- **SEC-11-003** — Use short-lived signed download URLs when appropriate.
- **SEC-11-004** — Avoid long-lived publicly accessible document links.
- **SEC-11-005** — Verify that signed URLs cannot be reused outside their intended scope.
- **SEC-11-006** — Use opaque storage keys, not user-controlled filesystem paths.
- **SEC-11-007** — Validate file types using content inspection rather than extensions alone.
- **SEC-11-008** — Scan uploaded files for malware.
- **SEC-11-009** — Reject executable or dangerous content not required by a workflow.
- **SEC-11-010** — Enforce file-size, file-count, and total-storage limits.
- **SEC-11-011** — Defend against archive bombs and decompression attacks.
- **SEC-11-012** — Sanitize filenames and downloadable metadata.
- **SEC-11-013** — Prevent path traversal.
- **SEC-11-014** — Prevent insecure direct access to another learner's submission.
- **SEC-11-015** — Isolate file conversion and preview workers.
- **SEC-11-016** — Use sandboxed processing for untrusted files and document conversions.
- **SEC-11-017** — Prevent dangerous HTML/SVG/PDF content from becoming an application-origin script execution path.
- **SEC-11-018** — Apply retention and deletion policies to submitted documents.
- **SEC-11-019** — Revoke access to shared documents when membership or permissions end.
- **SEC-11-020** — Audit bulk downloads and sensitive document access.

## SEC-12 — Browser and frontend security

- **SEC-12-001** — Implement a strict Content Security Policy.
- **SEC-12-002** — Remove avoidable `unsafe-inline` script allowances through a tested nonce/hash strategy.
- **SEC-12-003** — Prevent stored and reflected XSS.
- **SEC-12-004** — Sanitize rich-text course and assessment content.
- **SEC-12-005** — Treat Markdown, HTML, code previews, and embedded lesson content as untrusted.
- **SEC-12-006** — Protect against DOM-based XSS.
- **SEC-12-007** — Avoid dangerous HTML injection and unchecked rendering shortcuts.
- **SEC-12-008** — Implement protection against clickjacking.
- **SEC-12-009** — Configure secure frame and embedding rules.
- **SEC-12-010** — Use appropriate HSTS and other security response headers.
- **SEC-12-011** — Restrict browser permissions through Permissions-Policy.
- **SEC-12-012** — Restrict cross-origin access and credentialed CORS.
- **SEC-12-013** — Avoid broad wildcard CORS configurations.
- **SEC-12-014** — Prevent sensitive data from entering URLs and browser history.
- **SEC-12-015** — Audit browser storage for credentials and personal information.
- **SEC-12-016** — Ensure logout clears privileged local application state.
- **SEC-12-017** — Protect against cross-origin information leaks.
- **SEC-12-018** — Audit third-party scripts, analytics widgets, and embedded content.
- **SEC-12-019** — Verify that client-side checks never substitute for server-side authorization.

## SEC-13 — Application and business-logic security

- **SEC-13-001** — Create threat models for all major workflows.
- **SEC-13-002** — Model malicious users who have valid accounts.
- **SEC-13-003** — Enforce server-side state-machine transitions.
- **SEC-13-004** — Prevent unauthorized workflow skipping.
- **SEC-13-005** — Prevent duplicate actions and replayed mutations.
- **SEC-13-006** — Use idempotency keys where repeated requests can cause harmful effects.
- **SEC-13-007** — Protect concurrent writes against race conditions.
- **SEC-13-008** — Enforce optimistic or pessimistic concurrency control as appropriate.
- **SEC-13-009** — Prevent self-approval of privileged requests.
- **SEC-13-010** — Apply dual approval to particularly sensitive administrative operations.
- **SEC-13-011** — Prevent unauthorized changes to historical academic records.
- **SEC-13-012** — Protect published assessments, scores, and evaluations from unauthorized modification.
- **SEC-13-013** — Enforce submission ownership and permitted submission windows.
- **SEC-13-014** — Ensure withdrawn, expired, suspended, and archived entities cannot continue operating.
- **SEC-13-015** — Validate monetary or billing-related workflows if integrated into vNext.
- **SEC-13-016** — Review business logic for circumvention through bulk endpoints.
- **SEC-13-017** — Make security decisions deterministic and testable.
- **SEC-13-018** — Default to denial on inconsistent or missing security state.

## SEC-14 — LMS-specific attack scenarios

- **SEC-14-001** — Module: Courses — Unauthorized enrollment, course edits, hidden content exposure
- **SEC-14-002** — Module: Lessons — Accessing paid or restricted lessons without entitlement
- **SEC-14-003** — Module: Assignments — Reading another learner's submissions or modifying grades
- **SEC-14-004** — Module: Quizzes — Accessing unreleased questions, manipulating attempts and scores
- **SEC-14-005** — Module: Exams — Answer leakage, impersonation, replay, bypassing time restrictions
- **SEC-14-006** — Module: Projects — Cross-team data exposure, forged approvals, unauthorized evaluations
- **SEC-14-007** — Module: Placements — Unauthorized student shortlist access, employer data exposure
- **SEC-14-008** — Module: Recruiter portal — Company impersonation, forged college grants, unauthorized candidate access
- **SEC-14-009** — Module: Faculty — Modifying learners outside assigned course sections
- **SEC-14-010** — Module: Mentor — Accessing learners who are not assigned to the mentor
- **SEC-14-011** — Module: College Admin — Changing another college's academic or administrative records
- **SEC-14-012** — Module: Super Admin — Platform privilege escalation and unrestricted unaudited access
- **SEC-14-013** — Protect assessment publication and release times.
- **SEC-14-014** — Prevent direct-answer API calls from exposing unreleased assessment material.
- **SEC-14-015** — Enforce per-learner attempt limits transactionally.
- **SEC-14-016** — Protect score calculation integrity.
- **SEC-14-017** — Make grade changes and overrides attributable and auditable.
- **SEC-14-018** — Prevent unauthorized certificate issuance or credential forgery.
- **SEC-14-019** — Use verifiable certificate identifiers and revocation status if certificates are issued.
- **SEC-14-020** — Protect recruiter access to resumes, profiles, and placement decisions.
- **SEC-14-021** — Enforce consent and eligibility before exposing learner profiles to recruiters.
- **SEC-14-022** — Check legitimate company-to-college relationships at the time of access.
- **SEC-14-023** — Prevent fraudulent attendance, assessment completion, and placement record updates.
- **SEC-14-024** — Test every bulk upload, import, approval, and export path.

## SEC-15 — Integrations, webhooks, and third-party services

- **SEC-15-001** — Inventory every external provider and integration.
- **SEC-15-002** — Document the data shared with each provider.
- **SEC-15-003** — Use separate credentials for every provider and environment.
- **SEC-15-004** — Validate webhook signatures with provider-specific rules.
- **SEC-15-005** — Enforce timestamp and replay protection where supported.
- **SEC-15-006** — Verify webhook events against the expected organization and resource.
- **SEC-15-007** — Restrict webhook endpoint methods and payload sizes.
- **SEC-15-008** — Reject malformed or unexpected callback fields.
- **SEC-15-009** — Prevent callbacks from mutating another tenant's resources.
- **SEC-15-010** — Validate outbound destinations and defend against SSRF.
- **SEC-15-011** — Restrict requests to cloud metadata and internal network addresses.
- **SEC-15-012** — Add safe retry and idempotency behavior.
- **SEC-15-013** — Prevent untrusted provider responses from overriding authorization decisions.
- **SEC-15-014** — Encrypt integration tokens at rest.
- **SEC-15-015** — Revoke integration grants when tenant access ends.
- **SEC-15-016** — Log security-relevant integration failures without leaking secrets.
- **SEC-15-017** — Isolate compromised providers and support emergency disablement.

## SEC-16 — Background jobs, queues, and internal services

- **SEC-16-001** — Give workers independent service identities.
- **SEC-16-002** — Limit each worker to its required database and service permissions.
- **SEC-16-003** — Avoid giving queue workers automatic Super Admin-equivalent authority.
- **SEC-16-004** — Sign or authenticate internal job requests.
- **SEC-16-005** — Propagate verified tenant context into every job.
- **SEC-16-006** — Recheck authorization when delayed work executes.
- **SEC-16-007** — Handle revoked membership and expired grants before worker execution.
- **SEC-16-008** — Prevent job payload tampering and cross-tenant substitution.
- **SEC-16-009** — Validate messages at queue boundaries.
- **SEC-16-010** — Implement replay and duplicate-job protections.
- **SEC-16-011** — Use dead-letter queues and safe failure handling.
- **SEC-16-012** — Avoid disclosing sensitive job payloads through dashboards or logs.
- **SEC-16-013** — Restrict manual job triggering to authorized operators.
- **SEC-16-014** — Isolate scheduler, mail, storage, and analytics worker privileges.
- **SEC-16-015** — Audit emergency job reprocessing.

## SEC-17 — Cloud, network, and infrastructure security

- **SEC-17-001** — Keep production databases off the public internet.
- **SEC-17-002** — Restrict inbound network access.
- **SEC-17-003** — Restrict sensitive outbound connectivity.
- **SEC-17-004** — Apply least-privilege service identities.
- **SEC-17-005** — Use workload identity for cloud-to-cloud authentication where supported.
- **SEC-17-006** — Harden operating-system and runtime configurations.
- **SEC-17-007** — Keep container images minimal and patched.
- **SEC-17-008** — Use non-root application containers.
- **SEC-17-009** — Restrict filesystem and container privileges.
- **SEC-17-010** — Apply resource and process limits.
- **SEC-17-011** — Configure production-grade DDoS protection.
- **SEC-17-012** — Implement WAF rules and bot protections where appropriate.
- **SEC-17-013** — Verify load-balancer and reverse-proxy header trust.
- **SEC-17-014** — Enforce HTTPS and certificate lifecycle monitoring.
- **SEC-17-015** — Secure DNS and domain ownership.
- **SEC-17-016** — Protect production administration behind strong identity controls.
- **SEC-17-017** — Separate development, staging, and production environments.
- **SEC-17-018** — Define infrastructure using reviewed, version-controlled configuration.
- **SEC-17-019** — Detect infrastructure configuration drift.
- **SEC-17-020** — Run regular vulnerability and configuration scans.
- **SEC-17-021** — Restrict access to operational dashboards and monitoring systems.
- **SEC-17-022** — Remove unused services, ports, and development endpoints.
- **SEC-17-023** — Test service isolation when a workload is compromised.

## SEC-18 — Secure development and software supply chain

- **SEC-18-001** — Enforce branch protection on `main`.
- **SEC-18-002** — Require passing security and correctness checks before merging.
- **SEC-18-003** — Require review for authentication, authorization, database, and infrastructure changes.
- **SEC-18-004** — Define ownership rules for critical security files.
- **SEC-18-005** — Keep GitHub permissions least privileged.
- **SEC-18-006** — Enforce MFA for developers and repository administrators.
- **SEC-18-007** — Use short-lived, narrowly scoped CI credentials.
- **SEC-18-008** — Avoid exposing production secrets to pull-request jobs.
- **SEC-18-009** — Pin and review third-party GitHub Actions.
- **SEC-18-010** — Generate and maintain a Software Bill of Materials (SBOM).
- **SEC-18-011** — Run software composition analysis for vulnerable dependencies.
- **SEC-18-012** — Run static application security testing.
- **SEC-18-013** — Run secret scanning.
- **SEC-18-014** — Review container and infrastructure-as-code security.
- **SEC-18-015** — Use lockfiles and reproducible dependency installation.
- **SEC-18-016** — Protect release artifacts from unauthorized modification.
- **SEC-18-017** — Introduce signed build artifacts and provenance where practical.
- **SEC-18-018** — Establish patch deadlines for critical vulnerabilities.
- **SEC-18-019** — Audit transitive dependencies and supply-chain changes.
- **SEC-18-020** — Block known dangerous dependencies and insecure package versions.
- **SEC-18-021** — Require explicit security review for new external libraries handling identity or cryptography.

## SEC-19 — Security logging, audit trails, and detection

- **SEC-19-001** — Create a standardized security event schema.
- **SEC-19-002** — Record successful and failed authentications.
- **SEC-19-003** — Record MFA changes and account recovery.
- **SEC-19-004** — Record permission grants, revocations, and role switching.
- **SEC-19-005** — Record privileged administrative actions.
- **SEC-19-006** — Record sensitive data exports and bulk downloads.
- **SEC-19-007** — Record tenant and membership changes.
- **SEC-19-008** — Record blocked cross-tenant and object-access attempts.
- **SEC-19-009** — Record security-sensitive configuration changes.
- **SEC-19-010** — Keep audit logs separate from ordinary debugging logs.
- **SEC-19-011** — Protect audit logs against unauthorized editing or deletion.
- **SEC-19-012** — Use centralized, access-controlled log collection.
- **SEC-19-013** — Define reliable time synchronization and correlation IDs.
- **SEC-19-014** — Detect impossible or unusual administrative activity.
- **SEC-19-015** — Detect unusual authentication failure patterns.
- **SEC-19-016** — Detect suspicious API request volumes and object enumeration.
- **SEC-19-017** — Detect unexpectedly large data exports.
- **SEC-19-018** — Detect secret misuse and abnormal service-to-service access.
- **SEC-19-019** — Establish alert severity and on-call ownership.
- **SEC-19-020** — Test whether alerts are actually delivered and acted upon.
- **SEC-19-021** — Apply retention, minimization, and privacy controls to all logs.

## SEC-20 — Incident response and breach containment

- **SEC-20-001** — Write an incident-response plan.
- **SEC-20-002** — Identify who can declare a security incident.
- **SEC-20-003** — Define severity levels and escalation procedures.
- **SEC-20-004** — Maintain an emergency contact roster.
- **SEC-20-005** — Create playbooks for compromised administrator accounts.
- **SEC-20-006** — Create playbooks for exposed API keys.
- **SEC-20-007** — Create playbooks for unauthorized database access.
- **SEC-20-008** — Create playbooks for cross-college data exposure.
- **SEC-20-009** — Create playbooks for compromised storage objects.
- **SEC-20-010** — Create playbooks for malicious third-party integrations.
- **SEC-20-011** — Implement rapid credential revocation and rotation.
- **SEC-20-012** — Implement account and tenant emergency lockout controls.
- **SEC-20-013** — Support emergency disabling of vulnerable integrations and features.
- **SEC-20-014** — Preserve security evidence appropriately.
- **SEC-20-015** — Define secure forensic investigation procedures.
- **SEC-20-016** — Determine contractual and legal incident-notification obligations.
- **SEC-20-017** — Run tabletop exercises and incident simulations.
- **SEC-20-018** — Review root causes and close follow-up issues.
- **SEC-20-019** — Track detection time, containment time, and recovery time.

## SEC-21 — Backup, disaster recovery, and resilience

- **SEC-21-001** — Define recovery point and recovery time objectives.
- **SEC-21-002** — Enable automated production database backups.
- **SEC-21-003** — Protect backups with separate identities and encryption.
- **SEC-21-004** — Maintain isolated or immutable backups where practical.
- **SEC-21-005** — Test recovery against a disposable environment.
- **SEC-21-006** — Verify backup data integrity.
- **SEC-21-007** — Protect backup encryption keys.
- **SEC-21-008** — Test accidental deletion and database corruption recovery.
- **SEC-21-009** — Test ransomware-style recovery scenarios.
- **SEC-21-010** — Document restoration sequencing across databases, storage, and queues.
- **SEC-21-011** — Establish availability monitoring.
- **SEC-21-012** — Use safe retry and graceful degradation.
- **SEC-21-013** — Test regional or infrastructure outages where relevant.
- **SEC-21-014** — Prevent a failed dependency from causing an insecure authorization fallback.
- **SEC-21-015** — Verify recovery does not restore revoked permissions or compromised credentials without reconciliation.

## SEC-22 — Privacy and data governance

- **SEC-22-001** — Maintain a personal-data inventory.
- **SEC-22-002** — Classify student and employee data by sensitivity.
- **SEC-22-003** — Document the lawful basis and purposes for processing.
- **SEC-22-004** — Define retention periods by data category.
- **SEC-22-005** — Implement authorized data correction and deletion workflows.
- **SEC-22-006** — Respect applicable privacy rights.
- **SEC-22-007** — Track data-sharing relationships with colleges and recruiters.
- **SEC-22-008** — Apply consent and visibility rules to candidate discovery.
- **SEC-22-009** — Restrict unnecessary data sharing with external vendors.
- **SEC-22-010** — Evaluate children's and minors' data requirements where applicable.
- **SEC-22-011** — Prevent test accounts from exposing real student data.
- **SEC-22-012** — Implement secure data disposal.
- **SEC-22-013** — Review cross-border transfers and data residency requirements.
- **SEC-22-014** — Validate applicable Indian and international privacy obligations with qualified counsel.
- **SEC-22-015** — Assess whether specific customers trigger additional contractual, educational, or sector-specific obligations.

## SEC-23 — Automated security testing

- **SEC-23-001** — Run authentication regression tests.
- **SEC-23-002** — Run permission-matrix tests for every role.
- **SEC-23-003** — Run role-switching tests.
- **SEC-23-004** — Run account-disable and membership-revocation tests.
- **SEC-23-005** — Run cross-college tests.
- **SEC-23-006** — Run cross-organization tests.
- **SEC-23-007** — Run same-college, different-user isolation tests.
- **SEC-23-008** — Run direct-object-ID manipulation tests.
- **SEC-23-009** — Run forbidden-field and mass-assignment tests.
- **SEC-23-010** — Run CSRF tests.
- **SEC-23-011** — Run XSS and injection tests.
- **SEC-23-012** — Run SSRF tests.
- **SEC-23-013** — Run authentication and OTP replay tests.
- **SEC-23-014** — Run session revocation and concurrent-request tests.
- **SEC-23-015** — Run RLS tests using the real restricted application database role.
- **SEC-23-016** — Run database migration and privilege-drift tests.
- **SEC-23-017** — Run file-upload and signed-URL authorization tests.
- **SEC-23-018** — Run webhook signature and replay tests.
- **SEC-23-019** — Run cache and background-job isolation tests.
- **SEC-23-020** — Run concurrency and transaction-race tests.
- **SEC-23-021** — Test behavior under partial provider failures.
- **SEC-23-022** — Require security tests to run automatically for relevant changes.
- **SEC-23-023** — Keep dedicated disposable PostgreSQL fixtures for adversarial tests.
- **SEC-23-024** — Fail the release when critical security tests fail.
- **SEC-23-025** — Prevent test skips or weakened assertions from falsely satisfying acceptance.

## SEC-24 — Independent security testing

- **SEC-24-001** — Commission architecture and threat-model reviews.
- **SEC-24-002** — Conduct authenticated and unauthenticated penetration testing.
- **SEC-24-003** — Test every major account type.
- **SEC-24-004** — Perform multi-tenant authorization testing.
- **SEC-24-005** — Include source-assisted testing for complex RBAC and RLS rules.
- **SEC-24-006** — Conduct cloud configuration assessments.
- **SEC-24-007** — Conduct external attack-surface assessments.
- **SEC-24-008** — Review database privilege design independently.
- **SEC-24-009** — Review administrator recovery and MFA bypass risks.
- **SEC-24-010** — Test provider compromise scenarios.
- **SEC-24-011** — Conduct independent testing after major security architecture changes.
- **SEC-24-012** — Retest every critical or high-severity remediation.
- **SEC-24-013** — Establish coordinated vulnerability disclosure.
- **SEC-24-014** — Consider a managed bug bounty after the system is mature enough to support one.

## SEC-25 — Security governance and organizational controls

- **SEC-25-001** — Assign accountable owners for application, infrastructure, data, and incident security.
- **SEC-25-002** — Maintain an authoritative security risk register.
- **SEC-25-003** — Track security findings with evidence-based closure.
- **SEC-25-004** — Define a secure coding standard.
- **SEC-25-005** — Require threat modeling for high-risk changes.
- **SEC-25-006** — Establish formal access-review schedules.
- **SEC-25-007** — Remove unnecessary developer and production access.
- **SEC-25-008** — Separate production operations from ordinary development access.
- **SEC-25-009** — Require MFA for source control and production infrastructure.
- **SEC-25-010** — Require security reviews for new vendors.
- **SEC-25-011** — Maintain written change-management procedures.
- **SEC-25-012** — Review security policies regularly.
- **SEC-25-013** — Define vulnerability response deadlines.
- **SEC-25-014** — Train people with privileged operational access.
- **SEC-25-015** — Track security exceptions with owners and expiration dates.
- **SEC-25-016** — Build an evidence collection process for future ISO 27001 or SOC 2 assessment.

## SEC-26 — Advanced controls for particularly sensitive operations

- **SEC-26-001** — Hardware-backed, phishing-resistant authentication for the most powerful administrators.
- **SEC-26-002** — Just-in-time privileged access rather than permanently elevated operational access.
- **SEC-26-003** — Time-limited access grants with automatic expiration.
- **SEC-26-004** — Two-person approval for especially high-impact platform operations.
- **SEC-26-005** — Independent approval for changes to Super Admin assignments.
- **SEC-26-006** — A tightly controlled emergency-access procedure with mandatory review.
- **SEC-26-007** — Tamper-evident security audit storage.
- **SEC-26-008** — Automated detection of abnormal data movement.
- **SEC-26-009** — Contextual risk scoring for sensitive administrator operations.
- **SEC-26-010** — Stronger cryptographic signing for important issued credentials and certificates.
- **SEC-26-011** — Periodic red-team exercises.
- **SEC-26-012** — Continuous attack-surface monitoring.
- **SEC-26-013** — Security chaos testing: intentional failure of dependencies and controls in isolated environments.
- **SEC-26-014** — Security regression suites based on previous real incidents.
- **SEC-26-015** — Production policy-drift detection.
- **SEC-26-016** — Independent verification of the most critical controls.

## Baseline and change-control notes

- **493 traceable controls** in 26 domains, extracted from the 2026-11-04 source (473 original checklist bullets, 19 role/module table obligations, plus one explicit same-college horizontal-access safeguard).
- The archive contains other binding narrative requirements, design warnings, architecture examples, standards targets, ordering, release gates and specific existing evidence; do not reduce those to an unqualified “done” after only checking this list.
- No control is considered implemented or safe merely because a source-file search finds `requirePermission`, `isSameOriginRequest`, or RLS keywords.
- Do not copy secret values, customer row samples, unredacted incident evidence, or production catalog results into this repository.
- If this catalogue and the live checkout differ, inspect the actual running system, correct documentation, and preserve exact commit/test evidence in the canonical tracker. Do not “close” security tasks on a speculative plan.
