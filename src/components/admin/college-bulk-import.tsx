"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {DataTable} from "@/components/ui/data-table";
import {StatusBadge} from "@/components/ui/status-badge";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Dialog} from "@/components/ui/dialog";
import {Alert} from "@/components/ui/alert";
import {EmptyState} from "@/components/ui/empty-state";
import {useToast} from "@/components/ui/toast";
import {collegeBulkImportToast} from "@/modules/colleges/bulk-import-feedback-model";
import {parseCollegeImportCsv,COLLEGE_IMPORT_TEMPLATE,LEGACY_COLLEGE_IMPORT_TEMPLATE} from "@/modules/colleges/bulk-import-model";
import {canApplyConfirmedCollegeBulkImport} from "@/modules/colleges/bulk-import-confirmation-model";
type Result={line:number;code:string;name?:string;status:"CREATED"|"SKIPPED"|"FAILED";message:string};
export function CollegeBulkImport({organizations}:{organizations:readonly {id:string;name:string}[]}){
 const versionRef=useRef(0),confirmedVersionRef=useRef(-1),inFlightRef=useRef(false);
 const router=useRouter(),{showToast}=useToast(),[open,setOpen]=useState(false),[organizationId,setOrganizationId]=useState(organizations[0]?.id??""),
 [csv,setCsv]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[results,setResults]=useState<Result[]>([]);
 const [confirmImport,setConfirmImport]=useState(false),[confirmDiscard,setConfirmDiscard]=useState(false);
 useEffect(()=>{
  const warn=(event:BeforeUnloadEvent)=>{
   if(csv.trim()&&!results.length){event.preventDefault();event.returnValue="";}
  };
  window.addEventListener("beforeunload",warn);
  return ()=>window.removeEventListener("beforeunload",warn);
 },[csv,results.length]);
 let valid=0,validation="";
 try{if(csv.trim())valid=parseCollegeImportCsv(csv,organizationId).length;}
 catch(cause){validation=cause instanceof Error?cause.message:"Invalid CSV";}
 function discard(){
  versionRef.current++;confirmedVersionRef.current=-1;setOpen(false);setCsv("");
  // Completed imports remain visible in the results history when reopened.
  setError("");setConfirmDiscard(false);setConfirmImport(false);
 }
 function closeDraft(){
  if(busy||inFlightRef.current)return;
  if(csv.trim()&&!results.length)setConfirmDiscard(true);
  else setOpen(false);
 }
 async function submit(){
  if(!canApplyConfirmedCollegeBulkImport({
   confirmed:confirmImport,inFlight:inFlightRef.current||busy,validRows:valid,
   validationError:validation,organizationId,
   selectionVersion:versionRef.current,confirmationVersion:confirmedVersionRef.current,
  }))return;
  const confirmedOrganization=organizationId,confirmedCsv=csv;
  const namesByLine=new Map(parseCollegeImportCsv(confirmedCsv,confirmedOrganization).map(row=>[row.line,row.name]));
  inFlightRef.current=true;
  setBusy(true);setError("");setResults([]);
  try{
   const response=await fetch("/api/admin/colleges/bulk-import",{method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({organizationId:confirmedOrganization,csv:confirmedCsv})});
   if(!response.ok)throw Error("Bulk Import could not be completed.");
   const payload=await response.json() as {results:Result[]};
   setResults(payload.results.map(row=>({...row,name:namesByLine.get(row.line)??""})));setConfirmImport(false);
   const feedback=collegeBulkImportToast(payload.results);
   showToast({title:feedback.title,tone:feedback.tone});router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Import failed");
   showToast({title:"Bulk Import failed",tone:"error"});}
  finally{inFlightRef.current=false;setBusy(false);}
 }
 return <section aria-busy={busy} className="min-w-0 space-y-[var(--lms-space-3)] border-t border-border pt-[var(--lms-space-4)]">
  <div className="flex flex-wrap items-center gap-2 print:hidden">
   <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={busy}
    aria-expanded={open} aria-controls="admin-college-bulk-import-panel" onClick={()=>open?closeDraft():setOpen(true)}>
    <svg width={16} height={16} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill="none" aria-hidden="true">
     <path d="M12 16V3m0 0-5 5m5-5 5 5M4 17v3h16v-3"/>
    </svg>Bulk Import
   </Button>
   <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={()=>router.refresh()}>
    <svg width={16} height={16} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill="none" aria-hidden="true">
     <path d="M20 11a8 8 0 1 0-2 5.5M20 4v7h-7"/>
    </svg>Refresh
   </Button>
  </div>
  <Dialog open={open} onOpenChange={next=>next?setOpen(true):closeDraft()}
   dismissible={false} className="max-w-[640px]" title="Bulk Import Colleges (CSV)"
   footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    <Button type="button" variant="secondary" disabled={busy} onClick={closeDraft}>Close</Button>
    <Button type="button" loading={busy} disabled={busy||!valid||!organizationId||Boolean(validation)}
     onClick={()=>{confirmedVersionRef.current=versionRef.current;setConfirmImport(true);}}>
     {busy?"Importing…":"Import"}
    </Button>
   </div>}>
   <div id="admin-college-bulk-import-panel" role="region" aria-label="Bulk Import" className="min-w-0 space-y-[var(--lms-space-3)]">
   <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] print:hidden">Organization
    <Select className="min-h-11 w-full md:min-h-9" value={organizationId} disabled={busy}
     onChange={e=>{versionRef.current++;confirmedVersionRef.current=-1;setConfirmImport(false);setOrganizationId(e.target.value);setResults([]);setError("");}}>
     {organizations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
    </Select></label>
   <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] print:hidden">Columns: orgId, name, uniqueId, city, state (legacy); name, code, city, state, country (vNext)
    <Textarea rows={8} maxLength={150000} value={csv} disabled={busy}
     onChange={e=>{versionRef.current++;confirmedVersionRef.current=-1;setConfirmImport(false);setCsv(e.target.value);setResults([]);setError("");}}
     className="min-h-32 w-full min-w-0 font-mono text-sm leading-6" aria-invalid={Boolean(validation)} aria-describedby="admin-college-bulk-format"
     placeholder="name,code,city,state,country"/>
   </label>
   <div id="admin-college-bulk-format" className="space-y-2 text-sm text-muted-foreground print:hidden leading-[22px]">
    <p>Legacy columns: orgId, name, uniqueId, city, state. The new import keeps the verified organization selector and maps uniqueId to code. Header optional; up to 200 rows. Quoted commas, newlines and escaped quotes are supported.</p>
    <p>Converting an old LMS CSV? Map every numeric orgId to its verified vNext organization UUID, separate rows by organization and choose the matching organization above. Use <strong>uniqueId</strong> as the new <strong>code</strong>. Mixed-organization uploads are rejected rather than assigned to the wrong college.</p>
    <div className="flex flex-wrap gap-4">
     <a download="colleges-template.csv" href={"data:text/csv;charset=utf-8,"+encodeURIComponent(COLLEGE_IMPORT_TEMPLATE+"\n")} className="font-semibold text-primary-text underline">Download new CSV template</a>
     <a download="colleges-legacy-conversion-template.csv" href={"data:text/csv;charset=utf-8,"+encodeURIComponent(LEGACY_COLLEGE_IMPORT_TEMPLATE+"\n")} className="font-semibold text-primary-text underline">Download legacy conversion template</a>
    </div>
   </div>
   {valid>0?<Alert tone="info">{valid} colleges ready</Alert>:null}
   {!organizations.length?<Alert tone="warning">Choose an organization before importing colleges.</Alert>:null}
   {(error||validation)?<Alert tone="error">{error||validation}</Alert>:null}
   {results.length>0?<div role="region" aria-label="College import results" aria-live="polite" className="min-w-0 space-y-[var(--lms-space-3)] border-t border-border pt-[var(--lms-space-3)]"><h3 className="font-semibold text-[var(--lms-heading)]">Import results</h3>
    <DataTable caption="College bulk import results" rows={results} getRowKey={row=>String(row.line)}
     empty={<EmptyState title="No import results" description="No import results have been recorded."/>}
     columns={[
      {key:"row",header:"#",mobileLabel:"#",mobilePriority:"primary",cell:row=>row.line},
      {key:"name",header:"Name",mobileLabel:"Name",mobilePriority:"secondary",cell:row=>row.name||"—"},
      {key:"code",header:"Unique ID",mobileLabel:"Unique ID",mobilePriority:"secondary",cell:row=>row.code},
      {key:"status",header:"Result",mobileLabel:"Result",mobilePriority:"secondary",cell:row=><StatusBadge tone={row.status==="CREATED"?"success":row.status==="FAILED"?"error":"neutral"}>{row.status}</StatusBadge>},
      {key:"details",header:"Message",mobileLabel:"Message",mobilePriority:"secondary",cell:row=>row.message},
     ]}/>
   </div>:null}
  </div>
  </Dialog>
  <ConfirmDialog open={confirmImport} onOpenChange={setConfirmImport} title={"Create "+valid+" colleges?"} description="All rows will be imported into the selected organization. Existing codes will be skipped. Verify legacy orgId mappings before confirming." confirmLabel="Import colleges" pending={busy} confirmDisabled={!valid||!organizationId||Boolean(validation)||confirmedVersionRef.current!==versionRef.current} onConfirm={()=>void submit()}>
   {(error||validation)?<Alert tone="error">{error||validation}</Alert>:null}
  </ConfirmDialog>
  <ConfirmDialog open={confirmDiscard} onOpenChange={setConfirmDiscard} title="Discard this bulk-import draft?" description="Unsaved CSV content will be discarded. Completed import results are kept." confirmLabel="Discard" cancelLabel="Keep editing" confirmVariant="danger" pending={busy} onConfirm={discard}/>
 </section>;
}
