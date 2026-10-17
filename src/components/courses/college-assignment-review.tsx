"use client";

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
 const router=useRouter();
 async function publishAllGrades(selectedDeliveryId:string){
  if(bulkBusy||!window.confirm(
    "Publish grades for every graded submission in this Section? Learners will be notified."
  ))return;
  setBulkBusy(true);setBulkStatus("");setRetryAllowed(false);
  let published=0,failed=0;
  try{
   const base="/api/courses/college/assignments/"+encodeURIComponent(selectedDeliveryId)+
    "/submissions?assignmentId="+encodeURIComponent(assignmentId);
   let pages=1;
   for(let page=1;page<=pages;page++){
    const response=await fetch(base+"&page="+page,{cache:"no-store"});
    if(!response.ok)throw Error("Could not load all submissions for this Section.");
    const result=facultySubmissionReviewResponseSchema.parse(await response.json());
    pages=result.totalPages;
    for(const item of result.items){
     if(item.gradingStatus!=="GRADED"||item.gradePublished)continue;
     const saved=await fetch(
      "/api/courses/assignment-submissions/"+encodeURIComponent(item.id)+"/publish",{
       method:"POST",headers:{"Content-Type":"application/json"},
       body:JSON.stringify({expectedVersion:item.version}),
      });
     if(saved.ok)published++;
     else failed++;
    }
   }
   setRetryAllowed(failed>0);
   setBulkStatus(published+" grade(s) published"+
    (failed?"; "+failed+" failed. Review and retry the remaining grades.":"."));
   router.refresh();
  }catch(cause){
   setRetryAllowed(true);
   setBulkStatus((cause instanceof Error?cause.message:"Unable to publish all grades.")+
    (published?" "+published+" grade(s) were published; retry after refreshing.":""));
  }finally{setBulkBusy(false);}
 }
 if(!["PUBLISHED","DRAFT"].includes(status))return null;
 if(!options.length)return <p className="text-xs text-muted-foreground">
  No active class delivery is available for reviewing submissions.
 </p>;
 const selected=options.find(item=>item.deliveryId===deliveryId)??options[0];
 return <div className="space-y-2">
  {options.length>1?<label className="grid gap-1 text-xs font-semibold text-body">
   Section
   <select value={selected.deliveryId} disabled={bulkBusy} onChange={event=>{setDeliveryId(event.target.value);setBulkStatus("");}}
    className="min-h-10 rounded-md border border-border bg-surface px-2 text-sm text-foreground">
    {options.map(item=><option key={item.deliveryId} value={item.deliveryId}>
     {item.sectionName} ({item.sectionCode})
    </option>)}
   </select>
  </label>:null}
  <div className="flex flex-wrap items-center gap-2">
   <FacultyAssignmentReview key={selected.deliveryId} reviewScope="COLLEGE"
    assignmentId={assignmentId} deliveryId={selected.deliveryId}
    maxPoints={maxPoints} status={status as "DRAFT"|"PUBLISHED"} filesEnabled={filesEnabled}/>
   {status==="PUBLISHED"?<button type="button" disabled={bulkBusy} onClick={()=>void publishAllGrades(selected.deliveryId)}
    className="min-h-10 rounded-md border border-border px-3 text-xs font-semibold text-primary-text disabled:opacity-60">
    {bulkBusy?"Publishing…":"Publish grades"}
   </button>:null}
  </div>
  {bulkBusy?<p role="status" className="text-xs text-muted-foreground">Publishing graded submissions for this Section. Do not close this page.</p>:null}
  {bulkStatus?<p role="status" className="text-xs text-muted-foreground">{bulkStatus}</p>:null}
 </div>;
}
