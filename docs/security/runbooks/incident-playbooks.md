# Incident severity, escalation and playbooks (SEC-20-001 to 015)

Status: written 2026-11-08, extends `incident-response.md`. Needs the owner's approval and the names in the roster.

## Who can declare an incident (SEC-20-002)
The owner, or anyone with cluster or repository access who sees any trigger below. Declaring is cheap: write the time and what was seen in a new file under `docs/security/incidents/` and tell the owner. A false alarm costs nothing; a late one does.

## Severity (SEC-20-003)
| Level | Meaning | Examples | First response | Escalate to owner |
|---|---|---|---|---|
| S1 | Confirmed exposure or loss of personal data, or an attacker with privileged access | cross-college data returned, admin account taken over, database access by an unknown party, leaked production key in use | contain within 1 hour, within 15 minutes if data is still flowing | immediately, any hour |
| S2 | Credible weakness being exploited or a secret exposed but unused | exposed API key, a bypass found by a user, repeated tripwire findings from one actor | contain within 4 hours | same day |
| S3 | Weakness without exploitation | new vulnerability advisory, failed control found in testing | fix by the patch deadlines | next working day |

## Roster (SEC-20-004)
Incident lead: the owner. Operator: whoever holds cluster access. Scribe: the operator. A named second person and an out-of-hours contact are an owner item (OWNER-ACTIONS 33); until then the owner is the single contact.

## Generic first steps
1. Write the timeline file. Do not delete anything. 2. Decide S1, S2 or S3. 3. Contain (below). 4. Preserve evidence (SEC-20-014): copy pod logs (`kubectl logs`), export the `security_audit_events` rows for the window, run `node scripts/security/audit-chain-verify.mjs` to prove the trail is intact, keep the image digest in use. 5. Eradicate and recover. 6. Review within 5 working days: root cause, what detected it, time to detect, contain and recover (SEC-20-018, 019), tracker entries for follow-ups.

## Playbooks
**Compromised administrator account (SEC-20-005).** Disable the user (College Admin: People > user > suspend; platform: set `platform_status = DISABLED`), which revokes sessions on the next request. Revoke all sessions for the user (`revokeAllSessionsForUser`). List the account's actions: `security_audit_events where actor_user_id = <id>` and the activity log. Reverse role grants made in the window. Review `auth.new_device` events. Sign-in is a one-time code to the contact, so also check whether the contact itself (phone, email) was taken.

**Exposed API key or secret (SEC-20-006, 011).** Identify the secret in `src/security/secret-registry.ts` or the provider consoles. Rotate: for machine secrets set the new value as `<NAME>` and the old as `<NAME>_PREVIOUS`, roll out, then remove `_PREVIOUS`; for `AUTH_SECRET` use `AUTH_SECRET_PREVIOUS` the same way (sessions survive). Provider keys (Exotel, ZeptoMail, R2, Telegram, Google, GitHub): rotate in the provider and in the Kubernetes Secret. Revoke the old value at the provider the same hour. Check `internal.denied` and `api.denied` rows for use of the old value.

**Unauthorized database access (SEC-20-007).** Identify the login (Cloud SQL audit log; the runtime and migrator logins are separate). Rotate the password of that login in Cloud SQL and the matching Secret (`vnext-db`, `vnext-db-migrator`). Check authorized networks and remove any address not recognised. Run `node scripts/security/pg-security-inventory.mjs --check docs/security/pg-security-baseline.json` for privilege drift and the audit chain verifier for tampering.

**Cross-college data exposure (SEC-20-008).** Confirm with the cross-college probe on dev if reproducible. Contain: set the affected route to maintenance (module access rule off, or `MAINTENANCE_MODE=1`), keep row-level security enforcing (`app.rls_mode=enforce`). Find affected rows: audit rows `api.denied` and the not-found tripwire show attempts; the application log shows reads. Notify the affected colleges (SEC-20-016, owner and legal).

**Compromised storage objects (SEC-20-009).** Set `PRIVATE_STORAGE_SCANNER_READY=false` so no new object is served; signed links expire within 5 minutes. List objects by `file.link_issued` digests for the window. Rotate the R2 key. Quarantine suspect rows (status QUARANTINED).

**Malicious or compromised integration (SEC-20-010).** Disable it: unset its secret (the route then answers 503/denied), or turn the module access rule off. Inbound machine routes deny without their secret. The egress policy limits outbound to public HTTPS, so a compromised provider cannot reach the cluster network.

## Emergency controls (SEC-20-012, 013)
| Control | How |
|---|---|
| Lock one account | suspend the membership or disable the user; takes effect on the next request |
| Lock one college | set the college status to suspended (access is refused for all its members) |
| Stop a feature | module access rule off for the college or globally |
| Stop everything but the health check | `MAINTENANCE_MODE=1` |
| Stop machine callers | remove or change the route's secret |
| Revert enforcement (only to restore service) | `PGOPTIONS=-c app.rls_mode=inert` |

## Forensics (SEC-20-015)
Work on copies. Never run queries that modify evidence tables; `security_audit_events` is append-only and hash-chained, so a read-only export plus the verifier output is the primary record. Keep a hash of each exported file in the timeline. Take database snapshots only through the owner (no on-demand backups without approval).

## Notification (SEC-20-016)
Whether and when colleges, learners, regulators or partners must be told depends on the contracts and Indian law (DPDP Act); this is an owner and counsel decision (SEC-22-014). The timeline file is what counsel will ask for first.
