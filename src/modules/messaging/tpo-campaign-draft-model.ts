import {z} from "zod";
import {isCampaignTemplateKey} from "./template-boundary-model";
export const tpoCampaignDraftSchema=z.strictObject({
 title:z.string().trim().min(2,"Give this campaign a title").max(160,"Keep the title within 160 characters."),
 subject:z.string().trim().min(2,"Give the email a subject").max(200,"Keep the subject within 200 characters."),
 body:z.string().trim().min(2,"Write the email").max(10000,"Keep the email within 10000 characters."),
 segment:z.enum(["ALL_ELIGIBLE","UNASSIGNED","NEW"],{error:"Choose who gets it"}),
 selectedLeadIds:z.array(z.string().uuid()).min(1,"Choose who gets it").max(100,"Choose no more than 100 recruiters")
  .refine(value=>new Set(value).size===value.length,"Select distinct recruiters").optional(),
 templateKey:z.string().trim().min(2).max(160)
  .refine(isCampaignTemplateKey,"Use a provisioned, non-OTP campaign template"),
});
/** Legacy form boundary: explicit labels, maximum lengths and optional recipient
 * selection. The provider-approved template key is never synthesized. */
export const TPO_CAMPAIGN_DRAFT_FIELDS=[
 {name:"title",label:"Campaign title",maxLength:160,required:true},
 {name:"subject",label:"Email subject",maxLength:200,required:true},
 {name:"body",label:"Email body",maxLength:10000,required:true},
 {name:"segment",label:"Recipients",maxLength:null,required:true},
 {name:"selectedLeadIds",label:"Selected recruiters",maxLength:100,required:false},
 {name:"templateKey",label:"Verified email template",maxLength:160,required:true},
] as const;
export const CAMPAIGN_DRAFT_UNAVAILABLE="Campaign drafts are not ready. Your college needs registered campaign draft storage and a verified recruiter CRM before campaign records can be saved.";
export const CAMPAIGN_DELIVERY_UNAVAILABLE="Campaign delivery is not enabled. A dedicated non-OTP campaign template, provider, suppression checks and delivery receipts must be verified before sending.";

/** Render text-only campaign preview; never use innerHTML or claim provider delivery. */
export function previewTpoCampaignText(body:string,recipient:{name:string;company:string}){
 if(body.length>10000)throw new Error("CAMPAIGN_BODY_TOO_LONG");
 return body.replace(/\{(name|company)\}/g,(_match,key:string)=>
   key==="name"?recipient.name:recipient.company);
}
