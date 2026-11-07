# Incident response runbook (SEC-20), draft 2026-11-08

Grounded in what exists today on dev; production steps are the same commands with the production namespace and need the owner. Draft for the owner to approve and rehearse; nothing here has been exercised as an incident.

## 0. Roles and first 15 minutes

Incident lead (owner today), operator (whoever holds cluster access), scribe (writes the timeline into a new file under `docs/security/incidents/`, never in chat). First actions: write down the time and what was seen; do not delete anything; decide the severity: **S1** data of more than one college exposed or credentials leaked, **S2** one college or an account takeover, **S3** abuse without data exposure.

## 1. Where the evidence is

| Source | How to read it |
|---|---|
| Durable audit trail (append-only) | table `security_audit_events`: `select occurred_at, event, outcome, actor_user_id, college_id, role, method, path, status, ip_tag from security_audit_events where occurred_at > now() - interval '24 hours' order by occurred_at desc;` run as the runtime role in a system scope; events: `api.denied`, `api.mutation`, `api.export`, `action.<name>`, `auth.login_*`, `admin_scope.*`, `internal.denied` |
| Structured logs | `kubectl -n <ns> logs deploy/lms-vnext --since=1h` (`api.audit`, `action.audit`, `auth.login_rejected`, `internal.route_denied`, `config.secret_invalid`); Cloud Logging keeps them |
| Sessions | `identity_device_sessions` (user, device, last seen, revoked) |
| Application errors | tracker log viewer (Super Admin) and the log-alert module (Telegram) |

## 2. Contain (pick what fits; every command is reversible except secret rotation)

| Goal | Command |
|---|---|
| Stop all traffic to the app, keep the pod | `kubectl -n <ns> set env deployment/lms-vnext MAINTENANCE_MODE=1` (proxy answers 503; `/ready` stays) |
| Log one user out everywhere | Super Admin: people page, revoke sessions; or SQL `update identity_device_sessions set revoked_at = now() where user_id = '<id>' and revoked_at is null` (migrator login) |
| Log everyone out | rotate `AUTH_SECRET` (all session digests stop matching) |
| Disable a user | set `users.platform_status` to a non-ACTIVE value (checked on every request, with a row lock) |
| Remove a college's access | set the college status to non-ACTIVE (context resolution requires ACTIVE) |
| Switch off a feature safely | the module-access rules (`module_access_rules`, scope COLLEGE or GLOBAL) |
| Block an abusive IP | not available in-app; ingress rule or Cloud Armor (owner, GCP) |
| Revoke a Super Admin's college scope | the scope expires in 4 hours by itself; clear it with `DELETE /api/auth/admin-scope` |
| Turn off RLS enforcement (only if the lock itself breaks the product) | `kubectl -n <ns> set env deployment/lms-vnext PGOPTIONS-` (this widens access: S1 decision, record it) |

## 3. Credential compromise

1. Treat the value as public. Find where it was used (`secret-registry.ts` lists every secret and its purpose).
2. Generate a new value with at least 32 random bytes; replace it in the Kubernetes secret (`vnext-keys` for machine secrets, `vnext-auth` for `AUTH_SECRET`, `vnext-db`/`vnext-db-migrator` for database logins, `vnext-integrations` for providers); restart the deployment; confirm `/ready` is 200 and no `config.secret_invalid` lines.
3. Known consequences: `AUTH_SECRET` logs everyone out; `DB10_OUTBOUND_ENCRYPTION_KEY_BASE64` cannot decrypt sealed outbound payloads written with the old key (no key versions yet: drain the queue first); database password: change the role password in Cloud SQL, then the secret, then restart.
4. Provider keys (Exotel, ZeptoMail, R2, Telegram): revoke at the provider first.

## 4. Data exposure across colleges

1. Run the isolation sweep (`scripts/rls-isolation-sweep.mjs`) against the affected database to confirm the lock still isolates; run the runtime principal probe (`scripts/security/pg-runtime-principal-probe.mjs`).
2. Pull `security_audit_events` for the window; list exports (`api.export`) and denied reads by the suspect actor.
3. Counts of affected people per college come from the memberships of the actor's scope; write them in the timeline.

## 5. Recover and learn

Restore points: Cloud SQL daily backups and 7-day point-in-time recovery (restore into a new instance, never over the live one; owner decision, billable). After containment: rotate what was exposed, fix the cause, add a test or a guard that fails on the same mistake, update `accepted-risks.md` or the control tracker, and write the post-incident note (what happened, how found, how long, what changed).

## 6. Notification

Decision of the owner with legal advice. Provide: the timeline, the affected colleges and counts, what data fields, what was done. The platform has no breach-notification template yet (owner to supply). Customers on enterprise contracts may require notice within a fixed window: check the contract.

## 7. Gaps this runbook exposes

No alert on audit events yet (Telegram log alerts exist for errors only); no IP block in-app; no key versioning; no rehearsal; no on-call rota; the audit trail has no admin view or retention policy.
