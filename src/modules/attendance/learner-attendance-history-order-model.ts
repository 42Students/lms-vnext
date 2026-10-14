import {z} from "zod";
export const learnerAttendanceOrderSchema=z.enum(["NEWEST","OLDEST"]);
export type LearnerAttendanceOrder=z.infer<typeof learnerAttendanceOrderSchema>;
export function sortLearnerAttendanceHistory<T extends {id:string;startsAt:string}>(
 rows:readonly T[],input:unknown,
):T[]{
 const order=learnerAttendanceOrderSchema.catch("NEWEST").parse(input);
 const time=(text:string)=>{const n=Date.parse(text);return Number.isFinite(n)?n:0;};
 return [...rows].sort((a,b)=>{
  const delta=time(a.startsAt)-time(b.startsAt);
  return (order==="OLDEST"?delta:-delta)||a.id.localeCompare(b.id);
 });
}
