"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {DataTable} from "@/components/ui/data-table";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useToast} from "@/components/ui/toast";
import {collegeBulkImportToast} from "@/modules/colleges/bulk-import-feedback-model";
import {parseCollegeImportCsv} from "@/modules/colleges/bulk-import-model";
import {canApplyConfirmedCollegeBulkImport} from "@/modules/colleges/bulk-import-confirmation-model";
type Result={line:number;code:string;status:"CREATED"|"SKIPPED"|"FAILED";message:string};
export function CollegeBulkImport({organizations}:{organizations:readonly {id:string;name:string}[]}){
 const versionRef=useRef(0),confirmedVersionRef=useRef(-1),inFlightRef=useRef(false);
 const router=useRouter(),{showToast}=useToast(),[open,setOpen]=useState(false),[organizationId,setOrganizationId]=useState(organizations[0]?.id??""),
 [csv,setCsv]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[results,setResults]=useState<Result[]>([]);
 const [confirmImport,setConfirmImport]=useState(false),[confirmDiscard,setConfirmDiscard]=useState(false);
 let valid=0,validation="";
 try{if(csv.trim())valid=parseCollegeImportCsv(csv).length;}
 catch(cause){validation=cause instanceof Error?cause.message:"Invalid CSV";}
 function discard(){versionRef.current++;confirmedVersionRef.current=-1;setOpen(false);setCsv("");setResults([]);setError("");setConfirmDiscard(false);setConfirmImport(false);}
 async function submit(){
  if(!canApplyConfirmedCollegeBulkImport({
   confirmed:confirmImport,inFlight:inFlightRef.current||busy,validRows:valid,
   validationError:validation,organizationId,
   selectionVersion:versionRef.current,confirmationVersion:confirmedVersionRef.current,
  }))return;
  const confirmedOrganization=organizationId,confirmedCsv=csv;
  inFlightRef.current=true;
  setBusy(true);setError("");setResults([]);
  try{
   const response=await fetch("/api/admin/colleges/bulk-import",{method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({organizationId:confirmedOrganization,csv:confirmedCsv})});
   if(!response.ok)throw Error("Bulk Import could not be completed.");
   const payload=await response.json() as {results:Result[]};
   setResults(payload.results);setConfirmImport(false);
   const feedback=collegeBulkImportToast(payload.results);
   showToast({title:feedback.title,tone:feedback.tone});router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Import failed");
   showToast({title:"Bulk Import failed",tone:"error"});}
  finally{inFlightRef.current=false;setBusy(false);}
 }
 return <section className="space-y-3 border-t border-border pt-4">
  <Button type="button" variant="secondary" className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border px-3 text-link"
   onClick={()=>setOpen(x=>!x)}>Bulk Import</Button>
  {open?<div className="space-y-3">
   <label className="grid gap-1 text-sm">Organization
    <Select className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3" value={organizationId}
     onChange={e=>{versionRef.current++;confirmedVersionRef.current=-1;setConfirmImport(false);setOrganizationId(e.target.value);}}>
     {organizations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
    </Select></label>
   <label className="grid gap-1 text-sm">CSV (name, code, city, state, country)
    <Textarea rows={5} maxLength={150000} value={csv}
     onChange={e=>{versionRef.current++;confirmedVersionRef.current=-1;setConfirmImport(false);setCsv(e.target.value);setResults([]);setError("");}}
     className="w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 font-mono"
     placeholder="name,code,city,state,country"/>
   </label>
   <p className="text-sm text-muted-foreground">Header optional. Up to 200 rows. Quoted commas, newlines and escaped quotes are supported.</p>
   {valid>0?<p role="status" className="text-sm">{valid} colleges ready</p>:null}
   {(error||validation)?<p role="alert" className="text-sm text-error">{error||validation}</p>:null}
   <div className="flex flex-wrap gap-2">
    <Button type="button" disabled={busy||!valid} onClick={()=>{confirmedVersionRef.current=versionRef.current;setConfirmImport(true);}}
     className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-4 text-sm text-[var(--lms-on-primary)] disabled:opacity-50">
     {busy?"Importing…":"Import colleges"}</Button>
    <Button type="button" disabled={busy} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border px-3 text-sm"
     onClick={()=>csv?setConfirmDiscard(true):discard()}>Discard draft</Button>
   </div>
   {results.length>0?<div className="max-h-80 overflow-auto"><h3 className="font-semibold">Import results</h3>
    <DataTable caption="College bulk import results" rows={results} getRowKey={row=>String(row.line)}
     empty={<p role="status" className="text-sm text-body">No import results have been recorded.</p>}
     columns={[
      {key:"row",header:"Row",mobileLabel:"Row",mobilePriority:"primary",cell:row=>row.line},
      {key:"code",header:"Code",mobileLabel:"Code",mobilePriority:"secondary",cell:row=>row.code},
      {key:"status",header:"Status",mobileLabel:"Status",mobilePriority:"secondary",cell:row=>row.status},
      {key:"details",header:"Details",mobileLabel:"Details",mobilePriority:"secondary",cell:row=>row.message},
     ]}/>
   </div>:null}
  </div>:null}
  <ConfirmDialog open={confirmImport} onOpenChange={setConfirmImport} title={"Create "+valid+" colleges?"} description="Existing codes will be skipped." confirmLabel="Import colleges" pending={busy} confirmDisabled={!valid||!organizationId||Boolean(validation)||confirmedVersionRef.current!==versionRef.current} onConfirm={()=>void submit()}>
   {(error||validation)?<p role="alert" className="text-sm text-foreground">{error||validation}</p>:null}
  </ConfirmDialog>
  <ConfirmDialog open={confirmDiscard} onOpenChange={setConfirmDiscard} title="Discard Bulk Import draft?" description="Unsaved CSV content will be discarded." confirmLabel="Discard draft" confirmVariant="danger" pending={busy} onConfirm={discard}/>
 </section>;
}
