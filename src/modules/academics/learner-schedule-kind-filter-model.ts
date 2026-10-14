import {z} from "zod";
const kindSchema=z.enum(["ALL","COURSE","SECTION"]).catch("ALL");
export type LearnerScheduleKind=z.infer<typeof kindSchema>;
export function filterLearnerScheduleByKind<T extends {deliveryId:string|null}>(
  events:readonly T[],input:unknown,
):T[]{
 const kind=kindSchema.parse(input);
 if(kind==="ALL")return [...events];
 return events.filter(event=>kind==="COURSE"?event.deliveryId!==null:event.deliveryId===null);
}
