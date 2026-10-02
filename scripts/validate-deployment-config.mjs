const requiredNames = [
  "GCP_PROJECT_ID",
  "GCP_REGION",
  "GAR_REPOSITORY",
  "CLOUD_RUN_SERVICE",
  "CLOUD_SQL_CONNECTION_NAME",
  "CLOUD_RUN_RUNTIME_SERVICE_ACCOUNT",
  "GCP_WORKLOAD_IDENTITY_PROVIDER",
  "GCP_DEPLOYER_SERVICE_ACCOUNT",
  "DB_USER",
  "DB_NAME",
  "DB_PASSWORD_SECRET",
];

function required(env, name, errors) {
  const value = env[name]?.trim();
  if (!value) {
    errors.push(`${name} is required`);
    return "";
  }
  return value;
}

function safeToken(value) {
  return (
    value.length <= 255 &&
    !/[\s,=]/.test(value)
  );
}

export function validateDeploymentConfig(env) {
  const errors = [];

  for (const name of requiredNames) {
    required(env, name, errors);
  }

  if (errors.length > 0) {
    return errors;
  }

  const project = env.GCP_PROJECT_ID.trim();
  const region = env.GCP_REGION.trim();
  const repository = env.GAR_REPOSITORY.trim();
  const service = env.CLOUD_RUN_SERVICE.trim();
  const connection = env.CLOUD_SQL_CONNECTION_NAME.trim();
  const runtimeServiceAccount =
    env.CLOUD_RUN_RUNTIME_SERVICE_ACCOUNT.trim();
  const provider =
    env.GCP_WORKLOAD_IDENTITY_PROVIDER.trim();
  const deployer =
    env.GCP_DEPLOYER_SERVICE_ACCOUNT.trim();
  const dbUser = env.DB_USER.trim();
  const dbName = env.DB_NAME.trim();
  const secret = env.DB_PASSWORD_SECRET.trim();

  if (
    !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(
      project,
    )
  ) {
    errors.push(
      "GCP_PROJECT_ID must look like a canonical Google Cloud project ID",
    );
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)+\d$/.test(region)) {
    errors.push(
      "GCP_REGION must look like a regional location such as asia-south1",
    );
  }

  if (
    !safeToken(repository) ||
    repository.includes("/")
  ) {
    errors.push(
      "GAR_REPOSITORY must be a single safe repository identifier",
    );
  }

  if (
    service.length > 63 ||
    !/^[a-z][a-z0-9-]*[a-z0-9]$/.test(service)
  ) {
    errors.push(
      "CLOUD_RUN_SERVICE must be a valid lowercase Cloud Run service name",
    );
  }

  const connectionParts = connection.split(":");
  if (
    connectionParts.length !== 3 ||
    connectionParts[0] !== project ||
    connectionParts[1] !== region ||
    !/^[a-z][a-z0-9-]*[a-z0-9]$/.test(
      connectionParts[2] ?? "",
    )
  ) {
    errors.push(
      "CLOUD_SQL_CONNECTION_NAME must be PROJECT:REGION:INSTANCE and match GCP_PROJECT_ID/GCP_REGION",
    );
  }

  for (const [name, value] of [
    [
      "CLOUD_RUN_RUNTIME_SERVICE_ACCOUNT",
      runtimeServiceAccount,
    ],
    ["GCP_DEPLOYER_SERVICE_ACCOUNT", deployer],
  ]) {
    if (
      !/^[^\s@]+@[^\s@]+\.iam\.gserviceaccount\.com$/.test(
        value,
      )
    ) {
      errors.push(
        `${name} must be a Google service-account email`,
      );
    }
  }

  if (
    !/^projects\/[^/]+\/locations\/global\/workloadIdentityPools\/[^/]+\/providers\/[^/]+$/.test(
      provider,
    )
  ) {
    errors.push(
      "GCP_WORKLOAD_IDENTITY_PROVIDER must be a full Workload Identity provider resource name",
    );
  }

  for (const [name, value] of [
    ["DB_USER", dbUser],
    ["DB_NAME", dbName],
  ]) {
    if (!/^[A-Za-z_][A-Za-z0-9_]{0,62}$/.test(value)) {
      errors.push(
        `${name} must be a safe unquoted PostgreSQL identifier`,
      );
    }
  }

  if (
    !safeToken(secret) ||
    !/^(?:[A-Za-z0-9_-]+|projects\/[^/]+\/secrets\/[A-Za-z0-9_-]+)$/.test(
      secret,
    )
  ) {
    errors.push(
      "DB_PASSWORD_SECRET must be a Secret Manager secret ID or resource name",
    );
  }

  if (
    env.GCS_BUCKET?.trim() &&
    (
      env.GCS_BUCKET.trim().length > 222 ||
      !/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(
        env.GCS_BUCKET.trim(),
      )
    )
  ) {
    errors.push(
      "GCS_BUCKET must look like a valid Cloud Storage bucket name",
    );
  }

  return errors;
}

const errors = validateDeploymentConfig(process.env);

if (errors.length > 0) {
  process.stderr.write(
    ["Invalid deployment configuration:", ...errors.map((error) => `- ${error}`)].join("\n") +
      "\n",
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Deployment configuration is structurally valid.\n",
  );
}
