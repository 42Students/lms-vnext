import { z } from "zod";
import type { PlacementReportCompanyRow } from "./report-model";
export const companyReportViewSchema=z.object({
 q:z.string().trim().max(100).default(""),
 page:z.coerce.number().int().min(1).max(10000).default(1),
 sort:z.enum(["NAME","PLACED_DESC","ACCEPTED_DESC","AVG_CTC_DESC"]).default("NAME"),
}).strict();
export const COMPANY_REPORT_PAGE_SIZE=25;
export function paginateCompanyReport(rows:readonly PlacementReportCompanyRow[],raw:z.input<typeof companyReportViewSchema>){
 const query=companyReportViewSchema.parse(raw);
 const term=query.q.toLocaleLowerCase("en-IN");
 const filtered=rows.filter(r=>!term||r.companyName.toLocaleLowerCase("en-IN").includes(term))
 .sort((a,b)=>{
  if(query.sort!=="NAME"){
   const metric=query.sort==="PLACED_DESC"?"placed":query.sort==="ACCEPTED_DESC"?"acceptedOffers":"averagePackageInr";
   const left=a[metric],right=b[metric];
   if(left===null&&right!==null)return 1;
   if(right===null&&left!==null)return -1;
   if(left!==null&&right!==null&&left!==right)return right-left;
  }
  return a.companyName.localeCompare(b.companyName)||a.companyId.localeCompare(b.companyId);
 });
 const totalPages=Math.max(1,Math.ceil(filtered.length/COMPANY_REPORT_PAGE_SIZE));
 const page=Math.min(query.page,totalPages);
 return {query,page,pageSize:COMPANY_REPORT_PAGE_SIZE,total:filtered.length,totalPages,
  rows:filtered.slice((page-1)*COMPANY_REPORT_PAGE_SIZE,page*COMPANY_REPORT_PAGE_SIZE)};
}
export function companyReportViewHref(query:{seasonId?:string;jobId?:string;q?:string;page?:number;sort?:string}){
 const q=new URLSearchParams();
 if(query.seasonId)q.set("seasonId",query.seasonId);
 if(query.jobId)q.set("jobId",query.jobId);
 if(query.q)q.set("q",query.q);
 if(query.sort&&query.sort!=="NAME")q.set("sort",query.sort);
 if(query.page&&query.page>1)q.set("page",String(query.page));
 const suffix=q.toString();return "/tpo/reports/by-company"+(suffix?"?"+suffix:"");
}
