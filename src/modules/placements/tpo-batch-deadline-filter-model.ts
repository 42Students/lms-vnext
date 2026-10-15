import {z} from "zod";
export const tpoBatchDeadlineFilterSchema=z.enum(["ALL","NEXT_7_DAYS","PAST_DUE","NO_DEADLINE"]).default("ALL");
export function filterTpoBatchDeadline<T extends {deadline:Date|null;invitedAt:Date|null;finishedAt:Date|null}>(
 rows:readonly T[], filter:z.infer<typeof tpoBatchDeadlineFilterSchema>, now:Date
):T[]{
 if(filter==="ALL")return [...rows];
 const current=now.getTime(),end=current+7*24*60*60*1000;
 return rows.filter(row=>{
   if(row.finishedAt)return false;
   if(filter==="NO_DEADLINE")return !row.deadline;
   if(!row.invitedAt||!row.deadline)return false;
   const due=row.deadline.getTime();
   return filter==="PAST_DUE"?due<current:due>=current&&due<=end;
 });
}
