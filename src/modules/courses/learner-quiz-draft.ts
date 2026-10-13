/** 
 * Parse only a learner's session-scoped quiz draft. Corrupt browser storage
 * must never crash the attempt or erase a valid answer from another quiz.
 */
export type LearnerQuizDraft = {
  answers: Record<string, string[]>;
  step: number;
};
export function parseLearnerQuizDraft(raw: string | null, questionCount: number): LearnerQuizDraft {
  const empty: LearnerQuizDraft = { answers: {}, step: 0 };
  if (!raw) return empty;
  try {
    const decoded: unknown = JSON.parse(raw);
    if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) return empty;
    const value = decoded as Record<string, unknown>;
    const answers: Record<string, string[]> = {};
    if (value.answers && typeof value.answers === "object" && !Array.isArray(value.answers)) {
      for (const [questionId, selections] of Object.entries(value.answers)) {
        if (
          questionId.length <= 128 &&
          Array.isArray(selections)
        ) {
          answers[questionId] = [...new Set(selections.filter(
            (selected): selected is string => typeof selected === "string" && selected.length <= 128,
          ))].slice(0, 100);
        }
      }
    }
    const step = typeof value.step === "number" &&
      Number.isInteger(value.step) &&
      value.step >= 0 &&
      value.step < questionCount
        ? value.step
        : 0;
    return { answers, step };
  } catch {
    return empty;
  }
}
