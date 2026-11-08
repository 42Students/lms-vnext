# MASTER SECURITY TODO (ask me: "master security todo")

Generated 2026-11-07 from `docs/tracker.json` (the only status source) and `control-catalog.md`. Regenerate with `node scratch/gen-master-todo.cjs` (copy kept at `scripts/security/gen-master-todo.cjs`). A box is ticked only when the tracker says VERIFIED: test proof, deployed proof and an independent reviewer.

Totals: NEEDS_REVIEW 371, NEEDS_OWNER 122. Release sign-off: NOT approved.

## Work order

1. Close the route layer (done 2026-11-07): every API route on the central wrapper.
2. Server actions gated by guardAction + guard rule (done 2026-11-07); proxy reviewed; health/ready left outside on purpose (see architecture doc).
3. Independent audit of the central layer (`audit-brief-2026-11-07.md`), fix findings.
4. Assess the unassessed controls, group by group, starting with SEC-03, 05, 06, 08 (access, tenant, RLS, API).
5. Owner-gated: dev switches (tenant scope, shared store, RLS), credential rotation, branch protection and second code owner (SEC-18-002, SEC-18-004), pen test (SEC-24).

## Summary by group

| Group | Title | Controls | Verified | Assessed | Unassessed |
|---|---|---|---|---|---|
| SEC-01 | Authentication and identity security | 18 | 0 | 12 | 6 |
| SEC-02 | Session and device security | 16 | 0 | 16 | 0 |
| SEC-03 | RBAC — Role-Based Access Control | 27 | 0 | 25 | 2 |
| SEC-04 | Role-by-role scope model | 8 | 0 | 8 | 0 |
| SEC-05 | Multi-tenant isolation | 23 | 0 | 22 | 1 |
| SEC-06 | PostgreSQL Row-Level Security | 26 | 0 | 26 | 0 |
| SEC-07 | Database privilege and integrity security | 19 | 0 | 18 | 1 |
| SEC-08 | API authorization and object-level security | 24 | 0 | 24 | 0 |
| SEC-09 | Secrets, API keys, and cryptographic security | 18 | 0 | 11 | 7 |
| SEC-10 | Encryption and sensitive data protection | 16 | 0 | 12 | 4 |
| SEC-11 | File uploads, documents, and storage | 20 | 0 | 18 | 2 |
| SEC-12 | Browser and frontend security | 19 | 0 | 19 | 0 |
| SEC-13 | Application and business-logic security | 18 | 0 | 17 | 1 |
| SEC-14 | LMS-specific attack scenarios | 24 | 0 | 24 | 0 |
| SEC-15 | Integrations, webhooks, and third-party services | 17 | 0 | 17 | 0 |
| SEC-16 | Background jobs, queues, and internal services | 15 | 0 | 12 | 3 |
| SEC-17 | Cloud, network, and infrastructure security | 23 | 0 | 14 | 9 |
| SEC-18 | Secure development and software supply chain | 21 | 0 | 18 | 3 |
| SEC-19 | Security logging, audit trails, and detection | 21 | 0 | 20 | 1 |
| SEC-20 | Incident response and breach containment | 19 | 0 | 16 | 3 |
| SEC-21 | Backup, disaster recovery, and resilience | 15 | 0 | 7 | 8 |
| SEC-22 | Privacy and data governance | 15 | 0 | 4 | 11 |
| SEC-23 | Automated security testing | 25 | 0 | 25 | 0 |
| SEC-24 | Independent security testing | 14 | 0 | 0 | 14 |
| SEC-25 | Security governance and organizational controls | 16 | 0 | 8 | 8 |
| SEC-26 | Advanced controls for particularly sensitive operations | 16 | 0 | 5 | 11 |

## Every control, by group

`[ ]` open. State in brackets. Assessed controls show the next proof needed.

### SEC-01 - Authentication and identity security

- [ ] **SEC-01-001** [NEEDS_REVIEW] Maintain one authoritative internal user identity independent of email addresses, phone numbers, and legacy IDs.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-01-authentication.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-01-002** [NEEDS_REVIEW] Enforce verified ownership of login email and phone numbers.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-01-10-14-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-01-003** [NEEDS_REVIEW] Prevent account enumeration through login, recovery, and registration responses.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-01-010** [NEEDS_REVIEW] Protect against credential stuffing, OTP guessing, and authentication flooding.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-01-authentication.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-01-011** [NEEDS_REVIEW] Use distributed rate limits, not exclusively per-instance counters.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-01-012** [NEEDS_REVIEW] Apply per-account, per-device, per-network, and global abuse limits.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-01-013** [NEEDS_REVIEW] Prevent OTP replay and enforce atomic, single-use verification.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-01-authentication.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-01-014** [NEEDS_REVIEW] Ensure failed authentication cannot inadvertently activate sessions.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-01-authentication.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-01-015** [NEEDS_REVIEW] Implement tamper-resistant identity and authentication audit events.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-01-016** [NEEDS_REVIEW] Regularly test disabled users, archived tenants, and revoked memberships against authentication flows.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-01-authentication.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-01-005** [NEEDS_OWNER] Require phishing-resistant MFA for Super Admin accounts.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-01-authentication.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-01-009** [NEEDS_OWNER] Introduce risk-based authentication for suspicious sign-ins.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-01-authentication.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-01-004** [NEEDS_OWNER] Introduce passkeys/WebAuthn for strong authentication.
- [ ] **SEC-01-006** [NEEDS_OWNER] Require strong MFA for College Admin and other privileged accounts.
- [ ] **SEC-01-007** [NEEDS_OWNER] Enforce secure authenticator enrollment, replacement, removal, and recovery.
- [ ] **SEC-01-008** [NEEDS_OWNER] Require recent authentication before adding or replacing an authenticator.
- [ ] **SEC-01-017** [NEEDS_OWNER] Add managed enterprise SSO using OIDC or SAML where colleges require it.
- [ ] **SEC-01-018** [NEEDS_OWNER] Implement secure SSO account linking and protection against identity confusion.

### SEC-02 - Session and device security

- [ ] **SEC-02-001** [NEEDS_REVIEW] Use opaque, unpredictable, server-revocable session identifiers.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-02-session-and-device.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-02-002** [NEEDS_REVIEW] Store only cryptographic digests of session credentials.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-02-session-and-device.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-02-003** [NEEDS_REVIEW] Keep session cookies `HttpOnly`, `Secure`, and appropriately `SameSite` restricted.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-02-session-and-device.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-02-004** [NEEDS_REVIEW] Add inactivity timeouts as well as absolute session expiration.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-02-session-and-device.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-02-005** [NEEDS_REVIEW] Enforce shorter privileged-session lifetimes.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-02-session-and-device.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-02-006** [NEEDS_REVIEW] Rotate session credentials after login, reauthentication, and significant privilege changes.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-02-007** [NEEDS_REVIEW] Invalidate or restrict sessions after account suspension.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-02-session-and-device.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-02-008** [NEEDS_REVIEW] Revoke affected sessions immediately following role or membership removal.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-02-session-and-device.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-02-009** [NEEDS_REVIEW] Implement logout from all devices.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-02-session-and-device.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-02-010** [NEEDS_REVIEW] Provide device/session visibility to account owners.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-02-session-and-device.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-02-011** [NEEDS_REVIEW] Detect suspicious simultaneous sessions and unusual session behavior.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-02-012** [NEEDS_REVIEW] Protect against session fixation and replay.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-02-013** [NEEDS_REVIEW] Require fresh step-up authentication for sensitive actions.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-02-014** [NEEDS_REVIEW] Prevent cached privileged information from surviving logout or account switching.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-02-015** [NEEDS_REVIEW] Separate normal college workspaces from privileged platform administration sessions.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-02-016** [NEEDS_REVIEW] Ensure every workspace and role switch triggers fresh server-side authorization.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-02-session-and-device.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.

### SEC-03 - RBAC — Role-Based Access Control

- [ ] **SEC-03-001** [NEEDS_REVIEW] RBAC: What is this role allowed to do?
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-002** [NEEDS_REVIEW] ABAC: Under which conditions can it do that?
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-003** [NEEDS_REVIEW] Relationship authorization: Does this user actually have access to this specific course, learner, project, company, or college?
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-005** [NEEDS_REVIEW] Define explicit role-to-permission assignments.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-006** [NEEDS_REVIEW] Make every permission deny by default.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-007** [NEEDS_REVIEW] Enforce permissions on the server, never only through UI visibility.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-008** [NEEDS_REVIEW] Prevent conflicting roles from automatically combining their privileges.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-009** [NEEDS_REVIEW] For users holding multiple roles, require explicit selection before entering privileged roles.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-010** [NEEDS_REVIEW] Remove the current tendency to fall back to the highest-priority role when no valid selection exists.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-011** [NEEDS_REVIEW] Keep Super Admin privileges isolated from ordinary membership sessions.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-012** [NEEDS_REVIEW] Create a single reusable policy-decision interface.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-013** [NEEDS_REVIEW] Separate permission decisions from resource discovery and trusted ownership resolution.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-014** [NEEDS_REVIEW] Evaluate college, organization, resource, ownership, assignment, and grant relationships.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-015** [NEEDS_REVIEW] Check that role assignments themselves were granted by an authorized actor.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-016** [NEEDS_REVIEW] Define who can grant, revoke, delegate, and transfer each role.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-017** [NEEDS_REVIEW] Prevent self-promotion and unauthorized peer promotion.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-018** [NEEDS_REVIEW] Prevent privilege escalation through bulk operations.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-019** [NEEDS_REVIEW] Require elevated authorization for changing roles or permissions.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-020** [NEEDS_REVIEW] Enforce immediate revocation of sensitive permissions.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-021** [NEEDS_REVIEW] Prevent role creation or editing from bypassing the canonical permission catalogue.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-023** [NEEDS_REVIEW] Reevaluate role authorization at the point of protected database writes.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-024** [NEEDS_REVIEW] Verify the role actually selected by the user remains persisted and active.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-025** [NEEDS_REVIEW] Maintain audit trails for every role and permission change.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-026** [NEEDS_REVIEW] Test every unauthorized role/action combination.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-004** [NEEDS_OWNER] Define a complete central permission catalogue.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-03-022** [NEEDS_OWNER] Implement separation of duties for especially sensitive operations.
- [ ] **SEC-03-027** [NEEDS_OWNER] Make additions to the role and permission model require security review.

### SEC-04 - Role-by-role scope model

- [ ] **SEC-04-001** [NEEDS_REVIEW] Role: Learner — Own data, own enrollments, authorized lessons and assignments
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-04-002** [NEEDS_REVIEW] Role: Faculty — Assigned classes, deliveries, learners, and assessments
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-04-003** [NEEDS_REVIEW] Role: Mentor — Explicitly assigned learners, cohorts, and permitted mentoring resources
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-04-004** [NEEDS_REVIEW] Role: TPO — Own college's authorized placement resources
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-04-005** [NEEDS_REVIEW] Role: Recruiter — Verified company relationships, explicit college grants, permitted placement operations
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-04-006** [NEEDS_REVIEW] Role: College Admin — Authorized administrative resources within assigned college
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-04-007** [NEEDS_REVIEW] Role: Super Admin — Explicit platform administrative privileges, with independent step-up and auditing
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-04-008** [NEEDS_REVIEW] Deny horizontal access: one user may not view another user's private records solely because both are in the same college.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.

### SEC-05 - Multi-tenant isolation

- [ ] **SEC-05-001** [NEEDS_REVIEW] Establish authoritative tenant ownership for every tenant-owned table.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-05-06-tenant-isolation-and-rls.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-05-002** [NEEDS_REVIEW] Define organization-level versus college-level tenancy.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-05-003** [NEEDS_REVIEW] Make the active tenant server-validated.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-05-06-tenant-isolation-and-rls.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-05-004** [NEEDS_REVIEW] Reject tenant identity taken solely from request parameters or JSON.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-05-005** [NEEDS_REVIEW] Verify every object belongs to the authorized tenant.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-05-006** [NEEDS_REVIEW] Verify nested objects preserve tenant ancestry.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-05-007** [NEEDS_REVIEW] Prevent cross-tenant joins that expose unauthorized data.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-05-008** [NEEDS_REVIEW] Prevent cross-tenant mutations even when the IDs are valid.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-05-009** [NEEDS_REVIEW] Prevent unauthorized access through filters, pagination, sorting, and aggregate queries.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-05-010** [NEEDS_REVIEW] Prevent existence leaks through error messages and record counts.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-05-011** [NEEDS_REVIEW] Scope search indexes to the same authorization rules.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-05-012** [NEEDS_REVIEW] Scope caches and cache keys by tenant and, where necessary, user and role.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-05-07-14-last-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-05-013** [NEEDS_REVIEW] Scope background jobs and queues by verified tenant.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-05-014** [NEEDS_REVIEW] Scope file storage and signed URLs by tenant and resource.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-05-015** [NEEDS_REVIEW] Scope notifications, reports, exports, and analytics.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-05-016** [NEEDS_REVIEW] Enforce tenant isolation across WebSocket, polling, and real-time channels if used.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-05-017** [NEEDS_REVIEW] Prevent a tenant-domain or Host-header mismatch from widening access.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-05-06-tenant-isolation-and-rls.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-05-018** [NEEDS_REVIEW] Test users with multiple college memberships.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-05-019** [NEEDS_REVIEW] Test users who are administrators in one college and learners in another.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-05-020** [NEEDS_REVIEW] Revoke access immediately when college membership ends.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-05-021** [NEEDS_REVIEW] Verify college archival removes operational access.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-05-022** [NEEDS_REVIEW] Require explicit, time-limited authority for legitimate cross-college functions.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-05-023** [NEEDS_OWNER] Ensure backups, support tools, and administrative scripts respect tenant confidentiality.

### SEC-06 - PostgreSQL Row-Level Security

- [ ] **SEC-06-001** [NEEDS_REVIEW] Inventory all database tables, owners, grants, and current RLS settings.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-002** [NEEDS_REVIEW] Classify every table as tenant-owned, user-owned, globally shared, or internal infrastructure.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-003** [NEEDS_REVIEW] Identify tables whose tenant ownership comes through a parent relationship.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-004** [NEEDS_REVIEW] Design and review RLS policies for each protected table.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-005** [NEEDS_REVIEW] Enable RLS on eligible tenant and user data tables.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-05-06-tenant-isolation-and-rls.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-006** [NEEDS_REVIEW] Use `USING` policies to restrict which rows can be read or modified.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-05-06-tenant-isolation-and-rls.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-007** [NEEDS_REVIEW] Use `WITH CHECK` policies to prevent unauthorized inserted or updated rows.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-008** [NEEDS_REVIEW] Verify behavior independently for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-009** [NEEDS_REVIEW] Use `FORCE ROW LEVEL SECURITY` wherever table-owner behavior requires it.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-010** [NEEDS_REVIEW] Ensure the ordinary app runtime cannot use `BYPASSRLS`.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-05-06-tenant-isolation-and-rls.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-011** [NEEDS_REVIEW] Ensure the app runtime is not a superuser.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-012** [NEEDS_REVIEW] Separate runtime ownership from migration ownership.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-05-06-tenant-isolation-and-rls.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-013** [NEEDS_REVIEW] Restrict elevated database functions and `SECURITY DEFINER` routines.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-05-06-tenant-isolation-and-rls.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-014** [NEEDS_REVIEW] Prevent unsafe `search_path` behavior in privileged functions.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-015** [NEEDS_REVIEW] Define trustworthy tenant context for every protected transaction.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-05-06-tenant-isolation-and-rls.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-016** [NEEDS_REVIEW] Ensure connection pooling cannot carry tenant context from one request into another.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-05-06-tenant-isolation-and-rls.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-017** [NEEDS_REVIEW] Never trust an arbitrary client-provided tenant ID as database authority.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-05-06-tenant-isolation-and-rls.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-018** [NEEDS_REVIEW] Recognize that a client-writable PostgreSQL setting is not sufficient by itself to defend against arbitrary SQL execution or SQL injection.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-019** [NEEDS_REVIEW] Test SQL-level attempts to read another tenant's rows.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-020** [NEEDS_REVIEW] Test SQL-level attempts to modify another tenant's rows.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-021** [NEEDS_REVIEW] Test inserts that reference another tenant's records.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-022** [NEEDS_REVIEW] Test tenant-context absence and malformed context.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-023** [NEEDS_REVIEW] Test ownership changes and tenant transfers.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-024** [NEEDS_REVIEW] Test privileged workers and migration scripts separately.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-025** [NEEDS_REVIEW] Verify query performance and policy behavior before production rollout.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-06-026** [NEEDS_REVIEW] Roll out RLS incrementally with compatibility tests and rollback plans.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.

### SEC-07 - Database privilege and integrity security

- [ ] **SEC-07-002** [NEEDS_REVIEW] Grant only required schema, table, sequence, and function privileges.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-07-003** [NEEDS_REVIEW] Remove unnecessary schema ownership and DDL privileges from application runtime.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-07-database-privilege-and-integrity.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-07-004** [NEEDS_REVIEW] Remove dangerous default privileges.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-07-database-privilege-and-integrity.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-07-007** [NEEDS_REVIEW] Enforce tenant-aware foreign-key relationships.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-07-database-privilege-and-integrity.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-07-008** [NEEDS_REVIEW] Use composite tenant-aware constraints where needed.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-07-database-privilege-and-integrity.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-07-009** [NEEDS_REVIEW] Prevent child records from attaching to another tenant's parent.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-07-database-privilege-and-integrity.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-07-010** [NEEDS_REVIEW] Define safe cascading-deletion behavior.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-07-database-privilege-and-integrity.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-07-011** [NEEDS_REVIEW] Add integrity checks for membership, role, grant, and enrollment relationships.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-07-012** [NEEDS_REVIEW] Enforce uniqueness under the correct tenant scope.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-07-013** [NEEDS_REVIEW] Avoid raw SQL where reviewed query builders or parameterized SQL suffice.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-07-database-privilege-and-integrity.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-07-014** [NEEDS_REVIEW] Audit all dynamic SQL.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-07-database-privilege-and-integrity.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-07-015** [NEEDS_REVIEW] Prevent mass assignment and unsafe model updates.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-07-016** [NEEDS_REVIEW] Apply strict transactional checks around security-sensitive writes.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-07-017** [NEEDS_REVIEW] Handle concurrent role revocation and mutation races.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-07-018** [NEEDS_REVIEW] Use migration checks, rollback procedures, and production-safe sequencing.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-07-database-privilege-and-integrity.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-07-019** [NEEDS_REVIEW] Continuously detect database privilege and RLS-policy drift.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-07-001** [NEEDS_OWNER] Create separate database identities for application runtime, migrations, scheduled jobs, external workers, and emergency administration.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-07-database-privilege-and-integrity.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-07-005** [NEEDS_OWNER] Restrict database network access to authorized workloads.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-07-database-privilege-and-integrity.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-07-006** [NEEDS_OWNER] Require encrypted database connections with certificate validation.

### SEC-08 - API authorization and object-level security

- [ ] **SEC-08-001** [NEEDS_REVIEW] Inventory every API route and exported HTTP method.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-08-002** [NEEDS_REVIEW] Classify every endpoint as public, authenticated, privileged, service-to-service, or webhook.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-08-004** [NEEDS_REVIEW] Require authentication on every nonpublic endpoint.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-08-006** [NEEDS_REVIEW] Require persisted resource ownership checks for every resource ID.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-08-007** [NEEDS_REVIEW] Prevent broken object-level authorization (BOLA/IDOR).
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-08-008** [NEEDS_REVIEW] Prevent broken function-level authorization.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-08-009** [NEEDS_REVIEW] Prevent unauthorized field-level reads and writes.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-08-010** [NEEDS_REVIEW] Reject unsafe mass assignment.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-08-011** [NEEDS_REVIEW] Validate inputs using strict schemas.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-08-012** [NEEDS_REVIEW] Remove or reject unrecognized security-sensitive fields.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-08-013** [NEEDS_REVIEW] Enforce maximum request body sizes.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-08-014** [NEEDS_REVIEW] Enforce maximum pagination, batch, and export sizes.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-08-015** [NEEDS_REVIEW] Apply rate limits and abuse controls per endpoint risk.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-08-016** [NEEDS_REVIEW] Protect cookie-authenticated mutations against CSRF.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-08-017** [NEEDS_REVIEW] Validate Origin/Host/proxy assumptions.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-08-018** [NEEDS_REVIEW] Avoid leaking internal errors, SQL details, and secrets.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-08-019** [NEEDS_REVIEW] Use consistent authorization failure semantics.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-08-020** [NEEDS_REVIEW] Protect asynchronous export and report endpoints.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-08-021** [NEEDS_REVIEW] Protect less-obvious endpoints such as counts, autocomplete, previews, and download links.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-08-022** [NEEDS_REVIEW] Ensure authorization applies to background processing initiated by an API.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-08-023** [NEEDS_REVIEW] Fail CI when a new route lacks security classification.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-08-003** [NEEDS_OWNER] Define required roles, permissions, and resource scopes.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-08-005** [NEEDS_OWNER] Require explicit permission checks for every protected action.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-08-024** [NEEDS_OWNER] Require negative tests for every sensitive API method.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-03-04-08-access-control.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.

### SEC-09 - Secrets, API keys, and cryptographic security

- [ ] **SEC-09-001** [NEEDS_REVIEW] Inventory every application secret, API key, database credential, webhook secret, and signing key.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-09-12-21-secrets-browser-backup.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-09-002** [NEEDS_REVIEW] Establish clear ownership and purpose for each secret.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-09-15-16-17-21-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-09-003** [NEEDS_REVIEW] Ensure no production secrets remain in source code, Git history, images, documentation, or test fixtures.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-09-005** [NEEDS_REVIEW] Implement continuous secret scanning across commits and pull requests.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-09-12-21-secrets-browser-backup.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-09-006** [NEEDS_REVIEW] Scan historical Git commits, not only the latest source tree.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-09-15-16-17-21-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-09-011** [NEEDS_REVIEW] Apply expiration and regular rotation where supported.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-09-012** [NEEDS_REVIEW] Support overlapping keys for safe zero-downtime rotation.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-09-014** [NEEDS_REVIEW] Keep secrets out of request logs, exception logs, telemetry, and traces.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-09-016** [NEEDS_REVIEW] Use established, reviewed cryptographic libraries and algorithms.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-09-15-16-17-21-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-09-018** [NEEDS_REVIEW] Define emergency key-revocation and compromised-credential procedures.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-09-007** [NEEDS_OWNER] Use a managed secret store rather than application configuration files containing raw production secrets.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-09-12-21-secrets-browser-backup.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-09-004** [NEEDS_OWNER] Rotate every known or suspected exposed credential.
- [ ] **SEC-09-008** [NEEDS_OWNER] Prefer workload identity and short-lived credentials over static keys.
- [ ] **SEC-09-009** [NEEDS_OWNER] Use different credentials for development, staging, and production.
- [ ] **SEC-09-010** [NEEDS_OWNER] Scope each third-party key to minimum required privileges.
- [ ] **SEC-09-013** [NEEDS_OWNER] Restrict access to production secrets by operator and service identity.
- [ ] **SEC-09-015** [NEEDS_OWNER] Protect cryptographic keys with a managed KMS; consider HSM-backed controls for particularly sensitive signing operations.
- [ ] **SEC-09-017** [NEEDS_OWNER] Manage encryption key versions and revocation.

### SEC-10 - Encryption and sensitive data protection

- [ ] **SEC-10-001** [NEEDS_REVIEW] Enforce TLS for all external application traffic.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-10-encryption-and-sensitive-data.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-10-003** [NEEDS_REVIEW] Encrypt databases, storage buckets, and backups at rest.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-10-encryption-and-sensitive-data.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-10-005** [NEEDS_REVIEW] Classify student identity, contact, assessment, academic, placement, and employment information by sensitivity.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-10-008** [NEEDS_REVIEW] Define approved data handling rules for each role.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-10-009** [NEEDS_REVIEW] Prevent exposing sensitive data through error responses.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-10-encryption-and-sensitive-data.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-10-010** [NEEDS_REVIEW] Protect personal data in analytics and reporting systems.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-10-encryption-and-sensitive-data.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-10-011** [NEEDS_REVIEW] Use pseudonymization or aggregation for suitable analytics workloads.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-10-encryption-and-sensitive-data.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-10-012** [NEEDS_REVIEW] Require elevated authorization for bulk personal-data exports.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-10-encryption-and-sensitive-data.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-10-013** [NEEDS_REVIEW] Prevent sensitive information from being included in browser-accessible application state unnecessarily.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-10-014** [NEEDS_REVIEW] Prevent sensitive responses from being cached inappropriately.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-10-encryption-and-sensitive-data.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-10-015** [NEEDS_REVIEW] Test cryptographic key-loss and rotation procedures.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-10-004** [NEEDS_OWNER] Apply field-level encryption to selected highly sensitive values when justified by the threat model.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-10-encryption-and-sensitive-data.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-10-002** [NEEDS_OWNER] Enforce TLS between internal services and databases where appropriate.
- [ ] **SEC-10-006** [NEEDS_OWNER] Minimize data stored in the first place.
- [ ] **SEC-10-007** [NEEDS_OWNER] Restrict personal data returned from APIs to explicitly required fields.
- [ ] **SEC-10-016** [NEEDS_OWNER] Verify that development and test environments do not contain unprotected production student data.

### SEC-11 - File uploads, documents, and storage

- [ ] **SEC-11-002** [NEEDS_REVIEW] Authorize each file against its owning tenant, user, and resource.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-11-file-uploads-and-storage.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-11-003** [NEEDS_REVIEW] Use short-lived signed download URLs when appropriate.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-11-file-uploads-and-storage.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-11-004** [NEEDS_REVIEW] Avoid long-lived publicly accessible document links.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-11-005** [NEEDS_REVIEW] Verify that signed URLs cannot be reused outside their intended scope.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-11-006** [NEEDS_REVIEW] Use opaque storage keys, not user-controlled filesystem paths.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-11-007** [NEEDS_REVIEW] Validate file types using content inspection rather than extensions alone.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-11-file-uploads-and-storage.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-11-009** [NEEDS_REVIEW] Reject executable or dangerous content not required by a workflow.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-11-12-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-11-010** [NEEDS_REVIEW] Enforce file-size, file-count, and total-storage limits.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-11-file-uploads-and-storage.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-11-011** [NEEDS_REVIEW] Defend against archive bombs and decompression attacks.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-11-012** [NEEDS_REVIEW] Sanitize filenames and downloadable metadata.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-11-12-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-11-013** [NEEDS_REVIEW] Prevent path traversal.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-11-014** [NEEDS_REVIEW] Prevent insecure direct access to another learner's submission.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-11-12-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-11-015** [NEEDS_REVIEW] Isolate file conversion and preview workers.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-11-016** [NEEDS_REVIEW] Use sandboxed processing for untrusted files and document conversions.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-11-017** [NEEDS_REVIEW] Prevent dangerous HTML/SVG/PDF content from becoming an application-origin script execution path.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-11-12-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-11-019** [NEEDS_REVIEW] Revoke access to shared documents when membership or permissions end.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-11-12-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-11-020** [NEEDS_REVIEW] Audit bulk downloads and sensitive document access.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-11-008** [NEEDS_OWNER] Scan uploaded files for malware.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-11-file-uploads-and-storage.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-11-001** [NEEDS_OWNER] Keep private files in nonpublic storage buckets.
- [ ] **SEC-11-018** [NEEDS_OWNER] Apply retention and deletion policies to submitted documents.

### SEC-12 - Browser and frontend security

- [ ] **SEC-12-001** [NEEDS_REVIEW] Implement a strict Content Security Policy.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-09-12-21-secrets-browser-backup.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-12-002** [NEEDS_REVIEW] Remove avoidable `unsafe-inline` script allowances through a tested nonce/hash strategy.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-12-003** [NEEDS_REVIEW] Prevent stored and reflected XSS.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-11-12-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-12-004** [NEEDS_REVIEW] Sanitize rich-text course and assessment content.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-11-12-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-12-005** [NEEDS_REVIEW] Treat Markdown, HTML, code previews, and embedded lesson content as untrusted.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-11-12-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-12-006** [NEEDS_REVIEW] Protect against DOM-based XSS.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-12-007** [NEEDS_REVIEW] Avoid dangerous HTML injection and unchecked rendering shortcuts.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-11-12-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-12-008** [NEEDS_REVIEW] Implement protection against clickjacking.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-09-12-21-secrets-browser-backup.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-12-009** [NEEDS_REVIEW] Configure secure frame and embedding rules.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-09-12-21-secrets-browser-backup.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-12-010** [NEEDS_OWNER] Use appropriate HSTS and other security response headers.
  - Next proof: Fetch the headers from the deployed dev host and confirm they are served unchanged by the ingress
- [ ] **SEC-12-011** [NEEDS_REVIEW] Restrict browser permissions through Permissions-Policy.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-09-12-21-secrets-browser-backup.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-12-012** [NEEDS_REVIEW] Restrict cross-origin access and credentialed CORS.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-11-12-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-12-013** [NEEDS_REVIEW] Avoid broad wildcard CORS configurations.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-11-12-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-12-014** [NEEDS_REVIEW] Prevent sensitive data from entering URLs and browser history.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-11-12-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-12-015** [NEEDS_REVIEW] Audit browser storage for credentials and personal information.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-11-12-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-12-016** [NEEDS_REVIEW] Ensure logout clears privileged local application state.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-11-12-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-12-017** [NEEDS_REVIEW] Protect against cross-origin information leaks.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-12-018** [NEEDS_REVIEW] Audit third-party scripts, analytics widgets, and embedded content.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-12-019** [NEEDS_REVIEW] Verify that client-side checks never substitute for server-side authorization.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-11-12-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.

### SEC-13 - Application and business-logic security

- [ ] **SEC-13-001** [NEEDS_REVIEW] Create threat models for all major workflows.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-13-002** [NEEDS_REVIEW] Model malicious users who have valid accounts.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-13-005** [NEEDS_REVIEW] Prevent duplicate actions and replayed mutations.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-13-business-logic.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-13-006** [NEEDS_REVIEW] Use idempotency keys where repeated requests can cause harmful effects.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-13-business-logic.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-13-007** [NEEDS_REVIEW] Protect concurrent writes against race conditions.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-13-business-logic.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-13-008** [NEEDS_REVIEW] Enforce optimistic or pessimistic concurrency control as appropriate.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-13-business-logic.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-13-009** [NEEDS_REVIEW] Prevent self-approval of privileged requests.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-13-011** [NEEDS_REVIEW] Prevent unauthorized changes to historical academic records.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-13-012** [NEEDS_REVIEW] Protect published assessments, scores, and evaluations from unauthorized modification.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-13-013** [NEEDS_REVIEW] Enforce submission ownership and permitted submission windows.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-13-014** [NEEDS_REVIEW] Ensure withdrawn, expired, suspended, and archived entities cannot continue operating.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-13-business-logic.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-13-015** [NEEDS_REVIEW] Validate monetary or billing-related workflows if integrated into vNext.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-13-016** [NEEDS_REVIEW] Review business logic for circumvention through bulk endpoints.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-13-017** [NEEDS_REVIEW] Make security decisions deterministic and testable.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-13-business-logic.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-13-018** [NEEDS_REVIEW] Default to denial on inconsistent or missing security state.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-13-business-logic.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-13-003** [NEEDS_OWNER] Enforce server-side state-machine transitions.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-13-business-logic.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-13-004** [NEEDS_OWNER] Prevent unauthorized workflow skipping.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-13-business-logic.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-13-010** [NEEDS_OWNER] Apply dual approval to particularly sensitive administrative operations.

### SEC-14 - LMS-specific attack scenarios

- [ ] **SEC-14-001** [NEEDS_REVIEW] Module: Courses — Unauthorized enrollment, course edits, hidden content exposure
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-14-002** [NEEDS_REVIEW] Module: Lessons — Accessing paid or restricted lessons without entitlement
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-14-003** [NEEDS_REVIEW] Module: Assignments — Reading another learner's submissions or modifying grades
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-01-10-14-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-14-004** [NEEDS_REVIEW] Module: Quizzes — Accessing unreleased questions, manipulating attempts and scores
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-14-005** [NEEDS_REVIEW] Module: Exams — Answer leakage, impersonation, replay, bypassing time restrictions
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-14-006** [NEEDS_REVIEW] Module: Projects — Cross-team data exposure, forged approvals, unauthorized evaluations
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-14-007** [NEEDS_REVIEW] Module: Placements — Unauthorized student shortlist access, employer data exposure
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-14-008** [NEEDS_REVIEW] Module: Recruiter portal — Company impersonation, forged college grants, unauthorized candidate access
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-14-009** [NEEDS_REVIEW] Module: Faculty — Modifying learners outside assigned course sections
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-14-010** [NEEDS_REVIEW] Module: Mentor — Accessing learners who are not assigned to the mentor
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-14-011** [NEEDS_REVIEW] Module: College Admin — Changing another college's academic or administrative records
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-14-23-24-25-26-remaining.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-14-012** [NEEDS_REVIEW] Module: Super Admin — Platform privilege escalation and unrestricted unaudited access
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-14-23-24-25-26-remaining.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-14-013** [NEEDS_REVIEW] Protect assessment publication and release times.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-14-014** [NEEDS_REVIEW] Prevent direct-answer API calls from exposing unreleased assessment material.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-14-015** [NEEDS_REVIEW] Enforce per-learner attempt limits transactionally.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-14-016** [NEEDS_REVIEW] Protect score calculation integrity.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-14-017** [NEEDS_REVIEW] Make grade changes and overrides attributable and auditable.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-14-018** [NEEDS_REVIEW] Prevent unauthorized certificate issuance or credential forgery.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-14-019** [NEEDS_REVIEW] Use verifiable certificate identifiers and revocation status if certificates are issued.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-14-020** [NEEDS_REVIEW] Protect recruiter access to resumes, profiles, and placement decisions.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-14-021** [NEEDS_REVIEW] Enforce consent and eligibility before exposing learner profiles to recruiters.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-01-10-14-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-14-022** [NEEDS_REVIEW] Check legitimate company-to-college relationships at the time of access.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-01-10-14-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-14-023** [NEEDS_REVIEW] Prevent fraudulent attendance, assessment completion, and placement record updates.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-14-024** [NEEDS_REVIEW] Test every bulk upload, import, approval, and export path.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.

### SEC-15 - Integrations, webhooks, and third-party services

- [ ] **SEC-15-001** [NEEDS_REVIEW] Inventory every external provider and integration.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-15-002** [NEEDS_REVIEW] Document the data shared with each provider.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-15-003** [NEEDS_REVIEW] Use separate credentials for every provider and environment.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-15-004** [NEEDS_REVIEW] Validate webhook signatures with provider-specific rules.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-15-integrations-webhooks.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-15-006** [NEEDS_REVIEW] Verify webhook events against the expected organization and resource.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-09-15-16-17-21-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-15-007** [NEEDS_REVIEW] Restrict webhook endpoint methods and payload sizes.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-15-integrations-webhooks.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-15-008** [NEEDS_REVIEW] Reject malformed or unexpected callback fields.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-15-integrations-webhooks.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-15-009** [NEEDS_REVIEW] Prevent callbacks from mutating another tenant's resources.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-09-15-16-17-21-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-15-010** [NEEDS_REVIEW] Validate outbound destinations and defend against SSRF.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-15-011** [NEEDS_REVIEW] Restrict requests to cloud metadata and internal network addresses.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-15-012** [NEEDS_REVIEW] Add safe retry and idempotency behavior.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-09-15-16-17-21-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-15-013** [NEEDS_REVIEW] Prevent untrusted provider responses from overriding authorization decisions.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-15-014** [NEEDS_REVIEW] Encrypt integration tokens at rest.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-15-015** [NEEDS_REVIEW] Revoke integration grants when tenant access ends.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-15-016** [NEEDS_REVIEW] Log security-relevant integration failures without leaking secrets.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-09-15-16-17-21-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-15-017** [NEEDS_REVIEW] Isolate compromised providers and support emergency disablement.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-15-005** [NEEDS_OWNER] Enforce timestamp and replay protection where supported.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-15-integrations-webhooks.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.

### SEC-16 - Background jobs, queues, and internal services

- [ ] **SEC-16-003** [NEEDS_REVIEW] Avoid giving queue workers automatic Super Admin-equivalent authority.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-16-004** [NEEDS_REVIEW] Sign or authenticate internal job requests.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-16-background-jobs.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-16-005** [NEEDS_REVIEW] Propagate verified tenant context into every job.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-16-006** [NEEDS_REVIEW] Recheck authorization when delayed work executes.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-16-007** [NEEDS_REVIEW] Handle revoked membership and expired grants before worker execution.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-16-008** [NEEDS_REVIEW] Prevent job payload tampering and cross-tenant substitution.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-16-009** [NEEDS_REVIEW] Validate messages at queue boundaries.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-09-15-16-17-21-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-16-010** [NEEDS_REVIEW] Implement replay and duplicate-job protections.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-16-011** [NEEDS_REVIEW] Use dead-letter queues and safe failure handling.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-16-012** [NEEDS_REVIEW] Avoid disclosing sensitive job payloads through dashboards or logs.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-16-013** [NEEDS_REVIEW] Restrict manual job triggering to authorized operators.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-16-015** [NEEDS_REVIEW] Audit emergency job reprocessing.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-16-001** [NEEDS_OWNER] Give workers independent service identities.
- [ ] **SEC-16-002** [NEEDS_OWNER] Limit each worker to its required database and service permissions.
- [ ] **SEC-16-014** [NEEDS_OWNER] Isolate scheduler, mail, storage, and analytics worker privileges.

### SEC-17 - Cloud, network, and infrastructure security

- [ ] **SEC-17-001** [NEEDS_REVIEW] Keep production databases off the public internet.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-17-cloud-network-infrastructure.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-17-002** [NEEDS_REVIEW] Restrict inbound network access.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-17-cloud-network-infrastructure.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-17-003** [NEEDS_REVIEW] Restrict sensitive outbound connectivity.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-17-cloud-network-infrastructure.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-17-006** [NEEDS_REVIEW] Harden operating-system and runtime configurations.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-09-15-16-17-21-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-17-007** [NEEDS_REVIEW] Keep container images minimal and patched.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-17-008** [NEEDS_REVIEW] Use non-root application containers.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-17-cloud-network-infrastructure.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-17-009** [NEEDS_REVIEW] Restrict filesystem and container privileges.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-17-cloud-network-infrastructure.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-17-010** [NEEDS_REVIEW] Apply resource and process limits.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-17-cloud-network-infrastructure.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-17-013** [NEEDS_REVIEW] Verify load-balancer and reverse-proxy header trust.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-09-15-16-17-21-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-17-018** [NEEDS_REVIEW] Define infrastructure using reviewed, version-controlled configuration.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-17-019** [NEEDS_REVIEW] Detect infrastructure configuration drift.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-17-020** [NEEDS_REVIEW] Run regular vulnerability and configuration scans.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-17-022** [NEEDS_REVIEW] Remove unused services, ports, and development endpoints.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-17-014** [NEEDS_OWNER] Enforce HTTPS and certificate lifecycle monitoring.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-17-cloud-network-infrastructure.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-17-004** [NEEDS_OWNER] Apply least-privilege service identities.
- [ ] **SEC-17-005** [NEEDS_OWNER] Use workload identity for cloud-to-cloud authentication where supported.
- [ ] **SEC-17-011** [NEEDS_OWNER] Configure production-grade DDoS protection.
- [ ] **SEC-17-012** [NEEDS_OWNER] Implement WAF rules and bot protections where appropriate.
- [ ] **SEC-17-015** [NEEDS_OWNER] Secure DNS and domain ownership.
- [ ] **SEC-17-016** [NEEDS_OWNER] Protect production administration behind strong identity controls.
- [ ] **SEC-17-017** [NEEDS_OWNER] Separate development, staging, and production environments.
- [ ] **SEC-17-021** [NEEDS_OWNER] Restrict access to operational dashboards and monitoring systems.
- [ ] **SEC-17-023** [NEEDS_OWNER] Test service isolation when a workload is compromised.

### SEC-18 - Secure development and software supply chain

- [ ] **SEC-18-002** [NEEDS_OWNER] Require passing security and correctness checks before merging.
  - Next proof: Repository administrator must enforce protected main with required exact-SHA checks and review; re-query branch protection.
- [ ] **SEC-18-004** [NEEDS_OWNER] Define ownership rules for critical security files.
  - Next proof: Enforce code-owner review through branch protection and confirm a review is requested on a security-path pull request
- [ ] **SEC-18-007** [NEEDS_REVIEW] Use short-lived, narrowly scoped CI credentials.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-18-supply-chain-and-ci.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-18-008** [NEEDS_REVIEW] Avoid exposing production secrets to pull-request jobs.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-18-supply-chain-and-ci.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-18-009** [NEEDS_REVIEW] Pin and review third-party GitHub Actions.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-18-supply-chain-and-ci.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-18-010** [NEEDS_OWNER] Generate and maintain a Software Bill of Materials (SBOM).
  - Next proof: Attach the SBOM to each release and add the container image SBOM
- [ ] **SEC-18-011** [NEEDS_REVIEW] Run software composition analysis for vulnerable dependencies.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-18-supply-chain-and-ci.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-18-012** [NEEDS_REVIEW] Run static application security testing.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-18-013** [NEEDS_REVIEW] Run secret scanning.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-18-supply-chain-and-ci.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-18-014** [NEEDS_REVIEW] Review container and infrastructure-as-code security.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-18-015** [NEEDS_OWNER] Use lockfiles and reproducible dependency installation.
  - Next proof: Run the same check on every pull request touching package files and confirm Docker builds use npm ci
- [ ] **SEC-18-016** [NEEDS_REVIEW] Protect release artifacts from unauthorized modification.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-18-019** [NEEDS_REVIEW] Audit transitive dependencies and supply-chain changes.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-18-supply-chain-and-ci.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-18-020** [NEEDS_REVIEW] Block known dangerous dependencies and insecure package versions.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-18-021** [NEEDS_REVIEW] Require explicit security review for new external libraries handling identity or cryptography.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-18-003** [NEEDS_OWNER] Require review for authentication, authorization, database, and infrastructure changes.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-18-supply-chain-and-ci.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-18-005** [NEEDS_OWNER] Keep GitHub permissions least privileged.
  - Next proof: Review repository default workflow permissions, collaborator roles, deploy keys and the schema-drift workflow that pushes to main
- [ ] **SEC-18-018** [NEEDS_OWNER] Establish patch deadlines for critical vulnerabilities.
  - Next proof: Owner confirms the proposed deadlines and exception process; track a first critical advisory (next RCE fixed 2026-11-06) against them
- [ ] **SEC-18-001** [NEEDS_OWNER] Enforce branch protection on `main`.
- [ ] **SEC-18-006** [NEEDS_OWNER] Enforce MFA for developers and repository administrators.
- [ ] **SEC-18-017** [NEEDS_OWNER] Introduce signed build artifacts and provenance where practical.

### SEC-19 - Security logging, audit trails, and detection

- [ ] **SEC-19-001** [NEEDS_REVIEW] Create a standardized security event schema.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-19-logging-audit-detection.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-19-002** [NEEDS_REVIEW] Record successful and failed authentications.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-19-logging-audit-detection.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-19-004** [NEEDS_REVIEW] Record permission grants, revocations, and role switching.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-19-005** [NEEDS_REVIEW] Record privileged administrative actions.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-19-006** [NEEDS_REVIEW] Record sensitive data exports and bulk downloads.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-19-logging-audit-detection.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-19-007** [NEEDS_REVIEW] Record tenant and membership changes.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-19-008** [NEEDS_REVIEW] Record blocked cross-tenant and object-access attempts.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-19-009** [NEEDS_REVIEW] Record security-sensitive configuration changes.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-19-010** [NEEDS_REVIEW] Keep audit logs separate from ordinary debugging logs.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-19-logging-audit-detection.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-19-011** [NEEDS_REVIEW] Protect audit logs against unauthorized editing or deletion.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-19-logging-audit-detection.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-19-013** [NEEDS_REVIEW] Define reliable time synchronization and correlation IDs.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-19-logging-audit-detection.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-19-014** [NEEDS_REVIEW] Detect impossible or unusual administrative activity.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-19-015** [NEEDS_REVIEW] Detect unusual authentication failure patterns.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-19-logging-audit-detection.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-19-016** [NEEDS_REVIEW] Detect suspicious API request volumes and object enumeration.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-19-logging-audit-detection.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-19-017** [NEEDS_REVIEW] Detect unexpectedly large data exports.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-19-logging-audit-detection.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-19-018** [NEEDS_REVIEW] Detect secret misuse and abnormal service-to-service access.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-19-020** [NEEDS_REVIEW] Test whether alerts are actually delivered and acted upon.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-19-021** [NEEDS_REVIEW] Apply retention, minimization, and privacy controls to all logs.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-19-012** [NEEDS_OWNER] Use centralized, access-controlled log collection.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-19-logging-audit-detection.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-19-019** [NEEDS_OWNER] Establish alert severity and on-call ownership.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-19-logging-audit-detection.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-19-003** [NEEDS_OWNER] Record MFA changes and account recovery.

### SEC-20 - Incident response and breach containment

- [ ] **SEC-20-001** [NEEDS_REVIEW] Write an incident-response plan.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-20-002** [NEEDS_REVIEW] Identify who can declare a security incident.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-20-003** [NEEDS_REVIEW] Define severity levels and escalation procedures.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-20-005** [NEEDS_REVIEW] Create playbooks for compromised administrator accounts.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-20-006** [NEEDS_REVIEW] Create playbooks for exposed API keys.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-20-007** [NEEDS_REVIEW] Create playbooks for unauthorized database access.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-20-008** [NEEDS_REVIEW] Create playbooks for cross-college data exposure.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-20-009** [NEEDS_REVIEW] Create playbooks for compromised storage objects.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-20-010** [NEEDS_REVIEW] Create playbooks for malicious third-party integrations.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-20-011** [NEEDS_REVIEW] Implement rapid credential revocation and rotation.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-20-012** [NEEDS_REVIEW] Implement account and tenant emergency lockout controls.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-20-013** [NEEDS_REVIEW] Support emergency disabling of vulnerable integrations and features.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-20-014** [NEEDS_REVIEW] Preserve security evidence appropriately.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-20-015** [NEEDS_REVIEW] Define secure forensic investigation procedures.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-20-018** [NEEDS_REVIEW] Review root causes and close follow-up issues.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-20-019** [NEEDS_REVIEW] Track detection time, containment time, and recovery time.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-20-004** [NEEDS_OWNER] Maintain an emergency contact roster.
- [ ] **SEC-20-016** [NEEDS_OWNER] Determine contractual and legal incident-notification obligations.
- [ ] **SEC-20-017** [NEEDS_OWNER] Run tabletop exercises and incident simulations.

### SEC-21 - Backup, disaster recovery, and resilience

- [ ] **SEC-21-002** [NEEDS_REVIEW] Enable automated production database backups.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-21-005** [NEEDS_REVIEW] Test recovery against a disposable environment.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-21-006** [NEEDS_REVIEW] Verify backup data integrity.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-21-010** [NEEDS_REVIEW] Document restoration sequencing across databases, storage, and queues.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-21-011** [NEEDS_REVIEW] Establish availability monitoring.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-21-012** [NEEDS_REVIEW] Use safe retry and graceful degradation.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-21-014** [NEEDS_REVIEW] Prevent a failed dependency from causing an insecure authorization fallback.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-09-15-16-17-21-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-21-001** [NEEDS_OWNER] Define recovery point and recovery time objectives.
- [ ] **SEC-21-003** [NEEDS_OWNER] Protect backups with separate identities and encryption.
- [ ] **SEC-21-004** [NEEDS_OWNER] Maintain isolated or immutable backups where practical.
- [ ] **SEC-21-007** [NEEDS_OWNER] Protect backup encryption keys.
- [ ] **SEC-21-008** [NEEDS_OWNER] Test accidental deletion and database corruption recovery.
- [ ] **SEC-21-009** [NEEDS_OWNER] Test ransomware-style recovery scenarios.
- [ ] **SEC-21-013** [NEEDS_OWNER] Test regional or infrastructure outages where relevant.
- [ ] **SEC-21-015** [NEEDS_OWNER] Verify recovery does not restore revoked permissions or compromised credentials without reconciliation.

### SEC-22 - Privacy and data governance

- [ ] **SEC-22-001** [NEEDS_REVIEW] Maintain a personal-data inventory.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-22-002** [NEEDS_REVIEW] Classify student and employee data by sensitivity.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-22-007** [NEEDS_REVIEW] Track data-sharing relationships with colleges and recruiters.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-22-008** [NEEDS_REVIEW] Apply consent and visibility rules to candidate discovery.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-20-26-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-22-003** [NEEDS_OWNER] Document the lawful basis and purposes for processing.
- [ ] **SEC-22-004** [NEEDS_OWNER] Define retention periods by data category.
- [ ] **SEC-22-005** [NEEDS_OWNER] Implement authorized data correction and deletion workflows.
- [ ] **SEC-22-006** [NEEDS_OWNER] Respect applicable privacy rights.
- [ ] **SEC-22-009** [NEEDS_OWNER] Restrict unnecessary data sharing with external vendors.
- [ ] **SEC-22-010** [NEEDS_OWNER] Evaluate children's and minors' data requirements where applicable.
- [ ] **SEC-22-011** [NEEDS_OWNER] Prevent test accounts from exposing real student data.
- [ ] **SEC-22-012** [NEEDS_OWNER] Implement secure data disposal.
- [ ] **SEC-22-013** [NEEDS_OWNER] Review cross-border transfers and data residency requirements.
- [ ] **SEC-22-014** [NEEDS_OWNER] Validate applicable Indian and international privacy obligations with qualified counsel.
- [ ] **SEC-22-015** [NEEDS_OWNER] Assess whether specific customers trigger additional contractual, educational, or sector-specific obligations.

### SEC-23 - Automated security testing

- [ ] **SEC-23-001** [NEEDS_REVIEW] Run authentication regression tests.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-20-26-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-23-002** [NEEDS_REVIEW] Run permission-matrix tests for every role.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-23-003** [NEEDS_REVIEW] Run role-switching tests.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-20-26-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-23-004** [NEEDS_REVIEW] Run account-disable and membership-revocation tests.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-20-26-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-23-005** [NEEDS_REVIEW] Run cross-college tests.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-23-006** [NEEDS_REVIEW] Run cross-organization tests.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-23-007** [NEEDS_REVIEW] Run same-college, different-user isolation tests.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-23-008** [NEEDS_REVIEW] Run direct-object-ID manipulation tests.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-23-009** [NEEDS_REVIEW] Run forbidden-field and mass-assignment tests.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-23-010** [NEEDS_REVIEW] Run CSRF tests.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-20-26-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-23-011** [NEEDS_REVIEW] Run XSS and injection tests.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-23-012** [NEEDS_REVIEW] Run SSRF tests.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-23-013** [NEEDS_REVIEW] Run authentication and OTP replay tests.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-23-014** [NEEDS_REVIEW] Run session revocation and concurrent-request tests.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-20-26-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-23-015** [NEEDS_REVIEW] Run RLS tests using the real restricted application database role.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-14-23-24-25-26-remaining.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-23-016** [NEEDS_REVIEW] Run database migration and privilege-drift tests.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-23-017** [NEEDS_REVIEW] Run file-upload and signed-URL authorization tests.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-23-018** [NEEDS_REVIEW] Run webhook signature and replay tests.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-23-019** [NEEDS_REVIEW] Run cache and background-job isolation tests.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-23-020** [NEEDS_REVIEW] Run concurrency and transaction-race tests.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-20-26-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-23-021** [NEEDS_REVIEW] Test behavior under partial provider failures.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-23-022** [NEEDS_REVIEW] Require security tests to run automatically for relevant changes.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-14-23-24-25-26-remaining.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-23-023** [NEEDS_REVIEW] Keep dedicated disposable PostgreSQL fixtures for adversarial tests.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-14-23-24-25-26-remaining.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-23-025** [NEEDS_REVIEW] Prevent test skips or weakened assertions from falsely satisfying acceptance.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-23-024** [NEEDS_OWNER] Fail the release when critical security tests fail.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-14-23-24-25-26-remaining.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.

### SEC-24 - Independent security testing

- [ ] **SEC-24-001** [NEEDS_OWNER] Commission architecture and threat-model reviews.
- [ ] **SEC-24-002** [NEEDS_OWNER] Conduct authenticated and unauthenticated penetration testing.
- [ ] **SEC-24-003** [NEEDS_OWNER] Test every major account type.
- [ ] **SEC-24-004** [NEEDS_OWNER] Perform multi-tenant authorization testing.
- [ ] **SEC-24-005** [NEEDS_OWNER] Include source-assisted testing for complex RBAC and RLS rules.
- [ ] **SEC-24-006** [NEEDS_OWNER] Conduct cloud configuration assessments.
- [ ] **SEC-24-007** [NEEDS_OWNER] Conduct external attack-surface assessments.
- [ ] **SEC-24-008** [NEEDS_OWNER] Review database privilege design independently.
- [ ] **SEC-24-009** [NEEDS_OWNER] Review administrator recovery and MFA bypass risks.
- [ ] **SEC-24-010** [NEEDS_OWNER] Test provider compromise scenarios.
- [ ] **SEC-24-011** [NEEDS_OWNER] Conduct independent testing after major security architecture changes.
- [ ] **SEC-24-012** [NEEDS_OWNER] Retest every critical or high-severity remediation.
- [ ] **SEC-24-013** [NEEDS_OWNER] Establish coordinated vulnerability disclosure.
- [ ] **SEC-24-014** [NEEDS_OWNER] Consider a managed bug bounty after the system is mature enough to support one.

### SEC-25 - Security governance and organizational controls

- [ ] **SEC-25-002** [NEEDS_REVIEW] Maintain an authoritative security risk register.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-25-003** [NEEDS_REVIEW] Track security findings with evidence-based closure.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-20-26-batch-2026-11-08.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-25-004** [NEEDS_REVIEW] Define a secure coding standard.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-25-005** [NEEDS_REVIEW] Require threat modeling for high-risk changes.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-25-011** [NEEDS_REVIEW] Maintain written change-management procedures.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-25-015** [NEEDS_REVIEW] Track security exceptions with owners and expiration dates.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-25-016** [NEEDS_REVIEW] Build an evidence collection process for future ISO 27001 or SOC 2 assessment.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-25-013** [NEEDS_OWNER] Define vulnerability response deadlines.
  - Next proof: Owner approval of the deadlines and a named person accountable for meeting them
- [ ] **SEC-25-001** [NEEDS_OWNER] Assign accountable owners for application, infrastructure, data, and incident security.
- [ ] **SEC-25-006** [NEEDS_OWNER] Establish formal access-review schedules.
- [ ] **SEC-25-007** [NEEDS_OWNER] Remove unnecessary developer and production access.
- [ ] **SEC-25-008** [NEEDS_OWNER] Separate production operations from ordinary development access.
- [ ] **SEC-25-009** [NEEDS_OWNER] Require MFA for source control and production infrastructure.
- [ ] **SEC-25-010** [NEEDS_OWNER] Require security reviews for new vendors.
- [ ] **SEC-25-012** [NEEDS_OWNER] Review security policies regularly.
- [ ] **SEC-25-014** [NEEDS_OWNER] Train people with privileged operational access.

### SEC-26 - Advanced controls for particularly sensitive operations

- [ ] **SEC-26-003** [NEEDS_REVIEW] Time-limited access grants with automatic expiration.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-26-007** [NEEDS_REVIEW] Tamper-evident security audit storage.
  - Next proof: Independent review of the assessment docs/security/assessments/SEC-14-23-24-25-26-remaining.md and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-26-008** [NEEDS_REVIEW] Automated detection of abnormal data movement.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-26-014** [NEEDS_REVIEW] Security regression suites based on previous real incidents.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-26-015** [NEEDS_REVIEW] Production policy-drift detection.
  - Next proof: Independent review of the assessment scripts/security/dispositions.json and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.
- [ ] **SEC-26-001** [NEEDS_OWNER] Hardware-backed, phishing-resistant authentication for the most powerful administrators.
- [ ] **SEC-26-002** [NEEDS_OWNER] Just-in-time privileged access rather than permanently elevated operational access.
- [ ] **SEC-26-004** [NEEDS_OWNER] Two-person approval for especially high-impact platform operations.
- [ ] **SEC-26-005** [NEEDS_OWNER] Independent approval for changes to Super Admin assignments.
- [ ] **SEC-26-006** [NEEDS_OWNER] A tightly controlled emergency-access procedure with mandatory review.
- [ ] **SEC-26-009** [NEEDS_OWNER] Contextual risk scoring for sensitive administrator operations.
- [ ] **SEC-26-010** [NEEDS_OWNER] Stronger cryptographic signing for important issued credentials and certificates.
- [ ] **SEC-26-011** [NEEDS_OWNER] Periodic red-team exercises.
- [ ] **SEC-26-012** [NEEDS_OWNER] Continuous attack-surface monitoring.
- [ ] **SEC-26-013** [NEEDS_OWNER] Security chaos testing: intentional failure of dependencies and controls in isolated environments.
- [ ] **SEC-26-016** [NEEDS_OWNER] Independent verification of the most critical controls.
