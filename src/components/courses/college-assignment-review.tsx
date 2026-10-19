"use client";
import { Button } from "@/components/ui/button";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {facultySubmissionReviewResponseSchema} from "@/modules/courses/faculty-submission-review-model";
import {FacultyAssignmentReview} from "./faculty-assignment-review";

type Delivery={offeringId:string;deliveryId:string;sectionName:string;sectionCode:string};

/** College Admin may grade a shared offering assignment in each of its classes. */
export function CollegeAssignmentReview({
 assignmentId,offeringId,specificDeliveryId,maxPoints,status,deliveries,filesEnabled,
}:{
 assignmentId:string;offeringId:string;specificDeliveryId:string|null;
 maxPoints:number;status:string;deliveries:Delivery[];filesEnabled:boolean;
}){
 const options=deliveries.filter(item=>item.offeringId===offeringId&&
  (!specificDeliveryId||item.deliveryId===specificDeliveryId));
 const [deliveryId,setDeliveryId]=useState(options[0]?.deliveryId??"");
 const [bulkBusy,setBulkBusy]=useState(false);
 const [bulkStatus,setBulkStatus]=useState("");
 const [retryAllowed,setRetryAllowed]=useState(false);
 const [failedIds,setFailedIds]=useState<string[]>([]);
 const [progress,setProgress]=useState("");
 const router=useRouter();
 async function publishAllGrades(selectedDeliveryId:string,retryOnly:readonly string[]|null=null){
  if(bulkBusy||!window.confirm(
    retryOnly?"Retry publication of "+retryOnly.length+" failed grades for this Section?":
    "Publish grades for every graded submission in this Section? Published results become visible to learners."
  ))return;
  setBulkBusy(true);setBulkStatus("");setRetryAllowed(false);setFailedIds([]);setProgress("Loading graded submissions…");
  let published=0,failed=0;
  const failedRows=new Set<string>();
  try{
   const base="/api/courses/college/assignments/"+encodeURIComponent(selectedDeliveryId)+
    "/submissions?assignmentId="+encodeURIComponent(assignmentId);
   let pages=1;
   for(let page=1;page<=pages;page++){
    const response=await fetch(base+"&page="+page,{cache:"no-store"});
    if(!response.ok)throw Error("Could not load all submissions for this Section.");
    const result=facultySubmissionReviewResponseSchema.parse(await response.json());
    pages=result.totalPages;
    setProgress("Reviewing Section page "+page+" of "+pages+"…");
    for(const item of result.items){
     if(item.gradingStatus!=="GRADED"||item.gradePublished||
       (retryOnly&&!retryOnly.includes(item.id)))continue;
     try{
      const saved=await fetch(
       "/api/courses/assignment-submissions/"+encodeURIComponent(item.id)+"/publish",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({expectedVersion:item.version}),
       });
      if(saved.ok)published++;
      else{failed++;failedRows.add(item.id);}
     }catch{failed++;failedRows.add(item.id);}
     setProgress(published+" published, "+failed+" failed");
    }
   }
   setFailedIds([...failedRows]);setRetryAllowed(failed>0);
   setBulkStatus(published+" grade(s) published"+
    (failed?"; "+failed+" failed. Review and retry the remaining grades.":"."));
   router.refresh();
  }catch(cause){
   setRetryAllowed(true);
   setBulkStatus((cause instanceof Error?cause.message:"Unable to publish all grades.")+
    (published?" "+published+" grade(s) were published; retry after refreshing.":""));
  }finally{setBulkBusy(false);setProgress("");}
 }
 if(!["PUBLISHED","DRAFT"].includes(status))return null;
 if(!options.length)return <p className="text-xs text-muted-foreground">
  No active class delivery is available for reviewing submissions.
 </p>;
 const selected=options.find(item=>item.deliveryId===deliveryId)??options[0];
 return <div className="space-y-2">
  {options.length>1?<label className="grid gap-1 text-xs font-semibold text-body">
   Section
   <select value={selected.deliveryId} disabled={bulkBusy} onChange={event=>{setDeliveryId(event.target.value);setBulkStatus("");setRetryAllowed(false);setFailedIds([]);}}
    className="min-h-11 rounded-md border border-border bg-surface px-2 text-sm text-foreground">
    {options.map(item=><option key={item.deliveryId} value={item.deliveryId}>
     {item.sectionName} ({item.sectionCode})
    </option>)}
   </select>
  </label>:null}
  <div className="flex flex-wrap items-center gap-2">
   <FacultyAssignmentReview key={selected.deliveryId} reviewScope="COLLEGE"
    assignmentId={assignmentId} deliveryId={selected.deliveryId}
    maxPoints={maxPoints} status={status as "DRAFT"|"PUBLISHED"} filesEnabled={filesEnabled}/>
   {status==="PUBLISHED"?<Button variant="secondary" type="button" disabled={bulkBusy} onClick={()=>void publishAllGrades(selected.deliveryId)}
    className="text-primary-text">
    {bulkBusy?"Publishing…":"Publish grades"}
   </Button>:null}
  </div>
  {bulkBusy?<p role="status" className="text-xs text-muted-foreground">Publishing graded submissions for this Section. {progress} Do not close this page.</p>:null}
  {bulkStatus?<p role="status" className="text-xs text-muted-foreground">{bulkStatus}</p>:null}
  {retryAllowed&&status==="PUBLISHED"?<Button variant="secondary" type="button" disabled={bulkBusy}
   onClick={()=>void publishAllGrades(selected.deliveryId,failedIds.length?failedIds:null)}
   className="text-primary-text">
   {failedIds.length?"Retry "+failedIds.length+" failed":"Retry failed"}
  </Button>:null}
 </div>;
}
