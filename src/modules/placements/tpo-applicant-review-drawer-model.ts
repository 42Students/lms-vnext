import {canReviewApplicant} from "./tpo-applicant-review-model";
export type TpoApplicantReviewSnapshot={
 id:string;student:string|null;role:string;applicationStatus:string;
 screeningStatus:string|null;screeningUpdatedAt:string|null;
 eligibilityStatus:string;channel:string;submittedAt:string;
};
export function applicantDrawerReviewable(jobStatus:string,app:TpoApplicantReviewSnapshot){
 return jobStatus==="PUBLISHED"&&Boolean(app.screeningUpdatedAt)&&
  canReviewApplicant(app.applicationStatus,app.screeningStatus);
}
