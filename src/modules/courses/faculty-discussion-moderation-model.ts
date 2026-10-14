import {z} from "zod";
export const facultyDiscussionModerationSchema=z.object({
  expectedUpdatedAt:z.iso.datetime({offset:true}),
  confirmed:z.literal(true),
}).strict();
/** Compare JS-visible millisecond snapshots, never exact PG microseconds. */
export function facultyDiscussionTokenMatches(persisted:Date,expectedIso:string){
 const incoming=new Date(expectedIso);
 return Number.isFinite(incoming.getTime())&&
   persisted.getTime()===incoming.getTime();
}
