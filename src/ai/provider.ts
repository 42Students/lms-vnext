export type AiMessageRole =
  | "system"
  | "user"
  | "assistant";

export type AiMessage = {
  role: AiMessageRole;
  content: string;
};

export type AiUsage = {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  costMicros: number | null;
};

export type AiGenerateInput = {
  model: string;
  messages: readonly AiMessage[];
  temperature?: number;
  maxOutputTokens?: number;
};

export type AiGenerateResult = {
  text: string;
  model: string;
  finishReason: string | null;
  usage: AiUsage;
};

export interface AiProvider {
  readonly id: string;
  generate(
    input: AiGenerateInput,
  ): Promise<AiGenerateResult>;
}
