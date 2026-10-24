import type {MentorGoogleMeetingStatus} from
 "@/modules/projects/mentor-google-calendar-status";

/** Renders only a status retrieved from the Google Calendar event API using
 * the calendar owner's live consent. No imported text or .ics export enters
 * this component as proof of Google sync. */
export function MentorGoogleMeetingProviderStatus({
 status,
}:{status:MentorGoogleMeetingStatus}){
 const counts=status.responseCounts;
 return <div aria-label="Verified Google Calendar meeting status"
   className="space-y-1 text-sm">
  <p>Google Calendar event: {status.syncState==="CONFIRMED"?"Confirmed":
   status.syncState==="TENTATIVE"?"Tentative":
   status.syncState==="CANCELLED"?"Cancelled":"Not found"}.</p>
  {counts?<p>Google attendee responses: {counts.accepted} accepted,
    {" "}{counts.tentative} tentative, {counts.declined} declined,
    {" "}{counts.needsAction} awaiting response.</p>:
   <p>Google attendee responses: unavailable
    {status.responseCountReason==="ATTENDEES_OMITTED"?
     " (the provider omitted its full guest list).":
     status.responseCountReason==="TOO_MANY_GUESTS"?
     " (too many guests for reliable individual response status).":"."}</p>}
  <p>One-hour provider reminder: {status.reminderOneHour===true?"Verified":
   status.reminderOneHour===false?"Not configured":"Not reported"}.</p>
  <p>Weekly recurrence in Google: {status.recurringWeekly?"Recorded":"Not recorded"}.</p>
  {status.verifiedAt?<p>Provider event last updated: {new Intl.DateTimeFormat("en-IN",{
   dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
  }).format(new Date(status.verifiedAt))} IST.</p>:null}
  <p className="text-xs text-muted-foreground">
   These are the provider's recorded invitation responses, not actual
   meeting attendance or the separate in-app project RSVP.
  </p>
 </div>;
}
