import {z} from "zod";
export const COMPANY_SHARE_PAGE_SIZE=25;
export const companyShareLinkPageSchema=z.coerce.number().int().min(1).max(10000);
export function companyShareLinksHref(
 jobId:string,status:string,linkPage:number,q:string,applicantPage:number,
){
 const p=new URLSearchParams({shareStatus:status});
 if(linkPage>1)p.set("sharePage",String(linkPage));
 if(q)p.set("q",q);
 if(applicantPage>1)p.set("page",String(applicantPage));
 return "/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/share-preview?"+p;
}

export function recoverCompanyShareLinkPage(raw:unknown){
 const parsed=companyShareLinkPageSchema.safeParse(raw);
 return parsed.success?{page:parsed.data,wasInvalid:false}:{page:1,wasInvalid:true};
}

/** Keep the requested TPO share-history page in the current result bounds. */
export function clampCompanyShareLinksPage(page:number,total:number){
 const totalPages=Math.max(1,Math.ceil(total/COMPANY_SHARE_PAGE_SIZE));
 return {page:Math.min(Math.max(1,page),totalPages),totalPages};
}
