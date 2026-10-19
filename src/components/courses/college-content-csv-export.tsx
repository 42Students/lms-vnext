"use client";
import { Button } from "@/components/ui/button";
import {collegeContentCsv,type CollegeContentExportRow} from "@/modules/courses/college-content-csv-model";
export function CollegeContentCsvExport({rows,filename}:{rows:readonly CollegeContentExportRow[];filename:string}){
 function download(){
  const url=URL.createObjectURL(new Blob([collegeContentCsv(rows)],{type:"text/csv;charset=utf-8"}));
  const a=document.createElement("a");a.href=url;a.download=filename;a.click();
  window.setTimeout(()=>URL.revokeObjectURL(url),0);
 }
 return <Button variant="secondary" type="button" disabled={!rows.length} onClick={download}
  className="text-primary-text">Export CSV</Button>;
}
