# LMS vNext IAM review

This review records the minimum identity boundaries required by the committed vNext runtime and deployment workflow. It is intentionally account-agnostic: project IDs, service-account emails and resource names must come from the actual GCP environment.

## Reviewed implementation

The review is based on:

- `.github/workflows/deploy-development.yml`
- `docs/gcp-development.md`
- `src/auth/firebase-admin.ts`
- `src/auth/session.ts`
- `src/modules/people/firebase-identity-directory.ts`

The deployment workflow builds on the GitHub-hosted runner, authenticates to Google Cloud through Workload Identity Federation, pushes immutable images to Artifact Registry, deploys/executes a Cloud Run migration job, and deploys the browser-facing Cloud Run service. The application runtime uses Application Default Credentials.

## Identity separation

Use three distinct trust boundaries.

### 1. GitHub OIDC principal

The GitHub workflow receives only `contents: read` and `id-token: write`.

It must federate into the deployer service account through Workload Identity Federation. Do not create or store a JSON service-account key in GitHub, the repository, the image or local configuration.

The provider attribute condition should restrict trust to this repository and deployment path. At minimum:

- repository = `42Students/lms-vnext`
- deployment workflow is intended for `refs/heads/main`

If the provider is shared with other repositories, make the repository/ref condition explicit rather than relying only on the workflow's own branch guard.

### 2. Deployer service account

The deployer is CI/CD infrastructure. It must not inherit the application's data-plane permissions.

Current workflow needs:

- Artifact Registry Writer on the vNext Artifact Registry repository, because GitHub pushes both the application and migrator images
- Cloud Run permissions to create/update the application service and migration job and execute the migration job
- Service Account User on the dedicated vNext runtime service account so Cloud Run can be deployed with that identity

The current workflow also uses `--allow-unauthenticated` while deploying the web service. That operation changes the service IAM policy. With the workflow in its current form, using Cloud Run Admin for the deployer is the straightforward predefined-role choice. If the public invoker binding is provisioned separately later, remove `--allow-unauthenticated` from the deployment workflow and reduce the deployer toward Cloud Run Developer plus only the job-execution permission that remains necessary.

Do not grant the deployer:

- Owner or Editor
- Cloud SQL Client merely because the deployed workload needs it
- Secret Manager Secret Accessor for the application DB password
- Firebase Authentication Admin
- Storage object access

Those permissions belong to the runtime identity or resource provisioning path, not GitHub deployment.

### 3. Cloud Run runtime service account

Use one dedicated runtime identity for the application service and the migration job initially. This keeps the first deployment simple while avoiding default-compute identities.

Required by current code/workflow:

- Cloud SQL Client for the attached Cloud SQL instance
- Secret Manager Secret Accessor on the specific DB-password secret only
- Firebase Authentication Admin for the Identity Platform/Firebase Authentication operations the server actually performs

The Firebase Admin usage is concrete, not speculative. vNext currently calls:

- get user by phone
- get user by email
- create user
- update user
- verify ID/session tokens
- create session cookies
- revoke refresh tokens

The predefined Firebase Authentication Admin role contains the required user/session permissions. It is broader than the exact call set, so a custom role can be considered later if security review or compliance requires it; do not add that maintenance burden before there is a concrete requirement.

Do not grant the runtime identity:

- Owner or Editor
- Artifact Registry Writer
- Cloud Run Admin
- broad Secret Manager access across all secrets
- storage permissions before a storage-backed workflow exists

## Artifact Registry access

GitHub/deployer needs write access to the specific repository.

Cloud Run's Google-managed service agent needs image-read behavior required by Cloud Run. Do not replace or manually copy service-agent roles onto human or application principals.

The application runtime itself does not need Artifact Registry Writer.

## Cloud SQL and database privileges

IAM and PostgreSQL privileges are separate.

The runtime service account only needs Cloud SQL Client to connect through the managed Cloud SQL attachment. The application authenticates to PostgreSQL using the dedicated `lms_vnext_app` database user/password supplied through Secret Manager.

The current migration job intentionally reuses the runtime service account and configured DB user. This is acceptable for the first solo-developer deployment. If production later requires schema/data privilege separation, introduce a distinct migration database credential then; do not grant Cloud SQL Admin to the application as a substitute for PostgreSQL privileges.

## Secret Manager

The runtime identity gets Secret Manager Secret Accessor only on the exact DB password secret consumed by Cloud Run.

The deployer passes the secret reference into Cloud Run; it does not need to read the secret payload.

Future secrets must be granted individually rather than by adding project-wide secret access.

## Identity Platform / Firebase Authentication

Identity Platform configuration itself is an environment-provisioning concern. Runtime access is limited to the Admin Auth behavior exercised by the server.

Browser Firebase configuration is public application configuration and must not be confused with Admin credentials. Firebase Admin continues to use Application Default Credentials; no Admin private key is shipped to the browser.

## Cloud Storage

No runtime Storage IAM is required yet because assignment uploads and signed-storage video are intentionally dependency-blocked.

When the first storage workflow is implemented:

1. create one explicit bucket for the environment,
2. define the exact upload/read/signing operations,
3. grant only the bucket/object permissions those operations require,
4. separately evaluate whether signing requires service-account token signing for the chosen implementation,
5. do not pre-grant Storage Admin.

## Public invocation boundary

Only the browser-facing Cloud Run service is intended to be public at the network IAM layer. Application authentication and tenant authorization remain authoritative inside vNext.

The migration job is not a public HTTP service and must not receive an `allUsers` invoker binding.

## Explicitly prohibited shortcuts

- no project Owner for deployer/runtime
- no project Editor for deployer/runtime
- no default Compute Engine service account as the application identity
- no service-account JSON keys
- no secret values committed to GitHub variables or source
- no project-wide Secret Manager accessor when a secret-level binding is sufficient
- no cross-project service-account setup unless a real requirement appears
- no preemptive Storage permissions

## Provisioning-time verification checklist

The design review is complete in-repo. When the actual GCP project exists, verify the concrete bindings before production:

- WIF provider is restricted to `42Students/lms-vnext` and the intended deploy ref/workflow
- deployer has Artifact Registry Writer only on the intended repository
- deployer has the selected Cloud Run deployment role
- deployer has Service Account User only on the vNext runtime service account
- runtime has Cloud SQL Client
- runtime has Secret Manager Secret Accessor only on the DB secret
- runtime has Firebase Authentication Admin only in the vNext project
- no unexpected Owner/Editor bindings exist on deployer/runtime
- web service alone is public
- migration job has no public invoker
- any future bucket permissions are resource-scoped
- IAM changes are reviewed again before production launch

This verification is a deployment prerequisite; it does not require inventing GCP identifiers before the project is provisioned.
