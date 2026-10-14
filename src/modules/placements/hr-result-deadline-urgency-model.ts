export type HrDeadlineUrgency="PASSED"|"WITHIN_24H"|"UPCOMING";
export function hrResultDeadlineUrgency(dueAt:Date,now:Date):HrDeadlineUrgency{
 const ms=dueAt.getTime()-now.getTime();
 return ms<0?"PASSED":ms<=86400000?"WITHIN_24H":"UPCOMING";
}
export const HR_DEADLINE_URGENCY_LABELS={
 PASSED:"Result deadline passed",WITHIN_24H:"Due within 24 hours",UPCOMING:"Upcoming",
} as const;
