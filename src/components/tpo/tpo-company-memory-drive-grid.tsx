"use client";

import dynamic from "next/dynamic";
import {useRouter} from "next/navigation";
import type {TpoSpreadsheetGridProps} from "./tpo-spreadsheet-grid";
import type {TpoGridColumn} from "@/modules/placements/tpo-grid-model";
import {companyDriveCsv} from "@/modules/placements/tpo-company-drive-export-model";
import {GridWorkspace} from "./grid/grid-workspace";

export type CompanyMemoryDriveRow={
 id:string;jobTitle:string;status:string;createdAt:string;applied:number|null;offers:number|null;
};
const statusLabel=(status:string)=>({
 PUBLISHED:"Live",CLOSED:"Completed",DRAFT:"Draft",REQUEST:"Sent for review",
 CANCELLED:"Cancelled",
} as Record<string,string>)[status]??status;
const year=(value:string)=>{
 const instant=Date.parse(value);
 return Number.isFinite(instant)?new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",year:"numeric",
 }).format(new Date(instant)):"Not recorded";
};
const date=(value:string)=>{
 const instant=Date.parse(value);
 return Number.isFinite(instant)?new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
 }).format(new Date(instant)):"Not recorded";
};
const columns:readonly TpoGridColumn<CompanyMemoryDriveRow>[]=[
 {key:"role",label:"Role",read:row=>row.jobTitle},
 {key:"status",label:"Status",read:row=>statusLabel(row.status)},
 {key:"year",label:"Year",read:row=>year(row.createdAt),sortKind:"date",sortValue:row=>{const instant=Date.parse(row.createdAt);return Number.isFinite(instant)?instant:null;}},
 {key:"applied",label:"Applied",sortKind:"number",sortValue:row=>row.applied,
  read:row=>(row.applied===null?"Unavailable":String(row.applied))+" · "+(row.offers===null?"Unavailable":String(row.offers))+" offers"},
 {key:"created",label:"Created",read:row=>date(row.createdAt),sortKind:"date",sortValue:row=>{const instant=Date.parse(row.createdAt);return Number.isFinite(instant)?instant:null;}},
];
/** Quartz sheet mounts in the browser; rows remain the server-scoped company's drives. */
const TpoGrid=dynamic<TpoSpreadsheetGridProps<CompanyMemoryDriveRow>>(
 ()=>import("./grid/tpo-grid").then(module=>module.TpoGrid<CompanyMemoryDriveRow>),
 {ssr:false,loading:()=> <p role="status" className="border-y border-border py-4 text-sm text-muted-foreground">Loading company drives…</p>},
);

export function TpoCompanyMemoryDriveGrid({companyName,drives,search,onSearchChange}:{
 companyName:string;drives:readonly CompanyMemoryDriveRow[];
 search:string;onSearchChange:(next:string)=>void;
}){
 const router=useRouter();
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
  {visibleKeys=><TpoGrid rows={shown} rowKey={row=>row.id}
   columns={columns.filter(column=>visibleKeys.includes(column.key))}
   integratedWorkspace storageKey="tpo-company-memory-drives-v1"
   openPrimary={{
    columnKey:"role",
    ariaLabel:row=>"Open "+row.jobTitle+" drive",
    onOpen:row=>router.push("/tpo/placements/jobs/"+encodeURIComponent(row.id)),
   }}/>} 
 </GridWorkspace>;
}
