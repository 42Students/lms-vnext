import {
  describe,
  expect,
  it,
} from "vitest";
import {
  percentile,
  resolveLoadTargets,
  summarizeSamples,
  type LoadSample,
} from "../../scripts/load-read";

const SEED_COLLEGE_A =
  "20000000-0000-4000-8000-000000000001";

describe("read load-test harness", () => {
  it("uses nearest-rank percentiles", () => {
    expect(
      percentile(
        [10, 20, 30, 40, 50],
        50,
      ),
    ).toBe(30);
    expect(
      percentile(
        [10, 20, 30, 40, 50],
        95,
      ),
    ).toBe(50);
    expect(percentile([], 95)).toBe(0);
  });

  it("summarizes latency, errors, and status codes", () => {
    const samples: LoadSample[] = [
      {
        name: "learner:courses",
        status: 200,
        latencyMs: 100,
        ok: true,
      },
      {
        name: "learner:courses",
        status: 200,
        latencyMs: 200,
        ok: true,
      },
      {
        name: "learner:courses",
        status: 500,
        latencyMs: 300,
        ok: false,
      },
      {
        name: "learner:courses",
        status: 0,
        latencyMs: 400,
        ok: false,
      },
    ];

    expect(
      summarizeSamples(samples),
    ).toEqual({
      requests: 4,
      errors: 2,
      errorRate: 0.5,
      latencyMs: {
        average: 250,
        p50: 200,
        p95: 400,
        p99: 400,
        max: 400,
      },
      statusCounts: {
        "200": 2,
        "500": 1,
        network_error: 1,
      },
    });
  });

  it("keeps learner and operational hot reads explicit", () => {
    const learner =
      resolveLoadTargets("learner");
    const operations =
      resolveLoadTargets("operations");
    const mixed =
      resolveLoadTargets("mixed");

    expect(learner).toHaveLength(4);
    expect(operations).toHaveLength(4);
    expect(mixed).toHaveLength(8);

    expect(
      learner.map(
        (target) => target.path,
      ),
    ).toContain(
      "/api/courses/learner",
    );
    expect(
      operations.map(
        (target) => target.path,
      ),
    ).toContain(
      "/api/placements/tpo/operations?collegeId=" +
        SEED_COLLEGE_A,
    );
  });
});
