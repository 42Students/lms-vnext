export function hrReplySuccess(input:{
 status:number;redirected:boolean;redirectPath:string;threadId:string;
}):boolean {
 return input.status===200 && input.redirected &&
  input.redirectPath==="/hr/conversations/"+input.threadId;
}
export function hrReplyErrorMessage(status:number):string {
 if(status===400)return "Write a message first, or keep a message under 4000 characters.";
 if(status===403)return "Your access to this college has ended or was removed. Ask the placement cell to give it again.";
 if(status===404)return "This conversation is no longer available to your recruiter account.";
 if(status>=500)return "Could not reach the placement cell. Retry after checking your connection.";
 return "The message was not confirmed as sent. Check the thread before retrying.";
}
