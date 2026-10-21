"use client";
import {Button} from "@/components/ui/button";
import {collegeContentCsv,legacyLessonContentCsv,type CollegeContentExportRow} from "@/modules/courses/college-content-csv-model";
export function CollegeContentCsvExport({rows,filename,legacyLessonContent=false}:{rows:readonly CollegeContentExportRow[];filename:string;legacyLessonContent?:boolean}){
 function download(){
  const url=URL.createObjectURL(new Blob([legacyLessonContent?legacyLessonContentCsv(rows):collegeContentCsv(rows)],{type:"text/csv;charset=utf-8"}));
  let anchor: HTMLAnchorElement | null = null;
  let deferred=false;
  try {
   anchor=document.createElement("a");
   anchor.href=url;anchor.download=filename;
   document.body.appendChild(anchor);
   anchor.click();
   window.setTimeout(()=>URL.revokeObjectURL(url),30_000);
   deferred=true;
  } finally {
   anchor?.remove();
   if(!deferred)URL.revokeObjectURL(url);
  }
 }
 return <Button type="button" variant="secondary" disabled={!rows.length} onClick={download} aria-label={rows.length?"Export college course content as CSV":"No course content to export as CSV"}
  className="min-h-11 md:min-h-9 print:hidden">Export CSV</Button>;
}
