import {
  writeStructuredLog,
} from "@/observability/logger";
import type {
  AiRuntimeObserver,
} from "./runtime";

export const structuredAiObserver: AiRuntimeObserver = {
  onMetric(metric) {
    writeStructuredLog(
      metric.outcome === "success"
        ? "INFO"
        : "WARNING",
      "ai.provider_operation",
      {
        operation: metric.operation,
        provider_id: metric.providerId,
        model: metric.model,
        outcome: metric.outcome,
        latency_ms: metric.latencyMs,
        input_tokens:
          metric.usage?.inputTokens ??
          null,
        output_tokens:
          metric.usage?.outputTokens ??
          null,
        total_tokens:
          metric.usage?.totalTokens ??
          null,
        cost_micros:
          metric.usage?.costMicros ??
          null,
      },
    );
  },
};
