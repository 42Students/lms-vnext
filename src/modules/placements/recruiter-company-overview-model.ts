import { z } from "zod";
export const recruiterCompanyOverviewQuerySchema = z.object({collegeId:z.string().uuid().optional()}).strict();
export type RecruiterCompanyJob = {
  collegeId: string; relationshipId: string;
  job: { id:string; title:string; status:string; archivedAt:Date|null };
};
/** Never infer individual recruiter attribution from TPO-authored placement jobs. */
export function buildRecruiterCompanyOverview<T extends RecruiterCompanyJob>(
 rows:readonly T[], collegeId:string, relationshipId:string,
) {
 const scoped:T[]=[];
 const seen=new Set<string>();
 for(const row of rows){
  if(row.collegeId!==collegeId || row.relationshipId!==relationshipId ||
     row.job.archivedAt!==null ||
     (row.job.status!=="PUBLISHED"&&row.job.status!=="CLOSED") ||
     seen.has(row.job.id))continue;
  seen.add(row.job.id);
  scoped.push(row);
 }
 return {
  active:scoped.filter(row=>row.job.status==="PUBLISHED").length,
  closed:scoped.filter(row=>row.job.status==="CLOSED").length,
  total:scoped.length,
  recent:scoped.slice(0,3).map(row=>({id:row.job.id,title:row.job.title,status:row.job.status})),
 };
}
