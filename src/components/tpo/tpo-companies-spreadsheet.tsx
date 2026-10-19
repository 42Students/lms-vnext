"use client";

import Link from "next/link";
import {useMemo} from "react";
import {DataTable} from "@/components/ui/data-table";
import {StatusBadge} from "@/components/ui/status-badge";
import type {TpoCompanyRow} from "@/modules/placements/tpo-companies-view-model";
import type {TpoGridColumn} from "@/modules/placements/tpo-grid-model";
import {safeTpoCompanyWebsiteUrl} from "@/modules/placements/tpo-safe-company-url";
import {GridWorkspace} from "./grid/grid-workspace";

function companyHref(company:TpoCompanyRow){
 return company.companyId
  ?"/tpo/companies/"+encodeURIComponent(company.companyId)
  :"/tpo/companies?name="+encodeURIComponent(company.name);
}
const columns:readonly TpoGridColumn<TpoCompanyRow>[]=[
 {key:"company",label:"Company",read:company=>company.name},
 {key:"contacts",label:"Contacts",read:company=>company.contacts??"Unavailable",sortKind:"number",sortValue:company=>company.contacts},
 {key:"drives",label:"Drives",read:company=>company.drives,sortKind:"number"},
 {key:"offers",label:"Offers",read:company=>company.offers,sortKind:"number"},
 {key:"accepted",label:"Accepted",read:company=>company.acceptedOffers,sortKind:"number"},
 {key:"joins",label:"Confirmed joins",read:company=>company.confirmedJoinedLearners,sortKind:"number"},
 {key:"actions",label:"Actions",read:company=>company.companyId?"Create drive":"Link company first"},
];

/** Client chrome only; row data comes from the authorized server directory.
 * Columns are browser-local because the company API rejects a columns query key. */
export function TpoCompaniesSpreadsheet({rows}:{rows:readonly TpoCompanyRow[]}){
 const keys=useMemo(()=>columns.map(column=>column.key),[]);
 return <GridWorkspace rows={rows} columns={columns}
  rowKey={company=>company.companyId??"unlinked:"+company.name}
  searchParam="search" searchMaxLength={150} searchPlaceholder="Company name or website"
  columnScope="local" columnStorageKey="tpo-company-directory-columns-v1"
  exportName="tpo-companies-page">
  {visible=>{
   const active=new Set(visible.length?visible:keys);
   return <DataTable caption="Companies on this page" rows={rows}
    getRowKey={company=>company.companyId??"unlinked:"+company.name}
    empty={<p role="status" className="text-sm text-body">No companies match these filters.</p>}
    columns={[
     {key:"company",header:"Company",mobileLabel:"Company",mobilePriority:"primary" as const,
      cell:(company:TpoCompanyRow)=><div className="min-w-0">
       <Link href={companyHref(company)}
        className="inline-flex min-h-9 items-center break-words font-semibold text-link underline lms-inline-link">
        {company.name}</Link>
       {company.unlinkedLeadGroup
        ?<div className="mt-2"><StatusBadge tone="warning">CRM name only · not linked</StatusBadge></div>
        :<p className="mt-1 text-xs text-muted-foreground">Linked employer</p>}
       {company.websiteUrl?<p className="mt-1 break-all text-xs text-body">
        {safeTpoCompanyWebsiteUrl(company.websiteUrl)
         ?<a href={safeTpoCompanyWebsiteUrl(company.websiteUrl)!}
           target="_blank" rel="noopener noreferrer"
           aria-label={"Visit "+company.name+" website (opens in a new tab)"}
           className="text-link underline lms-inline-link focus-visible:outline-2 focus-visible:outline-primary">
           {company.websiteUrl}<span aria-hidden="true" className="ml-1">↗</span></a>
         :company.websiteUrl}
       </p>:null}
      </div>},
     {key:"contacts",header:"Contacts",mobileLabel:"Contacts",mobilePriority:"secondary" as const,
      cell:(company:TpoCompanyRow)=>company.contacts??"Unavailable"},
     {key:"drives",header:"Drives",mobileLabel:"Drives",mobilePriority:"secondary" as const,
      cell:(company:TpoCompanyRow)=>company.drives},
     {key:"offers",header:"Offers",mobileLabel:"Offers",mobilePriority:"secondary" as const,
      cell:(company:TpoCompanyRow)=>company.offers},
     {key:"accepted",header:"Accepted",mobileLabel:"Accepted",mobilePriority:"secondary" as const,
      cell:(company:TpoCompanyRow)=>company.acceptedOffers},
     {key:"joins",header:"Confirmed joins",mobileLabel:"Confirmed joins",mobilePriority:"secondary" as const,
      cell:(company:TpoCompanyRow)=>company.confirmedJoinedLearners},
     {key:"actions",header:"Actions",mobileLabel:"Actions",mobilePriority:"action" as const,
      cell:(company:TpoCompanyRow)=>company.companyId
       ?<Link href={"/tpo/placements/new?company="+encodeURIComponent(company.name)}
         className="inline-flex min-h-9 items-center font-semibold text-link underline lms-inline-link">Create drive</Link>
       :<span className="text-xs text-muted-foreground">Link company first</span>},
    ].filter(column=>active.has(column.key))}/>
  }}
 </GridWorkspace>;
}
