import {z} from "zod";
export const COMPANY_SHARE_AUDIT_PAGE_SIZE=25;
export const COMPANY_SHARE_AUDIT_EXPORT_LIMIT=500;
export const companyShareAuditPageSchema=z.coerce.number().int().min(1).max(10000);
export function companyShareAuditPageHref(jobId:string,kind:string,page:number){
 const base="/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/share-audit";
 const params=new URLSearchParams();
 if(kind!=="ALL")params.set("kind",kind);
 if(page>1)params.set("page",String(page));
 return params.size?base+"?"+params.toString():base;
}

/** Audit views can disappear from a filtered slice as its URL becomes stale. */
export function clampCompanyShareAuditPage(page:number,total:number){
 const totalPages=Math.max(1,Math.ceil(Math.max(0,total)/COMPANY_SHARE_AUDIT_PAGE_SIZE));
 return {page:Math.min(Math.max(page,1),totalPages),totalPages};
}

/** Unregistered audit tables cannot be interpreted as zero actual activity. */
export function companyShareAuditAvailability(ready:boolean,total:number){
 return ready?{kind:"READY" as const,total}:{kind:"UNAVAILABLE" as const,total:null};
}
