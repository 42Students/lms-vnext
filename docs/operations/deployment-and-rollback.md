# Deployment and rollback runbook

This runbook defines the minimum operational procedure for deploying and rolling back LMS vNext without inventing environment-specific values.

The development deployment implementation is `.github/workflows/deploy-development.yml`. Production must preserve the same safety ordering when its account-bound resources are created.

## Immutable deployment unit

Every deployment is identified by one Git commit SHA.

The same SHA produces:

- the web image
- the migration image

Do not deploy an uncommitted local build and do not reuse a mutable image tag as the source of truth for rollback.

## Pre-deployment gate

Before deployment:

1. `main` CI must be green
2. generated Drizzle migration state must match committed schema
3. PostgreSQL integration tests must pass
4. the application build must pass
5. any new migration must be reviewed for destructive or long-running operations
6. production-destructive migrations require a verified backup/recovery posture before execution

Do not bypass CI to repair a failed deployment.

## Deployment order

The committed deployment workflow intentionally uses this order:

1. authenticate through Workload Identity Federation
2. build and push immutable web + migrator images
3. deploy/update the Cloud Run migration job
4. execute migrations and wait for success
5. only after migration success, deploy the web revision
6. smoke `/health`
7. smoke `/ready`
8. require readiness to report the migrated database as ready

A failed migration blocks the new web revision from deployment.

## Migration policy

Migrations are forward-only operational history.

Rules:

- never rewrite a migration that has been applied outside a disposable environment
- never use `db:reset` against production
- prefer expand/contract changes when an old and new application revision may overlap
- do not rely on an automatic "down migration"
- if a migration needs correction after being applied, create a new forward migration
- destructive schema/data changes require a deliberate backup and restore plan

## Rollback: migration job fails before web deployment

If the migration job fails:

1. stop the deployment; do not deploy the new web image
2. inspect the migration-job logs and identify which migration failed
3. determine whether the failed migration committed any changes
4. keep serving the previous web revision
5. fix the migration forward in a new commit
6. rerun CI
7. deploy the new commit through the normal migration-first workflow

Do not blindly rerun a migration that may be non-idempotent and do not manually edit Drizzle migration history to make the job appear successful.

## Rollback: new web revision is unhealthy after migration succeeded

If the database migration succeeded but the new web revision is unhealthy:

1. verify whether the previous known-good application revision is compatible with the migrated schema
2. if compatible, restore traffic to or redeploy the previous immutable web image/revision
3. keep the migrated database in place
4. investigate and ship a forward application fix
5. rerun health/readiness and the authenticated smoke flow when available

Do not automatically reverse the database merely because the application revision is rolled back.

This is why schema changes should remain backward-compatible across at least the immediate rollback window whenever practical.

## Rollback: schema/data restoration is actually required

Database restoration is an incident operation, not the default application rollback.

Before production launch, Cloud SQL backup/PITR configuration and a restore test must be completed. Those checklist items remain open until real production infrastructure exists.

If restoration is required:

1. declare the incident and stop writes if continued writes would worsen recovery
2. identify the required recovery point and expected data-loss window
3. restore to a separate recovery instance/database where possible
4. validate schema and critical tenant/user counts
5. reconcile any writes after the recovery point
6. cut application traffic only after validation
7. record the incident, recovery point, affected SHA and follow-up actions

Never run the local `db:reset` workflow as a production recovery mechanism.

## Smoke checks

The shared `scripts/smoke-public.mjs` contract is executed in both normal CI and the development deployment workflow.

Normal CI boots the built standalone Next.js server against the PostgreSQL service and verifies:

- `GET /health`
- `GET /ready`
- readiness database/schema validation
- baseline response security headers

The development deployment workflow runs the same contract against the deployed Cloud Run URL.

Once live browser authentication exists, production smoke coverage must additionally include the core authenticated acceptance path:

- login
- membership selection
- tenant isolation
- one representative admin read/write flow
- logout/session restoration

The committed `npm run smoke:authenticated` harness verifies an already-authenticated real session, membership resolution, dashboard restoration and optional own-college/cross-college read assertions without enabling the E2E bypass. The interactive Identity Platform login/provider and representative authenticated write still require live-environment validation.

Until those live checks exist, do not mark production smoke tests complete.

## Deployment record

For every environment deployment, retain enough information to answer:

- Git SHA
- web image
- migration image
- workflow run
- Cloud Run revision
- migration job execution
- migration result
- smoke result
- operator/time

Cloud Run and GitHub Actions provide most of this history automatically; do not replace it with an undocumented manual process.

## Account-bound work still required

This runbook does not claim production infrastructure exists.

Still required later:

- production Cloud SQL
- backup/PITR policy
- restore test
- production Cloud Run
- production Identity Platform
- production storage when required
- IAM review
- error/alerting configuration
- production smoke and load tests
