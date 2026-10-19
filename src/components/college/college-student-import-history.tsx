"use client";
import { Button } from "@/components/ui/button";
import {DataTable} from "@/components/ui/data-table";
import {Dialog} from "@/components/ui/dialog";
import {Alert} from "@/components/ui/alert";
import {EmptyState} from "@/components/ui/empty-state";
import {Skeleton} from "@/components/ui/skeleton";
import {useRef,useState} from "react";
import {isCurrentCollegeImportHistoryRequest} from "@/modules/people/college-import-history-request-model";
type Receipt={id:string;when:string;students:number;imported:number;partial:number;failed:number};
export function CollegeStudentImportHistory(){
 const [open,setOpen]=useState(false);
 const [page,setPage]=useState(1);
 const [rows,setRows]=useState<Receipt[]>([]);
 const [hasNext,setHasNext]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const requestVersion=useRef(0);
 const activeRequest=useRef<AbortController|null>(null);
 function close(){
  // A late page response must never repopulate the dialog after it closes,
  // then overwrite a new page-one request when reopened.
  requestVersion.current++;
  activeRequest.current?.abort();
  activeRequest.current=null;
  // Do not retain private student-import history when the modal closes.
  setRows([]);
  setPage(1);
  setHasNext(false);
  setError("");
  setBusy(false);
  setOpen(false);
 }
 async function load(next:number){
  if(!Number.isSafeInteger(next)||next<1||next>500)return;
  activeRequest.current?.abort();
  const controller=new AbortController();
  activeRequest.current=controller;
  const version=++requestVersion.current;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/college/students/import-history?page="+next,{cache:"no-store",signal:controller.signal});
   const body=await response.json().catch(()=>null);
   if(!response.ok||!Array.isArray(body?.items))throw Error("Import history unavailable.");
   if(!isCurrentCollegeImportHistoryRequest(version,requestVersion.current,controller.signal.aborted))return;
   setRows(body.items as Receipt[]);setPage(next);setHasNext(body.hasNext===true);
  }catch{
   if(isCurrentCollegeImportHistoryRequest(version,requestVersion.current,controller.signal.aborted))
    setError("Import history unavailable. Please try again.");
  }finally{
   if(version===requestVersion.current){
    setBusy(false);
    activeRequest.current=null;
   }
  }
 }
 return <>
  <Button variant="secondary" type="button" onClick={()=>{setOpen(true);void load(1);}}
   className="min-h-11 md:min-h-9">
   Bulk import history</Button>
  <Dialog open={open} onOpenChange={next=>{if(next)setOpen(true);else close();}} title="Bulk import history">
    <div className="flex justify-end">
     <Button variant="secondary" type="button" onClick={close}
      className="min-h-11 md:min-h-9">Close</Button></div>
    {error?<Alert tone="error">{error}</Alert>:null}
    {busy?<Skeleton variant="row" label="Loading import history"/>:null}
    <DataTable<Receipt> caption="Bulk import history" rows={rows} getRowKey={row=>row.id}
      columns={[
        {key:"when",header:"When",cell:row=>new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",
          timeZone:"Asia/Kolkata"}).format(new Date(row.when)),mobilePriority:"primary"},
        {key:"students",header:"Students",cell:row=>row.students,mobilePriority:"secondary"},
        {key:"imported",header:"Imported",cell:row=>row.imported,mobilePriority:"secondary"},
        {key:"partial",header:"Partial",cell:row=>row.partial,mobilePriority:"secondary"},
        {key:"failed",header:"Failed",cell:row=>row.failed,mobilePriority:"secondary"},
      ]}
      empty={busy?<Skeleton variant="row" label="Loading import history"/>:
        error?<Alert tone="error">{error}</Alert>:
        <EmptyState title="No bulk import history" description="No bulk imports have been recorded yet."/>}/>
    <nav aria-label="Import history pages" className="flex justify-between gap-3 text-sm">
     <Button variant="secondary" type="button" disabled={page<=1||busy} onClick={()=>void load(page-1)}
      className="min-h-11 md:min-h-9">Previous</Button>
     <span className="py-2">Page {page}</span>
     <Button variant="secondary" type="button" disabled={!hasNext||busy} onClick={()=>void load(page+1)}
      className="min-h-11 md:min-h-9">Next</Button>
    </nav>
  </Dialog>
 </>;
}
