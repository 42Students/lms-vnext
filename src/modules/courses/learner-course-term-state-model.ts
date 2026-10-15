import { z } from "zod";
const states=z.enum(["ALL","CURRENT","HISTORY"]).catch("ALL");
export type LearnerCourseTermState=z.infer<typeof states>;
/** Use the Course service's authoritative readOnly status, never a client clock guess. */
export function learnerCourseMatchesTermState(row:{readOnly:boolean},value:unknown):boolean{
 const state=states.parse(value);
 return state==="ALL" || (state==="CURRENT"?!row.readOnly:row.readOnly);
}
