# Logging, alerting, retention, access and secrets handling (SEC-19-012, 019, 020, 021; SEC-09-009, 014, 018; SEC-25-006)

Status: written 2026-11-08, needs the owner's approval.

## What is logged and where
- **Structured application logs** to container stdout, collected by Cloud Logging for the cluster. Access follows Google Cloud IAM (owner decision on who is a viewer).
- **Durable security audit trail** in `security_audit_events` (append-only, hash-chained since migration 0342). Events: `auth.*`, `api.denied`, `api.mutation`, `api.export`, `internal.denied`, `file.link_issued`, `admin_scope.*`, `security.anomaly`.
- **Never logged**: one-time codes, session tokens, secrets, API keys, full contact details, request bodies. Logs carry user ids, hashed IP tags, route names and codes. Secret problems name the variable, not the value (`config.secret_invalid`).

## Retention and minimisation (SEC-19-021)
Audit rows: 365 days, then removed by `scripts/security/audit-retention.mjs` run by the owner (prefix purge, self-recording). Application logs follow the Cloud Logging project retention. Audit detail is a small JSON of codes and counts; no personal content.

## Alert severity and ownership (SEC-19-019)
| Source | Severity | Goes to | Owner |
|---|---|---|---|
| Application error (ERROR log) | S3 unless repeated | Telegram alert module | owner |
| `security.anomaly` (denials, login probing, id walking, export bursts) | S2 | ERROR log, so Telegram, plus audit row | owner |
| Audit chain verifier failure, database drift Job failed | S1 | failed Kubernetes Job; `kubectl get jobs` | owner (a scheduled check that posts to Telegram is a follow-up) |
| `/ready` failing | S2 | load balancer health | owner |
Out-of-hours coverage is a named-person decision (OWNER-ACTIONS 33).

## Alert delivery test (SEC-19-020)
Monthly: trigger a controlled finding by sending 20 denied requests from a test account (the tripwire fires `security.anomaly`) and confirm the Telegram message and the audit row. Record the date in `docs/security/evidence/`. Last verified: the tripwire fired as designed on dev on 2026-11-08 (`security.anomaly` rows exist).

## Access to production-relevant systems (SEC-25-006, 09-009)
Review every quarter and on every departure: GitHub collaborators and Actions permissions, GCP IAM, Kubernetes access (master authorized networks), Cloud SQL authorized networks and logins, Cloudflare R2 keys, ZeptoMail, Exotel, Telegram bot, Google OAuth clients. Output of the review: a dated line in `docs/security/accepted-risks.md` or a tracker entry. Each environment has its own secrets (dev generated 2026-11-08 in `vnext-keys`); production values are never copied to dev.

## Emergency revocation (SEC-09-018)
See the exposed-key playbook in `docs/security/runbooks/incident-playbooks.md`; the overlap variables (`AUTH_SECRET_PREVIOUS`, `<NAME>_PREVIOUS`) allow rotation without signing everyone out.
