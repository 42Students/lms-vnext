"use client";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Dialog} from "@/components/ui/dialog";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {FacultyAssignmentReview} from "./faculty-assignment-review";

type Delivery={offeringId:string;deliveryId:string;sectionName:string;sectionCode:string};

/** College Admin may grade a shared offering assignment in each of its classes. */
export function CollegeAssignmentReview({
 assignmentId,offeringId,specificDeliveryId,maxPoints,status,deliveries,filesEnabled,gradedLearners,assignmentTitle,
}:{
 assignmentId:string;offeringId:string;specificDeliveryId:string|null;
 maxPoints:number;status:string;deliveries:Delivery[];filesEnabled:boolean;gradedLearners?:number;
 assignmentTitle?:string;
}){
 const options=deliveries.filter(item=>item.offeringId===offeringId&&
  (!specificDeliveryId||item.deliveryId===specificDeliveryId));
 const [deliveryId,setDeliveryId]=useState(options[0]?.deliveryId??"");
 const [reviewOpen,setReviewOpen]=useState(false);
 const [bulkBusy,setBulkBusy]=useState(false);
 const [bulkStatus,setBulkStatus]=useState("");
 const [retryAllowed,setRetryAllowed]=useState(false);
 const [failedIds,setFailedIds]=useState<string[]>([]);
 const [failureDetails,setFailureDetails]=useState<{reason:string}[]>([]);
 const [breakdown,setBreakdown]=useState<{published:number;skippedUngraded:number;alreadyPublished:number;failed:number}|null>(null);
 const [progress,setProgress]=useState("");
 const [retryScope,setRetryScope]=useState<string|null>(null);
 const [confirmBulk,setConfirmBulk]=useState<{deliveryId:string|null;retryOnly:string[]|null}|null>(null);
 const router=useRouter();
 async function publishAllGrades(selectedDeliveryId:string|null,retryOnly:readonly string[]|null=null){
  if(bulkBusy)return;
  setBulkBusy(true);setBulkStatus("");setRetryAllowed(false);setFailedIds([]);setFailureDetails([]);setBreakdown(null);
  setProgress("Processing graded submissions on the server…");
  try{
   const response=await fetch(
    "/api/courses/assignments/"+encodeURIComponent(assignmentId)+"/publish-grades",{
     method:"POST",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({
      requestId:crypto.randomUUID(),deliveryId:selectedDeliveryId,
      ...(retryOnly?.length?{submissionIds:[...retryOnly]}:{}),
     }),
    });
   const result:unknown=await response.json().catch(()=>null);
   if(!response.ok||!result||typeof result!=="object")throw Error(
    "Grade publication failed. Reload and retry; completed grades remain published.");
   const receipt=result as {
    published?:unknown;failed?:unknown;remaining?:unknown;
    failedIds?:unknown;receiptId?:unknown;skippedUngraded?:unknown;
    alreadyPublished?:unknown;failureDetails?:unknown;
   };
   if(typeof receipt.published!=="number"||typeof receipt.failed!=="number"||
      typeof receipt.remaining!=="number"||!Array.isArray(receipt.failedIds)||
      typeof receipt.skippedUngraded!=="number"||typeof receipt.alreadyPublished!=="number"||
      typeof receipt.receiptId!=="string"){
    throw Error("Publication result could not be verified. Reload before retrying.");
   }
   const remaining=receipt.remaining;
   const failed=receipt.failedIds.filter((id):id is string=>typeof id==="string");
   setFailedIds(failed);
   setBreakdown({published:receipt.published,failed:receipt.failed,
    skippedUngraded:receipt.skippedUngraded,alreadyPublished:receipt.alreadyPublished});
   const details=Array.isArray(receipt.failureDetails)?receipt.failureDetails:[];
   setFailureDetails(details.filter((row):row is {reason:string}=>Boolean(row)&&typeof row==="object"&&
    "reason" in row&&typeof row.reason==="string").map(row=>({reason:row.reason})));
   setRetryScope(selectedDeliveryId);
   setRetryAllowed(remaining>0);
   setBulkStatus((remaining>0?remaining+" grades remain. Continue or retry.":"All graded submissions in this scope are published.")+
    " Audit receipt: "+receipt.receiptId.slice(0,8)+".");
   router.refresh();
  }catch(cause){
   setRetryScope(selectedDeliveryId);
   setRetryAllowed(true);
   setBulkStatus(cause instanceof Error?cause.message:"Unable to publish grades. Reload before retrying.");
  }finally{setBulkBusy(false);setProgress("");}
 }
 if(!["PUBLISHED","DRAFT"].includes(status))return null;
 if(!options.length)return <p className="text-xs text-muted-foreground">
  No active class delivery is available for reviewing submissions.
 </p>;
 const selected=options.find(item=>item.deliveryId===deliveryId)??options[0];
 return <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
  <Button variant="secondary" size="sm" type="button" disabled={bulkBusy}
   aria-label={"Submissions for "+(assignmentTitle||"assignment "+assignmentId)}
   onClick={()=>setReviewOpen(true)} className="min-h-11 md:min-h-9">
   Submissions
  </Button>
  {status==="PUBLISHED"?<Button variant="secondary" size="sm" type="button"
   disabled={bulkBusy||gradedLearners===0}
   title={gradedLearners===0?"Nothing graded yet":undefined}
   aria-label={"Publish grades for "+(assignmentTitle||"assignment "+assignmentId)}
   onClick={()=>setConfirmBulk({deliveryId:specificDeliveryId??null,retryOnly:null})}
   className="min-h-11 md:min-h-9">Publish grades</Button>:null}
  <Dialog open={reviewOpen} onOpenChange={open=>{if(!bulkBusy)setReviewOpen(open);}}
   dismissible={!bulkBusy} className="max-w-[760px]"
   title={assignmentTitle?.trim()||"Assignment #"+assignmentId.slice(0,8)}
   description="Submissions and grades for the selected Section"
   footer={<Button type="button" variant="secondary" disabled={bulkBusy}
    onClick={()=>setReviewOpen(false)}>Close</Button>}>
  <div className="min-w-0 space-y-3">
  {options.length>1?<label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
   Section
   <Select value={selected.deliveryId} disabled={bulkBusy} onChange={event=>{setDeliveryId(event.target.value);setBulkStatus("");setRetryAllowed(false);setFailedIds([]);}}
    className="min-h-11 md:min-h-9">
    {options.map(item=><option key={item.deliveryId} value={item.deliveryId}>
     {item.sectionName} ({item.sectionCode})
    </option>)}
   </Select>
  </label>:null}
  <div className="flex min-w-0 flex-wrap items-center gap-2">
   <FacultyAssignmentReview key={selected.deliveryId} reviewScope="COLLEGE"
    assignmentId={assignmentId} deliveryId={selected.deliveryId}
    maxPoints={maxPoints} status={status as "DRAFT"|"PUBLISHED"} filesEnabled={filesEnabled}/>
   {status==="PUBLISHED"?<Button variant="primary" type="button" loading={bulkBusy} disabled={bulkBusy||gradedLearners===0}
   title={gradedLearners===0?"Nothing graded yet":undefined}
   onClick={()=>setConfirmBulk({deliveryId:selected.deliveryId,retryOnly:null})}
    className="min-h-11 md:min-h-9">
    {bulkBusy?"Publishing…":"Publish grades for Section"}
   </Button>:null}
   {status==="PUBLISHED"&&options.length>1&&!specificDeliveryId?
    <Button variant="secondary" type="button" loading={bulkBusy} disabled={bulkBusy||gradedLearners===0}
     onClick={()=>setConfirmBulk({deliveryId:null,retryOnly:null})}
     className="min-h-11 md:min-h-9">Publish all sections</Button>:null}
  </div>
  {status==="PUBLISHED"&&gradedLearners===0?<p role="status" className="text-xs text-muted-foreground">Nothing graded yet</p>:null}
  {bulkBusy?<Alert tone="info" role="status">Publishing graded submissions for this assignment. {progress}</Alert>:null}
  {breakdown?<section aria-label="Grade publication results" className="rounded border border-border p-3">
   <h3 className="text-sm font-semibold">Grade publication results</h3>
   <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
    {([["Published",breakdown.published],["Skipped (ungraded)",breakdown.skippedUngraded],
      ["Already published",breakdown.alreadyPublished],["Failed",breakdown.failed]] as const).map(([label,value])=>
      <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt>
       <dd className="text-lg font-semibold tabular-nums">{value}</dd></div>)}
   </dl>
   {failureDetails.length?<div className="mt-3 border-t border-border pt-3">
    <h4 className="font-semibold">Could not publish</h4>
    <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-body">
     {failureDetails.map((item,index)=><li key={index}>Submission {index+1}: {item.reason}</li>)}
    </ol>
   </div>:null}
  </section>:null}
  {bulkStatus?<Alert tone={retryAllowed?"warning":"success"} role="status">{bulkStatus}</Alert>:null}
  {retryAllowed&&status==="PUBLISHED"?<Button variant="secondary" type="button" disabled={bulkBusy}
   onClick={()=>setConfirmBulk({deliveryId:retryScope,retryOnly:failedIds.length?[...failedIds]:null})}
   className="min-h-11 md:min-h-9">
   {failedIds.length?"Retry "+failedIds.length+" failed":"Retry failed"}
  </Button>:null}
  <ConfirmDialog open={confirmBulk!==null}
   onOpenChange={open=>{if(!open&&!bulkBusy)setConfirmBulk(null);}}
   title={confirmBulk?.retryOnly?"Retry publishing failed grades?":"Publish all graded submissions?"}
   description={confirmBulk?.retryOnly?
    "Retry publication of "+confirmBulk.retryOnly.length+" failed grades?":
    "Publish all graded submissions? "+(confirmBulk?.deliveryId===null?
      "This includes every Section on this assignment.":"Only this selected Section is included.")+
      " Ungraded submissions remain unchanged. Students can view only published grades."}
   confirmLabel={confirmBulk?.retryOnly?"Retry failed grades":"Publish grades"}
   confirmVariant="primary" pending={bulkBusy}
   onConfirm={()=>{
    if(!confirmBulk)return;
    const selectedBulk=confirmBulk;
    setConfirmBulk(null);
    void publishAllGrades(selectedBulk.deliveryId,selectedBulk.retryOnly);
   }}/>
  </div>
  </Dialog>
 </div>;
}
