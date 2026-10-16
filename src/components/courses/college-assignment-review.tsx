"use client";

import {useState} from "react";
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
 if(status!=="PUBLISHED")return null;
 if(!options.length)return <p className="text-xs text-muted-foreground">
  No active class delivery is available for reviewing submissions.
 </p>;
 const selected=options.find(item=>item.deliveryId===deliveryId)??options[0];
 return <div className="space-y-2">
  {options.length>1?<label className="grid gap-1 text-xs font-semibold text-body">
   Section
   <select value={selected.deliveryId} onChange={event=>setDeliveryId(event.target.value)}
    className="min-h-10 rounded-md border border-border bg-surface px-2 text-sm text-foreground">
    {options.map(item=><option key={item.deliveryId} value={item.deliveryId}>
     {item.sectionName} ({item.sectionCode})
    </option>)}
   </select>
  </label>:null}
  <FacultyAssignmentReview key={selected.deliveryId} reviewScope="COLLEGE"
   assignmentId={assignmentId} deliveryId={selected.deliveryId}
   maxPoints={maxPoints} status="PUBLISHED" filesEnabled={filesEnabled}/>
 </div>;
}
