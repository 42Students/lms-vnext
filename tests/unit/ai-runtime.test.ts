import {
  describe,
  expect,
  it,
} from "vitest";
import type {
  AiProvider,
} from "@/ai/provider";
import {
  generateWithAiProvider,
  type AiRuntimeMetric,
} from "@/ai/runtime";
import {
  executeAiTool,
  listAiTools,
} from "@/ai/tools/registry";
import type {
  RequestContext,
} from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";

const learner: RequestContext = {
  user: {
    id: SEED_IDS.learnerUser,
    identityUid: "seed-learner",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.learnerCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["LEARNER"],
  },
};

describe("AI runtime foundation", () => {
  it("records provider latency and usage without changing the provider result", async () => {
    const provider: AiProvider = {
      id: "fake-provider",
      async generate(input) {
        return {
          text: "ready",
          model: input.model,
          finishReason: "stop",
          usage: {
            inputTokens: 11,
            outputTokens: 3,
            totalTokens: 14,
            costMicros: 25,
          },
        };
      },
    };
    const metrics: AiRuntimeMetric[] = [];

    const result =
      await generateWithAiProvider(
        provider,
        {
          model: "fake-model",
          messages: [
            {
              role: "user",
              content: "Status?",
            },
          ],
        },
        {
          onMetric(metric) {
            metrics.push(metric);
          },
        },
      );

    expect(result).toMatchObject({
      text: "ready",
      model: "fake-model",
      usage: {
        totalTokens: 14,
        costMicros: 25,
      },
    });
    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toMatchObject({
      operation: "generate",
      providerId: "fake-provider",
      model: "fake-model",
      outcome: "success",
      usage: {
        inputTokens: 11,
        outputTokens: 3,
        totalTokens: 14,
        costMicros: 25,
      },
    });
    expect(
      metrics[0]!.latencyMs,
    ).toBeGreaterThanOrEqual(0);
  });

  it("records failed provider calls without swallowing the provider error", async () => {
    const provider: AiProvider = {
      id: "failing-provider",
      async generate() {
        throw new Error(
          "provider unavailable",
        );
      },
    };
    const metrics: AiRuntimeMetric[] = [];

    await expect(
      generateWithAiProvider(
        provider,
        {
          model: "fake-model",
          messages: [],
        },
        {
          onMetric(metric) {
            metrics.push(metric);
          },
        },
      ),
    ).rejects.toThrow(
      "provider unavailable",
    );

    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toMatchObject({
      providerId: "failing-provider",
      model: "fake-model",
      outcome: "error",
      usage: null,
    });
  });

  it("exposes only explicit tools and rejects unknown or malformed tool requests before domain execution", async () => {
    expect(
      listAiTools().map(
        (tool) => tool.name,
      ),
    ).toEqual([
      "placements.get_operations",
      "projects.get_readiness",
      "courses.get_learner_progress",
    ]);

    await expect(
      executeAiTool(
        learner,
        "does.not.exist",
        {},
      ),
    ).rejects.toMatchObject({
      code: "AI_TOOL_NOT_FOUND",
    });

    await expect(
      executeAiTool(
        learner,
        "projects.get_readiness",
        {
          projectId: "not-a-uuid",
        },
      ),
    ).rejects.toMatchObject({
      code: "AI_TOOL_INVALID_INPUT",
    });
  });
});
