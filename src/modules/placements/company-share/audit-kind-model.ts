import {z} from "zod";
export const tpoCompanyAuditKindSchema=z.enum(["ALL","VIEW","CSV","LOCKED"]);
export function tpoCompanyAuditHref(jobId:string,kind:z.infer<typeof tpoCompanyAuditKindSchema>){
 const base="/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/share-audit";
 return kind==="ALL"?base:base+"?kind="+kind;
}
export function tpoCompanyAuditExportHref(jobId:string,kind:z.infer<typeof tpoCompanyAuditKindSchema>){
 const base="/api/placements/tpo/jobs/"+encodeURIComponent(jobId)+"/company-shares/audit/export";
 return kind==="ALL"?base:base+"?kind="+kind;
}
