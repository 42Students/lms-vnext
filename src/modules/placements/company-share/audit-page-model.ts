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
