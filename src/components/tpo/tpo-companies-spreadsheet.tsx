"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import {useMemo} from "react";
import {useRouter} from "next/navigation";
import {StatusBadge} from "@/components/ui/status-badge";
import type {TpoCompanyRow} from "@/modules/placements/tpo-companies-view-model";
import type {TpoGridColumn} from "@/modules/placements/tpo-grid-model";
import type {TpoSpreadsheetGridProps} from "./tpo-spreadsheet-grid";
import {safeTpoCompanyWebsiteUrl} from "@/modules/placements/tpo-safe-company-url";
import {GridWorkspace} from "./grid/grid-workspace";

/** Desktop: the old LMS Quartz spreadsheet. Phone: its responsive list fallback.
 * Keep server-side company/lead authorization and paging unchanged. */
const TpoGrid=dynamic<TpoSpreadsheetGridProps<TpoCompanyRow>>(
 ()=>import("./grid/tpo-grid").then(module=>module.TpoGrid<TpoCompanyRow>),
 {ssr:false,loading:()=> <p role="status" className="py-4 text-sm text-muted-foreground">Loading company spreadsheet…</p>},
);

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

/** Browser toolbar controls only the authorized server directory's current page.
 * The company API does not accept a columns query parameter, so the workspace
 * owns local column visibility and the grid only persists Quartz layout locally. */
export function TpoCompaniesSpreadsheet({rows}:{rows:readonly TpoCompanyRow[]}){
 const router=useRouter();
 const keys=useMemo(()=>columns.map(column=>column.key),[]);
 return <GridWorkspace rows={rows} columns={columns}
  rowKey={company=>company.companyId??"unlinked:"+company.name}
  searchMode="hidden" searchParam="search" searchMaxLength={150} searchPlaceholder="Company name or website"
  columnScope="local" columnStorageKey="tpo-company-directory-columns-v1"
  exportName="companies">
  {visible=>{
   const active=new Set(visible.length?visible:keys);
   return <TpoGrid rows={rows}
    columns={columns.filter(column=>active.has(column.key)&&column.key!=="actions")}
    rowKey={company=>company.companyId??"unlinked:"+company.name}
    storageKey="tpo-company-directory-columns-v1" integratedWorkspace
    openPrimary={{
     columnKey:"company",
     ariaLabel:company=>"Open "+company.name+" company details",
     onOpen:company=>router.push(companyHref(company)),
    }}
    rowActions={company=><div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
     {company.unlinkedLeadGroup
      ?<StatusBadge tone="warning">CRM name only · not linked</StatusBadge>
       :<StatusBadge tone="success">Linked employer</StatusBadge>}
     {company.websiteUrl&&safeTpoCompanyWebsiteUrl(company.websiteUrl)
      ?<a href={safeTpoCompanyWebsiteUrl(company.websiteUrl)!}
        target="_blank" rel="noopener noreferrer"
        aria-label={"Visit "+company.name+" website (opens in a new tab)"}
        className="lms-inline-link inline-flex min-h-11 md:min-h-9 min-w-0 items-center break-all text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        {company.websiteUrl}<span aria-hidden="true" className="ml-1">↗</span></a>
      :company.websiteUrl?<span className="break-all text-xs text-muted-foreground">{company.websiteUrl}</span>:null}
     {company.companyId
      ?<Link href={"/tpo/placements/new?company="+encodeURIComponent(company.name)}
        className="lms-inline-link inline-flex min-h-11 md:min-h-9 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Create drive</Link>
      :<span className="text-xs text-muted-foreground">Link company first</span>}
    </div>}
   />;
  }}
 </GridWorkspace>;
}
