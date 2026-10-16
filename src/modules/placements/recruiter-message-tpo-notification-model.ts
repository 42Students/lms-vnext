/** REC-calendar-messages-profile-17: one bell per distinct active TPO user, never the sender. */
export function recruiterMessageTpoRecipients(
 rows:readonly {userId:string}[], senderUserId:string,
):string[]{
 return [...new Set(rows.map(row=>row.userId))].filter(id=>id!==senderUserId);
}
export function recruiterMessageTpoHref():string{
 return "/tpo/messages/notifications";
}
export const RECRUITER_MESSAGE_TPO_TITLE="New message from a recruiter";
