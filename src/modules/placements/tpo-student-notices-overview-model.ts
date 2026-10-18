export function tpoStudentNoticesOverview(input:{
 announcementsReady:boolean;noticeCount:number;prepReady:boolean;hasMore?:boolean;
}){
 const countValid=Number.isSafeInteger(input.noticeCount)&&input.noticeCount>=0;
 // A broken or missing aggregate is unknown, never an invented zero notices.
 const ready=input.announcementsReady&&countValid;
 const safeCount=countValid?input.noticeCount:0;
 const lowerBound=input.hasMore&&safeCount<Number.MAX_SAFE_INTEGER?safeCount+1:safeCount;
 return {
  publishedSummary:ready
   ?(input.hasMore?"At least "+lowerBound:String(safeCount))+" recorded college notices"
   :"College notices unavailable",
  prepSummary:input.prepReady?"Preparation-readiness configuration available":"Preparation configuration unavailable",
  noticeHref:"/tpo/announcements",prepHref:"/tpo/settings/prep-readiness",
 };
}
