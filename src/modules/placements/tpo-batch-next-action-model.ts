export function tpoBatchNextAction(row:{invitedAt:Date|null;finishedAt:Date|null},ready:boolean):string{
 if(!ready)return "Review cohort";
 if(row.finishedAt)return "Review history";
 if(row.invitedAt)return "Monitor batch";
 return "Review and invite";
}

/** Next destination follows the visible batch state rather than always returning to overview. */
export function tpoBatchNextActionLink(row:{
  invitedAt: Date | null; finishedAt: Date | null;
}, ready:boolean,counts?:{undecided:number;eligible:number}):string {
  if (!ready) return "";
  if (row.finishedAt) return "/history";
  if (counts && counts.undecided > 0) return "/students?decision=NOT_DECIDED";
  if (!row.invitedAt) return "/invitation-prep";
  return "/registrations?choice=UNRECORDED";
}
