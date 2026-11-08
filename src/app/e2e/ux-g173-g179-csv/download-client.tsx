"use client";
import {Button} from "@/components/ui/button";

/** Exercise the same browser Blob download primitive as the real College
 * Content CSV export. Only the development-gated synthetic fixture imports it.
 * A click creates a same-origin object URL instead of navigating to a data URL. */
export function CsvFixtureDownload({filename,csv}:{filename:string;csv:string}){
 function download(){
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  let anchor:HTMLAnchorElement|null=null;
  let deferred=false;
  try{
   anchor=document.createElement("a");
   anchor.href=url;
   anchor.download=filename;
   document.body.appendChild(anchor);
   anchor.click();
   window.setTimeout(()=>URL.revokeObjectURL(url),30_000);
   deferred=true;
  }finally{
   anchor?.remove();
   if(!deferred)URL.revokeObjectURL(url);
  }
 }
 return <Button variant="secondary" type="button"
  data-filename={filename} onClick={download}
  className="focus-ring flex min-h-11 w-full items-center justify-center rounded-lg border border-border p-3 text-center text-sm font-semibold">
  Download sample CSV
 </Button>;
}
