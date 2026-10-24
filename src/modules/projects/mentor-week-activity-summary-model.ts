export type MentorWeekActivityItem={
  id:string;eventType:string;summary:string;occurredAt:string|Date;
};
/** A bounded read: summarize only events actually loaded in the feed.
 * An exact project-wide total requires a separately executed aggregate query.
 */
export function mentorLoadedWeekActivitySummary(
  events:readonly MentorWeekActivityItem[],now:Date,
):{taskMoves:number;comments:number;resourcesShared:number;count:number;partial:true}{
  const dates=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Kolkata",
    day:"2-digit",month:"2-digit",year:"numeric"}).formatToParts(now);
  const field=(name:string)=>Number(dates.find(item=>item.type===name)?.value);
  const midnight=Date.UTC(field("year"),field("month")-1,field("day"))-330*60000;
  const weekday=new Date(midnight+330*60000).getUTCDay();
  const start=midnight-((weekday+6)%7)*86400000;
  const within=events.filter(event=>{
    const stamp=new Date(event.occurredAt).getTime();
    return Number.isFinite(stamp)&&stamp>=start&&stamp<=now.getTime();
  });
  const taskMoves=within.filter(event=>
    event.eventType==="projects.task.status_changed"||
    event.eventType==="projects.task.details_updated"&&
      /task (pulled into sprint|returned to product backlog)/i.test(event.summary)).length;
  const comments=within.filter(event=>
    event.eventType.toLowerCase().includes("comment")&&
    event.eventType.startsWith("projects.")).length;
  const resourcesShared=within.filter(event=>
    event.eventType==="projects.resource.created"||
    event.eventType==="projects.resource.updated"&&
      /shar(ed|ing)|publish(ed)?/i.test(event.summary)).length;
  return {taskMoves,comments,resourcesShared,count:within.length,partial:true};
}
