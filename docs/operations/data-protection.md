# Production data protection policy

This policy defines the minimum database protection baseline for LMS vNext production.

It is a policy/configuration target, not a claim that the production Cloud SQL instance already exists.

## Required Cloud SQL protections

Production PostgreSQL must have:

- automated backups enabled
- point-in-time recovery (PITR) enabled
- at least 14 automated backups retained
- at least 7 days of transaction logs retained for PITR
- final backup on instance deletion enabled with 30-day retention
- an on-demand backup before any deliberately destructive schema/data migration

The 7-day PITR minimum is intentionally compatible with Cloud SQL Enterprise edition. If the selected production edition supports a larger PITR window without disproportionate cost, extending it is allowed.

## Backup timing

Automated backups should run during the lowest expected write-traffic period for the production region.

The exact UTC window is account-bound and must be chosen after the production region and usage pattern are known.

## Migration protection

Normal additive/backward-compatible migrations do not require a manual backup for every deploy.

A fresh on-demand backup is required before a migration that deliberately:

- drops columns/tables
- rewrites large amounts of data
- changes data in a way that is not practically reversible forward
- removes legacy compatibility needed by the previous application revision

The deployment should still prefer expand/contract migration design instead of relying on restore as a normal rollback mechanism.

## Instance deletion protection

Final backup on deletion must be enabled with at least 30 days retention.

Deleting the Cloud SQL instance must never be used as an ordinary deployment/rollback action.

## Restore validation

Before production launch, perform and document a real restore rehearsal.

The rehearsal must:

1. restore a recent automated backup or PITR point into a separate recovery instance
2. apply no destructive changes to the source production-equivalent database
3. verify core schema presence
4. verify representative organization, college, user, membership and role counts
5. verify the application can start against the restored database
6. verify the readiness endpoint reports the restored schema as ready
7. record restore duration, recovery point, operator and result

The checklist item "restore test" remains open until this has been executed against real Cloud SQL.

## Recovery objectives

No contractual RPO/RTO is claimed before production traffic and business requirements are measured.

Operationally, the design should preserve the ability to recover to a recent point inside the configured PITR window and to recover from a retained automated backup if PITR is unsuitable.

## Monitoring

Backup failures, PITR configuration drift and storage pressure must become monitored production signals when the Cloud SQL instance is provisioned.

Do not mark backup monitoring or restore testing complete from documentation alone.
