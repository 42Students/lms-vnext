import type {PlacementReportCompanyRow} from "./report-model";
import {placementReportCsv} from "./report-model";
export function tpoVisibleCompanyReportCsv(rows:readonly PlacementReportCompanyRow[]){
 return placementReportCsv(
  ["Company","Drives","Unique applicants","Applications","Offers","Accepted offers",
   "Placed learners","Average annual CTC (INR)","Highest annual CTC (INR)"],
  rows.map(row=>[
   row.companyName,row.drives,row.applicants,row.applications,row.offers,row.acceptedOffers,
   row.placed,row.averagePackageInr,row.highestPackageInr,
  ]),
 );
}
export function tpoCompanyPageCsvHref(filters:{
 seasonId?:string;jobId?:string;q?:string;sort:string;page:number;
}){
 const p=new URLSearchParams();
 if(filters.seasonId)p.set("seasonId",filters.seasonId);
 if(filters.jobId)p.set("jobId",filters.jobId);
 if(filters.q)p.set("q",filters.q);
 p.set("sort",filters.sort);p.set("page",String(filters.page));
 return "/api/placements/tpo/reports/by-company-page/export?"+p.toString();
}
