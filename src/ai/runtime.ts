import type {
  AiGenerateInput,
  AiGenerateResult,
  AiProvider,
  AiUsage,
} from "./provider";

export type AiRuntimeMetric = {
  operation: "generate";
  providerId: string;
  model: string;
  outcome: "success" | "error";
  latencyMs: number;
  usage: AiUsage | null;
};

export type AiRuntimeObserver = {
  onMetric(
    metric: AiRuntimeMetric,
  ): void | Promise<void>;
};

export async function generateWithAiProvider(
  provider: AiProvider,
  input: AiGenerateInput,
  observer?: AiRuntimeObserver,
): Promise<AiGenerateResult> {
  const startedAt =
    performance.now();

  try {
    const result =
      await provider.generate(input);
    await observer?.onMetric({
      operation: "generate",
      providerId: provider.id,
      model: result.model,
      outcome: "success",
      latencyMs: Math.max(
        0,
        Math.round(
          performance.now() -
            startedAt,
        ),
      ),
      usage: result.usage,
    });
    return result;
  } catch (error) {
    await observer?.onMetric({
      operation: "generate",
      providerId: provider.id,
      model: input.model,
      outcome: "error",
      latencyMs: Math.max(
        0,
        Math.round(
          performance.now() -
            startedAt,
        ),
      ),
      usage: null,
    });
    throw error;
  }
}
