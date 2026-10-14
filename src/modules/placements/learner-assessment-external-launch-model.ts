import {z} from "zod";
const sourceSchema=z.object({
 href:z.url().refine(value=>{const p=new URL(value).protocol;return p==="https:"||p==="http:";}),
 scheduledAt:z.string().datetime({offset:true}).nullable(),
 roundName:z.string().trim().min(1).max(300),
}).strict();
/** Round time is not a provider deadline; never imply automatic submission. */
export function learnerAssessmentExternalLaunch(input:unknown,nowMs:number){
 const parsed=sourceSchema.safeParse(input);
 if(!parsed.success)return null;
 const at=parsed.data.scheduledAt?Date.parse(parsed.data.scheduledAt):Number.NaN;
 const minutes=Number.isFinite(at)&&Number.isFinite(nowMs)?(at-nowMs)/60000:null;
 const urgency=minutes!==null&&minutes>=0&&minutes<=30;
 return {href:parsed.data.href,urgent:urgency,
  notice:urgency
   ?"The recorded assessment starts within 30 minutes. This is not an official provider deadline. Confirm provider instructions and leave enough time."
   :"Follow the employer instructions. Opening the link does not submit or mark this assessment completed."};
}
