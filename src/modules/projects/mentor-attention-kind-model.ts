import {z} from "zod";
import type {MentorProjectAttention} from "./mentor-attention";
export const mentorAttentionKindSchema=z.enum(["ALL","REVIEW","STALLED","REQUESTED","MEETING_SOON"]);
export const mentorAttentionProjectSchema=z.preprocess(v=>v===""?undefined:v,z.string().uuid().optional());
export function selectMentorAttention(rows:readonly MentorProjectAttention[],
 kind:z.infer<typeof mentorAttentionKindSchema>,projectId?:string){
 return rows.filter(row=>(kind==="ALL"||row.kind===kind)&&
   (!projectId||row.projectId===projectId));
}
