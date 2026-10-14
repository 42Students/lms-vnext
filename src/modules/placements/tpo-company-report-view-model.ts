import { z } from "zod";
import type { PlacementReportCompanyRow } from "./report-model";
export const companyReportViewSchema=z.object({
 q:z.string().trim().max(100).default(""),
 page:z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export const COMPANY_REPORT_PAGE_SIZE=25;
export function paginateCompanyReport(rows:readonly PlacementReportCompanyRow[],query:z.infer<typeof companyReportViewSchema>){
 const term=query.q.toLocaleLowerCase("en-IN");
 const filtered=rows.filter(r=>!term||r.companyName.toLocaleLowerCase("en-IN").includes(term));
 const totalPages=Math.max(1,Math.ceil(filtered.length/COMPANY_REPORT_PAGE_SIZE));
 const page=Math.min(query.page,totalPages);
 return {query,page,pageSize:COMPANY_REPORT_PAGE_SIZE,total:filtered.length,totalPages,
  rows:filtered.slice((page-1)*COMPANY_REPORT_PAGE_SIZE,page*COMPANY_REPORT_PAGE_SIZE)};
}
export function companyReportViewHref(query:{seasonId?:string;jobId?:string;q?:string;page?:number}){
 const q=new URLSearchParams();
 if(query.seasonId)q.set("seasonId",query.seasonId);
 if(query.jobId)q.set("jobId",query.jobId);
 if(query.q)q.set("q",query.q);
 if(query.page&&query.page>1)q.set("page",String(query.page));
 const suffix=q.toString();return "/tpo/reports/by-company"+(suffix?"?"+suffix:"");
}
