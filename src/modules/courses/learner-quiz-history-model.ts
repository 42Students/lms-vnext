import { z } from "zod";

export const learnerQuizHistoryQuerySchema = z.object({
  quizId: z.string().uuid(),
  deliveryId: z.string().uuid(),
  attemptId: z.string().uuid().optional(),
}).strict();

/** Only select a quiz from a learner's server-authorized Course deliveries. */
export function ownQuizHistorySelection<T extends {id:string;deliveryId:string}>(
  authorizedRows: readonly T[], raw: unknown,
): { quiz: T; attemptId: string | null } | null {
  const query=learnerQuizHistoryQuerySchema.safeParse(raw);
  if(!query.success) return null;
  const quiz=authorizedRows.find(row=>row.id===query.data.quizId &&
    row.deliveryId===query.data.deliveryId);
  return quiz ? {quiz,attemptId:query.data.attemptId ?? null} : null;
}

/** A score not explicitly released by the persisted quiz lifecycle stays hidden. */
export function learnerAttemptResultLabel(attempt:{
  resultsVisible:boolean;score:number|null;maxScore:number|null;
}) {
  if(!attempt.resultsVisible) return "Result not published";
  if(attempt.score===null || attempt.maxScore===null) return "Score unavailable";
  return String(attempt.score) + " / " + String(attempt.maxScore) + " points";
}
/** Quiz results use the college's India-local date convention on all devices. */
export function learnerQuizAttemptDateLabel(value:Date):string {
 if(!Number.isFinite(value.getTime()))return "Date unavailable";
 return new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
 }).format(value);
}
