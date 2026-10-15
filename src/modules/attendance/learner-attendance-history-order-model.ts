import {z} from "zod";
export const learnerAttendanceOrderSchema=z.enum(["NEWEST","OLDEST"]);
export type LearnerAttendanceOrder=z.infer<typeof learnerAttendanceOrderSchema>;
export function sortLearnerAttendanceHistory<T extends {id:string;startsAt:string}>(
 rows:readonly T[],input:unknown,
):T[]{
 const order=learnerAttendanceOrderSchema.catch("NEWEST").parse(input);
 const time=(text:string)=>{const n=Date.parse(text);return Number.isFinite(n)?n:null;};
 return [...rows].sort((a,b)=>{
  const left=time(a.startsAt),right=time(b.startsAt);
  if(left===null&&right!==null)return 1;
  if(right===null&&left!==null)return -1;
  const delta=left===null||right===null?0:left-right;
  return (order==="OLDEST"?delta:-delta)||a.id.localeCompare(b.id);
 });
}
