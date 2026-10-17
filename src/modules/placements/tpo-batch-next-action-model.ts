export function tpoBatchNextAction(row:{invitedAt:Date|null;finishedAt:Date|null},ready:boolean,
 counts?:{undecided:number;eligible:number},journey?:{registered:number;verified:number}):string {
 if(!ready)return "Review cohort";
 if(row.finishedAt)return "Review history";
 if(counts&&counts.undecided>0)return "Decide who is in placements";
 if(!row.invitedAt)return "Invite "+(counts?.eligible??0)+" to register";
 if(journey&&counts&&journey.registered<counts.eligible)
  return (counts.eligible-journey.registered)+" still to register";
 if(journey&&journey.verified<journey.registered)
  return "Verify "+(journey.registered-journey.verified)+" profiles";
 return "Review decisions";
}

/** Next destination follows the visible batch state rather than always returning to overview. */
export function tpoBatchNextActionLink(row:{
  invitedAt: Date | null; finishedAt: Date | null;
}, ready:boolean,counts?:{undecided:number;eligible:number},journey?:{registered:number;verified:number}):string {
  if (!ready) return "";
  if (row.finishedAt) return "/history";
  if (counts && counts.undecided > 0) return "/students?decision=NOT_DECIDED";
  if (!row.invitedAt) return "#batch-invite";
  if(journey&&counts&&journey.registered<counts.eligible)return "/registrations?choice=UNRECORDED";
  if(journey&&journey.verified<journey.registered)return "/students?profileVerified=false";
  return "/registrations?choice=UNRECORDED";
}
