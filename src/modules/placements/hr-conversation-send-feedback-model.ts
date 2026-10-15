export function hrReplySuccess(input:{
 status:number;redirected:boolean;redirectPath:string;threadId:string;
}):boolean {
 return input.status===200 && input.redirected &&
  input.redirectPath==="/hr/conversations/"+input.threadId;
}
export function hrReplyErrorMessage(status:number):string {
 if(status===400)return "Enter a message between 1 and 4,000 characters.";
 if(status===403)return "Your recruiter access was not authorized. Refresh your account access.";
 if(status===404)return "This conversation is no longer available to your recruiter account.";
 if(status>=500)return "The message could not be sent. Please retry after checking your connection.";
 return "The message was not confirmed as sent. Check the thread before retrying.";
}
