/** REC-calendar-messages-profile-14: a returned redirect is evidence of an
 * acknowledged POST, unlike a merely successful HTML login response. */
export function recruiterConversationAcknowledged(result:{
 status:number;redirected:boolean;redirectPath:string;threadId:string;
}):boolean{
 return result.status===200&&result.redirected&&
  result.redirectPath==="/hr/conversations/"+result.threadId;
}
