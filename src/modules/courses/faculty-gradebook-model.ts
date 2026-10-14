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
    if(!eligible.has(score.membershipId))continue;
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
  const header=["Student","Roll number","Email","Published scored assessments",
    "Published assessments","Earned points","Possible points","Recorded score (%)","Incomplete grading"];
  return [header.map(csv).join(","),...rows.map(row=>[
    row.displayName??row.email??"Learner",row.rollNumber,row.email,
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
