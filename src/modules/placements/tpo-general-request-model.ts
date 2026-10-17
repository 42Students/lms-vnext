import {z} from "zod";

const reason=z.string().trim().min(3).max(2000);
const uuid=z.string().uuid();
const nonempty=z.string().trim().min(1).max(1000);
const proofUrl=z.union([
 z.literal(""),
 z.string().url().max(2048).refine(raw=>{
  try{
   const url=new URL(raw);
   return url.protocol==="https:" && !url.username && !url.password;
  }catch{return false;}
 }, "Use a safe HTTPS proof link"),
]).default("");
const requiredProofUrl=proofUrl.refine(value=>value.length>0,"An HTTPS proof link is required");

export const tpoGeneralRequestInputSchema=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("OFF_CAMPUS_OFFER"),reason,
  companyName:z.string().trim().min(1).max(150),ctcLpa:z.string().regex(/^\d{1,8}(?:\.\d{1,2})?$/).refine(value=>Number(value)>0,"Pay must be greater than zero"),
  proofUrl}),
 z.object({kind:z.literal("REGISTRATION_CHANGE"),reason,cohortId:uuid,
  choice:z.enum(["PLACEMENTS","HIGHER_STUDIES","NOT_INTERESTED","ENTREPRENEURSHIP","COMPETITIVE_EXAMS"]),
  consentConfirmed:z.boolean()}),
 z.object({kind:z.literal("ABSENCE_DISPUTE"),reason,applicationId:uuid,roundId:uuid,proofUrl}),
 z.object({kind:z.literal("CORRECTION_WITH_PROOF"),reason,section:z.enum(["EDUCATION"]),
  field:z.string().trim().min(1).max(140),proposedValue:nonempty,proofUrl:requiredProofUrl}),
 z.object({kind:z.literal("OFFER_ACCEPTANCE_DISPUTE"),reason,offerId:uuid}),
 z.object({kind:z.literal("PLACEMENT_AFTER_PLACEMENT"),reason,
  requestedJobId:uuid,justification:nonempty}),
]);
export type TpoGeneralRequestInput=z.infer<typeof tpoGeneralRequestInputSchema>;

export const tpoGeneralRequestDecisionSchema=z.object({
 confirmed:z.literal(true),
 version:uuid,
 action:z.enum(["APPROVE","REJECT"]),
 note:z.string().trim().max(2000),
}).strict().refine(value=>value.action!=="REJECT"||value.note.length>=3,
 {message:"A rejection reason is required",path:["note"]});

export function tpoGeneralRequestTarget(input:TpoGeneralRequestInput):string {
 switch(input.kind){
  case "OFF_CAMPUS_OFFER":return input.companyName.trim().toLocaleLowerCase("en-IN");
  case "REGISTRATION_CHANGE":return input.cohortId;
  case "ABSENCE_DISPUTE":return input.applicationId+":"+input.roundId;
  case "CORRECTION_WITH_PROOF":return input.section+":"+input.field.trim().toLocaleLowerCase("en-IN");
  case "OFFER_ACCEPTANCE_DISPUTE":return input.offerId;
  case "PLACEMENT_AFTER_PLACEMENT":return input.requestedJobId;
 }
}
export function tpoGeneralRequestPayload(input:TpoGeneralRequestInput):Record<string,unknown>{
 return {...input};
}
