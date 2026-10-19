"use client";
import {Button} from "@/components/ui/button";
import {collegeContentCsv,type CollegeContentExportRow} from "@/modules/courses/college-content-csv-model";
export function CollegeContentCsvExport({rows,filename}:{rows:readonly CollegeContentExportRow[];filename:string}){
 function download(){
  const url=URL.createObjectURL(new Blob([collegeContentCsv(rows)],{type:"text/csv;charset=utf-8"}));
  const a=document.createElement("a");a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();a.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),30_000);
 }
 return <Button type="button" variant="secondary" disabled={!rows.length} onClick={download} aria-label="Export college course content as CSV"
  className="min-h-11 md:min-h-9">Export CSV</Button>;
}
