"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {DataTable} from "@/components/ui/data-table";
import {StatusBadge} from "@/components/ui/status-badge";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Alert} from "@/components/ui/alert";
import {EmptyState} from "@/components/ui/empty-state";
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
 return <section aria-busy={busy} className="space-y-3 border-t border-border pt-4">
  <Button type="button" variant="secondary" className="min-h-11 md:min-h-9 print:hidden" disabled={busy}
   aria-expanded={open} aria-controls={open?"admin-college-bulk-import-panel":undefined}
   onClick={()=>setOpen(x=>!x)}>Bulk Import</Button>
  {open?<div id="admin-college-bulk-import-panel" className="space-y-3">
   <label className="grid gap-1 text-[13px] font-semibold text-body print:hidden">Organization
    <Select className="min-h-11 md:min-h-9" value={organizationId} disabled={busy}
     onChange={e=>{versionRef.current++;confirmedVersionRef.current=-1;setConfirmImport(false);setOrganizationId(e.target.value);}}>
     {organizations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
    </Select></label>
   <label className="grid gap-1 text-[13px] font-semibold text-body print:hidden">CSV (name, code, city, state, country)
    <Textarea rows={5} maxLength={150000} value={csv} disabled={busy}
     onChange={e=>{versionRef.current++;confirmedVersionRef.current=-1;setConfirmImport(false);setCsv(e.target.value);setResults([]);setError("");}}
     className="min-h-11 font-mono" aria-invalid={Boolean(validation)} aria-describedby="admin-college-bulk-format"
     placeholder="name,code,city,state,country"/>
   </label>
   <p id="admin-college-bulk-format" className="text-sm text-muted-foreground print:hidden">Header optional. Up to 200 rows. Quoted commas, newlines and escaped quotes are supported.</p>
   {valid>0?<Alert tone="info">{valid} colleges ready</Alert>:null}
   {(error||validation)?<Alert tone="error">{error||validation}</Alert>:null}
   <div className="flex flex-wrap gap-2 print:hidden">
    <Button type="button" className="min-h-11 md:min-h-9" loading={busy} disabled={busy||!valid} onClick={()=>{confirmedVersionRef.current=versionRef.current;setConfirmImport(true);}}
     >
     {busy?"Importing…":"Import colleges"}</Button>
    <Button type="button" variant="secondary" className="min-h-11 md:min-h-9 print:hidden" disabled={busy}
     onClick={()=>csv?setConfirmDiscard(true):discard()}>Discard draft</Button>
   </div>
   {results.length>0?<div role="region" aria-label="College import results" className="min-w-0 space-y-2"><h3 className="font-semibold text-foreground">Import results</h3>
    <DataTable caption="College bulk import results" rows={results} getRowKey={row=>String(row.line)}
     empty={<EmptyState title="No import results" description="No import results have been recorded."/>}
     columns={[
      {key:"row",header:"Row",mobileLabel:"Row",mobilePriority:"primary",cell:row=>row.line},
      {key:"code",header:"Code",mobileLabel:"Code",mobilePriority:"secondary",cell:row=>row.code},
      {key:"status",header:"Status",mobileLabel:"Status",mobilePriority:"secondary",cell:row=><StatusBadge tone={row.status==="CREATED"?"success":row.status==="FAILED"?"error":"neutral"}>{row.status}</StatusBadge>},
      {key:"details",header:"Details",mobileLabel:"Details",mobilePriority:"secondary",cell:row=>row.message},
     ]}/>
   </div>:null}
  </div>:null}
  <ConfirmDialog open={confirmImport} onOpenChange={setConfirmImport} title={"Create "+valid+" colleges?"} description="Existing codes will be skipped." confirmLabel="Import colleges" pending={busy} confirmDisabled={!valid||!organizationId||Boolean(validation)||confirmedVersionRef.current!==versionRef.current} onConfirm={()=>void submit()}>
   {(error||validation)?<Alert tone="error">{error||validation}</Alert>:null}
  </ConfirmDialog>
  <ConfirmDialog open={confirmDiscard} onOpenChange={setConfirmDiscard} title="Discard Bulk Import draft?" description="Unsaved CSV content will be discarded." confirmLabel="Discard draft" confirmVariant="danger" pending={busy} onConfirm={discard}/>
 </section>;
}
