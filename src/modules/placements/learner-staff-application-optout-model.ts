/** A staff-origin application can be opted out within 48 hours of the saved submission. */
export const STAFF_APPLICATION_OPT_OUT_MS=48*60*60*1000;
export function learnerStaffApplicationOptOut(input:{
 submittedAt:Date;submittedByUserId:string;learnerUserId:string;now:Date;
}):{staffApplied:boolean;expiresAt:Date|null;canOptOut:boolean}{
 const staffApplied=input.submittedByUserId!==input.learnerUserId;
 if(!staffApplied)return {staffApplied:false,expiresAt:null,canOptOut:false};
 const start=input.submittedAt.getTime(),current=input.now.getTime();
 if(!Number.isFinite(start)||!Number.isFinite(current))
  return {staffApplied:true,expiresAt:null,canOptOut:false};
 const expiresAt=new Date(start+STAFF_APPLICATION_OPT_OUT_MS);
 return {staffApplied:true,expiresAt,canOptOut:current>=start&&current<expiresAt.getTime()};
}
