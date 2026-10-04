import { pathToFileURL } from "node:url";
import { SEED_IDS } from "./db-seed-data";

export type LoadProfile =
  | "learner"
  | "operations"
  | "mixed";

export type LoadTarget = {
  name: string;
  path: string;
  identityUid: string;
  membershipId: string;
};

export type LoadSample = {
  name: string;
  status: number;
  latencyMs: number;
  ok: boolean;
};

const membershipCookieName =
  "lms_membership";
const e2eIdentityCookieName =
  "lms_e2e_identity";
const e2eSecretCookieName =
  "lms_e2e_secret";

const learnerTargets: LoadTarget[] = [
  {
    name: "learner:courses",
    path: "/api/courses/learner",
    identityUid: "seed-learner",
    membershipId:
      SEED_IDS.learnerCollegeAMembership,
  },
  {
    name: "learner:projects",
    path: "/api/projects/me",
    identityUid: "seed-learner",
    membershipId:
      SEED_IDS.learnerCollegeAMembership,
  },
  {
    name: "learner:placements",
    path: "/api/placements/jobs/me",
    identityUid: "seed-learner",
    membershipId:
      SEED_IDS.learnerCollegeAMembership,
  },
  {
    name: "learner:notifications",
    path: "/api/notifications?limit=20",
    identityUid: "seed-learner",
    membershipId:
      SEED_IDS.learnerCollegeAMembership,
  },
];

const operationsTargets: LoadTarget[] = [
  {
    name: "operations:activity",
    path:
      "/api/activity?collegeId=" +
      SEED_IDS.collegeA +
      "&limit=40",
    identityUid: "seed-college-admin",
    membershipId:
      SEED_IDS.collegeAdminMembership,
  },
  {
    name: "operations:tpo",
    path:
      "/api/placements/tpo/operations?collegeId=" +
      SEED_IDS.collegeA,
    identityUid: "seed-college-admin",
    membershipId:
      SEED_IDS.collegeAdminMembership,
  },
  {
    name: "operations:departments",
    path:
      "/api/departments?collegeId=" +
      SEED_IDS.collegeA,
    identityUid: "seed-college-admin",
    membershipId:
      SEED_IDS.collegeAdminMembership,
  },
  {
    name: "operations:notifications",
    path: "/api/notifications?limit=20",
    identityUid: "seed-college-admin",
    membershipId:
      SEED_IDS.collegeAdminMembership,
  },
];

export function resolveLoadTargets(
  profile: LoadProfile,
): LoadTarget[] {
  if (profile === "learner") {
    return learnerTargets;
  }
  if (profile === "operations") {
    return operationsTargets;
  }
  return [
    ...learnerTargets,
    ...operationsTargets,
  ];
}

export function percentile(
  values: readonly number[],
  percent: number,
) {
  if (values.length === 0) return 0;

  const sorted = [...values].sort(
    (left, right) => left - right,
  );
  const rank = Math.max(
    0,
    Math.ceil(
      (Math.min(
        100,
        Math.max(0, percent),
      ) /
        100) *
        sorted.length,
    ) - 1,
  );

  return sorted[rank] ?? 0;
}

function rounded(value: number) {
  return Math.round(value * 10) / 10;
}

export function summarizeSamples(
  samples: readonly LoadSample[],
) {
  const latencies = samples.map(
    (sample) => sample.latencyMs,
  );
  const errors = samples.filter(
    (sample) => !sample.ok,
  ).length;
  const statusCounts: Record<string, number> =
    {};

  for (const sample of samples) {
    const key =
      sample.status > 0
        ? String(sample.status)
        : "network_error";
    statusCounts[key] =
      (statusCounts[key] ?? 0) + 1;
  }

  const totalLatency = latencies.reduce(
    (sum, latency) => sum + latency,
    0,
  );

  return {
    requests: samples.length,
    errors,
    errorRate:
      samples.length === 0
        ? 1
        : errors / samples.length,
    latencyMs: {
      average:
        samples.length === 0
          ? 0
          : rounded(
              totalLatency /
                samples.length,
            ),
      p50: rounded(
        percentile(latencies, 50),
      ),
      p95: rounded(
        percentile(latencies, 95),
      ),
      p99: rounded(
        percentile(latencies, 99),
      ),
      max: rounded(
        latencies.length > 0
          ? Math.max(...latencies)
          : 0,
      ),
    },
    statusCounts,
  };
}

function positiveNumber(
  raw: string | undefined,
  fallback: number,
  name: string,
) {
  if (raw === undefined) return fallback;
  const value = Number(raw);

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(
      `${name} must be a positive number`,
    );
  }

  return value;
}

function ratio(
  raw: string | undefined,
  fallback: number,
  name: string,
) {
  if (raw === undefined) return fallback;
  const value = Number(raw);

  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1
  ) {
    throw new Error(
      `${name} must be between 0 and 1`,
    );
  }

  return value;
}

function loadProfile(
  raw: string | undefined,
): LoadProfile {
  const value = raw ?? "mixed";

  if (
    value !== "learner" &&
    value !== "operations" &&
    value !== "mixed"
  ) {
    throw new Error(
      "LOAD_PROFILE must be learner, operations, or mixed",
    );
  }

  return value;
}

function cookieHeader(
  target: LoadTarget,
  explicitCookie:
    | string
    | undefined,
  e2eSecret: string | undefined,
) {
  if (explicitCookie?.trim()) {
    return explicitCookie.trim();
  }

  if (
    !e2eSecret ||
    e2eSecret.length < 32
  ) {
    throw new Error(
      "Provide LOAD_COOKIE for a real authenticated account, or E2E_AUTH_SECRET (32+ chars) for the local/dev E2E harness.",
    );
  }

  return [
    `${e2eIdentityCookieName}=${encodeURIComponent(target.identityUid)}`,
    `${e2eSecretCookieName}=${encodeURIComponent(e2eSecret)}`,
    `${membershipCookieName}=${encodeURIComponent(target.membershipId)}`,
  ].join("; ");
}

async function hit(
  baseUrl: URL,
  target: LoadTarget,
  cookie: string,
  timeoutMs: number,
): Promise<LoadSample> {
  const startedAt = performance.now();

  try {
    const response = await fetch(
      new URL(target.path, baseUrl),
      {
        method: "GET",
        headers: {
          accept: "application/json",
          cookie,
        },
        cache: "no-store",
        signal:
          AbortSignal.timeout(timeoutMs),
      },
    );

    await response.arrayBuffer();

    return {
      name: target.name,
      status: response.status,
      latencyMs:
        performance.now() -
        startedAt,
      ok: response.ok,
    };
  } catch {
    return {
      name: target.name,
      status: 0,
      latencyMs:
        performance.now() -
        startedAt,
      ok: false,
    };
  }
}

function groupByTarget(
  samples: readonly LoadSample[],
) {
  const groups = new Map<
    string,
    LoadSample[]
  >();

  for (const sample of samples) {
    const current =
      groups.get(sample.name) ?? [];
    current.push(sample);
    groups.set(sample.name, current);
  }

  return Object.fromEntries(
    [...groups.entries()].map(
      ([name, targetSamples]) => [
        name,
        summarizeSamples(targetSamples),
      ],
    ),
  );
}

export async function runLoadRead() {
  const rawBaseUrl =
    process.argv[2] ??
    process.env.LOAD_BASE_URL ??
    "http://127.0.0.1:3000";
  const baseUrl = new URL(rawBaseUrl);
  const profile = loadProfile(
    process.env.LOAD_PROFILE,
  );
  const durationMs = positiveNumber(
    process.env.LOAD_DURATION_MS,
    15_000,
    "LOAD_DURATION_MS",
  );
  const concurrency = Math.floor(
    positiveNumber(
      process.env.LOAD_CONCURRENCY,
      8,
      "LOAD_CONCURRENCY",
    ),
  );
  const timeoutMs = positiveNumber(
    process.env.LOAD_REQUEST_TIMEOUT_MS,
    10_000,
    "LOAD_REQUEST_TIMEOUT_MS",
  );
  const maxP95Ms = positiveNumber(
    process.env.LOAD_MAX_P95_MS,
    750,
    "LOAD_MAX_P95_MS",
  );
  const maxErrorRate = ratio(
    process.env.LOAD_MAX_ERROR_RATE,
    0.01,
    "LOAD_MAX_ERROR_RATE",
  );
  const targets =
    resolveLoadTargets(profile);
  const explicitCookie =
    process.env.LOAD_COOKIE;
  const e2eSecret =
    process.env.E2E_AUTH_SECRET;

  if (
    baseUrl.protocol !== "http:" &&
    baseUrl.protocol !== "https:"
  ) {
    throw new Error(
      "Load target must use http or https",
    );
  }

  const cookies = new Map(
    targets.map((target) => [
      target.name,
      cookieHeader(
        target,
        explicitCookie,
        e2eSecret,
      ),
    ]),
  );

  for (const target of targets) {
    const warmup = await hit(
      baseUrl,
      target,
      cookies.get(target.name)!,
      timeoutMs,
    );

    if (!warmup.ok) {
      throw new Error(
        `Warm-up failed for ${target.name}: HTTP ${warmup.status || "network_error"}`,
      );
    }
  }

  const samples: LoadSample[] = [];
  const stopAt =
    performance.now() + durationMs;
  let sequence = 0;

  const workers = Array.from(
    { length: concurrency },
    async () => {
      while (performance.now() < stopAt) {
        const target =
          targets[
            sequence % targets.length
          ]!;
        sequence += 1;
        samples.push(
          await hit(
            baseUrl,
            target,
            cookies.get(target.name)!,
            timeoutMs,
          ),
        );
      }
    },
  );

  await Promise.all(workers);

  const summary =
    summarizeSamples(samples);
  const passed =
    summary.errorRate <=
      maxErrorRate &&
    summary.latencyMs.p95 <=
      maxP95Ms;

  process.stdout.write(
    JSON.stringify(
      {
        severity: passed
          ? "INFO"
          : "ERROR",
        event:
          "load.read_completed",
        baseUrl: baseUrl.origin,
        profile,
        durationMs,
        concurrency,
        thresholds: {
          maxP95Ms,
          maxErrorRate,
        },
        summary,
        targets:
          groupByTarget(samples),
        passed,
      },
      null,
      2,
    ) + "\n",
  );

  if (!passed) {
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1];

if (
  invokedPath &&
  import.meta.url ===
    pathToFileURL(invokedPath).href
) {
  runLoadRead().catch((error) => {
    process.stderr.write(
      `${
        error instanceof Error
          ? error.stack ??
            error.message
          : String(error)
      }\n`,
    );
    process.exitCode = 1;
  });
}
