import {z} from "zod";
export const campaignSourceSchema=z.object({
 source:z.enum(["REFERRAL","EVENT","DIRECTORY","LINKEDIN","OTHER"]),
 sourceDetail:z.string().trim().max(200).optional(),
}).strict().superRefine((value,ctx)=>{
 if(value.source==="OTHER" && !value.sourceDetail) ctx.addIssue({code:"custom",path:["sourceDetail"],message:"Describe other source"});
});
export type CampaignSource=z.infer<typeof campaignSourceSchema>;
