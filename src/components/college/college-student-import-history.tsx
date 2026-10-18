"use client";
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
   if(!response.ok||!body?.items)throw Error(body?.error??"Import history unavailable.");
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
    <div className="max-h-72 overflow-auto">
     <table className="w-full text-left text-sm [&_th:first-child]:sticky [&_th:first-child]:left-0 [&_th:first-child]:z-10 [&_th:first-child]:bg-surface [&_td:first-child]:sticky [&_td:first-child]:left-0 [&_td:first-child]:z-10 [&_td:first-child]:bg-surface">
      <thead><tr className="border-b border-border bg-muted">
       <th className="p-3">When</th><th className="p-3">Students</th><th className="p-3">Imported</th>
       <th className="p-3">Partial</th><th className="p-3">Failed</th></tr></thead>
      <tbody>{rows.map(row=><tr key={row.id} className="border-b border-border">
       <td className="p-3">{new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",
        timeZone:"Asia/Kolkata"}).format(new Date(row.when))}</td>
       <td className="p-3">{row.students}</td><td className="p-3">{row.imported}</td>
       <td className="p-3">{row.partial}</td><td className="p-3">{row.failed}</td>
      </tr>)}</tbody>
     </table>
     {!rows.length&&!busy?<p className="p-3 text-sm">No bulk imports have been recorded yet.</p>:null}
    </div>
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
