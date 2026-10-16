"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {useToast} from "@/components/ui/toast";
import {collegeBulkImportToast} from "@/modules/colleges/bulk-import-feedback-model";
import {parseCollegeImportCsv} from "@/modules/colleges/bulk-import-model";
type Result={line:number;code:string;status:"CREATED"|"SKIPPED"|"FAILED";message:string};
export function CollegeBulkImport({organizations}:{organizations:readonly {id:string;name:string}[]}){
 const router=useRouter(),{showToast}=useToast(),[open,setOpen]=useState(false),[organizationId,setOrganizationId]=useState(organizations[0]?.id??""),
 [csv,setCsv]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[results,setResults]=useState<Result[]>([]);
 let valid=0,validation="";
 try{if(csv.trim())valid=parseCollegeImportCsv(csv).length;}
 catch(cause){validation=cause instanceof Error?cause.message:"Invalid CSV";}
 async function submit(){
  if(busy||!valid||!organizationId||!window.confirm("Create "+valid+" colleges? Existing codes will be skipped."))return;
  setBusy(true);setError("");setResults([]);
  try{
   const response=await fetch("/api/admin/colleges/bulk-import",{method:"POST",
    headers:{"content-type":"application/json"},body:JSON.stringify({organizationId,csv})});
   if(!response.ok)throw Error("Bulk Import could not be completed.");
   const payload=await response.json() as {results:Result[]};
   setResults(payload.results);
   const feedback=collegeBulkImportToast(payload.results);
   showToast({title:feedback.title,tone:feedback.tone});router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Import failed");
   showToast({title:"Bulk Import failed",tone:"error"});}
  finally{setBusy(false);}
 }
 return <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <button type="button" className="min-h-10 rounded border border-border px-3 text-primary-text"
   onClick={()=>setOpen(x=>!x)}>Bulk Import</button>
  {open?<div className="space-y-3">
   <label className="grid gap-1 text-sm">Organization
    <select className="min-h-11 rounded border border-border bg-background px-3" value={organizationId}
     onChange={e=>setOrganizationId(e.target.value)}>
     {organizations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
    </select></label>
   <label className="grid gap-1 text-sm">CSV (name, code, city, state, country)
    <textarea rows={5} maxLength={150000} value={csv}
     onChange={e=>{setCsv(e.target.value);setResults([]);setError("");}}
     className="w-full rounded border border-border bg-background p-3 font-mono"
     placeholder="name,code,city,state,country"/>
   </label>
   <p className="text-sm text-muted-foreground">Header optional. Up to 200 rows. Quoted commas, newlines and escaped quotes are supported.</p>
   {valid>0?<p role="status" className="text-sm">{valid} colleges ready</p>:null}
   {(error||validation)?<p role="alert" className="text-sm text-error">{error||validation}</p>:null}
   <div className="flex flex-wrap gap-2">
    <button type="button" disabled={busy||!valid} onClick={()=>void submit()}
     className="min-h-11 rounded bg-primary px-4 text-sm text-on-primary disabled:opacity-50">
     {busy?"Importing…":"Import colleges"}</button>
    <button type="button" disabled={busy} className="min-h-11 rounded border border-border px-3 text-sm"
     onClick={()=>{if(csv&&!window.confirm("Discard Bulk Import draft?"))return;
       setOpen(false);setCsv("");setResults([]);setError("");}}>Discard draft</button>
   </div>
   {results.length>0?<div className="max-h-80 overflow-auto"><h3 className="font-semibold">Import results</h3>
    <table className="min-w-full text-left text-sm"><thead><tr>
     <th className="p-2">Row</th><th className="p-2">Code</th><th className="p-2">Status</th><th className="p-2">Details</th>
    </tr></thead><tbody>{results.map(r=><tr key={r.line} className="border-t">
     <td className="p-2">{r.line}</td><td className="p-2">{r.code}</td>
     <td className="p-2">{r.status}</td><td className="p-2">{r.message}</td>
    </tr>)}</tbody></table></div>:null}
  </div>:null}
 </section>;
}
