# Restoration sequence, proposed recovery targets and infrastructure-as-code review (SEC-21-010, SEC-21-001, SEC-18-014)

Written 2026-11-08, needs the owner. Nothing in this file was rehearsed against a restored copy; a restore test is an owner cost decision (OWNER-ACTIONS).

## Proposed recovery targets (owner to confirm)
RPO: 5 minutes (point-in-time recovery is on, 7 days). RTO: 4 hours for the application, 8 hours for a database restore.

## Restoration sequence
1. Decide the incident class and freeze writers: `MAINTENANCE_MODE=1` on the web deployment; suspend CronJobs (`kubectl -n lms-dev-2026 patch cronjob ... -p '{"spec":{"suspend":true}}'`).
2. Restore the database from the Cloud SQL backup or point in time into a NEW instance (never over the live one). Do not restore into production without the owner.
3. Run `scripts/security/pg-security-inventory.mjs --check docs/security/pg-security-baseline.json` and `scripts/security/audit-chain-verify.mjs` against the restored copy: owners, flags, policies and the audit chain must match before any traffic.
4. Reconcile revocations (SEC-21-015): users disabled, memberships ended, grants revoked and sessions revoked since the restore point must be re-applied. The audit trail and `identity_device_sessions.revoked_at` show what to repeat; rotate secrets if the incident involved credentials.
5. Object storage: R2 objects are independent of the database; check generation and size against the restored rows (the read path refuses mismatches), re-run the scanner verdicts for anything uploaded after the restore point.
6. Queues and jobs: outbound messages have idempotency keys; replay is safe, but suppress messages older than their `expires_at`.
7. Point the web deployment's `vnext-db` secret at the restored instance, roll out, check `/ready`, sign in, lift maintenance mode, resume CronJobs.
8. Write the timeline and the measured times (SEC-20-019).

## Infrastructure as code review (SEC-18-014)
Reviewed: `Dockerfile` (multi-stage; `runner` runs as non-root; migrator image contains scripts and no secrets), `deploy/k8s/dev/*.yaml` (non-root uid 1001, read-only root filesystem, seccomp RuntimeDefault, capabilities dropped, resource limits, no service-account token, ingress NetworkPolicy, egress NetworkPolicy, weekly drift CronJob). Findings kept open: images are deployed by digest but not signed (SEC-18-016/017), there is no admission policy requiring a scan result, and the shared `default` service account is used. Deferred to the owner: image signing and an admission policy.
