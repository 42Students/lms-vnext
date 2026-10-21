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

/** Privacy boundary shared with the legacy recruiter-college overview.
 * Report only cohorts containing at least ten active learners; do not emit
 * zeroes for suppressed cells, as zero would imply a known empty sample.
 */
export const RECRUITER_OVERVIEW_MIN_GROUP=10;
export const RECRUITER_CGPA_BANDS=[
 {label:"Below 6",min:0,max:6},
 {label:"6 to 7",min:6,max:7},
 {label:"7 to 8",min:7,max:8},
 {label:"8 to 9",min:8,max:9},
 {label:"9 and above",min:9,max:10.0001},
] as const;
export function buildRecruiterCollegeAcademicBands(
 learners:readonly {branchName:string;cgpa:number|null}[],
 minimumGroup=RECRUITER_OVERVIEW_MIN_GROUP,
){
 const sample=learners.filter(row=>typeof row.cgpa==="number"&&Number.isFinite(row.cgpa)&&row.cgpa>=0&&row.cgpa<=10);
 const safeSample=sample.length>=minimumGroup;
 const cgpaBands=safeSample?RECRUITER_CGPA_BANDS.map(band=>{
  const count=sample.filter(row=>row.cgpa!==null&&row.cgpa>=band.min&&row.cgpa<band.max).length;
  return {label:band.label,count:count>=minimumGroup?Math.round(count/5)*5:null};
 }):null;
 const branches=new Map<string,number>();
 for(const learner of learners)branches.set(learner.branchName,(branches.get(learner.branchName)??0)+1);
 const byBranch=[...branches].filter(([,count])=>count>=minimumGroup)
  .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],"en-IN"))
  .map(([branch,count])=>({branch,count:Math.round(count/5)*5}));
 return {cgpaBands,basedOn:safeSample?Math.round(sample.length/5)*5:null,byBranch,
  suppressed:!safeSample,minimumGroup};
}
