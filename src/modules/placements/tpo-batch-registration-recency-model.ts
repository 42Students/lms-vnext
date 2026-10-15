import {z} from "zod";
export const tpoRegistrationRecencySchema=z.enum(["ALL","UPDATED_7_DAYS","OLDER_30_DAYS","NO_RECORD"]).default("ALL");
export function filterTpoRegistrationRecency<T extends {updatedAt:string|null}>(rows:readonly T[],mode:z.infer<typeof tpoRegistrationRecencySchema>,asOf:Date):T[]{
 if(mode==="ALL")return [...rows];
 if(mode==="NO_RECORD")return rows.filter(row=>row.updatedAt===null);
 const threshold=asOf.getTime()-(mode==="UPDATED_7_DAYS"?7:30)*86400000;
 return rows.filter(row=>{
  if(row.updatedAt===null)return false;
  const time=Date.parse(row.updatedAt);
  return Number.isFinite(time)&&(mode==="UPDATED_7_DAYS"?time>=threshold&&time<=asOf.getTime():time<threshold);
 });
}
