"use client";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Textarea} from "@/components/ui/textarea";
import {Select} from "@/components/ui/select";
import {useToast} from "@/components/ui/toast";
import {useRef,useState} from "react";
import {VerificationWorkspace,type VerificationQueueCard} from "./VerificationWorkspace";
import {Disclosure} from "@/components/ui/disclosure";
import {VerificationFilterPanel} from "./VerificationFilterPanel";
import {VerificationExportControl} from "./VerificationExportControl";
import type {VerificationTab} from "@/modules/verification/queue-tabs";
import {VerificationReviewDrawer} from "./VerificationReviewDrawer";
import {verificationSelectionKey} from "@/modules/verification/selection-model";
import {collegeBulkReviewPayload} from "@/modules/verification/bulk-client-payload";

export function SuperAdminVerificationPanel({collegeId,rows,counts,activeTab,initialKind,page,total,hasMore,query}:{
 collegeId:string;
 rows:VerificationQueueCard[];counts:Record<VerificationTab,number>;
 activeTab:VerificationTab;initialKind:"ALL"|"EDUCATION"|"IDENTITY";
 page:number;total:number;hasMore:boolean;query:Record<string,string>;
}){
 const router=useRouter();
 const {showToast}=useToast();
 const [selected,setSelected]=useState<VerificationQueueCard|null>(null);
 const [sequence,setSequence]=useState<VerificationQueueCard[]>([]);
 const [sequenceIndex,setSequenceIndex]=useState(0);
 const [selectedKeys,setSelectedKeys]=useState<string[]>([]);
 const [bulkAction,setBulkAction]=useState<"VERIFY"|"SEND_BACK"|null>(null);
 const [sort,setSort]=useState<"OLDEST"|"NEWEST"|"NAME">("OLDEST");
 const [reason,setReason]=useState("");
 const [acknowledged,setAcknowledged]=useState(false);
 const [bulkBusy,setBulkBusy]=useState(false);
 const inFlightRef=useRef(false);
 const [bulkMessage,setBulkMessage]=useState("");
 const [bulkFailed,setBulkFailed]=useState(false);
 const candidates=rows.filter(row=>row.status==="SUBMITTED"||row.status==="UPDATE_PENDING");
 const inSequence=selected&&sequence.length>0&&sequence[sequenceIndex]&&
  verificationSelectionKey(selected)===verificationSelectionKey(sequence[sequenceIndex]);
 const nextInSequence=()=>{
  if(sequenceIndex+1<sequence.length){setSequenceIndex(i=>i+1);setSelected(sequence[sequenceIndex+1]);}
  else{setSequence([]);setSequenceIndex(0);setSelected(null);}
 };
 const stopSequence=(notify=true)=>{
  if(notify&&sequence.length>0&&sequenceIndex+1<sequence.length){
   showToast({tone:"info",title:"Stopped at "+(sequenceIndex+1)+" of "+sequence.length+" verification requests."});
  }
  setSequence([]);setSequenceIndex(0);setSelected(null);
 };
 const chosen=candidates.filter(row=>selectedKeys.includes(verificationSelectionKey(row)));
 const missingEvidence=(row:VerificationQueueCard)=>
   row.section==="EDUCATION"?row.missingMarksheet:row.missingIdentityProof===true;
 const skipped=bulkAction==="VERIFY"?chosen.filter(missingEvidence):[];
 const applicable=bulkAction==="VERIFY"?chosen.filter(row=>!missingEvidence(row)):chosen;
 async function submitBulk(){
  if(!bulkAction||bulkBusy||inFlightRef.current||applicable.length===0||bulkAction==="VERIFY"&&!acknowledged||
    bulkAction==="SEND_BACK"&&reason.trim().length<3)return;
  inFlightRef.current=true;
  setBulkBusy(true);setBulkMessage("");setBulkFailed(false);
  try{
   const payload=collegeBulkReviewPayload(applicable,bulkAction,reason);
   const response=await fetch("/api/admin/verification/bulk-review",{method:"POST",credentials:"same-origin",
    headers:{"Content-Type":"application/json"},body:JSON.stringify({collegeId,...payload})});
   if(!response.ok)throw Error(response.status===503?"Verification storage unavailable.":"Bulk review was not accepted.");
   const result=await response.json() as {summary:{succeeded:number;failed:number;attempted:number}};
   const subject=bulkAction==="VERIFY"?"verified":"sent back";
   setBulkMessage(result.summary.succeeded+" "+subject+"; "+
     result.summary.failed+" not applied. "+skipped.length+
     " without supporting proof were excluded. Verified students are notified through the authorized workflow.");
   showToast({tone:result.summary.failed?"info":"success",title:
     result.summary.succeeded+" "+subject+"; "+result.summary.failed+" not applied."});
   setSelectedKeys([]);setBulkAction(null);setAcknowledged(false);router.refresh();
  }catch(error){setBulkFailed(true);setBulkMessage(error instanceof Error?error.message:"Could not finish bulk review.");}
  finally{inFlightRef.current=false;setBulkBusy(false);}
 }

 const base=`/admin/colleges/${encodeURIComponent(collegeId)}/verification`;
 const navigate=(changes:Record<string,string>)=>{
  if(bulkBusy||inFlightRef.current)return;
  stopSequence(false);setSelectedKeys([]);setBulkAction(null);setAcknowledged(false);
  const params=new URLSearchParams(query);
  for(const [k,v] of Object.entries(changes)){if(v)params.set(k,v);else params.delete(k);}
  router.push(base+"?"+params.toString());
 };
 return <div className="min-w-0 space-y-[var(--lms-space-4)]">
  {activeTab==="WAITING"&&candidates.length>0?<div className="flex flex-wrap gap-3">
   <Button variant="secondary" type="button" onClick={()=>{
    const picks=candidates.slice(0,20);setSequence(picks);setSequenceIndex(0);setSelected(picks[0]??null);
   }} className="min-h-11 min-[768px]:min-h-[var(--lms-control-height)]">
    Review one by one ({Math.min(20,candidates.length)})
   </Button>
   <p className="self-center text-xs text-muted-foreground">Review up to 20 waiting requests on this page. Each decision keeps its own audit history.</p>
  </div>:null}
  <VerificationFilterPanel key={JSON.stringify(query)} query={query} onApply={filters=>navigate({...filters,page:"1"})}/>
  <div className="flex flex-wrap items-center justify-between gap-3">
   <p className="text-sm text-muted-foreground">Select only eligible requests on this page. Bulk actions are limited to 20 per operation.</p>
   <label className="text-sm font-semibold">Sort requests
    <Select value={sort} onChange={e=>setSort(e.target.value as typeof sort)} className="ml-2 min-h-11 md:min-h-9">
     <option value="OLDEST">Oldest first</option><option value="NEWEST">Newest first</option>
     <option value="NAME">Student name</option>
    </Select>
   </label>
  </div>
  <VerificationWorkspace key={activeTab+initialKind} rows={rows} counts={counts}
   denseTable sort={sort} preserveServerOrder={false}
   selectedKeys={new Set(selectedKeys)}
   selectionDisabled={bulkBusy}
   onSelectionChange={(row,checked)=>{
    const key=verificationSelectionKey(row);
    setSelectedKeys(current=>checked?
      current.includes(key)||current.length>=20?current:[...current,key]:
      current.filter(value=>value!==key));
    setBulkAction(null);
   }}
   initialTab={activeTab} initialKind={initialKind}
   onTabChange={tab=>navigate({tab,page:"1"})}
   onKindChange={kind=>navigate({kind:kind==="ALL"?"":kind,page:"1"})}
   onReview={row=>{setSequence([]);setSequenceIndex(0);setSelected(row);}}/>
  {activeTab==="WAITING"&&candidates.length>0?<Disclosure ariaLabel="Super Admin bulk verification" title={<h2 className="font-semibold">Act on selected verification requests</h2>} className="min-w-0" contentClassName="space-y-[var(--lms-space-3)] pt-[var(--lms-space-3)] pb-[var(--lms-space-4)]">
   <p role="status" className="text-sm">{chosen.length} of 20 requests selected on this page.</p>
   <div className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-2)] sm:grid-cols-2 lg:flex lg:flex-wrap [&>button]:w-full lg:[&>button]:w-auto">
    <Button variant="secondary" type="button" disabled={bulkBusy} onClick={()=>{setSelectedKeys(candidates.slice(0,20).map(verificationSelectionKey));setBulkAction(null);}}
     className="min-h-11 min-[768px]:min-h-[var(--lms-control-height)]">Select first 20 waiting</Button>
    <Button variant="secondary" type="button" disabled={bulkBusy} onClick={()=>{setSelectedKeys([]);setBulkAction(null);}}
     className="min-h-11 min-[768px]:min-h-[var(--lms-control-height)]">Clear selection</Button>
    <Button variant="secondary" type="button" disabled={bulkBusy||!chosen.length} onClick={()=>{setBulkAction("VERIFY");setAcknowledged(false);}}
     className="min-h-11 min-[768px]:min-h-[var(--lms-control-height)]">Verify without opening</Button>
    <Button variant="secondary" type="button" disabled={bulkBusy||!chosen.length} onClick={()=>setBulkAction("SEND_BACK")}
     className="min-h-11 min-[768px]:min-h-[var(--lms-control-height)]">Send back</Button>
   </div>
   <ul className="max-h-44 space-y-2 overflow-y-auto">
    {candidates.slice(0,50).map(row=><li key={verificationSelectionKey(row)}>
      <label className="flex min-h-11 items-center gap-[var(--lms-space-2)] text-sm">
       <Checkbox disabled={bulkBusy||(!selectedKeys.includes(verificationSelectionKey(row))&&selectedKeys.length>=20)}
        checked={selectedKeys.includes(verificationSelectionKey(row))}
        onChange={e=>{const key=verificationSelectionKey(row);setSelectedKeys(current=>e.target.checked?[...current,key]:current.filter(k=>k!==key));setBulkAction(null);}}/>
       {row.learnerName} · {row.section} {missingEvidence(row)?"(missing document)":""}
      </label>
    </li>)}
   </ul>
   {bulkAction?<div className="space-y-[var(--lms-space-2)] border-t border-border pt-[var(--lms-space-3)]">
    <p className="text-sm">{applicable.length} ready, {skipped.length} left out because proof is missing. Decisions are individually rechecked by the server.</p>
    {skipped.length?<p className="text-xs text-warning-text">Skipped: {skipped.map(r=>r.learnerName).join(", ")}</p>:null}
    {bulkAction==="SEND_BACK"?<label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Reason for sending back
     <Textarea value={reason} onChange={e=>setReason(e.target.value)} maxLength={500}
      className="mt-2 w-full"/></label>:
     <label className="flex items-start gap-2 text-sm">
      <Checkbox checked={acknowledged} onChange={e=>setAcknowledged(e.target.checked)}/>
      I have checked their documents by another method. Each verification will be recorded with my name.
     </label>}
    <Button variant="primary" type="button" disabled={bulkBusy||!applicable.length||bulkAction==="VERIFY"&&!acknowledged||bulkAction==="SEND_BACK"&&reason.trim().length<3}
     onClick={()=>void submitBulk()} className="min-h-11 min-[768px]:min-h-[var(--lms-control-height)]">
     {bulkBusy?"Processing…":"Confirm "+applicable.length+" selected"}
    </Button>
   </div>:null}
   {bulkMessage?<p role={bulkFailed?"alert":"status"} className="text-sm">{bulkMessage}</p>:null}
  </Disclosure>:null}
  <div className="flex min-w-0 flex-wrap items-center justify-start gap-[var(--lms-space-2)]">
   <VerificationExportControl url="/api/admin/verification/export" filename="super-admin-profile-verification.csv" query={{...query,collegeId}}/>
   <Button variant="secondary" type="button" onClick={()=>router.refresh()} className="min-h-11 min-[768px]:min-h-[var(--lms-control-height)]">Refresh</Button>
  </div>
  <nav aria-label="Verification pages" className="flex flex-wrap items-center gap-[var(--lms-space-3)] border-t border-border pt-[var(--lms-space-3)] text-sm">
   <span>Showing {rows.length} of {total} in this status</span>
   {page>1?<Button variant="ghost" type="button" onClick={()=>navigate({page:String(page-1)})} className="min-h-[var(--lms-control-height)] underline">Previous</Button>:null}
   {hasMore?<Button variant="ghost" type="button" onClick={()=>navigate({page:String(page+1)})} className="min-h-[var(--lms-control-height)] underline">Next</Button>:null}
  </nav>
  {selected?<VerificationReviewDrawer key={selected.learnerMembershipId+selected.section}
   row={selected} apiBase="/api/admin/verification"
   collegeId={collegeId} onClose={stopSequence}
   sequenceProgress={inSequence?(sequenceIndex+1)+" of "+sequence.length:undefined}
   onNext={inSequence?nextInSequence:undefined}
   onFinish={inSequence?stopSequence:undefined}
   onSaved={(action)=>{
    showToast({tone:"success",title:action==="VERIFY"?(selected.section==="EDUCATION"?"Education":"Identity")+" verified. The student has been told.":"Sent back. The student sees your reason."});
    if(inSequence)nextInSequence();else setSelected(null);
    router.refresh();
   }}/>:null}
 </div>;
}
