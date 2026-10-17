/**
 * TPO-settings-audit-41: placement preparation is a course-progress signal,
 * never a claim about employment eligibility or verified academic results.
 */
export type TpoPrepCourseEvidence={
 courseId:string; totalContent:number; completedContent:number;
};
export type TpoPrepCoursePolicy={courseIds:readonly string[];minimumCompleted:number;progressThresholdPct:number};
export type TpoPrepCourseOutcome="UNCONFIGURED"|"NEEDS_PREP"|"READY"|"UNAVAILABLE";

export function deriveTpoPrepCourseOutcome(
 policy:TpoPrepCoursePolicy,evidence:readonly TpoPrepCourseEvidence[]|null,
):TpoPrepCourseOutcome{
 if(!policy.courseIds.length)return "UNCONFIGURED";
 if(evidence===null)return "UNAVAILABLE";
 if(!Number.isInteger(policy.minimumCompleted)||policy.minimumCompleted<0||
    policy.minimumCompleted>policy.courseIds.length||!Number.isFinite(policy.progressThresholdPct)||
    policy.progressThresholdPct<0||policy.progressThresholdPct>100)return "UNAVAILABLE";
 const byCourse=new Map(evidence.map(item=>[item.courseId,item]));
 if(policy.courseIds.some(id=>!byCourse.has(id)))return "UNAVAILABLE";
 const rows=policy.courseIds.map(id=>byCourse.get(id)!);
 if(rows.some(row=>!Number.isInteger(row.totalContent)||row.totalContent<=0||
   row.completedContent<0||row.completedContent>row.totalContent))return "UNAVAILABLE";
 const completed=rows.filter(row=>row.completedContent===row.totalContent).length;
 const total=rows.reduce((sum,row)=>sum+row.totalContent,0);
 const done=rows.reduce((sum,row)=>sum+row.completedContent,0);
 return completed>=policy.minimumCompleted&&done*100>=total*policy.progressThresholdPct
  ?"READY":"NEEDS_PREP";
}
