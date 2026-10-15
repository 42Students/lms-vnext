export function tpoStudentNoticesOverview(input:{announcementsReady:boolean;noticeCount:number;prepReady:boolean}){
 return {
  publishedSummary:input.announcementsReady?input.noticeCount+" recorded college notices":"College notices unavailable",
  prepSummary:input.prepReady?"Preparation-readiness configuration available":"Preparation configuration unavailable",
  noticeHref:"/tpo/announcements",prepHref:"/tpo/settings/prep-readiness",
 };
}
