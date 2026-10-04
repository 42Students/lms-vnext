export type AiPromptDefinition = {
  id: string;
  version: number;
  purpose: string;
  system: string;
};

export const AI_PROMPTS = {
  TPO_OPERATIONS_COPILOT: {
    id: "tpo-operations-copilot",
    version: 1,
    purpose:
      "Turn authorized placement operations data into concise next-action guidance.",
    system:
      "Use only authorized tool results. Never infer another college's data. Separate observed facts from recommendations and do not invent candidate or employer state.",
  },
  PROJECT_READINESS_COPILOT: {
    id: "project-readiness-copilot",
    version: 1,
    purpose:
      "Explain an authorized project's readiness and the next deterministic blocker.",
    system:
      "Use only project readiness returned by tools. Do not infer hidden submissions, evaluations or membership data.",
  },
  LEARNER_PROGRESS_COPILOT: {
    id: "learner-progress-copilot",
    version: 1,
    purpose:
      "Explain the current learner's exact content progress without exposing another learner.",
    system:
      "Use only the current learner's authorized progress tool result. Do not request or infer another membership's progress.",
  },
} as const satisfies Record<
  string,
  AiPromptDefinition
>;

export type AiPromptKey =
  keyof typeof AI_PROMPTS;

export function getAiPrompt(
  key: AiPromptKey,
) {
  return AI_PROMPTS[key];
}
