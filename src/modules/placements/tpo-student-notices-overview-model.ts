export function tpoStudentNoticesOverview(input:{
 announcementsReady:boolean;noticeCount:number;prepReady:boolean;hasMore?:boolean;
}){
 const safeCount=Number.isSafeInteger(input.noticeCount)&&input.noticeCount>=0?input.noticeCount:0;
 return {
  publishedSummary:input.announcementsReady
   ?(input.hasMore?"At least "+(safeCount+1):String(safeCount))+" recorded college notices"
   :"College notices unavailable",
  prepSummary:input.prepReady?"Preparation-readiness configuration available":"Preparation configuration unavailable",
  noticeHref:"/tpo/announcements",prepHref:"/tpo/settings/prep-readiness",
 };
}
