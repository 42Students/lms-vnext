import {z} from "zod";
import {neutralizeFacultyCsvCell} from "./faculty-report-csv";
export const facultyGradebookParamsSchema=z.object({
  deliveryId:z.string().uuid(),
}).strict();
export type GradebookScore={
  membershipId:string; earned:number; possible:number;
  kind:"ASSIGNMENT"|"QUIZ";assessmentId:string;
};
export type GradebookLearner={
  membershipId:string;displayName:string|null;email:string|null;rollNumber:string|null;
};
export function facultyPublishedGradeRows(
  roster:readonly GradebookLearner[],scores:readonly GradebookScore[],
  publishedAssessments:number,
) {
  const byMember=new Map<string,GradebookScore[]>();
  const eligible=new Set(roster.map(r=>r.membershipId));
  for(const score of scores){
    // Malformed or private producer data must not produce plausible grade totals.
    if(!eligible.has(score.membershipId) ||
      !Number.isFinite(score.earned) || !Number.isFinite(score.possible) ||
      score.possible<=0 || score.earned<0 || score.earned>score.possible)continue;
    const entries=byMember.get(score.membershipId)??[];
    if(!entries.some(e=>e.kind===score.kind&&e.assessmentId===score.assessmentId))
      entries.push(score);
    byMember.set(score.membershipId,entries);
  }
  return roster.map(learner=>{
    const registered=byMember.get(learner.membershipId)??[];
    const earned=registered.reduce((total,item)=>total+item.earned,0);
    const possible=registered.reduce((total,item)=>total+item.possible,0);
    return {
      ...learner,gradedCount:registered.length,publishedAssessments,
      earned:registered.length?earned:null,
      possible:registered.length?possible:null,
      percent:registered.length&&possible>0?Math.round(earned/possible*100):null,
      hasUnknown:registered.length<publishedAssessments,
    };
  });
}
export type FacultyGradebookRow=ReturnType<typeof facultyPublishedGradeRows>[number];
const csv=(value:string|number|null)=>{
  const safe=neutralizeFacultyCsvCell(value);
  return '"'+safe.replaceAll('"','""')+'"';
};
export function facultyGradebookCsv(rows:readonly FacultyGradebookRow[]){
  const header=["Student","Roll number","Published scored assessments",
    "Published assessments","Earned points","Possible points","Recorded score (%)","Incomplete grading"];
  return [header.map(csv).join(","),...rows.map(row=>[
    row.displayName??"Learner",row.rollNumber,
    row.gradedCount,row.publishedAssessments,row.earned,row.possible,
    row.percent,row.hasUnknown?"YES":"NO",
  ].map(csv).join(","))].join("\r\n")+"\r\n";
}

/** Only published, Section-scoped assessment evidence belongs in this view. */
export type FacultyGradebookAssessment = {
  assessmentId:string;kind:"ASSIGNMENT"|"QUIZ";title:string;
};
export function facultyPublishedLearnerBreakdown(
  learnerMembershipId:string,
  assessments:readonly FacultyGradebookAssessment[],
  scores:readonly GradebookScore[],
) {
  return assessments.map(assessment=>{
    const score=scores.find(item=>item.membershipId===learnerMembershipId&&
      item.assessmentId===assessment.assessmentId&&item.kind===assessment.kind);
    if(!score||!Number.isFinite(score.earned)||!Number.isFinite(score.possible)||
      score.possible<=0||score.earned<0||score.earned>score.possible){
      return {...assessment,earned:null,possible:null,percent:null,
        status:"UNKNOWN" as const};
    }
    return {...assessment,earned:score.earned,possible:score.possible,
      percent:Math.round(score.earned/score.possible*100),
      status:"PUBLISHED_SCORE" as const};

  });
}

/**
 * A bounded view over the already authorized Section gradebook. This does not
 * alter the server-owned full-Section CSV or grant access to other Sections.
 */
export const facultyGradebookViewQuerySchema = z.object({
  search: z.string().trim().max(120).default(""),
  page: z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export type FacultyGradebookViewQuery = z.infer<typeof facultyGradebookViewQuerySchema>;

export function paginateFacultyGradebookRows<T extends GradebookLearner>(
  rows: readonly T[], query: FacultyGradebookViewQuery,
) {
  const term = query.search.toLowerCase();
  const matching = rows.filter(row =>
    !term || [row.displayName, row.rollNumber, row.email].some(value =>
      value?.toLowerCase().includes(term)),
  ).sort((a,b) =>
    (a.rollNumber ?? "").localeCompare(b.rollNumber ?? "", undefined, {numeric:true}) ||
    (a.displayName ?? "").localeCompare(b.displayName ?? "") ||
    a.membershipId.localeCompare(b.membershipId),
  );
  const pageSize=25;
  const totalPages=Math.max(1, Math.ceil(matching.length/pageSize));
  const page=Math.min(query.page,totalPages);
  return {
    total:rows.length, matching:matching.length, page, pageSize, totalPages,
    items:matching.slice((page-1)*pageSize,page*pageSize),
  };
}

export function facultyGradebookViewHref(
  deliveryId:string, query:FacultyGradebookViewQuery,
) {
  const params=new URLSearchParams();
  if(query.search)params.set("search",query.search);
  if(query.page>1)params.set("page",String(query.page));
  const suffix=params.toString();
  return "/teacher/courses/"+encodeURIComponent(deliveryId)+"/gradebook"+
    (suffix?"?"+suffix:"");
}
