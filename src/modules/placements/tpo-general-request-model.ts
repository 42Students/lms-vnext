import {z} from "zod";
const uuid=z.string().uuid(),reason=z.string().trim().min(3).max(2000);
const https=z.url().refine(value=>{try{const url=new URL(value);return url.protocol==="https:"&&!url.username&&!url.password;}catch{return false;}});
const shared={reason};
export const tpoGeneralRequestInputSchema=z.discriminatedUnion("kind",[
 z.strictObject({...shared,kind:z.literal("OFF_CAMPUS_OFFER"),companyName:z.string().trim().min(2).max(200),
  ctcLpa:z.string().regex(/^(?:0|[1-9][0-9]{0,6})(?:\\.[0-9]{1,2})?$/),
  proofUrl:https}),
 z.strictObject({...shared,kind:z.literal("REGISTRATION_CHANGE"),
  cohortId:uuid,choice:z.enum(["PLACEMENTS","HIGHER_STUDIES","NOT_INTERESTED","ENTREPRENEURSHIP","COMPETITIVE_EXAMS"]),
  consentConfirmed:z.boolean().optional()}),
 z.strictObject({...shared,kind:z.literal("ABSENCE_DISPUTE"),roundId:uuid,applicationId:uuid,proofUrl:https}),
 z.strictObject({...shared,kind:z.literal("CORRECTION_WITH_PROOF"),
  section:z.enum(["EDUCATION","IDENTITY"]),field:z.string().trim().min(2).max(80),
  proposedValue:z.string().trim().min(1).max(250),proofUrl:https}),
 z.strictObject({...shared,kind:z.literal("PLACEMENT_AFTER_PLACEMENT"),
  requestedJobId:uuid,justification:z.string().trim().min(10).max(1000)}),
]);
export type TpoGeneralRequestInput=z.infer<typeof tpoGeneralRequestInputSchema>;
export const tpoGeneralRequestDecisionSchema=z.strictObject({
 confirmed:z.literal(true),version:uuid,action:z.enum(["APPROVE","REJECT"]),
 note:z.string().trim().max(2000),
});
export function tpoGeneralRequestTarget(input:TpoGeneralRequestInput){
 switch(input.kind){
  case "OFF_CAMPUS_OFFER":return input.companyName.trim().toLocaleLowerCase("en-IN").slice(0,150);
  case "REGISTRATION_CHANGE":return input.cohortId;
  case "ABSENCE_DISPUTE":return input.applicationId+":"+input.roundId;
  case "CORRECTION_WITH_PROOF":return input.section+":"+input.field;
  case "PLACEMENT_AFTER_PLACEMENT":return input.requestedJobId;
 }
}
export function tpoGeneralRequestPayload(input:TpoGeneralRequestInput):Record<string,unknown>{
 const {kind,reason,...payload}=input;return payload;
}
export function requiresTrustedProof(kind:string):boolean{
 return ["OFF_CAMPUS_OFFER","ABSENCE_DISPUTE","CORRECTION_WITH_PROOF"].includes(kind);
}
