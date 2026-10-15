import { z } from "zod";
export const tpoRegistrationChoiceSchema = z.enum([
 "PLACEMENTS","HIGHER_STUDIES","NOT_INTERESTED","ENTREPRENEURSHIP","COMPETITIVE_EXAMS",
]);
export type TpoRegistrationChoice = z.infer<typeof tpoRegistrationChoiceSchema>;
export type TpoRegistrationCount = {choice:TpoRegistrationChoice;count:number};
export const TPO_REGISTRATION_CHOICES = tpoRegistrationChoiceSchema.options;
export function summarizeTpoBatchRegistrations(
 activeLearners:number,counts:readonly TpoRegistrationCount[],available:boolean,
){
 if(!available)return {available:false,activeLearners,registered:null,unrecorded:null,byChoice:null};
 const byChoice=Object.fromEntries(TPO_REGISTRATION_CHOICES.map(choice=>[
  choice,counts.find(r=>r.choice===choice)?.count??0,
 ])) as Record<TpoRegistrationChoice,number>;
 const registered=Object.values(byChoice).reduce((a,b)=>a+b,0);
 return {available:true,activeLearners,registered,unrecorded:Math.max(0,activeLearners-registered),byChoice};
}
