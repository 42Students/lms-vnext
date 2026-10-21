"use client";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {FacultyAssignmentReview} from "./faculty-assignment-review";

type Delivery={offeringId:string;deliveryId:string;sectionName:string;sectionCode:string};

/** College Admin may grade a shared offering assignment in each of its classes. */
export function CollegeAssignmentReview({
 assignmentId,offeringId,specificDeliveryId,maxPoints,status,deliveries,filesEnabled,gradedLearners,
}:{
 assignmentId:string;offeringId:string;specificDeliveryId:string|null;
 maxPoints:number;status:string;deliveries:Delivery[];filesEnabled:boolean;gradedLearners?:number;
}){
 const options=deliveries.filter(item=>item.offeringId===offeringId&&
  (!specificDeliveryId||item.deliveryId===specificDeliveryId));
 const [deliveryId,setDeliveryId]=useState(options[0]?.deliveryId??"");
 const [bulkBusy,setBulkBusy]=useState(false);
 const [bulkStatus,setBulkStatus]=useState("");
 const [retryAllowed,setRetryAllowed]=useState(false);
 const [failedIds,setFailedIds]=useState<string[]>([]);
 const [progress,setProgress]=useState("");
 const [retryScope,setRetryScope]=useState<string|null>(null);
 const [confirmBulk,setConfirmBulk]=useState<{deliveryId:string|null;retryOnly:string[]|null}|null>(null);
 const router=useRouter();
 async function publishAllGrades(selectedDeliveryId:string|null,retryOnly:readonly string[]|null=null){
  if(bulkBusy)return;
  setBulkBusy(true);setBulkStatus("");setRetryAllowed(false);setFailedIds([]);
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
    failedIds?:unknown;receiptId?:unknown;
   };
   if(typeof receipt.published!=="number"||typeof receipt.failed!=="number"||
      typeof receipt.remaining!=="number"||!Array.isArray(receipt.failedIds)||
      typeof receipt.receiptId!=="string"){
    throw Error("Publication result could not be verified. Reload before retrying.");
   }
   const remaining=receipt.remaining;
   const failed=receipt.failedIds.filter((id):id is string=>typeof id==="string");
   setFailedIds(failed);
   setRetryScope(selectedDeliveryId);
   setRetryAllowed(remaining>0);
   setBulkStatus(receipt.published+" grade(s) published; "+receipt.failed+
    " failed. "+(remaining>0?remaining+" grades remain. Continue or retry.":"All graded submissions in this scope are published.")+
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
 return <div className="space-y-2">
  {options.length>1?<label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
   Section
   <Select value={selected.deliveryId} disabled={bulkBusy} onChange={event=>{setDeliveryId(event.target.value);setBulkStatus("");setRetryAllowed(false);setFailedIds([]);}}
    className="min-h-11 md:min-h-9">
    {options.map(item=><option key={item.deliveryId} value={item.deliveryId}>
     {item.sectionName} ({item.sectionCode})
    </option>)}
   </Select>
  </label>:null}
  <div className="flex flex-wrap items-center gap-2">
   <FacultyAssignmentReview key={selected.deliveryId} reviewScope="COLLEGE"
    assignmentId={assignmentId} deliveryId={selected.deliveryId}
    maxPoints={maxPoints} status={status as "DRAFT"|"PUBLISHED"} filesEnabled={filesEnabled}/>
   {status==="PUBLISHED"?<Button variant="primary" type="button" loading={bulkBusy} disabled={bulkBusy||gradedLearners===0}
   title={gradedLearners===0?"Nothing graded yet":undefined}
   onClick={()=>setConfirmBulk({deliveryId:selected.deliveryId,retryOnly:null})}
    className="min-h-11 md:min-h-9">
    {bulkBusy?"Publishing…":"Publish grades"}
   </Button>:null}
   {status==="PUBLISHED"&&options.length>1&&!specificDeliveryId?
    <Button variant="secondary" type="button" loading={bulkBusy} disabled={bulkBusy||gradedLearners===0}
     onClick={()=>setConfirmBulk({deliveryId:null,retryOnly:null})}
     className="min-h-11 md:min-h-9">Publish all sections</Button>:null}
  </div>
  {status==="PUBLISHED"&&gradedLearners===0?<p role="status" className="text-xs text-muted-foreground">Nothing graded yet</p>:null}
  {bulkBusy?<Alert tone="info" role="status">Publishing graded submissions for this assignment. {progress}</Alert>:null}
  {bulkStatus?<Alert tone={retryAllowed?"warning":"success"} role="status">{bulkStatus}</Alert>:null}
  {retryAllowed&&status==="PUBLISHED"?<Button variant="secondary" type="button" disabled={bulkBusy}
   onClick={()=>setConfirmBulk({deliveryId:retryScope,retryOnly:failedIds.length?[...failedIds]:null})}
   className="min-h-11 md:min-h-9">
   {failedIds.length?"Retry "+failedIds.length+" failed":"Retry failed"}
  </Button>:null}
  <ConfirmDialog open={confirmBulk!==null}
   onOpenChange={open=>{if(!open&&!bulkBusy)setConfirmBulk(null);}}
   title={confirmBulk?.retryOnly?"Retry publishing failed grades?":"Publish grades?"}
   description={confirmBulk?.retryOnly?
    "Retry publication of "+confirmBulk.retryOnly.length+" failed grades?":
    (confirmBulk?.deliveryId===null?"Publish all graded submissions across the assignment?":"Publish grades for every graded submission in this Section?")+" Published results become visible to learners."}
   confirmLabel={confirmBulk?.retryOnly?"Retry failed grades":"Publish grades"}
   confirmVariant="primary" pending={bulkBusy}
   onConfirm={()=>{
    if(!confirmBulk)return;
    const selectedBulk=confirmBulk;
    setConfirmBulk(null);
    void publishAllGrades(selectedBulk.deliveryId,selectedBulk.retryOnly);
   }}/>
 </div>;
}
