export type ReadinessPayload = {
  status: "ready" | "not_ready";
  service: "lms-vnext";
  timestamp: string;
  dependencies: {
    database: "ok" | "unavailable";
    /** Only present (and "invalid") when production secrets are missing or weak; see readiness-runtime.ts. */
    configuration?: "invalid";
  };
};

export type ReadinessResult = {
  httpStatus: 200 | 503;
  payload: ReadinessPayload;
};

export async function getReadinessResult(
  checkDatabase: () => Promise<void>,
  now = new Date(),
): Promise<ReadinessResult> {
  try {
    await checkDatabase();

    return {
      httpStatus: 200,
      payload: {
        status: "ready",
        service: "lms-vnext",
        timestamp: now.toISOString(),
        dependencies: {
          database: "ok",
        },
      },
    };
  } catch {
    return {
      httpStatus: 503,
      payload: {
        status: "not_ready",
        service: "lms-vnext",
        timestamp: now.toISOString(),
        dependencies: {
          database: "unavailable",
        },
      },
    };
  }
}
