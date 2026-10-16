/** REC-calendar-messages-profile-15: exact legacy message guard copy. */
export function hrReplyValidationError(body: string): string | null {
 if (!body.trim()) return "Write a message first";
 if (body.trim().length > 4000) return "Keep a message under 4000 characters";
 return null;
}
export const HR_REPLY_SEND_FAILED = "Could not send";
export const HR_REPLY_REFRESH_FAILED =
 "Message sent, but the conversation could not refresh. Retry to load the latest messages.";

export function hrReplySuccess(input:{
 status:number;redirected:boolean;redirectPath:string;threadId:string;
}):boolean {
 return input.status===200 && input.redirected &&
  input.redirectPath==="/hr/conversations/"+input.threadId;
}
export function hrReplyErrorMessage(status:number):string {
 if(status===400)return HR_REPLY_SEND_FAILED;
 if(status===403)return "Your recruiter access was not authorized. Refresh your account access.";
 if(status===404)return "This conversation is no longer available to your recruiter account.";
 if(status>=500)return "The message could not be sent. Please retry after checking your connection.";
 return "The message was not confirmed as sent. Check the thread before retrying.";
}
