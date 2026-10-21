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
  saved:z.literal("1").optional(),
}).strict();
export function readLearnerDriveUrl(raw:string):{
  filters:LearnerJobBrowseFilters;page:number;savedOnly:boolean;
} {
  const query=new URLSearchParams(raw.startsWith("?")?raw.slice(1):raw);
  const safe: Record<string,string> = {};
  for (const key of ["q","type","loc","sort","eligible","soon","availability","page","saved"]) {
    const values = query.getAll(key);
    if (values.length === 1 && learnerDriveUrlSchema.safeParse({ [key]: values[0] }).success) {
      safe[key] = values[0]!;
    }
  }
  // Never accept tenant selectors or duplicate facets; valid independent filters survive.
  const v=learnerDriveUrlSchema.parse(safe);
  // Old LMS bookmarks used ?tab=saved. Treat it as an alias only when the
  // modern saved= selector is absent; do not trust repeated/unknown tabs.
  const legacySaved=query.getAll("tab").length===1&&query.get("tab")==="saved";
  return {filters:{
    search:v.q,employmentType:v.type,location:v.loc,sort:v.sort,
    eligibleOnly:v.eligible==="1",closingSoon:v.soon==="1",availability:v.availability,
  },page:v.page,savedOnly:v.saved==="1"||(v.saved===undefined&&legacySaved)};
}
export function learnerDriveQueryWithChanges(
  current:string,changes:Record<string,string|null>,
):string {
  const allowed=["q","type","loc","sort","eligible","soon","availability","page","saved"];
  const query=new URLSearchParams();
  const prev=new URLSearchParams(current);
  for(const key of allowed){
    const values=prev.getAll(key);
    if(values.length===1 && values[0] &&
       learnerDriveUrlSchema.safeParse({ [key]: values[0] }).success) query.set(key,values[0]);
  }
  // Canonicalize old saved-tab bookmarks after preserving the selected tab.
  if(!query.has("saved")&&prev.getAll("tab").length===1&&prev.get("tab")==="saved")
    query.set("saved","1");
  for(const [key,value] of Object.entries(changes)){
    if(!allowed.includes(key))continue;
    if(!value||value==="all")query.delete(key);
    else if(learnerDriveUrlSchema.safeParse({ [key]: value }).success)query.set(key,value);
    else query.delete(key);
  }
  if(!Object.prototype.hasOwnProperty.call(changes,"page"))query.delete("page");
  return query.toString();
}
