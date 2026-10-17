import { z } from "zod";
export const tpoApplicantPipelineParams = z.object({
  jobId: z.string().uuid(),
  stage: z.enum(["ALL","SUBMITTED","PENDING","HOLD","SHORTLISTED","REJECTED","WITHDRAWN"]).default("ALL"),
  search: z.string().trim().max(100).default(""),
  channel:z.enum(["ALL","INTERNAL","EXTERNAL"]).default("ALL"),
  eligibility:z.enum(["ALL","ELIGIBLE","ELIGIBLE_WITH_MISSING_EVIDENCE"]).default("ALL"),
  flag:z.enum(["ALL","WITHDRAWAL_REQUESTED","NO_SHOW","PLACED_ELSEWHERE","ADDED_BY_COLLEGE"]).default("ALL"),
  sort:z.enum(["NEWEST","OLDEST","LEARNER_NAME"]).default("NEWEST"),
  submittedWithin:z.enum(["ALL","LAST_7_DAYS","LAST_30_DAYS"]).default("ALL"),
  page:z.coerce.number().int().min(1).max(100000).default(1),
}).strict();
export function tpoApplicantPipelinePage(total:number,requestedPage:number){
 const pageSize=25,totalPages=Math.max(1,Math.ceil(total/pageSize));
 const page=Math.min(requestedPage,totalPages);
 return {page,pageSize,totalPages,totalMatching:total,offset:(page-1)*pageSize};
}
export type ApplicantPipelineFact = {
  id: string; student: string | null; role: string;
  applicationStatus: string; screeningStatus: string | null;
  submittedAt: string;
};
export function applicantStage(fact: ApplicantPipelineFact) {
  return fact.applicationStatus === "WITHDRAWN" ? "WITHDRAWN" :
    fact.screeningStatus === "SHORTLISTED" ? "SHORTLISTED" :
    fact.screeningStatus === "HOLD" ? "HOLD" :
    fact.screeningStatus === "REJECTED" ? "REJECTED" : "PENDING";
}
export function projectTpoApplicantPipeline<T extends ApplicantPipelineFact>(
  facts: readonly T[],
  stage: z.infer<typeof tpoApplicantPipelineParams>["stage"],
  search: string,
) {
  const counts = { all: facts.length,
    submitted: facts.filter((f) => f.applicationStatus === "SUBMITTED").length,
    pending: 0, hold: 0, shortlisted: 0, rejected: 0, withdrawn: 0,
  };
  for (const f of facts) {
    const key = applicantStage(f).toLowerCase() as "pending"|"hold"|"shortlisted"|"rejected"|"withdrawn";
    counts[key]++;
  }
  const q = search.trim().toLocaleLowerCase();
  return { counts, rows: facts.filter((f) =>
    (stage === "ALL" || (stage === "SUBMITTED" ? f.applicationStatus === "SUBMITTED" : applicantStage(f) === stage)) &&
    (!q || f.student?.toLocaleLowerCase().includes(q) || f.role.toLocaleLowerCase().includes(q)))
    .sort((a,b) => a.submittedAt.localeCompare(b.submittedAt) * -1 || a.id.localeCompare(b.id)) };
}

/** A rolling duration measured from read time, never a season snapshot. */
export function tpoApplicantSubmittedSince(value:"ALL"|"LAST_7_DAYS"|"LAST_30_DAYS",now:Date){
 if(value==="ALL")return null;
 return new Date(now.getTime()-(value==="LAST_7_DAYS"?7:30)*86400000);
}

/** An empty filtered result should not be mistaken for an empty drive. */
export function tpoApplicantPipelineHasFilters(filter:{
 stage:string;search:string;channel:string;eligibility:string;submittedWithin:string;flag?:string
}):boolean {
 return filter.stage!=="ALL"||Boolean(filter.search.trim())||filter.channel!=="ALL"||
  filter.eligibility!=="ALL"||filter.submittedWithin!=="ALL"||(filter.flag??"ALL")!=="ALL";
}

/** Invalid deep links may never silently expand the learner roster. */
export function parseTpoApplicantPipelineLink(value:unknown){
 return tpoApplicantPipelineParams.safeParse(value);
}
export function tpoApplicantPipelineResetHref(jobId:string){
 return "/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/applicants-pipeline";
}
