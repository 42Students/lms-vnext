import {z} from "zod";
import type {MentorProjectAttention} from "./mentor-attention";
export const mentorAttentionKindSchema=z.enum(["ALL","REVIEW","STALLED","REQUESTED","MEETING_SOON",
  "TASK_REVIEW","TASK_BLOCKED","SPRINT_SIGN_OFF","UNASSIGNED_NEXT"]);
export const mentorAttentionOrderSchema=z.enum(["RECENT","REVIEW_FIRST"]); 
export const mentorAttentionProjectSchema=z.preprocess(v=>v===""?undefined:v,z.string().uuid().optional());
export function selectMentorAttention(rows:readonly MentorProjectAttention[],
 kind:z.infer<typeof mentorAttentionKindSchema>,projectId?:string,
 order:z.infer<typeof mentorAttentionOrderSchema>="RECENT"){
 return rows.filter(row=>(kind==="ALL"||row.kind===kind)&&
   (!projectId||row.projectId===projectId)).sort((a,b)=>{
   if(order==="REVIEW_FIRST"){
     const priority={REVIEW:0,TASK_REVIEW:1,SPRINT_SIGN_OFF:2,TASK_BLOCKED:3,
       UNASSIGNED_NEXT:4,REQUESTED:5,STALLED:6,MEETING_SOON:7};
     const diff=priority[a.kind]-priority[b.kind];if(diff)return diff;
   }
   return b.occurredAt.localeCompare(a.occurredAt)||a.key.localeCompare(b.key);
 });
}

/** Selector labels must come from the authenticated Mentor roster, never alert prose. */
export function mentorAttentionProjectOptions(
  alerts:readonly MentorProjectAttention[],
  projects:readonly {id:string;title:string}[],
){
  const alerted=new Set(alerts.map(row=>row.projectId));
  return projects.filter(project=>alerted.has(project.id))
    .map(project=>({id:project.id,title:project.title}))
    .sort((a,b)=>a.title.localeCompare(b.title)||a.id.localeCompare(b.id));
}
