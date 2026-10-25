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

/** Group the persisted, booked interview list by round/panel/room, with
 * deterministic ordering. A panel name is not a security boundary; the
 * upstream read still owns the exact recruiter/college authorization. */
export function groupRecruiterBookedPanels<T extends {
 roundId:string;panel:string|null;room:string;startsAt:Date;slotId:string
}>(items:readonly T[]):Array<{key:string;roundId:string;panel:string;room:string;startsAt:Date;appointments:T[]}>{
 const grouped=new Map<string,{key:string;roundId:string;panel:string;room:string;startsAt:Date;appointments:T[]}>();
 for(const item of items){
  const panel=item.panel?.trim()||"Panel not assigned";
  const room=item.room.trim()||"Room not set";
  const key=JSON.stringify([item.roundId,panel,room]);
  const prior=grouped.get(key);
  if(prior){
   prior.appointments.push(item);
   if(item.startsAt.getTime()<prior.startsAt.getTime())prior.startsAt=item.startsAt;
  }else grouped.set(key,{key,roundId:item.roundId,panel,room,startsAt:item.startsAt,appointments:[item]});
 }
 return [...grouped.values()].map(group=>({
  ...group,appointments:group.appointments.sort((a,b)=>
   a.startsAt.getTime()-b.startsAt.getTime()||a.slotId.localeCompare(b.slotId))
 })).sort((a,b)=>a.startsAt.getTime()-b.startsAt.getTime()||
  a.key.localeCompare(b.key));
}
