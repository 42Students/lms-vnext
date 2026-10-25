/** Names and times supplied by the already authorized, shortlisted and booked
 * database read. This model never interprets a proposed employer slot as a
 * confirmed learner interview. */
export type RecruiterBookedInterview={
 slotId:string;roundId:string;name:string|null;startsAt:Date;endsAt:Date;
 panel:string|null;room:string;confirmedAt:Date|null;learnerConfirmedAt:Date|null;
};
export function projectRecruiterBookedInterviews(
 rows:readonly RecruiterBookedInterview[],
):Array<RecruiterBookedInterview & {confirmation:"CONFIRMED"|"AWAITING_STUDENT"|"AWAITING_COLLEGE"}>{
 return rows.filter(row=>row.startsAt instanceof Date&&row.endsAt instanceof Date&&
   Number.isFinite(row.startsAt.getTime())&&Number.isFinite(row.endsAt.getTime())&&
   row.endsAt.getTime()>row.startsAt.getTime())
 .map(row=>({...row,confirmation:row.confirmedAt===null?"AWAITING_COLLEGE" as const:
   row.learnerConfirmedAt===null?"AWAITING_STUDENT" as const:"CONFIRMED" as const}))
 .sort((a,b)=>a.startsAt.getTime()-b.startsAt.getTime()||a.slotId.localeCompare(b.slotId));
}
