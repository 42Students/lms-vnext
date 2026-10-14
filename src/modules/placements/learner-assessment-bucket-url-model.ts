import {learnerAssessmentDueBucketSchema,type LearnerAssessmentDueBucket} from "./learner-assessment-due-buckets";
/** Only recognized bucket identifiers are navigable; never inherit identity selectors. */
export function readLearnerAssessmentDueFromUrl(raw:string):LearnerAssessmentDueBucket{
 const params=new URLSearchParams(raw.startsWith("?")?raw.slice(1):raw);
 const values=params.getAll("due");
 if(values.length===0)return "all";
 return values.length===1
   ?learnerAssessmentDueBucketSchema.safeParse(values[0]).data??"all":"all";
}
export function learnerAssessmentDueHref(raw:string,bucket:LearnerAssessmentDueBucket):string{
 const url=new URL(raw,"https://lms-vnext.invalid");
 const params=new URLSearchParams();
 const q=url.searchParams.get("q");
 if(q&&q.length<=100)params.set("q",q);
 const ids=["applicationId","roundId"] as const;
 for(const key of ids){const values=url.searchParams.getAll(key);
  if(values.length===1&&/^[0-9a-fA-F-]{36}$/.test(values[0]!))params.set(key,values[0]!);
 }
 if(bucket!=="all")params.set("due",learnerAssessmentDueBucketSchema.parse(bucket));
 const search=params.toString();
 return "/learn/my-placements/assessments"+(search?"?"+search:"");
}
