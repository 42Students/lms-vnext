/** REC-home-drives-35: progress is an orientation aid, never a claim that
 * unshared applicants, unverified selections or joining are complete. */
export type RecruiterDriveProgressInput={
 shared:number; active:number; withdrawn:number;
 issuedOffers:number; acceptedOffers:number;
 totalRounds:number;completedRounds:number;readOnly:boolean;closed?:boolean;
};
const STEPS=["Requested","Approved","Applications","Rounds","Offers","Completed"] as const;
export function recruiterDriveProgressSteps(input:RecruiterDriveProgressInput){
 // Published and closed jobs necessarily passed request/approval; the current
 // stage comes only from persisted employer-visible activity, not invented rows.
 // A student accepting an offer does not complete the company's drive.
 // Only the persisted CLOSED lifecycle may reach Completed.
 const index=input.closed?5:input.acceptedOffers>0||input.issuedOffers>0?4:
  input.totalRounds>0&&input.shared>0?3:2;
 return STEPS.map((label,i)=>({
  label,state:(i<index?"COMPLETE":i===index?"CURRENT":"UPCOMING") as
   "COMPLETE"|"CURRENT"|"UPCOMING",
 }));
}
export function recruiterDriveNextAction(input:RecruiterDriveProgressInput){
 if(input.readOnly)return {label:"Hire again",detail:"This drive is closed. Start another request using this role as a draft.",tab:null};
 if(input.issuedOffers>0)return {label:"View offers",detail:"Follow up on offers and joining outcomes with the placement cell.",tab:"offers"};
 if(input.shared===0)return {label:"Review applicants",detail:"Students can apply while the drive is live. The placement cell shares the applicant list with you.",tab:"applicants"};
 if(input.totalRounds>0)return {label:"Rounds & results",detail:"Review rounds, send results and follow up with the placement cell.",tab:"rounds"};
 return {label:"Review applicants",detail:"Review the shared applicants and prepare the next hiring step.",tab:"applicants"};
}
