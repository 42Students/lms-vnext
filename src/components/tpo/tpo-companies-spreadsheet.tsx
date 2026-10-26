"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import {useMemo,useState} from "react";
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
 const keys=useMemo(()=>columns.map(column=>column.key),[]);
 const [focusedKey,setFocusedKey]=useState<string|null>(null);
 const [dismissed,setDismissed]=useState(false);
 const keyOf=(company:TpoCompanyRow)=>company.companyId??"unlinked:"+company.name;
 const focused=dismissed?null:rows.find(company=>keyOf(company)===focusedKey)??rows[0]??null;
 return <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_290px]">
 <GridWorkspace rows={rows} columns={columns}
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
     onOpen:company=>{setFocusedKey(keyOf(company));setDismissed(false);},
    }}
    rowActions={company=><div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
     {company.unlinkedLeadGroup
      ?<StatusBadge tone="warning">CRM name only · not linked</StatusBadge>
       :<StatusBadge tone="success">Linked employer</StatusBadge>}
     {company.websiteUrl&&safeTpoCompanyWebsiteUrl(company.websiteUrl)
      ?<a href={safeTpoCompanyWebsiteUrl(company.websiteUrl)!}
        
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
 </GridWorkspace>
 {focused?<aside aria-label={"Selected company: "+focused.name} data-testid="tpo.companies.inspector"
  className="min-w-0 rounded-xl border border-border bg-surface p-4">
   <div className="flex items-start justify-between gap-2">
    <div className="min-w-0">
     <h2 className="break-words text-lg font-bold text-foreground">{focused.name}</h2>
     <p className="mt-1 text-xs text-body">{focused.unlinkedLeadGroup?
      "CRM-only name · not linked to a verified employer":"College-linked employer"}</p>
    </div>
    <button type="button" aria-label="Close company summary" onClick={()=>setDismissed(true)}
     className="min-h-11 min-w-11 rounded-lg border border-border text-body md:min-h-9 md:min-w-9">×</button>
   </div>
   <dl className="mt-4 grid grid-cols-3 gap-2" aria-label="Verified company numbers">
    {([
     ["Contacts",focused.contacts===null?"Unavailable":focused.contacts],
     ["Drives",focused.drives],
     ["Confirmed joins",focused.confirmedJoinedLearners],
    ] as const).map(([label,value])=><div key={label} className="min-w-0 rounded-lg bg-surface-secondary p-2">
     <dt className="text-[11px] text-muted-foreground">{label}</dt>
     <dd className="mt-1 break-words text-base font-semibold text-foreground">{value}</dd>
    </div>)}
   </dl>
   <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
    <p className="font-bold uppercase tracking-wide text-muted-foreground">Offer evidence</p>
    <p>{focused.offers} recorded offers · {focused.acceptedOffers} accepted</p>
    <p className="text-xs text-muted-foreground">Earlier-season placement comparisons are unavailable in this directory. Confirmed joins are not the same as placed students.</p>
   </div>
   <nav aria-label="Company actions" className="mt-4 flex flex-wrap gap-2">
    {focused.companyId?<Link href={"/tpo/placements/new?company="+encodeURIComponent(focused.name)}
     className="inline-flex min-h-11 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-on-primary md:min-h-9">Plan a drive</Link>:null}
    <Link href={"/tpo/recruiters?add=1&company="+encodeURIComponent(focused.name)}
     className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-semibold text-link md:min-h-9">Add contact</Link>
    <Link href={companyHref(focused)}
     className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">Open company page</Link>
   </nav>
   {focused.websiteUrl&&safeTpoCompanyWebsiteUrl(focused.websiteUrl)?
    <a href={safeTpoCompanyWebsiteUrl(focused.websiteUrl)!}
     className="mt-3 inline-flex min-h-11 items-center break-all text-sm text-link underline md:min-h-9">Company website</a>:null}
 </aside>:<aside className="min-w-0 rounded-xl border border-border bg-surface p-4 text-sm text-body">
  <p>Choose a company in the table to see its summary.</p>
  <button type="button" className="mt-2 min-h-11 font-semibold text-link underline"
   onClick={()=>{setFocusedKey(null);setDismissed(false);}}>Show first company</button>
 </aside>}
 </div>;
}
