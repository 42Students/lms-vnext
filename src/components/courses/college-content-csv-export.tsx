"use client";
import {collegeContentCsv,type CollegeContentExportRow} from "@/modules/courses/college-content-csv-model";
export function CollegeContentCsvExport({rows,filename}:{rows:readonly CollegeContentExportRow[];filename:string}){
 function download(){
  const url=URL.createObjectURL(new Blob([collegeContentCsv(rows)],{type:"text/csv;charset=utf-8"}));
  const a=document.createElement("a");a.href=url;a.download=filename;a.click();
  window.setTimeout(()=>URL.revokeObjectURL(url),0);
 }
 return <button type="button" disabled={!rows.length} onClick={download}
  className="inline-flex min-h-10 items-center rounded border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">Export CSV</button>;
}
