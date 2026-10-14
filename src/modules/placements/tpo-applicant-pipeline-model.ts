import { z } from "zod";
export const tpoApplicantPipelineParams = z.object({
  jobId: z.string().uuid(),
  stage: z.enum(["ALL","SUBMITTED","PENDING","HOLD","SHORTLISTED","REJECTED","WITHDRAWN"]).default("ALL"),
  search: z.string().trim().max(100).default(""),
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
