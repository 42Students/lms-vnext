import {z} from "zod";
export const resourceFileLimitsSchema=z.object({
 maxBytes:z.number().int().positive().max(1073741824),
 maxPerResource:z.number().int().min(1).max(1000),
 allowedContentTypes:z.array(z.string().min(1).max(160)).min(1).max(50),
}).strict();
export type ResourceFileLimits=z.infer<typeof resourceFileLimitsSchema>;
export type FileCandidate={name:string;size:number;type:string};
/** Browser preflight only; backend must sniff type, enforce quotas and reauthorize. */
export function resourceFilePreflight(candidate:FileCandidate,limits:ResourceFileLimits,
 currentCount:number):{allowed:boolean;message:string|null}{
 const policy=resourceFileLimitsSchema.parse(limits);
 if(!Number.isSafeInteger(currentCount)||currentCount<0)return {allowed:false,message:"File count is unavailable. Refresh the resource."};
 if(currentCount>=policy.maxPerResource)return {allowed:false,message:"This resource reached its file limit."};
 if(!candidate.name.trim()||candidate.name.length>255||/[\u0000-\u001f\/\\]/u.test(candidate.name))
  return {allowed:false,message:"Choose a file with a valid name."};
 if(!Number.isSafeInteger(candidate.size)||candidate.size<=0)
  return {allowed:false,message:"Choose a non-empty file."};
 if(candidate.size>policy.maxBytes)return {allowed:false,message:"File exceeds the permitted size."};
 if(!policy.allowedContentTypes.includes(candidate.type))
  return {allowed:false,message:"This file type is not permitted."};
 return {allowed:true,message:null};
}
