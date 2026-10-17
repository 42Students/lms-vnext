import {z} from "zod";
export const companyEngagementFilterSchema=z.object({
 companyId:z.string().uuid().optional(),
 seasonId:z.string().uuid().optional(),
 jobId:z.string().uuid().optional(),
}).strict();
export function filterCompanyEngagement<T extends {companyId:string|null}>(
 rows:readonly T[],selectedCompanyId:string|null,
):{rows:T[];valid:boolean}{
 if(!selectedCompanyId)return {rows:[...rows],valid:true};
 const valid=rows.some(row=>row.companyId===selectedCompanyId);
 return {valid,rows:valid?rows.filter(row=>row.companyId===selectedCompanyId):[]};
}
/** Persist the selected company when season/drive filters change. */
export function companyEngagementHref(filters:{companyId?:string|null;seasonId?:string|null;jobId?:string|null}){
 const params=new URLSearchParams();
 if(filters.companyId)params.set("companyId",filters.companyId);
 if(filters.seasonId)params.set("seasonId",filters.seasonId);
 if(filters.jobId)params.set("jobId",filters.jobId);
 const q=params.toString();
 return "/tpo/reports/leads"+(q?"?"+q:"");
}
