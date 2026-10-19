"use client";

import Link from "next/link";
import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
import type {TpoGridColumn} from "@/modules/placements/tpo-grid-model";
import {companyDriveCsv} from "@/modules/placements/tpo-company-drive-export-model";
import {GridWorkspace} from "./grid/grid-workspace";

export type CompanyMemoryDriveRow={
 id:string;jobTitle:string;status:string;createdAt:string;applied:number;offers:number;
};
const statusLabel=(status:string)=>({
 PUBLISHED:"Live",CLOSED:"Completed",DRAFT:"Draft",REQUEST:"Sent for review",
 CANCELLED:"Cancelled",
} as Record<string,string>)[status]??status;
const year=(value:string)=>new Intl.DateTimeFormat("en-IN",{
 timeZone:"Asia/Kolkata",year:"numeric",
}).format(new Date(value));
const date=(value:string)=>new Intl.DateTimeFormat("en-IN",{
 timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
}).format(new Date(value));
const columns:readonly TpoGridColumn<CompanyMemoryDriveRow>[]=[
 {key:"role",label:"Role",read:row=>row.jobTitle},
 {key:"status",label:"Status",read:row=>statusLabel(row.status)},
 {key:"year",label:"Year",read:row=>year(row.createdAt)},
 {key:"applied",label:"Applied",read:row=>row.applied+" · "+row.offers+" offers"},
 {key:"created",label:"Created",read:row=>date(row.createdAt)},
];
const rowColumns:readonly DataTableColumn<CompanyMemoryDriveRow>[]=[
 {key:"role",header:"Role",mobilePriority:"primary",cell:row=>
  <Link href={"/tpo/placements/jobs/"+encodeURIComponent(row.id)}
   className="inline-flex min-h-9 items-center font-semibold text-link hover:underline lms-inline-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
   {row.jobTitle}
  </Link>},
 {key:"status",header:"Status",mobilePriority:"secondary",cell:row=>statusLabel(row.status)},
 {key:"year",header:"Year",mobilePriority:"secondary",cell:row=>year(row.createdAt)},
 {key:"applied",header:"Applied",mobilePriority:"secondary",cell:row=>row.applied+" · "+row.offers+" offers"},
 {key:"created",header:"Created",mobilePriority:"secondary",cell:row=>date(row.createdAt)},
];

export function TpoCompanyMemoryDriveGrid({companyName,drives,search,onSearchChange}:{
 companyName:string;drives:readonly CompanyMemoryDriveRow[];
 search:string;onSearchChange:(next:string)=>void;
}){
 const term=search.trim().toLocaleLowerCase("en-IN");
 const shown=drives.filter(row=>!term||[
  row.jobTitle,statusLabel(row.status),year(row.createdAt),
 ].join(" ").toLocaleLowerCase("en-IN").includes(term));
 function exportCurrent(){
  if(shown.length===0)return;
  const blob=new Blob([companyDriveCsv(shown)],{type:"text/csv;charset=utf-8"});
  const href=URL.createObjectURL(blob);
  try{
   const anchor=document.createElement("a");
   anchor.href=href;
   anchor.download=companyName.toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,70)+"-drives.csv";
   document.body.appendChild(anchor);anchor.click();anchor.remove();
  }finally{URL.revokeObjectURL(href);}
 }
 return <GridWorkspace rows={shown} columns={columns} rowKey={row=>row.id}
  columnScope="local" columnStorageKey="tpo-company-memory-drives-v1"
  searchMode="controlled" searchValue={search} onSearchChange={onSearchChange}
  searchMaxLength={120} searchPlaceholder="Search role, status or year"
  exportName="company-drives" onExportCsv={()=>exportCurrent()}>
  {visibleKeys=><DataTable rows={shown} getRowKey={row=>row.id}
   caption="Company drives" empty={<p role="status">No matching drives.</p>}
   columns={rowColumns.filter(column=>visibleKeys.includes(column.key))}/>}
 </GridWorkspace>;
}
