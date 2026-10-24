export type MentorMeetingWorkloadFact={
 id:string;status:string;startsAt:string;endsAt:string;
 meetingType?:string;
};
/** Current IST Monday-through-Sunday workload from real calendar instances.
 * A recurring-series estimate is never substituted for persisted meetings.
 * Pending/draft/cancelled rows are excluded from scheduled-hour totals.
 */
export function mentorCalendarWeekWorkload(
 meetings:readonly MentorMeetingWorkloadFact[],now:Date,
):{scheduled:number;hours:number;requests:number;reviews:number;retros:number}{
 const ist=new Date(now.getTime()+330*60000);
 const weekday=(ist.getUTCDay()+6)%7;
 const monday=Date.UTC(ist.getUTCFullYear(),ist.getUTCMonth(),
   ist.getUTCDate()-weekday)-330*60000;
 const until=monday+7*86400000;
 // Scheduled meetings overlapping the displayed IST week contribute only
 // the minutes within that week. A late Sunday start may occupy next Monday;
 // neither week should count the other's portion as its own workload.
 const scheduled=meetings.filter(item=>{
   if(item.status!=="SCHEDULED"&&item.status!=="RESCHEDULED")return false;
   const start=Date.parse(item.startsAt),end=Date.parse(item.endsAt);
   return Number.isFinite(start)&&Number.isFinite(end)&&end>start&&
     start<until&&end>monday;
 });
 const occupiedMs=scheduled.reduce((total,item)=>{
   const start=Date.parse(item.startsAt),end=Date.parse(item.endsAt);
   return total+Math.max(0,Math.min(end,until)-Math.max(start,monday));
 },0);
 // Requests are displayed by the student's requested START day and never
 // contribute to confirmed meeting hours before a Mentor accepts them.
 const requests=meetings.filter(item=>{
   const start=Date.parse(item.startsAt);
   return item.status==="REQUESTED"&&Number.isFinite(start)&&
     start>=monday&&start<until;
 }).length;
 return {scheduled:scheduled.length,hours:Math.round(occupiedMs/360000)/10,
   requests,
   reviews:scheduled.filter(item=>item.meetingType==="REVIEW").length,
   retros:scheduled.filter(item=>item.meetingType==="RETRO").length};
}
