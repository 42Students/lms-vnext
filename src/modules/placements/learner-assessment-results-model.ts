import { z } from "zod";

import { isCareerRoundVisible } from "./learner-round-visibility-policy";

export const learnerAssessmentResultsViewSchema = z.enum([
  "all",
  "passed",
  "failed",
  "other",
]);

export type LearnerAssessmentResultsView = z.infer<
  typeof learnerAssessmentResultsViewSchema
>;

export type LearnerAssessmentJourney = {
  applicationId: string;
  job: { id: string; title: string };
  company: { name: string };
  results: readonly {
    resultId: string;
    roundKind: string;
    roundName: string;
    roundSequence: number;
    outcome: string;
    scorePercent: number | null;
    candidateMessage: string | null;
    appliedAt: Date | null;
  }[];
};

export type LearnerAssessmentResultRow = {
  resultId: string;
  applicationId: string;
  jobId: string;
  roleTitle: string;
  companyName: string;
  roundName: string;
  roundSequence: number;
  outcome: string;
  scorePercent: number | null;
  candidateMessage: string | null;
  appliedAt: Date;
};

/**
 * The input is the learner's already authorized journey. Never display
 * staged results, interview/GD rounds, or provider completion inferred
 * from a scheduled time. A result without appliedAt is not published.
 */
export function buildLearnerAssessmentResults(
  journeys: readonly LearnerAssessmentJourney[],
): LearnerAssessmentResultRow[] {
  return journeys.flatMap((journey) =>
    journey.results.flatMap((result) => {
      if (
        !isCareerRoundVisible("ASSESSMENT", result.roundKind) ||
        !result.appliedAt ||
        !Number.isFinite(result.appliedAt.getTime())
      ) {
        return [];
      }
      return [{
        resultId: result.resultId,
        applicationId: journey.applicationId,
        jobId: journey.job.id,
        roleTitle: journey.job.title,
        companyName: journey.company.name,
        roundName: result.roundName,
        roundSequence: result.roundSequence,
        outcome: result.outcome,
        scorePercent: result.scorePercent,
        candidateMessage: result.candidateMessage,
        appliedAt: result.appliedAt,
      }];
    }),
  ).sort((a, b) =>
    b.appliedAt.getTime() - a.appliedAt.getTime() ||
    a.resultId.localeCompare(b.resultId),
  );
}

export function filterLearnerAssessmentResults(
  rows: readonly LearnerAssessmentResultRow[],
  view: LearnerAssessmentResultsView,
) {
  const status = (outcome: string): Exclude<LearnerAssessmentResultsView, "all"> =>
    outcome === "PASS" ? "passed" :
      outcome === "FAIL" ? "failed" : "other";

  const counts = {
    all: rows.length,
    passed: rows.filter((row) => status(row.outcome) === "passed").length,
    failed: rows.filter((row) => status(row.outcome) === "failed").length,
    other: rows.filter((row) => status(row.outcome) === "other").length,
  };
  return {
    counts,
    items: rows.filter((row) => view === "all" || status(row.outcome) === view),
  };
}

export const learnerAssessmentResultsQuerySchema = z.object({
  view: learnerAssessmentResultsViewSchema.optional().default("all"),
  q: z.string().trim().max(100).optional().default(""),
  page: z.coerce.number().int().min(1).max(10_000).optional().default(1),
}).strict();

export function pageLearnerAssessmentResults(
  rows: readonly LearnerAssessmentResultRow[],
  raw: unknown,
  pageSize = 20,
) {
  const filters=learnerAssessmentResultsQuerySchema.parse(raw);
  const term=filters.q.toLocaleLowerCase();
  const matching=rows.filter(row=>!term || [
    row.companyName,row.roleTitle,row.roundName,row.outcome,
  ].some(text=>text.toLocaleLowerCase().includes(term)));
  const total=matching.length;
  const pages=Math.max(1,Math.ceil(total/pageSize));
  const page=Math.min(filters.page,pages);
  return {
    filters, page, pages, total,
    items:matching.slice((page-1)*pageSize,page*pageSize),
  };
}
