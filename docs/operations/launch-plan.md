# Fresh vNext production launch plan

LMS vNext launches as a greenfield authoritative LMS. There is no legacy traffic cutover and no legacy production data migration.

This plan defines the release gates, launch sequence, rollback triggers, and evidence that must exist before the launch checklist can be closed. Account-specific values remain deliberately blank until the production GCP project exists.

## 1. Go/no-go entry gates

Do not start the production launch until all of the following are true:

- intended vNext feature scope is explicitly accepted
- `main` CI is green for the launch SHA
- critical PostgreSQL integration and browser regression suites are green
- the centralized permission/tenant-isolation validation is green
- production Cloud SQL exists with backup/PITR configured
- the restore rehearsal has passed
- production Cloud Run and Artifact Registry are ready
- production Identity Platform and the approved login provider are working
- required Cloud Storage workflows are provisioned
- production IAM bindings have been reviewed against the documented least-privilege model
- public and authenticated smoke tests pass in the production-shaped environment
- the read-load baseline is recorded for the hot learner and operational paths
- user acceptance is complete
- the application/database rollback procedure has been rehearsed or otherwise validated against the real production environment

A launch candidate is one immutable Git SHA. Do not combine unrelated fixes after go/no-go without restarting the relevant validation gates.

## 2. Launch evidence record

Create one launch record containing:

- launch Git SHA
- CI workflow run
- web image digest/tag
- migrator image digest/tag
- Cloud Run revision
- migration job execution ID/result
- production Cloud SQL instance/region
- backup/PITR verification timestamp
- restore-rehearsal evidence
- Identity Platform smoke result
- authenticated core smoke result
- load-test command/profile/concurrency and p50/p95/p99/error rate
- permission/tenant-isolation test result
- user-acceptance sign-off
- rollback target revision/SHA
- launch operator and timestamp

Do not store secrets, session cookies, OTPs, database passwords, or Identity tokens in this record.

## 3. Pre-launch preparation

Before changing production traffic:

1. confirm the launch SHA is the exact HEAD intended for release;
2. verify no required migration is destructive without a current recovery point;
3. confirm Cloud SQL backup/PITR and deletion protection;
4. capture the current known-good Cloud Run revision if one exists;
5. confirm the migration job and web service use the intended runtime service accounts;
6. confirm production secrets/environment values are present without printing secret values;
7. confirm Identity Platform authorized origins/provider configuration;
8. confirm the storage bucket/CORS/signing configuration required by shipped file workflows;
9. run `npm run smoke:public` against the production-shaped service;
10. run the authenticated smoke path with approved test identities;
11. run `npm run test:load:reads` using the approved production-like test account and record the result;
12. review Error Reporting, Cloud Run metrics, Cloud SQL metrics, Query Insights and backup status.

## 4. Deployment sequence

Use the migration-first ordering in `docs/operations/deployment-and-rollback.md`:

1. authenticate deployment through Workload Identity Federation;
2. build and push immutable web + migrator images for the launch SHA;
3. deploy/update the migration job;
4. execute migrations and require success;
5. deploy the web revision only after migration success;
6. run public health/readiness smoke;
7. run authenticated smoke;
8. verify the production revision and database dependency are healthy;
9. only then declare the release live.

A migration failure is a hard stop and must not be bypassed by deploying the web revision manually.

## 5. Greenfield bootstrap sequence

Because vNext is a fresh system, initial production data is created natively.

After the production application is healthy:

1. bootstrap the first approved Identity Platform identity through the documented secure SUPER_ADMIN bootstrap;
2. verify the SUPER_ADMIN global/unscoped session;
3. create the production Organization;
4. create the first College;
5. configure the verified tenant domain if used;
6. onboard the first College Admin;
7. verify the College Admin can access only the intended College;
8. create the first academic structure through vNext flows;
9. onboard a small approved Faculty/Learner validation set;
10. verify membership switching/role boundaries with only synthetic or approved launch-test identities before broad onboarding.

Do not seed real users through direct ad-hoc SQL.

## 6. Immediate launch validation

After the production revision is live, verify:

- `/health` returns healthy
- `/ready` confirms database/schema readiness
- login succeeds through production Identity Platform
- membership selection/restoration works
- SUPER_ADMIN scope selection works
- College Admin cannot escape its tenant
- representative Academics read/write works
- representative Course learner/faculty/admin reads work
- representative Project learner/mentor/admin reads work
- representative Placement learner/TPO/HR reads work
- Activity/notifications load
- storage-backed upload/playback works if that feature is included in the launch scope
- Error Reporting/structured logs receive the expected production records without sensitive data

Any critical authorization, data-integrity, login, or migration failure is a rollback/blocker condition.

## 7. Rollback triggers

Rollback or stop rollout when any of the following occurs and cannot be corrected safely in-place:

- production login is broadly unavailable
- cross-tenant data exposure or authorization bypass is observed
- migration leaves the schema incompatible with the launched application
- readiness repeatedly fails because of database/schema health
- critical write workflows corrupt or lose data
- severe error rate/latency materially exceeds the validated launch baseline
- storage/auth configuration makes a required launch feature unusable

Use application rollback before database restoration whenever the migrated schema remains backward-compatible with the previous application revision.

Database restoration is an incident recovery action and follows `docs/operations/data-protection.md`.

## 8. Launch monitoring window

During the agreed launch-monitoring window, watch:

- Cloud Run request count, latency, error rate and instance health
- readiness failures
- Identity Platform login/OTP failures and abuse signals
- Cloud SQL CPU, connections, storage and Query Insights
- migration-job failures
- Error Reporting groups
- hot-workflow p95/error rates
- user-reported authorization or navigation failures

Record meaningful findings in the launch record with severity, affected role/module, decision and fix SHA.

Do not close the launch window while a critical/high issue lacks an owner/decision.

## 9. Closeout

The production-launch checklist can be closed only after:

1. the launch revision remains healthy through the monitoring window;
2. critical launch findings are resolved;
3. rollback evidence is retained;
4. launch metrics/evidence are stored;
5. no temporary launch-only access or elevated IAM remains;
6. unused legacy infrastructure, if any still exists, is reviewed separately before retirement.

Legacy retirement is not a prerequisite for the greenfield vNext launch and must not be coupled to the application deployment.
