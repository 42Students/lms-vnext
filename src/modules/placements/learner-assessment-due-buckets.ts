import { z } from "zod";
import { careerDayKey } from "./learner-career-calendar-model";
import {
  learnerRoundScheduledInstant,
  type LearnerRoundBrowseSource,
} from "./learner-rounds-browse-model";

export const learnerAssessmentDueBucketSchema = z.enum([
  "all", "today", "week", "later", "past", "unscheduled",
]);
export type LearnerAssessmentDueBucket = z.infer<
  typeof learnerAssessmentDueBucketSchema
>;

/** The scheduled time is not proof of submission or employer completion.
 * Approved reschedules supersede it; grouping follows Asia/Kolkata days. */
function mondayOfIstWeek(day: string) {
  const date = new Date(day + "T12:00:00.000Z");
  const offset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - offset);
  return date.toISOString().slice(0, 10);
}

export function learnerAssessmentBucketForRound(
  round: LearnerRoundBrowseSource,
  nowMs: number,
): "today" | "week" | "later" | "past" | "unscheduled" {
  const scheduled = learnerRoundScheduledInstant(round);
  if (scheduled === null) return "unscheduled";
  if (scheduled < nowMs) return "past";
  const nowDay = careerDayKey(new Date(nowMs));
  const dueDay = careerDayKey(new Date(scheduled));
  if (dueDay === nowDay) return "today";
  if (mondayOfIstWeek(dueDay) === mondayOfIstWeek(nowDay)) return "week";
  return "later";
}

export function learnerAssessmentDueBuckets<T extends LearnerRoundBrowseSource>(
  rounds: readonly T[], nowMs: number,
) {
  const today = rounds.filter((round) =>
    learnerAssessmentBucketForRound(round, nowMs) === "today");
  const week = rounds.filter((round) => {
    const bucket = learnerAssessmentBucketForRound(round, nowMs);
    return bucket === "today" || bucket === "week";
  });
  const later=rounds.filter(round=>learnerAssessmentBucketForRound(round,nowMs)==="later");
  const past=rounds.filter(round=>learnerAssessmentBucketForRound(round,nowMs)==="past");
  const unscheduled=rounds.filter(round=>learnerAssessmentBucketForRound(round,nowMs)==="unscheduled");
  return {today,week,later,past,unscheduled};
}

export function filterLearnerAssessmentDueBucket<T extends LearnerRoundBrowseSource>(
  rounds: readonly T[], bucket: LearnerAssessmentDueBucket, nowMs: number,
): T[] {
  if (bucket === "all") return [...rounds];
  return rounds.filter((round) => {
    const kind = learnerAssessmentBucketForRound(round, nowMs);
    if(bucket==="today")return kind==="today";
    if(bucket==="week")return kind==="today"||kind==="week";
    return kind===bucket;
  });
}
