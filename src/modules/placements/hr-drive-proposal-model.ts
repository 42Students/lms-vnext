import {z} from "zod";
import {hrDriveDraftSchema} from "./hr-drive-draft-model";
/**
 * A drive proposal is a persisted recruiter-to-TPO CONVERSATION MESSAGE.
 * It is not an approval request, published job, or student-visible drive.
 */
export const hrDriveProposalSchema=z.strictObject({
 collegeId:z.string().uuid(),
 sourceJobId:z.string().uuid().optional(),
 submissionId:z.string().uuid(),
 draft:hrDriveDraftSchema,
});
export type HrDriveProposal=z.infer<typeof hrDriveProposalSchema>;
export function formatHrDriveProposal(raw:unknown):string{
 const input=hrDriveProposalSchema.parse(raw),d=input.draft;
 const fields=[
  "Drive proposal for placement cell discussion — NOT a submitted approval request",
  "Proposal reference: "+input.submissionId,
  "Role: "+d.title,
  "Employment: "+d.employmentType+" · "+d.workMode,
  "Location: "+d.location,
  ...(input.sourceJobId?["Hire Again source job: "+input.sourceJobId]:[]),
  ...([
   ["Minimum annual CTC",d.minimumAnnualCtcInr],
   ["Maximum annual CTC",d.maximumAnnualCtcInr],
   ["Fixed annual CTC",d.fixedAnnualCtcInr],
   ["Variable annual CTC",d.variableAnnualCtcInr],
   ["Minimum CGPA",d.minimumCgpa],
   ["Maximum active backlogs",d.maximumActiveBacklogs],
   ["Bond months",d.bondMonths],
   ["Bond amount",d.bondAmountInr],
  ] as const).filter(([,value])=>value!=="").map(([label,value])=>label+": "+value),
  "Hiring rounds:",
  ...d.rounds.map((round,index)=>(index+1)+". "+round.kind+" — "+round.name),
  "Description:",
  d.description,
 ];
 const message=fields.join("\n");
 if(message.length>4000)throw new Error("DRIVE_PROPOSAL_MESSAGE_TOO_LONG");
 return message;
}
