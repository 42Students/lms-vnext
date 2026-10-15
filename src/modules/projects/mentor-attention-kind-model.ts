import {z} from "zod";
import type {MentorProjectAttention} from "./mentor-attention";
export const mentorAttentionKindSchema=z.enum(["ALL","REVIEW","STALLED","REQUESTED","MEETING_SOON"]);
export const mentorAttentionOrderSchema=z.enum(["RECENT","REVIEW_FIRST"]); 
export const mentorAttentionProjectSchema=z.preprocess(v=>v===""?undefined:v,z.string().uuid().optional());
export function selectMentorAttention(rows:readonly MentorProjectAttention[],
 kind:z.infer<typeof mentorAttentionKindSchema>,projectId?:string,
 order:z.infer<typeof mentorAttentionOrderSchema>="RECENT"){
 return rows.filter(row=>(kind==="ALL"||row.kind===kind)&&
   (!projectId||row.projectId===projectId)).sort((a,b)=>{
   if(order==="REVIEW_FIRST"){
     const priority={REVIEW:0,REQUESTED:1,STALLED:2,MEETING_SOON:3};
     const diff=priority[a.kind]-priority[b.kind];if(diff)return diff;
   }
   return b.occurredAt.localeCompare(a.occurredAt)||a.key.localeCompare(b.key);
 });
}
