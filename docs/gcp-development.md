# GCP development environment runbook

This runbook captures the vNext GCP1 deployment decisions that can be made without inventing account-specific values.

## Current state

Code is ready for the GCP development environment, but the actual Google Cloud project and primary region have not been supplied/provisioned from this repository.

Do not invent project IDs, regions, instance names, credentials or billing settings in code.

## Locked low-maintenance topology

For the first development environment:

- one Cloud Run service for the vNext application
- one Cloud SQL for PostgreSQL instance
- one dedicated PostgreSQL application user/database
- Cloud Run -> Cloud SQL through the managed Cloud SQL attachment and Unix socket
- local developer -> Cloud SQL through Cloud SQL Auth Proxy using `DATABASE_URL`
- one dedicated Cloud Run runtime service account
- database password stored in Secret Manager
- Application Default Credentials for Firebase Admin / Google APIs
- one Cloud Storage bucket when file workflows begin
- one regional Artifact Registry Docker repository
- no VPC connector/private-IP complexity initially unless a concrete security/network requirement demands it

Keep Cloud Run, Cloud SQL and Artifact Registry in the same primary region where practical.

## Application database configuration

### Local / Cloud SQL Auth Proxy

Use `DATABASE_URL=postgresql://<user>:<password>@127.0.0.1:5432/lms_vnext`.

### Cloud Run / Cloud SQL attachment

Do not set `DATABASE_URL`. Configure:

- `DB_USER=lms_vnext_app`
- `DB_PASSWORD=<Secret Manager injection>`
- `DB_NAME=lms_vnext`
- `INSTANCE_UNIX_SOCKET=/cloudsql/<PROJECT_ID>:<REGION>:<INSTANCE_ID>`
- `DB_POOL_MAX=5`

The runtime accepts exactly one database strategy and fails closed on partial or mixed configuration.

## Runtime service account

Create a dedicated runtime identity such as `lms-vnext-dev-runtime@<PROJECT_ID>.iam.gserviceaccount.com`.

Grant only what the running application needs:

- Cloud SQL Client
- Secret Manager Secret Accessor only for the specific secrets it consumes
- Storage Object permissions only on the vNext bucket when storage code exists

Do not ship a service-account JSON file inside the image.

## Database user strategy

Use a dedicated built-in PostgreSQL user for the application initially:

- database: `lms_vnext`
- user: `lms_vnext_app`
- password: generated random secret

The password belongs in Secret Manager. Human/admin database access should use a different identity.

Do not reuse the legacy LMS database user or point vNext at the legacy production database.

## Identity Platform

Initial login provider remains **phone OTP** unless product requirements change before UI1.

When the project is available:

1. enable Identity Platform / Identity Toolkit
2. enable the phone provider
3. ensure project billing/settings required for phone authentication are configured
4. create/register the web application
5. capture the public browser Firebase configuration
6. provide the `NEXT_PUBLIC_FIREBASE_*` values at build time
7. keep Firebase Admin on Application Default Credentials
8. do not expose Admin credentials to the browser

The browser SDK/login UI is UI1 work; this GCP batch only prepares the provider/environment contract.

## Health and readiness

- `GET /health` is liveness only and does not depend on PostgreSQL.
- `GET /ready` performs a database round trip.
- Cloud Run smoke validation should require both endpoints:
  - `/health` -> HTTP 200
  - `/ready` -> HTTP 200 with `database: ok`

Do not make liveness depend on Cloud SQL; a temporary database incident should not create a container restart loop.

## Provisioning order once project ID + region are known

1. select/confirm GCP project
2. choose one primary region
3. enable Cloud Run, Cloud SQL Admin, Artifact Registry, Secret Manager and Identity Toolkit APIs
4. create Artifact Registry Docker repository
5. create Cloud SQL PostgreSQL instance in the same region
6. create `lms_vnext` database and `lms_vnext_app` user
7. store DB password in Secret Manager
8. create the dedicated runtime service account
9. grant Cloud SQL Client and only required secret access
10. build/push the container
11. deploy Cloud Run with the Cloud SQL instance attached
12. inject the DB secret and non-secret env values
13. run committed Drizzle migrations against the dev database
14. enable/configure Identity Platform phone provider and web app
15. smoke `/health` and `/ready`
16. add the storage bucket only when the first file workflow needs it
17. add budgets/alerts before persistent paid use

## Values still required from the actual GCP account

- `GCP_PROJECT_ID`
- `GCP_REGION`
- `CLOUD_SQL_INSTANCE_ID`
- `CLOUD_SQL_CONNECTION_NAME`
- `ARTIFACT_REGISTRY_REPOSITORY`
- `CLOUD_RUN_SERVICE_NAME`
- `RUNTIME_SERVICE_ACCOUNT`
- `DB_PASSWORD_SECRET_NAME`
- `GCS_BUCKET`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Once those values exist, the next implementation batch can add the authenticated dev deployment workflow without placeholders or guessed infrastructure.
