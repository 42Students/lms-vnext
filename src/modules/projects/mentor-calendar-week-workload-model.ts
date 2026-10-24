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
 const inWeek=meetings.filter(item=>{
   const stamp=Date.parse(item.startsAt);
   return Number.isFinite(stamp)&&stamp>=monday&&stamp<until;
 });
 const scheduled=inWeek.filter(item=>["SCHEDULED","RESCHEDULED"].includes(item.status));
 const seconds=scheduled.reduce((total,item)=>{
   const from=Date.parse(item.startsAt),to=Date.parse(item.endsAt);
   return total+(Number.isFinite(to)&&to>from?Math.min(to-from,24*3600*1000):0);
 },0);
 return {scheduled:scheduled.length,hours:Math.round(seconds/360000)/10,
   requests:inWeek.filter(item=>item.status==="REQUESTED").length,
   reviews:scheduled.filter(item=>item.meetingType==="REVIEW").length,
   retros:scheduled.filter(item=>item.meetingType==="RETRO").length};
}
