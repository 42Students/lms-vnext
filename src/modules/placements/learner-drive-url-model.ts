import { z } from "zod";
import {
  DEFAULT_LEARNER_JOB_FILTERS, learnerDriveAvailabilitySchema,
  type LearnerJobBrowseFilters,
} from "./learner-jobs-browse-model";
export const learnerDriveUrlSchema=z.object({
  q:z.string().trim().max(100).optional().default(""),
  type:z.string().max(64).optional().default("all"),
  loc:z.string().max(120).optional().default("all"),
  sort:z.enum(["deadline","newest","ctc","title"]).optional().default("deadline"),
  eligible:z.enum(["1","0"]).optional(),
  soon:z.literal("1").optional(),
  availability:learnerDriveAvailabilitySchema.optional().default("all"),
  page:z.coerce.number().int().min(1).max(10_000).optional().default(1),
}).strict();
export function readLearnerDriveUrl(raw:string):{
  filters:LearnerJobBrowseFilters;page:number;
} {
  const query=new URLSearchParams(raw.startsWith("?")?raw.slice(1):raw);
  const parsed=learnerDriveUrlSchema.safeParse(Object.fromEntries(query.entries()));
  if(!parsed.success)return {filters:{...DEFAULT_LEARNER_JOB_FILTERS},page:1};
  const v=parsed.data;
  return {filters:{
    search:v.q,employmentType:v.type,location:v.loc,sort:v.sort,
    eligibleOnly:v.eligible==="1",closingSoon:v.soon==="1",availability:v.availability,
  },page:v.page};
}
export function learnerDriveQueryWithChanges(
  current:string,changes:Record<string,string|null>,
):string {
  const allowed=["q","type","loc","sort","eligible","soon","availability","page"];
  const query=new URLSearchParams();
  const prev=new URLSearchParams(current);
  for(const key of allowed){
    const value=prev.get(key);
    if(value)query.set(key,value);
  }
  for(const [key,value] of Object.entries(changes)){
    if(!allowed.includes(key))continue;
    if(!value||value==="all")query.delete(key);
    else query.set(key,value);
  }
  if(!Object.prototype.hasOwnProperty.call(changes,"page"))query.delete("page");
  return query.toString();
}
