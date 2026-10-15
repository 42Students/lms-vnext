export function tpoBatchNextAction(row:{invitedAt:Date|null;finishedAt:Date|null},ready:boolean):string{
 if(!ready)return "Review cohort";
 if(row.finishedAt)return "Review history";
 if(row.invitedAt)return "Monitor batch";
 return "Review and invite";
}
