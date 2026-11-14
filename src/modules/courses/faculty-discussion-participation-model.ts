import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
export const facultyDiscussionParticipationSchema=z.object({
  deliveryId:zUuid,
}).strict();
export type FacultyDiscussionCountRow={total:number;faculty:number;learner:number;pinned:number};
export function facultyDiscussionParticipationSummary(row:FacultyDiscussionCountRow){
  return {...row,other:Math.max(0,row.total-row.faculty-row.learner),
    facultyShare:row.total>0?Math.round(row.faculty/row.total*100):null};
}
