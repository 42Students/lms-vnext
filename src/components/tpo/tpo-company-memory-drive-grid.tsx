"use client";

import dynamic from "next/dynamic";
import {useRouter} from "next/navigation";
import type {TpoSpreadsheetGridProps} from "./tpo-spreadsheet-grid";
import type {TpoGridColumn} from "@/modules/placements/tpo-grid-model";
import {exportTpoGridCsv} from "@/modules/placements/tpo-grid-model";
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
 {key:"year",label:"Year",read:row=>year(row.createdAt),sortKind:"date",sortValue:row=>{const instant=Date.parse(row.createdAt);return Number.isFinite(instant)?instant:null;}},
 {key:"applied",label:"Applied",sortKind:"number",sortValue:row=>row.applied,
  read:row=>row.applied===null||row.offers===null?"Unavailable":
    String(row.applied)+(row.offers>0?" · "+row.offers+" offers":"")},
 {key:"status",label:"Status",read:row=>statusLabel(row.status)},
 {key:"created",label:"Created",read:row=>date(row.createdAt),sortKind:"date",sortValue:row=>{const instant=Date.parse(row.createdAt);return Number.isFinite(instant)?instant:null;}},
];
/** Quartz sheet mounts in the browser; rows remain the server-scoped company's drives. */
const TpoGrid=dynamic<TpoSpreadsheetGridProps<CompanyMemoryDriveRow>>(
 ()=>import("./grid/tpo-grid").then(module=>module.TpoGrid<CompanyMemoryDriveRow>),
 {ssr:false,loading:()=> <div role="status" aria-label="Loading company drives" className="space-y-2 border-y border-border py-4">
  <p className="text-sm text-muted-foreground">Loading company drives…</p>
  <div aria-hidden="true" className="h-9 w-full animate-pulse rounded bg-muted"/>
  <div aria-hidden="true" className="h-9 w-full animate-pulse rounded bg-muted"/>
 </div>},
);

export function TpoCompanyMemoryDriveGrid({companyName,drives,search,onSearchChange}:{
 companyName:string;drives:readonly CompanyMemoryDriveRow[];
 search:string;onSearchChange:(next:string)=>void;
}){
 const router=useRouter();
 const term=search.trim().toLocaleLowerCase("en-IN");
 const shown=drives.filter(row=>!term||[
  row.jobTitle,year(row.createdAt),
 ].join(" ").toLocaleLowerCase("en-IN").includes(term));
 const exportColumns=columns.filter(column=>["role","year","applied","status"].includes(column.key));
 const basename=(companyName.replace(/[\\/?%*:|"<>]/g,"-").trim().slice(0,80)||"company")+"-drives";
 function download(bytes:BlobPart,mime:string,extension:string){
  if(shown.length===0)return;
  const href=URL.createObjectURL(new Blob([bytes],{type:mime}));
  try{
   const anchor=document.createElement("a");
   anchor.href=href;anchor.download=basename+"."+extension;
   document.body.appendChild(anchor);anchor.click();anchor.remove();
  }finally{URL.revokeObjectURL(href);}
 }
 function exportCurrent(){
  download("\uFEFF"+exportTpoGridCsv(exportColumns,shown),
   "text/csv;charset=utf-8","csv");
 }
 function exportExcel(){
  // Valid minimal OOXML worksheet. All cells are inline strings, never formulas.
  // Store-only ZIP keeps the export self-contained without another dependency.
  const xml=(value:unknown)=>String(value??"").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,"")
   .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
   .replace(/"/g,"&quot;").replace(/'/g,"&apos;");
  const lines=[exportColumns.map(col=>col.label),...shown.map(row=>exportColumns.map(col=>col.read(row)))];
  const sheet='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
   '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+
   lines.map((line,index)=>'<row r="'+(index+1)+'">'+
    line.map((value,col)=>'<c r="'+String.fromCharCode(65+col)+(index+1)+'" t="inlineStr"><is><t>'+
     xml(value)+'</t></is></c>').join("")+'</row>').join("")+'</sheetData></worksheet>';
  const contentTypes='<?xml version="1.0" encoding="UTF-8"?>'+
   '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
   '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
   '<Default Extension="xml" ContentType="application/xml"/>'+
   '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+
   '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>';
  const files=[
   ["[Content_Types].xml",contentTypes],
   ["_rels/.rels",'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
   ["xl/workbook.xml",'<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Drives" sheetId="1" r:id="rId1"/></sheets></workbook>'],
   ["xl/_rels/workbook.xml.rels",'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'],
   ["xl/worksheets/sheet1.xml",sheet],
  ] as const;
  const encoder=new TextEncoder();
  const parts:Uint8Array<ArrayBuffer>[]=[];
  const directory:Uint8Array<ArrayBuffer>[]=[];
  let offset=0;
  const crc=(bytes:Uint8Array)=>{
   let result=0xffffffff;
   for(const byte of bytes){
    result^=byte;
    for(let i=0;i<8;i++)result=(result>>>1)^((result&1)?0xedb88320:0);
   }
   return (result^0xffffffff)>>>0;
  };
  for(const [name,contents] of files){
   const nameBytes=encoder.encode(name),body=encoder.encode(contents),sum=crc(body);
   const local=new Uint8Array(30+nameBytes.length);
   const lh=new DataView(local.buffer);
   lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);
   lh.setUint32(14,sum,true);lh.setUint32(18,body.length,true);lh.setUint32(22,body.length,true);
   lh.setUint16(26,nameBytes.length,true);local.set(nameBytes,30);
   parts.push(local,body);
   const central=new Uint8Array(46+nameBytes.length),ch=new DataView(central.buffer);
   ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);
   ch.setUint32(16,sum,true);ch.setUint32(20,body.length,true);ch.setUint32(24,body.length,true);
   ch.setUint16(28,nameBytes.length,true);ch.setUint32(42,offset,true);central.set(nameBytes,46);
   directory.push(central);offset+=local.length+body.length;
  }
  const centralSize=directory.reduce((sum,part)=>sum+part.length,0);
  const footer=new Uint8Array(22),view=new DataView(footer.buffer);
  view.setUint32(0,0x06054b50,true);view.setUint16(8,files.length,true);
  view.setUint16(10,files.length,true);view.setUint32(12,centralSize,true);
  view.setUint32(16,offset,true);
  download(new Uint8Array([...parts,...directory,footer].flatMap(part=>Array.from(part))),
   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","xlsx");
 }
 return <GridWorkspace rows={shown} columns={columns} rowKey={row=>row.id}
  columnScope="local" columnStorageKey="tpo-company-memory-drives-v1"
  defaultVisibleKeys={["role","year","applied","status"]}
  searchMode="controlled" searchValue={search} onSearchChange={onSearchChange}
  searchMaxLength={120} searchPlaceholder="Search"
  exportName={basename} onExportCsv={()=>exportCurrent()} onExportXlsx={()=>exportExcel()}>
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
