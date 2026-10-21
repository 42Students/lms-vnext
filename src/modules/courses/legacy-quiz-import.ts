import {parseLegacyLocalIstTimestamp} from "@/modules/identity/legacy-base-model-import";

/** Never clamp source score values: that would alter learner grading. */
export function normalizeLegacyQuizPoints(value: number | bigint | string) {
  let source: bigint;
  try { source = BigInt(value); } catch { return {legacyTotalPoints:null, totalPoints:null, needsReview:true}; }
  const allowed = source >= 1n && source <= 10000n;
  return {legacyTotalPoints:source, totalPoints:allowed ? Number(source) : null,
    needsReview:!allowed};
}
/** Nullable legacy LocalDateTime is interpreted as IST, never server-local time. */
export function normalizeLegacyQuizDeadline(value:string|null|undefined){
  if(!value) return {dueAt:null,legacyDueAtLocal:null,needsReview:false};
  const dueAt=parseLegacyLocalIstTimestamp(value);
  return {dueAt,legacyDueAtLocal:value,needsReview:dueAt===null};
}
