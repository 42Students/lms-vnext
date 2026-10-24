/** In-app notification receipts prove saved inbox rows, not Google Calendar
 * invitations, attendee acceptance, delivery to external mail, or RSVP.
 */
export type MentorMeetingNoticeEvent={
 id:string;subjectId:string;occurredAt:Date;metadata:Record<string,unknown>;
};
export type MentorMeetingNoticeFact={
 meetingId:string;announcedAt:string;notifiedRecipients:number;
};
export function mentorMeetingInAppNoticeFacts(
 events:readonly MentorMeetingNoticeEvent[],
 counts:ReadonlyMap<string,number>,
 projectId:string,
):MentorMeetingNoticeFact[]{
 const latest=new Map<string,MentorMeetingNoticeEvent>();
 const ordered=[...events].sort((a,b)=>
   b.occurredAt.getTime()-a.occurredAt.getTime()||b.id.localeCompare(a.id));
 for(const event of ordered){
   if(event.metadata["projectId"]!==projectId||
      event.metadata["meetingId"]!==event.subjectId||
      !Number.isFinite(event.occurredAt.getTime())||
      latest.has(event.subjectId))continue;
   latest.set(event.subjectId,event);
 }
 return [...latest.values()].map(event=>({
   meetingId:event.subjectId,announcedAt:event.occurredAt.toISOString(),
   notifiedRecipients:Math.max(0,counts.get(event.id)??0),
 }));
}
