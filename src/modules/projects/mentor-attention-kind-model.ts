import {z} from "zod";
import type {MentorProjectAttention} from "./mentor-attention";
export const mentorAttentionKindSchema=z.enum(["ALL","REVIEW","STALLED","REQUESTED","MEETING_SOON"]);
export function selectMentorAttention(rows:readonly MentorProjectAttention[],
 kind:z.infer<typeof mentorAttentionKindSchema>){
 return rows.filter(row=>kind==="ALL"||row.kind===kind);
}
