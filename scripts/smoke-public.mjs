const rawBaseUrl =
  process.argv[2] ?? process.env.SMOKE_BASE_URL;

if (!rawBaseUrl) {
  throw new Error(
    "Usage: node scripts/smoke-public.mjs <base-url>",
  );
}

const baseUrl = new URL(rawBaseUrl);
const retries = Number(process.env.SMOKE_RETRIES ?? "6");
const retryDelayMs = Number(
  process.env.SMOKE_RETRY_DELAY_MS ?? "1000",
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(pathname) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(
        new URL(pathname, baseUrl),
        {
          headers: {
            accept: "application/json",
          },
        },
      );

      if (response.ok) {
        return response;
      }

      lastError = new Error(
        `${pathname} returned HTTP ${response.status}`,
      );
    } catch (error) {
      lastError = error;
    }

    if (attempt < retries) {
      await sleep(retryDelayMs);
    }
  }

  throw lastError ?? new Error(`${pathname} failed`);
}

function requireHeader(response, name, expected) {
  const value = response.headers.get(name);

  if (value !== expected) {
    throw new Error(
      `Expected ${name}=${expected}, received ${value ?? "<missing>"}`,
    );
  }
}

const healthResponse = await request("/health");
const health = await healthResponse.json();

if (
  health.status !== "ok" ||
  health.service !== "lms-vnext"
) {
  throw new Error(
    `Unexpected health payload: ${JSON.stringify(health)}`,
  );
}

requireHeader(
  healthResponse,
  "x-content-type-options",
  "nosniff",
);
requireHeader(
  healthResponse,
  "x-frame-options",
  "DENY",
);
requireHeader(
  healthResponse,
  "referrer-policy",
  "strict-origin-when-cross-origin",
);

const permissionsPolicy =
  healthResponse.headers.get("permissions-policy") ?? "";

for (const directive of [
  "camera=()",
  "microphone=()",
  "geolocation=()",
]) {
  if (!permissionsPolicy.includes(directive)) {
    throw new Error(
      `Permissions-Policy missing ${directive}: ${permissionsPolicy}`,
    );
  }
}

const readyResponse = await request("/ready");
const ready = await readyResponse.json();

if (
  ready.status !== "ready" ||
  ready.service !== "lms-vnext" ||
  ready.dependencies?.database !== "ok"
) {
  throw new Error(
    `Unexpected readiness payload: ${JSON.stringify(ready)}`,
  );
}

process.stdout.write(
  JSON.stringify({
    severity: "INFO",
    event: "smoke.public_passed",
    baseUrl: baseUrl.origin,
    checks: [
      "health",
      "readiness",
      "security_headers",
    ],
  }) + "\n",
);
