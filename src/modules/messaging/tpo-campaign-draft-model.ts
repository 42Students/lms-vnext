import {z} from "zod";
import {isCampaignTemplateKey} from "./template-boundary-model";
export const tpoCampaignDraftSchema=z.strictObject({
 title:z.string().trim().min(2).max(160),
 subject:z.string().trim().min(2).max(200),
 body:z.string().trim().min(2).max(10000),
 segment:z.enum(["ALL_ELIGIBLE","UNASSIGNED","NEW"]),
 selectedLeadIds:z.array(z.string().uuid()).max(100).optional(),
 templateKey:z.string().trim().min(2).max(160)
  .refine(isCampaignTemplateKey,"Use a provisioned, non-OTP campaign template"),
});
export const CAMPAIGN_DRAFT_UNAVAILABLE="Campaign drafts are not ready. Your college needs registered campaign draft storage and a verified recruiter CRM before campaign records can be saved.";
export const CAMPAIGN_DELIVERY_UNAVAILABLE="Campaign delivery is not enabled. A dedicated non-OTP campaign template, provider, suppression checks and delivery receipts must be verified before sending.";

/** Render text-only campaign preview; never use innerHTML or claim provider delivery. */
export function previewTpoCampaignText(body:string,recipient:{name:string;company:string}){
 if(body.length>10000)throw new Error("CAMPAIGN_BODY_TOO_LONG");
 return body.replace(/\{(name|company)\}/g,(_match,key:string)=>
   key==="name"?recipient.name:recipient.company);
}
