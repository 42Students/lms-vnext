"use client";
import {DataTable} from "@/components/ui/data-table";
import {Dialog} from "@/components/ui/dialog";
import {useState} from "react";
type Receipt={id:string;when:string;students:number;imported:number;partial:number;failed:number};
export function CollegeStudentImportHistory(){
 const [open,setOpen]=useState(false);
 const [page,setPage]=useState(1);
 const [rows,setRows]=useState<Receipt[]>([]);
 const [hasNext,setHasNext]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 async function load(next:number){
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/college/students/import-history?page="+next,{cache:"no-store"});
   const body=await response.json().catch(()=>null);
   if(!response.ok||!body?.items)throw Error("Import history unavailable.");
   setRows(body.items as Receipt[]);setPage(next);setHasNext(body.hasNext===true);
  }catch(e){setError(e instanceof Error?e.message:"Import history unavailable.");}
  finally{setBusy(false);}
 }
 return <>
  <button type="button" onClick={()=>{setOpen(true);void load(1);}}
   className="inline-flex min-h-11 items-center rounded border border-border px-4 text-sm font-semibold text-primary-text">
   Bulk import history</button>
  <Dialog open={open} onOpenChange={setOpen} title="Bulk import history">
    <div className="flex justify-between"><h2 className="font-semibold">Bulk import history</h2>
     <button type="button" onClick={()=>setOpen(false)}
      className="min-h-11 rounded border border-border px-3">Close</button></div>
    {error?<p role="alert" className="text-error">{error}</p>:null}
    {busy?<p role="status">Loading import history…</p>:null}
    <DataTable<Receipt> caption="Bulk import history" rows={rows} getRowKey={row=>row.id}
      columns={[
        {key:"when",header:"When",cell:row=>new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",
          timeZone:"Asia/Kolkata"}).format(new Date(row.when)),mobilePriority:"primary"},
        {key:"students",header:"Students",cell:row=>row.students,mobilePriority:"secondary"},
        {key:"imported",header:"Imported",cell:row=>row.imported,mobilePriority:"secondary"},
        {key:"partial",header:"Partial",cell:row=>row.partial,mobilePriority:"secondary"},
        {key:"failed",header:"Failed",cell:row=>row.failed,mobilePriority:"secondary"},
      ]}
      empty={<p className="text-sm">No bulk imports have been recorded yet.</p>}/>
    <nav aria-label="Import history pages" className="flex justify-between gap-3 text-sm">
     <button type="button" disabled={page<=1||busy} onClick={()=>void load(page-1)}
      className="min-h-11 rounded border border-border px-3 disabled:opacity-40">Previous</button>
     <span className="py-2">Page {page}</span>
     <button type="button" disabled={!hasNext||busy} onClick={()=>void load(page+1)}
      className="min-h-11 rounded border border-border px-3 disabled:opacity-40">Next</button>
    </nav>
  </Dialog>
 </>;
}
