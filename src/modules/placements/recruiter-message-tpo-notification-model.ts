/** REC-calendar-messages-profile-17: one bell per distinct active TPO user, never the sender. */
export function recruiterMessageTpoRecipients(
 rows:readonly {userId:string}[], senderUserId:string,
):string[]{
 return [...new Set(rows.map(row=>row.userId))].filter(id=>id!==senderUserId);
}
export function recruiterMessageTpoHref(threadId:string):string{
 return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(threadId)
   ? "/tpo/messages/"+encodeURIComponent(threadId)
   : "/tpo/messages";
}
export const RECRUITER_MESSAGE_TPO_TITLE="New message from a recruiter";

/** The TPO bell shows at most 120 visible codepoints of the recruiter's message. */
export function recruiterMessageTpoPreview(body:string):string{
 const text=Array.from(body.replace(/[\u0000-\u001f\u007f\u200e-\u200f\u202a-\u202e\u2066-\u2069]/g," ")
  .replace(/\s+/g," ").trim());
 return text.length>120?text.slice(0,120).join("")+"…":text.join("");
}
