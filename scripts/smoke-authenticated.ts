import { pathToFileURL } from "node:url";

export type AuthenticatedSmokeConfig = {
  baseUrl: URL;
  cookie: string;
  expectedMembershipId: string | null;
  collegeId: string | null;
  forbiddenCollegeId: string | null;
};

type SmokeEnv = Record<
  string,
  string | undefined
>;

export function authenticatedSmokeConfig(
  env: SmokeEnv,
  positionalBaseUrl?: string,
): AuthenticatedSmokeConfig {
  const rawBaseUrl =
    positionalBaseUrl ??
    env.SMOKE_BASE_URL;
  if (!rawBaseUrl) {
    throw new Error(
      "Provide a base URL as the first argument or SMOKE_BASE_URL.",
    );
  }

  const baseUrl = new URL(rawBaseUrl);
  if (
    baseUrl.protocol !== "http:" &&
    baseUrl.protocol !== "https:"
  ) {
    throw new Error(
      "Authenticated smoke target must use http or https.",
    );
  }

  const cookie =
    env.SMOKE_AUTH_COOKIE?.trim();
  if (!cookie) {
    throw new Error(
      "SMOKE_AUTH_COOKIE is required. Use an approved authenticated test session; never enable the E2E identity bypass in production.",
    );
  }

  return {
    baseUrl,
    cookie,
    expectedMembershipId:
      env.SMOKE_EXPECT_MEMBERSHIP_ID?.trim() ||
      null,
    collegeId:
      env.SMOKE_COLLEGE_ID?.trim() ||
      null,
    forbiddenCollegeId:
      env.SMOKE_FORBIDDEN_COLLEGE_ID?.trim() ||
      null,
  };
}

async function fetchJson(
  config: AuthenticatedSmokeConfig,
  pathname: string,
) {
  const response = await fetch(
    new URL(pathname, config.baseUrl),
    {
      headers: {
        accept: "application/json",
        cookie: config.cookie,
      },
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(
        Number(
          process.env.SMOKE_REQUEST_TIMEOUT_MS ??
            "10000",
        ),
      ),
    },
  );

  let body: unknown = null;
  const contentType =
    response.headers.get(
      "content-type",
    ) ?? "";
  if (
    contentType.includes(
      "application/json",
    )
  ) {
    body = await response.json();
  } else {
    await response.arrayBuffer();
  }

  return { response, body };
}

function requireStatus(
  name: string,
  actual: number,
  expected: number,
) {
  if (actual !== expected) {
    throw new Error(
      `${name} expected HTTP ${expected}, received ${actual}`,
    );
  }
}

export function membershipIds(
  payload: unknown,
) {
  if (
    !payload ||
    typeof payload !== "object" ||
    !("memberships" in payload) ||
    !Array.isArray(
      (
        payload as {
          memberships?: unknown;
        }
      ).memberships,
    )
  ) {
    throw new Error(
      "Membership smoke response has an unexpected shape.",
    );
  }

  return (
    payload as {
      memberships: Array<{
        id?: unknown;
      }>;
    }
  ).memberships
    .map((membership) =>
      typeof membership.id === "string"
        ? membership.id
        : null,
    )
    .filter(
      (id): id is string =>
        id !== null,
    );
}

export async function runAuthenticatedSmoke(
  config = authenticatedSmokeConfig(
    process.env,
    process.argv[2],
  ),
) {
  const checks: string[] = [];

  const memberships =
    await fetchJson(
      config,
      "/api/auth/memberships",
    );
  requireStatus(
    "membership resolution",
    memberships.response.status,
    200,
  );
  const ids = membershipIds(
    memberships.body,
  );

  if (
    config.expectedMembershipId &&
    !ids.includes(
      config.expectedMembershipId,
    )
  ) {
    throw new Error(
      "Expected membership is not available to the authenticated identity.",
    );
  }
  checks.push(
    "identity_and_memberships",
  );

  const dashboard = await fetch(
    new URL(
      "/dashboard",
      config.baseUrl,
    ),
    {
      headers: {
        cookie: config.cookie,
      },
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(
        Number(
          process.env.SMOKE_REQUEST_TIMEOUT_MS ??
            "10000",
        ),
      ),
    },
  );
  requireStatus(
    "authenticated dashboard",
    dashboard.status,
    200,
  );
  await dashboard.arrayBuffer();
  checks.push(
    "authenticated_dashboard",
  );

  if (config.collegeId) {
    const ownCollege =
      await fetchJson(
        config,
        `/api/departments?collegeId=${encodeURIComponent(config.collegeId)}`,
      );
    requireStatus(
      "authorized tenant read",
      ownCollege.response.status,
      200,
    );
    checks.push(
      "authorized_tenant_read",
    );
  }

  if (
    config.forbiddenCollegeId
  ) {
    const foreignCollege =
      await fetchJson(
        config,
        `/api/departments?collegeId=${encodeURIComponent(config.forbiddenCollegeId)}`,
      );
    requireStatus(
      "cross-tenant denial",
      foreignCollege.response.status,
      403,
    );

    if (
      !foreignCollege.body ||
      typeof foreignCollege.body !==
        "object" ||
      (
        foreignCollege.body as {
          error?: unknown;
        }
      ).error !== "FORBIDDEN"
    ) {
      throw new Error(
        "Cross-tenant denial returned an unexpected payload.",
      );
    }
    checks.push(
      "cross_tenant_denial",
    );
  }

  process.stdout.write(
    JSON.stringify({
      severity: "INFO",
      event:
        "smoke.authenticated_passed",
      baseUrl:
        config.baseUrl.origin,
      checks,
      membershipCount:
        ids.length,
    }) + "\n",
  );
}

const invokedPath =
  process.argv[1];

if (
  invokedPath &&
  import.meta.url ===
    pathToFileURL(invokedPath).href
) {
  runAuthenticatedSmoke().catch(
    (error) => {
      process.stderr.write(
        `${
          error instanceof Error
            ? error.stack ??
              error.message
            : String(error)
        }\n`,
      );
      process.exitCode = 1;
    },
  );
}
