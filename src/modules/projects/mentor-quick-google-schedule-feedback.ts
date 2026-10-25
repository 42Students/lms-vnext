/** Report only real persisted+provider outcomes; receipt acceptance is not
 * the same as attendee inbox delivery, and an in-progress Meet stays a draft.
 */
export function mentorQuickGoogleScheduleFeedback(raw:unknown):{
  title:string;description:string;
}{
 if(!raw||typeof raw!=="object"||!("meetingScheduled" in raw)||
    raw.meetingScheduled!==true)
  return {title:"Meeting draft saved",description:
    "Google Meet creation is pending or could not be confirmed. Open Meetings to retry; no invitation success is claimed."};
 const invitation="invitationStatus" in raw?raw.invitationStatus:null;
 if(invitation==="RETRY_REQUIRED")
  return {title:"Meeting scheduled with Google Meet",description:
    "A verified Meet link was saved, but Google invitations require another sync attempt. Open Meetings to retry."};
 if(invitation==="PROVIDER_ACCEPTED")
  return {title:"Meeting scheduled with Google Meet",description:
    "Google accepted the event and invitation update. Actual delivery and RSVPs still need provider verification."};
 return {title:"Meeting scheduled with Google Meet",description:
   "A verified Meet link was saved. Invitation delivery is not confirmed; verify status in Meetings."};
}
